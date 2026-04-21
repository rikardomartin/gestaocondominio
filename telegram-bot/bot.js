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
  const texto = msg.text.trim().toUpperCase();

  if (CODIGO_REGEX.test(texto)) {
    await handlers.handleCadastroCodigo(bot, msg, texto);
    return;
  }

  if (isAdmin(msg.from.id)) {
    await handleNaturalLanguage(msg, texto);
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

console.log('✅ Handlers registrados. Aguardando mensagens...');

// ─── IA Natural ───────────────────────────────────────────────────────────────
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
