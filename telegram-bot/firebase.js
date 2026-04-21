const admin = require('firebase-admin');
require('dotenv').config();

// Inicializar Firebase Admin
let credential;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log('🔑 Usando credencial via variável de ambiente FIREBASE_SERVICE_ACCOUNT');
    credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const path = require('path');
    const fs = require('fs');
    const resolvedPath = path.resolve(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    console.log(`🔑 Usando credencial via arquivo: ${resolvedPath}`);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`❌ Arquivo de credenciais NÃO encontrado: ${resolvedPath}`);
      process.exit(1);
    }
    credential = admin.credential.cert(resolvedPath);
  } else {
    console.error('❌ Credenciais Firebase não configuradas! Configure FIREBASE_SERVICE_ACCOUNT ou FIREBASE_SERVICE_ACCOUNT_PATH no .env');
    process.exit(1);
  }

  admin.initializeApp({ credential });
  console.log('✅ Firebase Admin inicializado com sucesso!');
} catch (err) {
  console.error('❌ Erro ao inicializar Firebase:', err.message);
  process.exit(1);
}
const db = admin.firestore();

// ─── COLLECTIONS ────────────────────────────────────────────────────────────
const C = {
  CONDOMINIOS:   'condominios',
  BLOCOS:        'blocos',
  APARTAMENTOS:  'apartamentos',
  PAYMENTS:      'payments',
  USUARIOS_BOT:  'usuarios_bot',       // Usuários do Telegram
  COMPROVANTES:  'comprovantes'        // Comprovantes enviados
};

// ─── USUÁRIOS BOT ────────────────────────────────────────────────────────────

/**
 * Busca usuário pelo telegram_id
 */
async function getUsuarioBot(telegramId) {
  const snap = await db.collection(C.USUARIOS_BOT)
    .where('telegram_id', '==', telegramId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

/**
 * Cadastra ou atualiza usuário do bot
 */
async function salvarUsuarioBot(telegramId, codigo, nome, tipo = 'morador') {
  const existing = await getUsuarioBot(telegramId);
  const data = {
    telegram_id: telegramId,
    nome,
    codigo,
    tipo,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (existing) {
    await db.collection(C.USUARIOS_BOT).doc(existing.id).update(data);
    return existing.id;
  } else {
    data.createdAt = admin.firestore.FieldValue.serverTimestamp();
    const ref = await db.collection(C.USUARIOS_BOT).add(data);
    return ref.id;
  }
}

// ─── CONDOMÍNIOS ─────────────────────────────────────────────────────────────

/**
 * Busca condomínio pelo nome (parcial, case-insensitive)
 */
async function getCondominioPorNome(nome) {
  const snap = await db.collection(C.CONDOMINIOS)
    .where('active', '==', true)
    .get();
  const lower = nome.toLowerCase();
  const doc = snap.docs.find(d => d.data().nome.toLowerCase().includes(lower));
  if (!doc) return null;
  return { id: doc.id, ...doc.data() };
}

/**
 * Busca condomínio pelo código (VAC, AYR, etc.)
 */
async function getCondominioPorCodigo(codigo) {
  const nomes = {
    VAC: 'Vacaria', AYR: 'Ayres', VID: 'Vidal',
    TAR: 'Taroni', DES: 'Destri', SPE: 'Speranza'
  };
  const nome = nomes[codigo.toUpperCase()];
  if (!nome) return null;
  return getCondominioPorNome(nome);
}

// ─── APARTAMENTOS ─────────────────────────────────────────────────────────────

/**
 * Busca apartamento pelo código único (ex: DES-01-101 ou VID-20-C01)
 * Retorna { apartamento, bloco, condominio } ou null
 */
async function getApartamentoPorCodigo(codigo) {
  const match = codigo.toUpperCase().match(/^(VAC|AYR|VID|TAR|DES|SPE)-(\d{2})-(C?\d{2,3})$/);
  if (!match) return null;

  const [, condCodigo, blocoNum, aptNum] = match;
  const isCasa = aptNum.startsWith('C');

  // Buscar condomínio
  const condominio = await getCondominioPorCodigo(condCodigo);
  if (!condominio) return null;

  // Buscar bloco
  const blocoNome = `Bloco ${blocoNum}`;
  const blocoSnap = await db.collection(C.BLOCOS)
    .where('condominioId', '==', condominio.id)
    .where('numero', '==', parseInt(blocoNum))
    .where('active', '==', true)
    .limit(1)
    .get();
  if (blocoSnap.empty) return null;
  const bloco = { id: blocoSnap.docs[0].id, ...blocoSnap.docs[0].data() };

  // Buscar apartamento/casa
  const numero = isCasa
    ? `Casa ${aptNum.replace('C', '').padStart(2, '0')}`
    : aptNum;

  const aptSnap = await db.collection(C.APARTAMENTOS)
    .where('blocoId', '==', bloco.id)
    .where('numero', '==', numero)
    .where('active', '==', true)
    .limit(1)
    .get();
  if (aptSnap.empty) return null;

  const apartamento = { id: aptSnap.docs[0].id, ...aptSnap.docs[0].data() };
  return { apartamento, bloco, condominio };
}

// ─── PAGAMENTOS ───────────────────────────────────────────────────────────────

/**
 * Busca pagamento de um apartamento em um período (YYYY-MM)
 */
async function getPagamento(apartamentoId, periodo) {
  const snap = await db.collection(C.PAYMENTS)
    .where('apartamentoId', '==', apartamentoId)
    .where('date', '==', periodo)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

/**
 * Dá baixa em um pagamento (cria ou atualiza)
 */
async function darBaixaPagamento(apartamentoId, blocoId, condominioId, periodo, valor, adminId) {
  const existing = await getPagamento(apartamentoId, periodo);
  const data = {
    apartamentoId,
    blocoId,
    condominioId,
    date: periodo,
    status: 'pago',
    value: valor,
    paidAt: admin.firestore.FieldValue.serverTimestamp(),
    paidByTelegram: adminId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (existing) {
    await db.collection(C.PAYMENTS).doc(existing.id).update(data);
    return existing.id;
  } else {
    data.createdAt = admin.firestore.FieldValue.serverTimestamp();
    const ref = await db.collection(C.PAYMENTS).add(data);
    return ref.id;
  }
}

/**
 * Lista pendentes de um condomínio no período atual
 */
async function getPendentes(condominioId, periodo) {
  // Buscar todos os apartamentos do condomínio
  const aptsSnap = await db.collection(C.APARTAMENTOS)
    .where('condominioId', '==', condominioId)
    .where('active', '==', true)
    .get();

  // Buscar pagamentos do período
  const pagSnap = await db.collection(C.PAYMENTS)
    .where('condominioId', '==', condominioId)
    .where('date', '==', periodo)
    .get();

  const pagosIds = new Set(pagSnap.docs
    .filter(d => ['pago', 'reciclado'].includes(d.data().status))
    .map(d => d.data().apartamentoId));

  return aptsSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(apt => !pagosIds.has(apt.id));
}

/**
 * Busca todos os apartamentos de um bloco
 */
async function getApartamentosPorBloco(blocoId) {
  const snap = await db.collection(C.APARTAMENTOS)
    .where('blocoId', '==', blocoId)
    .where('active', '==', true)
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (parseInt(a.numero) || 0) - (parseInt(b.numero) || 0));
}

/**
 * Busca pagamentos de um bloco no período
 */
async function getPagamentosPorBloco(blocoId, periodo) {
  const snap = await db.collection(C.PAYMENTS)
    .where('blocoId', '==', blocoId)
    .where('date', '==', periodo)
    .get();
  const map = {};
  snap.docs.forEach(d => { map[d.data().apartamentoId] = d.data(); });
  return map;
}

/**
 * Busca todos os pagamentos de um condomínio no período (para planilha)
 */
async function getPagamentosParaPlanilha(condominioId, periodo) {
  const aptsSnap = await db.collection(C.APARTAMENTOS)
    .where('condominioId', '==', condominioId)
    .where('active', '==', true)
    .get();

  const pagSnap = await db.collection(C.PAYMENTS)
    .where('condominioId', '==', condominioId)
    .where('date', '==', periodo)
    .get();

  const pagMap = {};
  pagSnap.docs.forEach(d => { pagMap[d.data().apartamentoId] = d.data(); });

  return aptsSnap.docs.map(d => {
    const apt = { id: d.id, ...d.data() };
    const pag = pagMap[apt.id] || {};
    return {
      condominio: apt.condominioNome || '',
      bloco: apt.blocoNome || '',
      unidade: apt.numero || '',
      tipo: apt.tipo || 'apartamento',
      proprietario: apt.proprietario || '',
      status: pag.status || 'pendente',
      valor: pag.value || 0,
      data_pagamento: pag.paidAt ? new Date(pag.paidAt.toDate()).toLocaleDateString('pt-BR') : ''
    };
  }).sort((a, b) => a.bloco.localeCompare(b.bloco) || a.unidade.localeCompare(b.unidade));
}

// ─── COMPROVANTES ─────────────────────────────────────────────────────────────

/**
 * Salva comprovante enviado pelo morador
 */
async function salvarComprovante(telegramId, codigo, fileId, fileType, periodo) {
  const ref = await db.collection(C.COMPROVANTES).add({
    telegram_id: telegramId,
    codigo_unidade: codigo,
    file_id: fileId,
    file_type: fileType,
    periodo,
    status: 'aguardando',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return ref.id;
}

// ─── SALÃO ────────────────────────────────────────────────────────────────────

/**
 * Busca reservas do salão de um condomínio no mês/ano
 */
async function getReservasSalao(condominioId, ano, mes) {
  const startDate = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const endDate = `${ano}-${String(mes).padStart(2, '0')}-31`;

  const snap = await db.collection('salaoReservations')
    .where('condominioId', '==', condominioId)
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .orderBy('date')
    .get();

  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Cria solicitação de reserva do salão
 */
async function solicitarReservaSalao(condominioId, apartamentoId, apartamentoNumero, blocoNome, data, telegramId) {
  const ref = await db.collection('salaoReservations').add({
    condominioId,
    apartamentoId,
    apartamentoNumero,
    blocoNome,
    date: data,
    status: 'pendente',
    value: 0,
    solicitadoViaTelegram: true,
    solicitadoPor: telegramId,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return ref.id;
}

/**
 * Verifica se uma data já está reservada no salão
 */
async function dataDisponivelSalao(condominioId, data) {
  const snap = await db.collection('salaoReservations')
    .where('condominioId', '==', condominioId)
    .where('date', '==', data)
    .where('status', 'in', ['pendente', 'confirmado', 'pago'])
    .get();
  return snap.empty;
}

module.exports = {
  db,
  getUsuarioBot,
  salvarUsuarioBot,
  getCondominioPorCodigo,
  getCondominioPorNome,
  getApartamentoPorCodigo,
  getPagamento,
  darBaixaPagamento,
  getPendentes,
  getApartamentosPorBloco,
  getPagamentosPorBloco,
  getPagamentosParaPlanilha,
  salvarComprovante,
  getReservasSalao,
  solicitarReservaSalao,
  dataDisponivelSalao
};
