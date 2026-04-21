/**
 * bot.js — Ponto de entrada do Bot Telegram
 * Sistema de Gestão Condominial
 */
require('dotenv').config();
const http = require('http');

// ─── Servidor HTTP PRIMEIRO — Render precisa detectar a porta ─────────────────
const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot Telegram rodando OK');
});
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Servidor HTTP na porta ${PORT}`);
  iniciarBot(); // Só inicia o bot depois que o servidor HTTP estiver pronto
});

// ─── Inicializar bot (chamado após servidor HTTP subir) ───────────────────────
function iniciarBot() {
  const TelegramBot = require('node-telegram-bot-api');
  const { BOT_TOKEN, ADMIN_IDS, CODIGO_REGEX, MSGS } = require('./config');
  const { isAdmin } = require('./permissions');
  const handlers = require('./handlers');

  if (!BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN não configurado');
    process.exit(1);
  }

  const bot = new TelegramBot(BOT_TOKEN, { polling: true });
  console.log('🤖 Bot Telegram iniciado!');
  console.log(`👮 Admins configurados: ${ADMIN_IDS.join(', ') || 'nenhum'}`);

  bot.on('polling_error', err => {
    if (!err.message.includes('409')) console.error('Polling error:', err.message);
  });

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
        console.error(`❌ Erro no handler: ${err.message}`);
        try { await bot.sendMessage(chatId, MSGS.ERRO_GERAL); } catch (_) {}
      }
    };
  }

  bot.onText(/\/start/, safe(async (msg) => {
    console.log(`▶️  /start de ${msg.from?.id} chat: ${msg.chat?.id}`);
    await handlers.handleStart(bot, msg);
  }));

  bot.onText(/\/trocar(?:\s+(.+))?/, safe((msg, match) =>
    handlers.handleTrocar(bot, msg, match[1] ? match[1].trim() : null)
  ));

  bot.onText(/\/consultar(?:\s+(.+))?/, safe((msg, match) =>
    handlers.handleConsultar(bot, msg, match[1] ? match[1].trim() : null)
  ));

  bot.onText(/\/historico/, safe(msg => handlers.handleHistorico(bot, msg)));

  bot.onText(/\/ajuda/, safe(msg => {
    const adminUser = msg.from ? isAdmin(msg.from.id) : false;
    return handlers.handleAjuda(bot, msg, adminUser);
  }));

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
    const texto = msg.text.trim().toUpperCase();

    if (CODIGO_REGEX.test(texto)) {
      await handlers.handleCadastroCodigo(bot, msg, texto);
      return;
    }

    if (isAdmin(msg.from.id)) {
      await handleNaturalLanguage(bot, msg, texto, handlers);
      return;
    }

    const { getUsuarioBot } = require('./firebase');
    const usuario = await getUsuarioBot(msg.from.id);
    if (!usuario) {
      await bot.sendMessage(msg.chat.id, MSGS.BEM_VINDO, { parse_mode: 'Markdown' });
    }
  }));

  bot.on('photo', safe(msg => handlers.handleComprovante(bot, msg, ADMIN_IDS)));
  bot.on('document', safe(msg => handlers.handleComprovante(bot, msg, ADMIN_IDS)));

  console.log('✅ Todos os handlers registrados. Aguardando mensagens...');
}

async function handleNaturalLanguage(bot, msg, texto, handlers) {
  const chatId = msg.chat.id;
  const { MSGS } = require('./config');

  const baixarMatch = texto.match(/(?:BAIXAR|DAR BAIXA|BAIXA)\s+([A-Z]+-\d{2}-C?\d{2,3})/);
  if (baixarMatch) return handlers.handleBaixar(bot, msg, baixarMatch[1]);

  const aptoMatch = texto.match(/(?:CONSULTAR|VER|STATUS)\s+([A-Z]+-\d{2}-C?\d{2,3})/);
  if (aptoMatch) return handlers.handleConsultarApto(bot, msg, aptoMatch[1]);

  const blocoMatch = texto.match(/BLOCO\s+([A-Z]+-\d{2})/);
  if (blocoMatch) return handlers.handleConsultarBloco(bot, msg, blocoMatch[1]);

  const condMatch = texto.match(/(?:CONDOMINIO|RESUMO|COND)\s+(VAC|AYR|VID|TAR|DES|SPE)/);
  if (condMatch) return handlers.handleConsultarCondominio(bot, msg, condMatch[1]);

  const pendMatch = texto.match(/(?:PENDENTES|DEVENDO|INADIMPLENTES)\s+(VAC|AYR|VID|TAR|DES|SPE)/);
  if (pendMatch) return handlers.handlePendentes(bot, msg, pendMatch[1]);

  const planMatch = texto.match(/PLANILHA\s+(VAC|AYR|VID|TAR|DES|SPE)/);
  if (planMatch) return handlers.handlePlanilha(bot, msg, planMatch[1]);

  await bot.sendMessage(chatId, `🤖 Não entendi. Use /ajuda para ver os comandos.`);
}

// ─── Validação inicial ────────────────────────────────────────────────────────
if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN não configurado no .env');
  process.exit(1);
}

// ─── Inicializar bot ──────────────────────────────────────────────────────────
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
console.log('🤖 Bot Telegram iniciado!');
console.log(`👮 Admins configurados: ${ADMIN_IDS.join(', ') || 'nenhum'}`);

// ─── Suprimir erros de polling (não críticos) ─────────────────────────────────
bot.on('polling_error', err => {
  // Ignorar erros 409 (conflito de instâncias) e logar o resto
  if (!err.message.includes('409')) {
    console.error('Polling error:', err.message);
  }
});

// ─── Helper: valida se msg tem chat_id ───────────────────────────────────────
function getChatId(msg) {
  return msg && msg.chat && msg.chat.id ? msg.chat.id : null;
}

// ─── Helper: wrapper seguro ───────────────────────────────────────────────────
function safe(fn) {
  return async (msg, match) => {
    const chatId = getChatId(msg);
    if (!chatId) return;

    try {
      await fn(msg, match);
    } catch (err) {
      console.error(`❌ Erro no handler: ${err.message}`);
      console.error(err.stack);
      try {
        await bot.sendMessage(chatId, `❌ Erro interno: ${err.message}`);
      } catch (e) {
        console.error('Falha ao enviar mensagem de erro:', e.message);
      }
    }
  };
}

// ─── /start ───────────────────────────────────────────────────────────────────
bot.onText(/\/start/, safe(async (msg) => {
  console.log(`▶️  /start de ${msg.from?.id} chat: ${msg.chat?.id}`);
  await handlers.handleStart(bot, msg);
}));

// ─── /trocar (aceita código direto: /trocar DES-22-403) ──────────────────────
bot.onText(/\/trocar(?:\s+(.+))?/, safe((msg, match) =>
  handlers.handleTrocar(bot, msg, match[1] ? match[1].trim() : null)
));

// ─── /consultar (aceita período opcional: /consultar 03/2026) ────────────────
bot.onText(/\/consultar(?:\s+(.+))?/, safe((msg, match) =>
  handlers.handleConsultar(bot, msg, match[1] ? match[1].trim() : null)
));

// ─── /historico ───────────────────────────────────────────────────────────────
bot.onText(/\/historico/, safe(msg => handlers.handleHistorico(bot, msg)));

// ─── /ajuda ───────────────────────────────────────────────────────────────────
bot.onText(/\/ajuda/, safe(msg => {
  const adminUser = msg.from ? isAdmin(msg.from.id) : false;
  return handlers.handleAjuda(bot, msg, adminUser);
}));

// ─── /apto DES-01-101 (admin) ─────────────────────────────────────────────────
bot.onText(/\/apto\s+(.+)/i, safe((msg, match) =>
  handlers.handleConsultarApto(bot, msg, match[1].trim())
));

// ─── /bloco DES-01 (admin) ────────────────────────────────────────────────────
bot.onText(/\/bloco\s+(.+)/i, safe((msg, match) =>
  handlers.handleConsultarBloco(bot, msg, match[1].trim())
));

// ─── /condominio DES (admin) ──────────────────────────────────────────────────
bot.onText(/\/condominio\s+(.+)/i, safe((msg, match) =>
  handlers.handleConsultarCondominio(bot, msg, match[1].trim())
));

// ─── /pendentes DES (admin) ───────────────────────────────────────────────────
bot.onText(/\/pendentes(?:\s+(.+))?/i, safe((msg, match) =>
  handlers.handlePendentes(bot, msg, (match[1] || '').trim())
));

// ─── /baixar DES-01-101 (admin) — aceita período: /baixar DES-01-101 03/2026 ──
bot.onText(/\/baixar\s+(\S+)(?:\s+(.+))?/i, safe((msg, match) =>
  handlers.handleBaixar(bot, msg, match[1].trim(), match[2] ? match[2].trim() : null)
));

// ─── /baixartodos DES (admin) — baixa em lote: /baixartodos DES 03/2026 ───────
bot.onText(/\/baixartodos\s+(\S+)(?:\s+(.+))?/i, safe((msg, match) =>
  handlers.handleBaixarTodos(bot, msg, match[1].trim().toUpperCase(), match[2] ? match[2].trim() : null)
));

// ─── /planilha DES (admin) ────────────────────────────────────────────────────
bot.onText(/\/planilha(?:\s+(.+))?/i, safe((msg, match) =>
  handlers.handlePlanilha(bot, msg, (match[1] || '').trim())
));

// ─── Mensagens de texto livre ─────────────────────────────────────────────────
bot.on('message', safe(async (msg) => {
  // Só processar mensagens de texto simples
  if (!msg.text) return;
  if (msg.text.startsWith('/')) return;
  if (!msg.from) return;

  const texto = msg.text.trim().toUpperCase();

  // Código de unidade (ex: DES-01-101 ou VID-20-C01)
  if (CODIGO_REGEX.test(texto)) {
    await handlers.handleCadastroCodigo(bot, msg, texto);
    return;
  }

  // IA Natural para admins
  if (isAdmin(msg.from.id)) {
    await handleNaturalLanguage(bot, msg, texto);
    return;
  }

  // Morador sem cadastro
  const { getUsuarioBot } = require('./firebase');
  const usuario = await getUsuarioBot(msg.from.id);
  if (!usuario) {
    await bot.sendMessage(msg.chat.id, MSGS.BEM_VINDO, { parse_mode: 'Markdown' });
  }
}));

// ─── Fotos e documentos (comprovantes) ───────────────────────────────────────
bot.on('photo', safe(msg => handlers.handleComprovante(bot, msg, ADMIN_IDS)));
bot.on('document', safe(msg => handlers.handleComprovante(bot, msg, ADMIN_IDS)));

// ─── IA Natural (admin) ───────────────────────────────────────────────────────
async function handleNaturalLanguage(bot, msg, texto) {
  const chatId = msg.chat.id;

  const baixarMatch = texto.match(/(?:BAIXAR|DAR BAIXA|BAIXA)\s+([A-Z]+-\d{2}-C?\d{2,3})/);
  if (baixarMatch) return handlers.handleBaixar(bot, msg, baixarMatch[1]);

  const aptoMatch = texto.match(/(?:CONSULTAR|VER|STATUS)\s+([A-Z]+-\d{2}-C?\d{2,3})/);
  if (aptoMatch) return handlers.handleConsultarApto(bot, msg, aptoMatch[1]);

  const blocoMatch = texto.match(/BLOCO\s+([A-Z]+-\d{2})/);
  if (blocoMatch) return handlers.handleConsultarBloco(bot, msg, blocoMatch[1]);

  const condMatch = texto.match(/(?:CONDOMINIO|RESUMO|COND)\s+(VAC|AYR|VID|TAR|DES|SPE)/);
  if (condMatch) return handlers.handleConsultarCondominio(bot, msg, condMatch[1]);

  const pendMatch = texto.match(/(?:PENDENTES|DEVENDO|INADIMPLENTES)\s+(VAC|AYR|VID|TAR|DES|SPE)/);
  if (pendMatch) return handlers.handlePendentes(bot, msg, pendMatch[1]);

  const planMatch = texto.match(/PLANILHA\s+(VAC|AYR|VID|TAR|DES|SPE)/);
  if (planMatch) return handlers.handlePlanilha(bot, msg, planMatch[1]);

  await bot.sendMessage(chatId, `🤖 Não entendi. Use /ajuda para ver os comandos.`);
}

console.log('✅ Todos os handlers registrados. Aguardando mensagens...');
