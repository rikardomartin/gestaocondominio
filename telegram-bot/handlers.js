/**
 * handlers.js — Lógica de cada comando/ação do bot
 */
const fb = require('./firebase');
const { requireAdmin, moradorPodeAcessar } = require('./permissions');
const { getPeriodoAtual, formatarPeriodo, formatarValor, emojiStatus, gerarExcel } = require('./utils');
const { MSGS, CONDOMINIOS, CODIGO_REGEX } = require('./config');

// ─── /start ───────────────────────────────────────────────────────────────────
async function handleStart(bot, msg) {
  const chatId = msg.chat.id;
  const from = msg.from;
  const usuario = await fb.getUsuarioBot(from.id);

  if (usuario) {
    await bot.sendMessage(chatId,
      `👋 Olá, *${from.first_name}*!\n\nSua unidade cadastrada: \`${usuario.codigo}\`\n\nUse /consultar para ver seu status ou /ajuda para ver os comandos.\n\n_Para trocar de unidade use /trocar_`,
      { parse_mode: 'Markdown' }
    );
  } else {
    await bot.sendMessage(chatId, MSGS.BEM_VINDO, { parse_mode: 'Markdown' });
  }
}

// ─── /trocar — permite trocar a unidade cadastrada ───────────────────────────
async function handleTrocar(bot, msg, novoCodigo) {
  const chatId = msg.chat.id;
  const from = msg.from;

  if (!novoCodigo) {
    const usuario = await fb.getUsuarioBot(from.id);
    const atual = usuario ? `\`${usuario.codigo}\`` : '_nenhuma_';
    await bot.sendMessage(chatId,
      `🔄 *Trocar Unidade*\n\nUnidade atual: ${atual}\n\nEnvie o novo código:\nEx: \`DES-22-403\``,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const codigo = novoCodigo.toUpperCase();
  await bot.sendMessage(chatId, '🔍 Verificando código...');

  const resultado = await fb.getApartamentoPorCodigo(codigo);
  if (!resultado) {
    await bot.sendMessage(chatId, MSGS.CODIGO_INVALIDO, { parse_mode: 'Markdown' });
    return;
  }

  const { apartamento, bloco, condominio } = resultado;
  const nome = `${from.first_name} ${from.last_name || ''}`.trim();
  await fb.salvarUsuarioBot(from.id, codigo, nome, 'morador');

  await bot.sendMessage(chatId,
    `✅ *Unidade atualizada com sucesso!*\n\n` +
    `🏢 Condomínio: *${condominio.nome}*\n` +
    `🏗️ Bloco: *${bloco.nome}*\n` +
    `🏠 Unidade: *${apartamento.numero}*\n\n` +
    `Use /consultar para ver seu status de pagamento.`,
    { parse_mode: 'Markdown' }
  );
}

// ─── Cadastro de unidade ──────────────────────────────────────────────────────
async function handleCadastroCodigo(bot, msg, codigo) {
  const chatId = msg.chat.id;
  const from = msg.from;

  await bot.sendMessage(chatId, '🔍 Verificando código...');

  const resultado = await fb.getApartamentoPorCodigo(codigo);
  if (!resultado) {
    await bot.sendMessage(chatId, MSGS.CODIGO_INVALIDO, { parse_mode: 'Markdown' });
    return;
  }

  const { apartamento, bloco, condominio } = resultado;
  const nome = `${from.first_name} ${from.last_name || ''}`.trim();

  await fb.salvarUsuarioBot(from.id, codigo.toUpperCase(), nome, 'morador');

  await bot.sendMessage(chatId,
    `✅ *Cadastro realizado com sucesso!*\n\n` +
    `🏢 Condomínio: *${condominio.nome}*\n` +
    `🏗️ Bloco: *${bloco.nome}*\n` +
    `🏠 Unidade: *${apartamento.numero}*\n` +
    `👤 Proprietário: ${apartamento.proprietario}\n\n` +
    `Use /consultar para ver seu status de pagamento.`,
    { parse_mode: 'Markdown' }
  );
}

// ─── /consultar (opcional: /consultar 03/2026) ────────────────────────────────
async function handleConsultar(bot, msg, periodoParam) {
  const chatId = msg.chat.id;
  const from = msg.from;

  // Se passou código de condomínio (admin tentando consultar condomínio)
  if (periodoParam && /^(VAC|AYR|VID|TAR|DES|SPE)/i.test(periodoParam)) {
    await bot.sendMessage(chatId,
      `ℹ️ Para consultar um condomínio use:\n\`/condominio ${periodoParam.split(' ')[0].toUpperCase()}\`\n\nO /consultar é para o morador ver o próprio pagamento.`,
      { parse_mode: 'Markdown' }
    );
    return;
  }
  const usuario = await fb.getUsuarioBot(from.id);

  if (!usuario) {
    await bot.sendMessage(chatId, MSGS.BEM_VINDO, { parse_mode: 'Markdown' });
    return;
  }

  // Período: parâmetro passado ou mês atual
  let periodo = getPeriodoAtual();
  if (periodoParam) {
    // Aceita MM/YYYY ou YYYY-MM
    const m1 = periodoParam.match(/^(\d{2})\/(\d{4})$/);
    const m2 = periodoParam.match(/^(\d{4})-(\d{2})$/);
    if (m1) periodo = `${m1[2]}-${m1[1]}`;
    else if (m2) periodo = `${m2[1]}-${m2[2]}`;
    else {
      await bot.sendMessage(chatId, '❌ Formato de período inválido. Use: `03/2026`', { parse_mode: 'Markdown' });
      return;
    }
  }

  const resultado = await fb.getApartamentoPorCodigo(usuario.codigo);
  if (!resultado) {
    await bot.sendMessage(chatId, '❌ Unidade não encontrada. Recadastre com /start.');
    return;
  }

  const { apartamento, bloco, condominio } = resultado;
  const pagamento = await fb.getPagamento(apartamento.id, periodo);
  const status = pagamento ? pagamento.status : 'pendente';
  const valor = pagamento ? pagamento.value : 0;

  await bot.sendMessage(chatId,
    `📊 *Status de Pagamento*\n\n` +
    `🏢 ${condominio.nome}\n` +
    `🏗️ ${bloco.nome} — Unidade *${apartamento.numero}*\n` +
    `📅 Período: *${formatarPeriodo(periodo)}*\n\n` +
    `${emojiStatus(status)} Status: *${status.toUpperCase()}*` +
    `\n\n_Para outro mês: /consultar 03/2026_`,
    { parse_mode: 'Markdown' }
  );
}

// ─── /historico ───────────────────────────────────────────────────────────────
async function handleHistorico(bot, msg) {
  const chatId = msg.chat.id;
  const from = msg.from;
  const usuario = await fb.getUsuarioBot(from.id);

  if (!usuario) {
    await bot.sendMessage(chatId, MSGS.BEM_VINDO, { parse_mode: 'Markdown' });
    return;
  }

  const resultado = await fb.getApartamentoPorCodigo(usuario.codigo);
  if (!resultado) return;

  const { apartamento } = resultado;

  // Buscar últimos 6 meses
  const linhas = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const periodo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const pag = await fb.getPagamento(apartamento.id, periodo);
    const status = pag ? pag.status : 'pendente';
    linhas.push(`${emojiStatus(status)} ${formatarPeriodo(periodo)}: *${status}*`);
  }

  await bot.sendMessage(chatId,
    `📋 *Histórico — ${usuario.codigo}*\n\n${linhas.join('\n')}`,
    { parse_mode: 'Markdown' }
  );
}

// ─── Receber comprovante ──────────────────────────────────────────────────────
async function handleComprovante(bot, msg, adminIds) {
  const chatId = msg.chat.id;
  const from = msg.from;
  const photo = msg.photo;
  const document = msg.document;
  const usuario = await fb.getUsuarioBot(from.id);

  if (!usuario) {
    await bot.sendMessage(chatId, '⚠️ Cadastre sua unidade primeiro com /start.');
    return;
  }

  let fileId, fileType;
  if (photo) {
    fileId = photo[photo.length - 1].file_id;
    fileType = 'imagem';
  } else if (document) {
    fileId = document.file_id;
    fileType = document.mime_type || 'documento';
  } else {
    return;
  }

  const periodo = getPeriodoAtual();
  await fb.salvarComprovante(from.id, usuario.codigo, fileId, fileType, periodo);

  await bot.sendMessage(chatId,
    `✅ *Comprovante recebido!*\n\nUnidade: \`${usuario.codigo}\`\nPeríodo: ${formatarPeriodo(periodo)}\n\nAguarde a confirmação do administrador.`,
    { parse_mode: 'Markdown' }
  );

  // Encaminhar para todos os admins
  const caption = `📥 *Novo Comprovante*\n\nUnidade: \`${usuario.codigo}\`\nMorador: ${from.first_name}\nPeríodo: ${formatarPeriodo(periodo)}`;
  for (const adminId of adminIds) {
    try {
      if (photo) {
        await bot.sendPhoto(adminId, fileId, { caption, parse_mode: 'Markdown' });
      } else {
        await bot.sendDocument(adminId, fileId, { caption, parse_mode: 'Markdown' });
      }
    } catch (e) {
      console.error(`Erro ao encaminhar para admin ${adminId}:`, e.message);
    }
  }
}

// ─── /apto DES-01-101 (admin) ─────────────────────────────────────────────────
async function handleConsultarApto(bot, msg, codigo) {
  const chatId = msg.chat.id;
  const from = msg.from;
  if (!await requireAdmin(bot, msg)) return;

  const resultado = await fb.getApartamentoPorCodigo(codigo);
  if (!resultado) {
    await bot.sendMessage(chatId, `❌ Unidade \`${codigo}\` não encontrada.`, { parse_mode: 'Markdown' });
    return;
  }

  const { apartamento, bloco, condominio } = resultado;
  const periodo = getPeriodoAtual();
  const pagamento = await fb.getPagamento(apartamento.id, periodo);
  const status = pagamento ? pagamento.status : 'pendente';

  await bot.sendMessage(chatId,
    `🔍 *Consulta de Unidade*\n\n` +
    `🏢 ${condominio.nome}\n` +
    `🏗️ ${bloco.nome} — *${apartamento.numero}*\n` +
    `👤 ${apartamento.proprietario}\n` +
    `📅 ${formatarPeriodo(periodo)}: ${emojiStatus(status)} *${status.toUpperCase()}*`,
    { parse_mode: 'Markdown' }
  );
}

// ─── /bloco DES-01 (admin) ────────────────────────────────────────────────────
async function handleConsultarBloco(bot, msg, codigoBloco) {
  const chatId = msg.chat.id;
  if (!await requireAdmin(bot, msg)) return;

  const match = codigoBloco.toUpperCase().match(/^(VAC|AYR|VID|TAR|DES|SPE)-(\d{2})$/);
  if (!match) {
    await bot.sendMessage(chatId, '❌ Formato inválido. Use: `/bloco DES-01`', { parse_mode: 'Markdown' });
    return;
  }

  const [, condCodigo, blocoNum] = match;
  const condominio = await fb.getCondominioPorCodigo(condCodigo);
  if (!condominio) {
    await bot.sendMessage(chatId, '❌ Condomínio não encontrado.');
    return;
  }

  const { db } = require('./firebase');
  const blocoSnap = await db.collection('blocos')
    .where('condominioId', '==', condominio.id)
    .where('numero', '==', parseInt(blocoNum))
    .where('active', '==', true)
    .limit(1)
    .get();

  if (blocoSnap.empty) {
    await bot.sendMessage(chatId, `❌ Bloco ${blocoNum} não encontrado em ${condominio.nome}.`);
    return;
  }

  const bloco = { id: blocoSnap.docs[0].id, ...blocoSnap.docs[0].data() };
  const periodo = getPeriodoAtual();
  const apts = await fb.getApartamentosPorBloco(bloco.id);
  const pagMap = await fb.getPagamentosPorBloco(bloco.id, periodo);

  let pago = 0, pendente = 0;
  const linhas = apts.map(apt => {
    const pag = pagMap[apt.id];
    const status = pag ? pag.status : 'pendente';
    if (['pago', 'reciclado'].includes(status)) pago++;
    else pendente++;
    return `${emojiStatus(status)} ${apt.numero}`;
  });

  // Dividir em grupos de 16 para não ultrapassar limite do Telegram
  const chunks = [];
  for (let i = 0; i < linhas.length; i += 16) chunks.push(linhas.slice(i, i + 16));

  await bot.sendMessage(chatId,
    `🏗️ *${bloco.nome} — ${condominio.nome}*\n📅 ${formatarPeriodo(periodo)}\n\n` +
    `✅ Pagos: ${pago} | ⏳ Pendentes: ${pendente}\n\n` +
    chunks[0].join('  '),
    { parse_mode: 'Markdown' }
  );
}

// ─── /condominio DES (admin) ──────────────────────────────────────────────────
async function handleConsultarCondominio(bot, msg, codigo) {
  const chatId = msg.chat.id;
  if (!await requireAdmin(bot, msg)) return;

  const condominio = await fb.getCondominioPorCodigo(codigo);
  if (!condominio) {
    await bot.sendMessage(chatId, `❌ Condomínio \`${codigo}\` não encontrado.\n\nCódigos: VAC, AYR, VID, TAR, DES, SPE`, { parse_mode: 'Markdown' });
    return;
  }

  const periodo = getPeriodoAtual();
  const pendentes = await fb.getPendentes(condominio.id, periodo);

  // Buscar total de unidades
  const { db } = require('./firebase');
  const totalSnap = await db.collection('apartamentos')
    .where('condominioId', '==', condominio.id)
    .where('active', '==', true)
    .get();

  const total = totalSnap.size;
  const totalPago = total - pendentes.length;
  const pct = total > 0 ? Math.round((totalPago / total) * 100) : 0;

  await bot.sendMessage(chatId,
    `🏢 *${condominio.nome}*\n📅 ${formatarPeriodo(periodo)}\n\n` +
    `📊 Total de unidades: *${total}*\n` +
    `✅ Pagas: *${totalPago}* (${pct}%)\n` +
    `⏳ Pendentes: *${pendentes.length}*`,
    { parse_mode: 'Markdown' }
  );
}

// ─── /pendentes (admin) ───────────────────────────────────────────────────────
async function handlePendentes(bot, msg, codigoCond) {
  const chatId = msg.chat.id;
  if (!await requireAdmin(bot, msg)) return;

  const condominio = await fb.getCondominioPorCodigo(codigoCond);
  if (!condominio) {
    await bot.sendMessage(chatId,
      `❌ Informe o código do condomínio.\nEx: \`/pendentes DES\`\n\nCódigos: VAC, AYR, VID, TAR, DES, SPE`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const periodo = getPeriodoAtual();
  await bot.sendMessage(chatId, `🔍 Buscando pendentes de ${condominio.nome}...`);

  const pendentes = await fb.getPendentes(condominio.id, periodo);

  if (pendentes.length === 0) {
    await bot.sendMessage(chatId, `🎉 *${condominio.nome}* — Nenhum pendente em ${formatarPeriodo(periodo)}!`, { parse_mode: 'Markdown' });
    return;
  }

  // Agrupar por bloco
  const porBloco = {};
  pendentes.forEach(apt => {
    const b = apt.blocoNome || 'Sem bloco';
    if (!porBloco[b]) porBloco[b] = [];
    porBloco[b].push(apt.numero);
  });

  let texto = `⏳ *Pendentes — ${condominio.nome}*\n📅 ${formatarPeriodo(periodo)}\nTotal: *${pendentes.length}*\n\n`;
  for (const [bloco, unidades] of Object.entries(porBloco).sort()) {
    texto += `*${bloco}:* ${unidades.join(', ')}\n`;
  }

  // Telegram tem limite de 4096 chars
  if (texto.length > 4000) {
    texto = texto.substring(0, 3990) + '\n..._(lista truncada)_';
  }

  await bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
}

// ─── /baixar DES-01-101 (admin) ───────────────────────────────────────────────
async function handleBaixar(bot, msg, codigo, periodoParam) {
  const chatId = msg.chat.id;
  const from = msg.from;
  if (!await requireAdmin(bot, msg)) return;

  // Período: parâmetro ou mês atual
  let periodo = getPeriodoAtual();
  if (periodoParam) {
    const m1 = periodoParam.match(/^(\d{2})\/(\d{4})$/);
    const m2 = periodoParam.match(/^(\d{4})-(\d{2})$/);
    if (m1) periodo = `${m1[2]}-${m1[1]}`;
    else if (m2) periodo = `${m2[1]}-${m2[2]}`;
  }

  const resultado = await fb.getApartamentoPorCodigo(codigo);
  if (!resultado) {
    await bot.sendMessage(chatId, `❌ Unidade \`${codigo}\` não encontrada.`, { parse_mode: 'Markdown' });
    return;
  }

  const { apartamento, bloco, condominio } = resultado;
  const pagAtual = await fb.getPagamento(apartamento.id, periodo);

  if (pagAtual && ['pago', 'reciclado'].includes(pagAtual.status)) {
    await bot.sendMessage(chatId,
      `ℹ️ Unidade \`${codigo}\` já está como *${pagAtual.status}* em ${formatarPeriodo(periodo)}.`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const valor = pagAtual?.value || 285.00;
  await fb.darBaixaPagamento(apartamento.id, bloco.id, condominio.id, periodo, valor, from.id);

  await bot.sendMessage(chatId,
    `✅ *Baixa realizada com sucesso!*\n\n` +
    `🏢 ${condominio.nome}\n` +
    `🏗️ ${bloco.nome} — *${apartamento.numero}*\n` +
    `📅 ${formatarPeriodo(periodo)}\n\n` +
    `_Para outro mês: /baixar ${codigo} 03/2026_`,
    { parse_mode: 'Markdown' }
  );
}

// ─── /baixartodos DES (admin) — baixa em lote por condomínio ─────────────────
async function handleBaixarTodos(bot, msg, codigoCond, periodoParam) {
  const chatId = msg.chat.id;
  const from = msg.from;
  if (!await requireAdmin(bot, msg)) return;

  const condominio = await fb.getCondominioPorCodigo(codigoCond);
  if (!condominio) {
    await bot.sendMessage(chatId,
      `❌ Informe o código do condomínio.\nEx: \`/baixartodos DES\`\n\nCódigos: VAC, AYR, VID, TAR, DES, SPE`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // Período
  let periodo = getPeriodoAtual();
  if (periodoParam) {
    const m1 = periodoParam.match(/^(\d{2})\/(\d{4})$/);
    const m2 = periodoParam.match(/^(\d{4})-(\d{2})$/);
    if (m1) periodo = `${m1[2]}-${m1[1]}`;
    else if (m2) periodo = `${m2[1]}-${m2[2]}`;
  }

  await bot.sendMessage(chatId,
    `⏳ Processando baixa em lote...\n🏢 *${condominio.nome}*\n📅 ${formatarPeriodo(periodo)}`,
    { parse_mode: 'Markdown' }
  );

  const pendentes = await fb.getPendentes(condominio.id, periodo);

  if (pendentes.length === 0) {
    await bot.sendMessage(chatId,
      `✅ Nenhuma unidade pendente em *${condominio.nome}* — ${formatarPeriodo(periodo)}!`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // Processar em lotes de 20 para não sobrecarregar o Firestore
  const LOTE = 20;
  let processados = 0;
  let erros = 0;

  for (let i = 0; i < pendentes.length; i += LOTE) {
    const lote = pendentes.slice(i, i + LOTE);
    await Promise.all(lote.map(async (apt) => {
      try {
        await fb.darBaixaPagamento(
          apt.id,
          apt.blocoId,
          condominio.id,
          periodo,
          285.00,
          from.id
        );
        processados++;
      } catch (e) {
        erros++;
        console.error(`Erro ao baixar ${apt.numero}:`, e.message);
      }
    }));
  }

  await bot.sendMessage(chatId,
    `✅ *Baixa em lote concluída!*\n\n` +
    `🏢 ${condominio.nome}\n` +
    `📅 ${formatarPeriodo(periodo)}\n\n` +
    `✅ Baixados: *${processados}*\n` +
    (erros > 0 ? `❌ Erros: *${erros}*\n` : '') +
    `\nTotal processado: *${processados + erros}* de *${pendentes.length}* pendentes`,
    { parse_mode: 'Markdown' }
  );
}
// ─── /planilha DES ou /planilha DES-22 (admin) ───────────────────────────────
async function handlePlanilha(bot, msg, param) {
  const chatId = msg.chat.id;
  if (!await requireAdmin(bot, msg)) return;

  if (!param) {
    await bot.sendMessage(chatId,
      `❌ Informe o condomínio ou bloco.\n\nExemplos:\n\`/planilha DES\` — todo o condomínio\n\`/planilha DES-22\` — só o bloco 22`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // Verificar se é bloco específico (ex: DES-22)
  const blocoMatch = param.toUpperCase().match(/^(VAC|AYR|VID|TAR|DES|SPE)-(\d{2})$/);
  const condMatch = param.toUpperCase().match(/^(VAC|AYR|VID|TAR|DES|SPE)$/);

  if (!blocoMatch && !condMatch) {
    await bot.sendMessage(chatId,
      `❌ Formato inválido.\n\`/planilha DES\` ou \`/planilha DES-22\``,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const periodo = getPeriodoAtual();

  // ── Planilha de BLOCO específico ──────────────────────────────────────────
  if (blocoMatch) {
    const [, condCodigo, blocoNum] = blocoMatch;
    const condominio = await fb.getCondominioPorCodigo(condCodigo);
    if (!condominio) {
      await bot.sendMessage(chatId, `❌ Condomínio não encontrado.`);
      return;
    }

    const blocoSnap = await fb.db.collection('blocos')
      .where('condominioId', '==', condominio.id)
      .where('numero', '==', parseInt(blocoNum))
      .where('active', '==', true)
      .limit(1)
      .get();

    if (blocoSnap.empty) {
      await bot.sendMessage(chatId, `❌ Bloco ${blocoNum} não encontrado em ${condominio.nome}.`);
      return;
    }

    const bloco = { id: blocoSnap.docs[0].id, ...blocoSnap.docs[0].data() };
    await bot.sendMessage(chatId, `📊 Gerando planilha do ${bloco.nome}...`);

    const dados = await fb.getPagamentosBloco(bloco.id, periodo);
    const nomeAba = `Pag ${periodo}`;
    const nomeArquivo = `${condCodigo}_Bloco${blocoNum}_${periodo}.xlsx`;
    const buffer = gerarExcel(dados, nomeAba);

    await bot.sendDocument(chatId, buffer, {
      caption: `📊 *${condominio.nome} — ${bloco.nome}*\nPeríodo: ${formatarPeriodo(periodo)}\nTotal: ${dados.length} unidades`,
      parse_mode: 'Markdown'
    }, {
      filename: nomeArquivo,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    return;
  }

  // ── Planilha de CONDOMÍNIO completo ───────────────────────────────────────
  const condominio = await fb.getCondominioPorCodigo(param.toUpperCase());
  if (!condominio) {
    await bot.sendMessage(chatId,
      `❌ Condomínio não encontrado.\nCódigos: VAC, AYR, VID, TAR, DES, SPE`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  await bot.sendMessage(chatId, `📊 Gerando planilha de ${condominio.nome}...`);

  const dados = await fb.getPagamentosParaPlanilha(condominio.id, periodo);
  const nomeAba = `Pag ${periodo}`;
  const nomeArquivo = `${param.toUpperCase()}_${periodo}.xlsx`;
  const buffer = gerarExcel(dados, nomeAba);

  await bot.sendDocument(chatId, buffer, {
    caption: `📊 *${condominio.nome}*\nPeríodo: ${formatarPeriodo(periodo)}\nTotal: ${dados.length} unidades`,
    parse_mode: 'Markdown'
  }, {
    filename: nomeArquivo,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

// ─── /salao — morador consulta disponibilidade ───────────────────────────────
async function handleSalao(bot, msg, dataParam) {
  const chatId = msg.chat.id;
  const from = msg.from;
  const usuario = await fb.getUsuarioBot(from.id);

  if (!usuario) {
    await bot.sendMessage(chatId, '⚠️ Cadastre sua unidade primeiro com /start.');
    return;
  }

  const resultado = await fb.getApartamentoPorCodigo(usuario.codigo);
  if (!resultado) return;
  const { condominio } = resultado;

  // Sem data = mostrar reservas do mês atual
  if (!dataParam) {
    const now = new Date();
    const reservas = await fb.getReservasSalao(condominio.id, now.getFullYear(), now.getMonth() + 1);

    if (reservas.length === 0) {
      await bot.sendMessage(chatId,
        `🎉 *Salão de Festas — ${condominio.nome}*\n\nNenhuma reserva este mês. Salão disponível!\n\nPara reservar: \`/reservar DD/MM/AAAA\``,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const linhas = reservas.map(r => {
      const emoji = { pendente: '⏳', confirmado: '✅', pago: '✅', cancelado: '❌' }[r.status] || '❓';
      return `${emoji} ${r.date} — Apto ${r.apartamentoNumero} (${r.status})`;
    });

    await bot.sendMessage(chatId,
      `🏛️ *Salão de Festas — ${condominio.nome}*\n\n${linhas.join('\n')}\n\nPara reservar: \`/reservar DD/MM/AAAA\``,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // Com data = verificar disponibilidade
  const match = dataParam.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    await bot.sendMessage(chatId, '❌ Formato inválido. Use: `DD/MM/AAAA`\nEx: `/salao 25/05/2026`', { parse_mode: 'Markdown' });
    return;
  }
  const dataISO = `${match[3]}-${match[2]}-${match[1]}`;
  const disponivel = await fb.dataDisponivelSalao(condominio.id, dataISO);

  await bot.sendMessage(chatId,
    disponivel
      ? `✅ *${dataParam}* está disponível!\n\nPara reservar: \`/reservar ${dataParam}\``
      : `❌ *${dataParam}* já está reservado.`,
    { parse_mode: 'Markdown' }
  );
}

// ─── /reservar DD/MM/AAAA — morador solicita reserva ─────────────────────────
async function handleReservar(bot, msg, dataParam, adminIds) {
  const chatId = msg.chat.id;
  const from = msg.from;
  const usuario = await fb.getUsuarioBot(from.id);

  if (!usuario) {
    await bot.sendMessage(chatId, '⚠️ Cadastre sua unidade primeiro com /start.');
    return;
  }

  if (!dataParam) {
    await bot.sendMessage(chatId,
      `🏛️ *Reservar Salão de Festas*\n\nInforme a data desejada:\n\`/reservar DD/MM/AAAA\`\n\nEx: \`/reservar 27/04/2026\`\n\nPara ver disponibilidade: /salao`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const match = dataParam.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    await bot.sendMessage(chatId,
      `❌ Formato inválido.\n\nUse: \`/reservar DD/MM/AAAA\`\nEx: \`/reservar 27/04/2026\`\n\n⚠️ Não use o código do apartamento aqui — informe a *data* da reserva.`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const dataISO = `${match[3]}-${match[2]}-${match[1]}`;
  const resultado = await fb.getApartamentoPorCodigo(usuario.codigo);
  if (!resultado) return;
  const { apartamento, bloco, condominio } = resultado;

  // Verificar disponibilidade
  const disponivel = await fb.dataDisponivelSalao(condominio.id, dataISO);
  if (!disponivel) {
    await bot.sendMessage(chatId, `❌ *${dataParam}* já está reservado. Use /salao para ver datas disponíveis.`, { parse_mode: 'Markdown' });
    return;
  }

  await fb.solicitarReservaSalao(condominio.id, apartamento.id, apartamento.numero, bloco.nome, dataISO, from.id);

  await bot.sendMessage(chatId,
    `✅ *Solicitação de Reserva Enviada!*\n\n` +
    `🏛️ Salão de Festas\n` +
    `🏢 ${condominio.nome}\n` +
    `🏠 Unidade: ${usuario.codigo}\n` +
    `📅 Data: *${dataParam}*\n\n` +
    `⏳ Aguarde a confirmação do administrador.`,
    { parse_mode: 'Markdown' }
  );

  // Notificar admins
  for (const adminId of adminIds) {
    try {
      await bot.sendMessage(adminId,
        `🏛️ *Nova Solicitação de Reserva*\n\n` +
        `🏢 ${condominio.nome}\n` +
        `🏠 ${bloco.nome} — Apto ${apartamento.numero}\n` +
        `👤 ${from.first_name}\n` +
        `📅 Data: *${dataParam}*\n\n` +
        `Use \`/salao ${condominio.nome.replace('Condomínio ', '').toUpperCase().substring(0,3)}\` para ver reservas.`,
        { parse_mode: 'Markdown' }
      );
    } catch (e) {}
  }
}

// ─── /salao DES (admin) — ver reservas do condomínio ─────────────────────────
async function handleSalaoAdmin(bot, msg, codigoCond) {
  const chatId = msg.chat.id;
  if (!await requireAdmin(bot, msg)) return;

  const condominio = await fb.getCondominioPorCodigo(codigoCond);
  if (!condominio) {
    await bot.sendMessage(chatId,
      `❌ Informe o código.\nEx: \`/reservas DES\`\n\nCódigos: VAC, AYR, VID, TAR, DES, SPE`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const now = new Date();
  const reservas = await fb.getReservasSalao(condominio.id, now.getFullYear(), now.getMonth() + 1);

  if (reservas.length === 0) {
    await bot.sendMessage(chatId, `🏛️ *${condominio.nome}* — Nenhuma reserva este mês.`, { parse_mode: 'Markdown' });
    return;
  }

  const linhas = reservas.map(r => {
    const emoji = { pendente: '⏳', confirmado: '✅', pago: '✅', cancelado: '❌' }[r.status] || '❓';
    return `${emoji} ${r.date} — Apto ${r.apartamentoNumero} (${r.status})\n   ID: \`${r.id}\``;
  });

  await bot.sendMessage(chatId,
    `🏛️ *Reservas — ${condominio.nome}*\n\n${linhas.join('\n\n')}`,
    { parse_mode: 'Markdown' }
  );
}
// ─── /confirmarreserva ID (admin) ────────────────────────────────────────────
async function handleConfirmarReserva(bot, msg, reservaId) {
  const chatId = msg.chat.id;
  if (!await requireAdmin(bot, msg)) return;

  if (!reservaId) {
    await bot.sendMessage(chatId,
      `❌ Informe o ID da reserva.\nEx: \`/confirmarreserva abc123\`\n\nUse \`/reservas DES\` para ver os IDs.`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const snap = await fb.db.collection('salaoReservations').doc(reservaId).get();
  if (!snap.exists) {
    await bot.sendMessage(chatId, `❌ Reserva \`${reservaId}\` não encontrada.`, { parse_mode: 'Markdown' });
    return;
  }

  const reserva = snap.data();
  await fb.db.collection('salaoReservations').doc(reservaId).update({
    status: 'confirmado',
    confirmadoPor: msg.from.id,
    confirmadoEm: require('firebase-admin').firestore.FieldValue.serverTimestamp()
  });

  await bot.sendMessage(chatId,
    `✅ *Reserva Confirmada!*\n\n📅 Data: *${reserva.date}*\n🏠 Apto: ${reserva.apartamentoNumero}\nStatus: *CONFIRMADO*`,
    { parse_mode: 'Markdown' }
  );

  if (reserva.solicitadoPor) {
    try {
      await bot.sendMessage(reserva.solicitadoPor,
        `✅ *Sua reserva foi confirmada!*\n\n🏛️ Salão de Festas\n📅 Data: *${reserva.date}*\n\nDúvidas? Use /mensagem`,
        { parse_mode: 'Markdown' }
      );
    } catch (e) {}
  }
}

// ─── /cancelarreserva ID (admin) ──────────────────────────────────────────────
async function handleCancelarReserva(bot, msg, reservaId) {
  const chatId = msg.chat.id;
  if (!await requireAdmin(bot, msg)) return;

  if (!reservaId) {
    await bot.sendMessage(chatId, `❌ Informe o ID.\nEx: \`/cancelarreserva abc123\``, { parse_mode: 'Markdown' });
    return;
  }

  const snap = await fb.db.collection('salaoReservations').doc(reservaId).get();
  if (!snap.exists) {
    await bot.sendMessage(chatId, `❌ Reserva não encontrada.`);
    return;
  }

  const reserva = snap.data();
  await fb.db.collection('salaoReservations').doc(reservaId).update({
    status: 'cancelado',
    canceladoPor: msg.from.id,
    canceladoEm: require('firebase-admin').firestore.FieldValue.serverTimestamp()
  });

  await bot.sendMessage(chatId,
    `❌ *Reserva Cancelada*\n\n📅 ${reserva.date} — Apto ${reserva.apartamentoNumero}`,
    { parse_mode: 'Markdown' }
  );

  if (reserva.solicitadoPor) {
    try {
      await bot.sendMessage(reserva.solicitadoPor,
        `❌ *Sua reserva foi cancelada.*\n\n📅 Data: ${reserva.date}\n\nPara mais informações, use /mensagem.`,
        { parse_mode: 'Markdown' }
      );
    } catch (e) {}
  }
}

async function handleMensagem(bot, msg, texto, adminIds) {
  const chatId = msg.chat.id;
  const from = msg.from;
  const usuario = await fb.getUsuarioBot(from.id);

  if (!usuario) {
    await bot.sendMessage(chatId, '⚠️ Cadastre sua unidade primeiro com /start.');
    return;
  }

  if (!texto) {
    await bot.sendMessage(chatId,
      `💬 *Enviar Mensagem ao Administrador*\n\nUse: \`/mensagem Seu texto aqui\`\n\nEx: \`/mensagem Preciso de segunda via do boleto\``,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // Confirmar para o morador
  await bot.sendMessage(chatId,
    `✅ Mensagem enviada ao administrador!\n\n_"${texto}"_`,
    { parse_mode: 'Markdown' }
  );

  // Encaminhar para todos os admins
  const aviso = `📩 *Mensagem de Morador*\n\n` +
    `👤 ${from.first_name} ${from.last_name || ''}\n` +
    `🏠 Unidade: \`${usuario.codigo}\`\n\n` +
    `💬 _${texto}_\n\n` +
    `_Para responder, use o Telegram diretamente._`;

  for (const adminId of adminIds) {
    try {
      await bot.sendMessage(adminId, aviso, { parse_mode: 'Markdown' });
    } catch (e) {
      console.error(`Erro ao notificar admin ${adminId}:`, e.message);
    }
  }
}
async function handleAjuda(bot, msg, isAdminUser) {
  const chatId = msg.chat.id;

  let texto = `📖 *Comandos Disponíveis*\n\n`;
  texto += `*Para Moradores:*\n`;
  texto += `/start — Cadastrar sua unidade\n`;
  texto += `/trocar DES-22-403 — Trocar de unidade\n`;
  texto += `/consultar — Ver status do pagamento\n`;
  texto += `📎 Envie uma imagem ou PDF para enviar comprovante\n`;
  texto += `/salao — Ver disponibilidade do salão\n`;
  texto += `/reservar 25/05/2026 — Solicitar reserva do salão\n`;
  texto += `/mensagem Texto — Enviar mensagem ao administrador\n`;

  if (isAdminUser) {
    texto += `\n*Para Administradores:*\n`;
    texto += `/apto DES-01-101 — Consultar unidade\n`;
    texto += `/bloco DES-01 — Consultar bloco\n`;
    texto += `/condominio DES — Resumo do condomínio\n`;
    texto += `/pendentes DES — Listar pendentes\n`;
    texto += `/baixar DES-01-101 — Dar baixa no pagamento\n`;
    texto += `/reservas DES — Ver reservas do salão\n`;
    texto += `/confirmarreserva ID — Confirmar reserva\n`;
    texto += `/cancelarreserva ID — Cancelar reserva\n`;
    texto += `/planilha DES — Planilha do condomínio\n`;
    texto += `/planilha DES-22 — Planilha só do bloco 22\n`;
    texto += `\n*Códigos:* VAC AYR VID TAR DES SPE`;
  }

  await bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
}

module.exports = {
  handleStart,
  handleTrocar,
  handleCadastroCodigo,
  handleConsultar,
  handleHistorico,
  handleComprovante,
  handleMensagem,
  handleSalao,
  handleReservar,
  handleSalaoAdmin,
  handleConfirmarReserva,
  handleCancelarReserva,
  handleConsultarApto,
  handleConsultarBloco,
  handleConsultarCondominio,
  handlePendentes,
  handleBaixar,
  handleBaixarTodos,
  handlePlanilha,
  handleAjuda
};
