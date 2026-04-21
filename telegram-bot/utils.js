/**
 * Retorna o período atual no formato YYYY-MM
 */
function getPeriodoAtual() {
  const now = new Date();
  const ano = now.getFullYear();
  const mes = String(now.getMonth() + 1).padStart(2, '0');
  return `${ano}-${mes}`;
}

/**
 * Formata período YYYY-MM para MM/YYYY
 */
function formatarPeriodo(periodo) {
  if (!periodo) return '';
  const [ano, mes] = periodo.split('-');
  return `${mes}/${ano}`;
}

/**
 * Formata valor em reais
 */
function formatarValor(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0);
}

/**
 * Emoji por status de pagamento
 */
function emojiStatus(status) {
  const map = {
    pago:     '✅',
    reciclado:'♻️',
    pendente: '⏳',
    acordo:   '🤝'
  };
  return map[status] || '❓';
}

/**
 * Gera planilha Excel em buffer usando xlsx
 */
function gerarExcel(dados, periodo) {
  const XLSX = require('xlsx');

  const cabecalho = [
    ['Condomínio', 'Bloco', 'Unidade', 'Tipo', 'Proprietário', 'Status', 'Valor', 'Data Pagamento']
  ];

  const linhas = dados.map(d => [
    d.condominio,
    d.bloco,
    d.unidade,
    d.tipo,
    d.proprietario,
    d.status,
    d.valor,
    d.data_pagamento
  ]);

  const ws = XLSX.utils.aoa_to_sheet([...cabecalho, ...linhas]);

  // Largura das colunas
  ws['!cols'] = [
    { wch: 22 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
    { wch: 25 }, { wch: 10 }, { wch: 12 }, { wch: 16 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Pagamentos ${periodo}`);

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = { getPeriodoAtual, formatarPeriodo, formatarValor, emojiStatus, gerarExcel };
