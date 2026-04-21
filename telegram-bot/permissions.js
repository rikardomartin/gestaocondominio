const { ADMIN_IDS } = require('./config');

/**
 * Verifica se o usuário é administrador
 */
function isAdmin(telegramId) {
  return ADMIN_IDS.includes(telegramId);
}

/**
 * Middleware: bloqueia se não for admin
 * Retorna true se passou, false se bloqueado (já enviou mensagem)
 */
async function requireAdmin(bot, msg) {
  if (!isAdmin(msg.from.id)) {
    await bot.sendMessage(msg.chat.id, '⛔ Você não tem permissão para executar este comando.');
    return false;
  }
  return true;
}

/**
 * Verifica se o morador pode acessar determinado código
 * (morador só pode ver a própria unidade)
 */
function moradorPodeAcessar(usuario, codigo) {
  if (!usuario) return false;
  if (usuario.tipo === 'admin') return true;
  return usuario.codigo.toUpperCase() === codigo.toUpperCase();
}

module.exports = { isAdmin, requireAdmin, moradorPodeAcessar };
