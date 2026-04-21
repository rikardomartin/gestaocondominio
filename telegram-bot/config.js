require('dotenv').config();

module.exports = {
  // Token do bot Telegram
  BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,

  // IDs dos administradores (array de números)
  ADMIN_IDS: (process.env.ADMIN_IDS || '').split(',').map(id => parseInt(id.trim())).filter(Boolean),

  // Códigos dos condomínios
  CONDOMINIOS: {
    VAC: 'Condomínio Vacaria',
    AYR: 'Condomínio Ayres',
    VID: 'Condomínio Vidal',
    TAR: 'Condomínio Taroni',
    DES: 'Condomínio Destri',
    SPE: 'Condomínio Speranza'
  },

  // Regex para validar código de unidade
  // Formato: VAC-01-101 | DES-27-C01 | AYR-01-C02
  CODIGO_REGEX: /^(VAC|AYR|VID|TAR|DES|SPE)-(\d{2})-(C?\d{2,3})$/i,

  // Mensagens padrão
  MSGS: {
    BEM_VINDO: `🏢 *Bem-vindo ao Sistema de Gestão Condominial!*\n\nPara começar, informe o código da sua unidade.\n\n*Exemplos:*\n• Apartamento: \`DES-01-101\`\n• Casa: \`DES-27-C01\`\n\n_Formato: CONDOMÍNIO-BLOCO-UNIDADE_`,
    CODIGO_INVALIDO: `❌ Código inválido!\n\nUse o formato correto:\n• Apartamento: \`DES-01-101\`\n• Casa: \`VID-20-C01\`\n\nCódigos dos condomínios:\n• VAC = Vacaria\n• AYR = Ayres\n• VID = Vidal\n• TAR = Taroni\n• DES = Destri\n• SPE = Speranza`,
    SEM_PERMISSAO: `⛔ Você não tem permissão para executar este comando.`,
    ERRO_GERAL: `❌ Ocorreu um erro. Tente novamente ou contate o administrador.`
  }
};
