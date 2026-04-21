/**
 * bot.js — Ponto de entrada do Bot Telegram
 * Sistema de Gestão Condominial
 */
require('dotenv').config();

// ─── Imports todos no topo ────────────────────────────────────────────────────
const http = require('http');
const TelegramBot = require('node-telegram-bot-api');
const { BOT_TOKEN, ADMIN_IDS, CODIGO_REGEX, MSGS } = require('./config');
const { isAdmin } = require('./permissions');
const handlers = require('./handlers');
const { interpretarMensagem, gerarRespostaMorador } = require('./ai');

// ─── Servidor HTTP — sobe imediatamente, independente do bot ─────────────────
const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OK');
}).listen(PORT, '0.0.0.0');
console.log(`🌐 HTTP na porta ${PORT}`);

// ─── Validação ────────────────────────────────────────────────────────────────
if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN não configurado');
  process.exit(1);
}

// ─── Bot ──────────────────────────────────────────────────────────────────────
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
console.log('🤖 Bot iniciado!');
console.log(`👮 Admins: ${ADMIN_IDS.join(', ')}`);

bot.on('polling_error', err => {
  if (!err.message.includes('409')) console.error('Polling error:', err.message);
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getChatId(msg) {
  return msg && msg.chat && msg.chat.id ? msg.chat.id : null;
}

function safe(fn) {
  return async (msg, match) => {
    const chatId = getChatId(msg);
    if (!chatId) return;
    try {
      await fn(msg, match);
    } catch (err) {
      console.error(`❌ ${err.message}`);
      try { await bot.sendMessage(chatId, MSGS.ERRO_GERAL); } catch (_) {}
    }
  };
}

// ─── Handlers ─────────────────────────────────────────────────────────────────
bot.onText(/\/start/, safe(msg => handlers.handleStart(bot, msg)));

bot.onText(/\/trocar(?:\s+(.+))?/, safe((msg, match) =>
  handlers.handleTrocar(bot, msg, match[1] ? match[1].trim() : null)
));

bot.onText(/\/consultar(?:\s+(.+))?/, safe((msg, match) =>
  handlers.handleConsultar(bot, msg, match[1] ? match[1].trim() : null)
));

bot.onText(/\/historico/, safe(msg => handlers.handleHistorico(bot, msg)));

bot.onText(/\/salao(?:\s+(.+))?/i, safe((msg, match) => {
  const param = match[1] ? match[1].trim() : null;
  // Admin com código de condomínio = ver reservas admin
  if (param && /^(VAC|AYR|VID|TAR|DES|SPE)$/i.test(param) && isAdmin(msg.from?.id)) {
    return handlers.handleSalaoAdmin(bot, msg, param.toUpperCase());
  }
  return handlers.handleSalao(bot, msg, param);
}));

bot.onText(/\/reservar(?:\s+(.+))?/i, safe((msg, match) =>
  handlers.handleReservar(bot, msg, match[1] ? match[1].trim() : null, ADMIN_IDS)
));

bot.onText(/\/reservas(?:\s+(.+))?/i, safe((msg, match) =>
  handlers.handleSalaoAdmin(bot, msg, (match[1] || '').trim().toUpperCase())
));

bot.onText(/\/confirmarreserva(?:\s+(.+))?/i, safe((msg, match) =>
  handlers.handleConfirmarReserva(bot, msg, match[1] ? match[1].trim() : null)
));

bot.onText(/\/cancelarreserva(?:\s+(.+))?/i, safe((msg, match) =>
  handlers.handleCancelarReserva(bot, msg, match[1] ? match[1].trim() : null)
));

bot.onText(/\/mensagem(?:\s+(.+))?/i, safe((msg, match) =>
  handlers.handleMensagem(bot, msg, match[1] ? match[1].trim() : null, ADMIN_IDS)
));

bot.onText(/\/ajuda/, safe(msg =>
  handlers.handleAjuda(bot, msg, msg.from ? isAdmin(msg.from.id) : false)
));

bot.onText(/\/apto\s+(.+)/i, safe((msg, match) =>
  handlers.handleConsultarApto(bot, msg, match[1].trim())
));

bot.onText(/\/bloco\s+(.+)/i, safe((msg, match) =>
  handlers.handleConsultarBloco(bot, msg, match[1].trim())
));

bot.onText(/\/condominio\s+(.+)/i, safe((msg, match) =>
  handlers.handleConsultarCondominio(bot, msg, match[1].trim())
));

bot.onText(/\/pendentes(?:\s+(.+))?/i, safe((msg, match) =>
  handlers.handlePendentes(bot, msg, (match[1] || '').trim())
));

bot.onText(/\/baixar\s+(\S+)(?:\s+(.+))?/i, safe((msg, match) =>
  handlers.handleBaixar(bot, msg, match[1].trim(), match[2] ? match[2].trim() : null)
));

bot.onText(/\/baixartodos\s+(\S+)(?:\s+(.+))?/i, safe((msg, match) =>
  handlers.handleBaixarTodos(bot, msg, match[1].trim().toUpperCase(), match[2] ? match[2].trim() : null)
));

bot.onText(/\/planilha(?:\s+(.+))?/i, safe((msg, match) =>
  handlers.handlePlanilha(bot, msg, (match[1] || '').trim())
));

bot.on('message', safe(async (msg) => {
  if (!msg.text || msg.text.startsWith('/') || !msg.from) return;
  const texto = msg.text.trim();
  const textoUpper = texto.toUpperCase();

  // Código de unidade direto (ex: DES-01-101)
  if (CODIGO_REGEX.test(textoUpper)) {
    await handlers.handleCadastroCodigo(bot, msg, textoUpper);
    return;
  }

  // Buscar contexto do usuário para enriquecer a IA
  const { getUsuarioBot } = require('./firebase');
  const usuario = await getUsuarioBot(msg.from.id);
  const contexto = {
    unidade: usuario?.codigo || null,
    isAdmin: isAdmin(msg.from.id)
  };

  // Tentar IA
  const ia = await interpretarMensagem(texto, contexto);

  if (ia && ia.intent !== 'desconhecido') {
    await executarIntencaoIA(bot, msg, ia);
    return;
  }

  // IA retornou resposta conversacional
  if (ia && ia.intent === 'desconhecido' && ia.resposta) {
    await bot.sendMessage(msg.chat.id, ia.resposta);
    return;
  }

  // Fallback regex para admin
  if (isAdmin(msg.from.id)) {
    await handleNaturalLanguage(msg, textoUpper);
    return;
  }

  // Morador sem cadastro
  if (!usuario) {
    await bot.sendMessage(msg.chat.id, MSGS.BEM_VINDO, { parse_mode: 'Markdown' });
  } else {
    await bot.sendMessage(msg.chat.id, '🤖 Não entendi. Use /ajuda para ver os comandos disponíveis.');
  }
}));

bot.on('photo', safe(msg => handlers.handleComprovante(bot, msg, ADMIN_IDS)));
bot.on('document', safe(msg => handlers.handleComprovante(bot, msg, ADMIN_IDS)));

console.log('✅ Handlers registrados. Aguardando mensagens...');

// ─── Executar intenção detectada pela IA ─────────────────────────────────────
async function executarIntencaoIA(bot, msg, ia) {
  const adminUser = isAdmin(msg.from?.id);

  switch (ia.intent) {
    case 'consultar':
      await handlers.handleConsultar(bot, msg, ia.periodo || null);
      break;
    case 'historico':
      await handlers.handleHistorico(bot, msg);
      break;
    case 'baixar':
      if (adminUser && ia.codigo)
        await handlers.handleBaixar(bot, msg, ia.codigo, ia.periodo);
      else
        await bot.sendMessage(msg.chat.id, '⛔ Sem permissão ou código inválido.');
      break;
    case 'baixartodos':
      if (adminUser && ia.condominio)
        await handlers.handleBaixarTodos(bot, msg, ia.condominio, ia.periodo);
      else
        await bot.sendMessage(msg.chat.id, '⛔ Sem permissão ou condomínio inválido.');
      break;
    case 'pendentes':
      if (adminUser && ia.condominio)
        await handlers.handlePendentes(bot, msg, ia.condominio);
      else
        await bot.sendMessage(msg.chat.id, '⛔ Sem permissão.');
      break;
    case 'condominio':
      if (adminUser && ia.condominio)
        await handlers.handleConsultarCondominio(bot, msg, ia.condominio);
      else
        await bot.sendMessage(msg.chat.id, '⛔ Sem permissão.');
      break;
    case 'bloco':
      if (adminUser && ia.bloco)
        await handlers.handleConsultarBloco(bot, msg, ia.bloco);
      else
        await bot.sendMessage(msg.chat.id, '⛔ Sem permissão.');
      break;
    case 'apto':
      if (adminUser && ia.codigo)
        await handlers.handleConsultarApto(bot, msg, ia.codigo);
      else
        await bot.sendMessage(msg.chat.id, '⛔ Sem permissão.');
      break;
    case 'planilha':
      if (adminUser && ia.condominio)
        await handlers.handlePlanilha(bot, msg, ia.condominio);
      else
        await bot.sendMessage(msg.chat.id, '⛔ Sem permissão.');
      break;
    case 'salao':
      await handlers.handleSalao(bot, msg, ia.data || null);
      break;
    case 'reservar':
      await handlers.handleReservar(bot, msg, ia.data || null, ADMIN_IDS);
      break;
    case 'mensagem':
      await handlers.handleMensagem(bot, msg, ia.texto || null, ADMIN_IDS);
      break;
    case 'ajuda':
      await handlers.handleAjuda(bot, msg, adminUser);
      break;
    default:
      await bot.sendMessage(msg.chat.id, '🤖 Não entendi. Use /ajuda.');
  }
}

// ─── IA Natural (fallback regex) ─────────────────────────────────────────────
async function handleNaturalLanguage(msg, texto) {
  const chatId = msg.chat.id;

  const m1 = texto.match(/(?:BAIXAR|DAR BAIXA|BAIXA)\s+([A-Z]+-\d{2}-C?\d{2,3})/);
  if (m1) return handlers.handleBaixar(bot, msg, m1[1]);

  const m2 = texto.match(/(?:CONSULTAR|VER|STATUS)\s+([A-Z]+-\d{2}-C?\d{2,3})/);
  if (m2) return handlers.handleConsultarApto(bot, msg, m2[1]);

  const m3 = texto.match(/BLOCO\s+([A-Z]+-\d{2})/);
  if (m3) return handlers.handleConsultarBloco(bot, msg, m3[1]);

  const m4 = texto.match(/(?:CONDOMINIO|RESUMO)\s+(VAC|AYR|VID|TAR|DES|SPE)/);
  if (m4) return handlers.handleConsultarCondominio(bot, msg, m4[1]);

  const m5 = texto.match(/(?:PENDENTES|DEVENDO)\s+(VAC|AYR|VID|TAR|DES|SPE)/);
  if (m5) return handlers.handlePendentes(bot, msg, m5[1]);

  const m6 = texto.match(/PLANILHA\s+(VAC|AYR|VID|TAR|DES|SPE)/);
  if (m6) return handlers.handlePlanilha(bot, msg, m6[1]);

  await bot.sendMessage(chatId, '🤖 Não entendi. Use /ajuda.');
}
