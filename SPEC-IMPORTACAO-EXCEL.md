# 📊 Especificação: Importação de Planilha Excel

**Versão**: 1.0  
**Data**: 06/05/2026  
**Status**: 📋 PLANEJAMENTO

---

## 🎯 OBJETIVO

Permitir que o **admin** possa:
1. **Exportar** dados de pagamentos para Excel (✅ já existe)
2. **Editar** a planilha offline (marcar baixas, status, etc)
3. **Importar** a planilha de volta para o sistema
4. **Atualizar** automaticamente os pagamentos no Firestore

---

## 📋 FUNCIONALIDADE ATUAL (EXPORTAÇÃO)

### Onde Existe
- **Painel Geral**: Botão "Exportar Excel" (`#exportExcel`)
- **Pagamentos de Hoje**: Função `exportarPagamentosHojeExcel()`
- **Telegram Bot**: Comando `/planilha DES` ou `/planilha DES-22`

### Formato Atual do Excel Exportado

```
Colunas:
├── Condomínio
├── Bloco
├── Apartamento
├── Código (ex: DES-01-101)
├── Status (Pago, Pendente, Reciclado, Isento)
├── Mês/Ano (ex: 01/2026)
├── Data Pagamento
├── Valor (R$)
└── Observações
```

---

## ✨ NOVA FUNCIONALIDADE (IMPORTAÇÃO)

### Interface do Usuário

#### 1. Botão de Importação
**Localização**: Painel Geral (ao lado do botão "Exportar Excel")

```html
<button id="importExcel" class="btn btn-success">
  📥 Importar Excel
</button>
```

#### 2. Modal de Importação
```html
<div id="importModal" class="modal">
  <div class="modal-content">
    <h2>📥 Importar Planilha Excel</h2>
    
    <div class="import-steps">
      <h3>Como usar:</h3>
      <ol>
        <li>Exporte a planilha atual</li>
        <li>Edite os dados (Status, Data Pagamento, Observações)</li>
        <li>Salve o arquivo Excel</li>
        <li>Selecione o arquivo abaixo para importar</li>
      </ol>
    </div>
    
    <div class="file-upload">
      <input type="file" id="excelFile" accept=".xlsx,.xls" />
      <label for="excelFile">Escolher arquivo Excel</label>
    </div>
    
    <div id="previewSection" style="display:none">
      <h3>📋 Prévia das Alterações</h3>
      <div id="changesPreview"></div>
      <p class="info">
        ✅ <span id="validCount">0</span> registros válidos
        ⚠️ <span id="warningCount">0</span> avisos
        ❌ <span id="errorCount">0</span> erros
      </p>
    </div>
    
    <div class="modal-actions">
      <button id="cancelImport" class="btn btn-secondary">Cancelar</button>
      <button id="confirmImport" class="btn btn-primary" disabled>
        Importar <span id="importCount">0</span> Registros
      </button>
    </div>
  </div>
</div>
```

---

## 🔧 IMPLEMENTAÇÃO TÉCNICA

### 1. Biblioteca para Leitura de Excel

**Opção Recomendada**: SheetJS (xlsx)
```html
<!-- Adicionar no index.html -->
<script src="https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"></script>
```

### 2. Fluxo de Importação

```javascript
// Fluxo completo
1. Usuário seleciona arquivo Excel
2. Sistema lê e valida o arquivo
3. Sistema compara com dados atuais do Firestore
4. Sistema mostra prévia das alterações
5. Usuário confirma importação
6. Sistema atualiza Firestore em lote (batch)
7. Sistema mostra relatório de sucesso/erros
```

### 3. Validações Necessárias

#### Validação de Estrutura
```javascript
const colunasObrigatorias = [
  'Código',           // DES-01-101
  'Status',           // Pago, Pendente, Reciclado, Isento
  'Mês/Ano',         // 01/2026
  'Data Pagamento',  // 06/05/2026 ou vazio
  'Observações'      // Texto livre
];
```

#### Validação de Dados
```javascript
// Status válidos
const statusValidos = ['Pago', 'Pendente', 'Reciclado', 'Isento'];

// Formato de código
const regexCodigo = /^[A-Z]{3}-\d{2}-\d{3}$/; // DES-01-101

// Formato de data
const regexData = /^\d{2}\/\d{2}\/\d{4}$/; // 06/05/2026

// Formato de período
const regexPeriodo = /^\d{2}\/\d{4}$/; // 01/2026
```

#### Validação de Negócio
```javascript
// 1. Código deve existir no Firestore
// 2. Status "Pago" deve ter Data Pagamento
// 3. Data Pagamento não pode ser futura
// 4. Período deve ser válido (01-12/YYYY)
// 5. Não permitir alterar dados de períodos muito antigos (> 12 meses)
```

### 4. Estrutura de Dados

#### Objeto de Alteração
```javascript
{
  codigo: 'DES-01-101',
  apartamentoId: 'abc123',
  periodo: '01/2026',
  alteracoes: {
    statusAnterior: 'Pendente',
    statusNovo: 'Pago',
    dataPagamentoAnterior: null,
    dataPagamentoNovo: '06/05/2026',
    observacoesAnterior: '',
    observacoesNovo: 'Pago via PIX'
  },
  valido: true,
  avisos: [],
  erros: []
}
```

---

## 📝 CÓDIGO EXEMPLO

### Função Principal de Importação

```javascript
async function importarExcel() {
  if (!requirePermission('managePayments')) return;
  
  // Abrir modal
  const modal = document.getElementById('importModal');
  modal.style.display = 'block';
  
  // Configurar input de arquivo
  const fileInput = document.getElementById('excelFile');
  fileInput.addEventListener('change', handleFileSelect);
}

async function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  showLoading('Lendo arquivo Excel...');
  
  try {
    // Ler arquivo
    const dados = await lerArquivoExcel(file);
    
    // Validar estrutura
    const validacao = validarEstrutura(dados);
    if (!validacao.valido) {
      showToast(validacao.erro, 'error');
      return;
    }
    
    // Comparar com dados atuais
    const alteracoes = await compararComFirestore(dados);
    
    // Mostrar prévia
    mostrarPrevia(alteracoes);
    
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Erro ao ler arquivo: ' + error.message, 'error');
  }
}

async function lerArquivoExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Pegar primeira aba
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Converter para JSON
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
}

function validarEstrutura(dados) {
  if (!Array.isArray(dados) || dados.length === 0) {
    return { valido: false, erro: 'Planilha vazia ou inválida' };
  }
  
  const primeiraLinha = dados[0];
  const colunasObrigatorias = ['Código', 'Status', 'Mês/Ano'];
  
  for (const coluna of colunasObrigatorias) {
    if (!(coluna in primeiraLinha)) {
      return { 
        valido: false, 
        erro: `Coluna obrigatória não encontrada: ${coluna}` 
      };
    }
  }
  
  return { valido: true };
}

async function compararComFirestore(dados) {
  const alteracoes = [];
  
  for (const linha of dados) {
    const codigo = linha['Código'];
    const statusNovo = linha['Status'];
    const dataPagamentoNovo = linha['Data Pagamento'];
    const observacoesNovo = linha['Observações'] || '';
    const periodo = linha['Mês/Ano'];
    
    // Buscar apartamento pelo código
    const apt = await buscarApartamentoPorCodigo(codigo);
    
    if (!apt) {
      alteracoes.push({
        codigo,
        valido: false,
        erros: ['Código não encontrado no sistema']
      });
      continue;
    }
    
    // Buscar pagamento atual
    const pagamentoAtual = await buscarPagamento(apt.id, periodo);
    
    // Verificar se há alterações
    const temAlteracao = 
      pagamentoAtual.status !== statusNovo ||
      pagamentoAtual.dataPagamento !== dataPagamentoNovo ||
      pagamentoAtual.observacoes !== observacoesNovo;
    
    if (!temAlteracao) continue;
    
    // Validar alteração
    const validacao = validarAlteracao(statusNovo, dataPagamentoNovo);
    
    alteracoes.push({
      codigo,
      apartamentoId: apt.id,
      periodo,
      alteracoes: {
        statusAnterior: pagamentoAtual.status,
        statusNovo,
        dataPagamentoAnterior: pagamentoAtual.dataPagamento,
        dataPagamentoNovo,
        observacoesAnterior: pagamentoAtual.observacoes,
        observacoesNovo
      },
      valido: validacao.valido,
      avisos: validacao.avisos,
      erros: validacao.erros
    });
  }
  
  return alteracoes;
}

function validarAlteracao(status, dataPagamento) {
  const avisos = [];
  const erros = [];
  
  // Validar status
  const statusValidos = ['Pago', 'Pendente', 'Reciclado', 'Isento'];
  if (!statusValidos.includes(status)) {
    erros.push(`Status inválido: ${status}`);
  }
  
  // Validar data de pagamento
  if (status === 'Pago' && !dataPagamento) {
    erros.push('Status "Pago" requer Data de Pagamento');
  }
  
  if (dataPagamento) {
    const data = parseDate(dataPagamento);
    if (!data) {
      erros.push('Data de pagamento inválida');
    } else if (data > new Date()) {
      erros.push('Data de pagamento não pode ser futura');
    }
  }
  
  return {
    valido: erros.length === 0,
    avisos,
    erros
  };
}

function mostrarPrevia(alteracoes) {
  const previewSection = document.getElementById('previewSection');
  const changesPreview = document.getElementById('changesPreview');
  
  const validas = alteracoes.filter(a => a.valido);
  const comAvisos = alteracoes.filter(a => a.avisos.length > 0);
  const comErros = alteracoes.filter(a => !a.valido);
  
  document.getElementById('validCount').textContent = validas.length;
  document.getElementById('warningCount').textContent = comAvisos.length;
  document.getElementById('errorCount').textContent = comErros.length;
  document.getElementById('importCount').textContent = validas.length;
  
  // Habilitar botão de importar se houver alterações válidas
  const confirmBtn = document.getElementById('confirmImport');
  confirmBtn.disabled = validas.length === 0;
  
  // Mostrar tabela de alterações
  let html = '<table class="preview-table">';
  html += '<thead><tr><th>Código</th><th>Alteração</th><th>Status</th></tr></thead>';
  html += '<tbody>';
  
  for (const alt of alteracoes) {
    const statusIcon = alt.valido ? '✅' : '❌';
    const statusClass = alt.valido ? 'valid' : 'error';
    
    html += `<tr class="${statusClass}">`;
    html += `<td>${alt.codigo}</td>`;
    html += `<td>`;
    
    if (alt.alteracoes) {
      html += `${alt.alteracoes.statusAnterior} → ${alt.alteracoes.statusNovo}`;
    }
    
    html += `</td>`;
    html += `<td>${statusIcon}`;
    
    if (alt.erros.length > 0) {
      html += ` ${alt.erros.join(', ')}`;
    }
    
    html += `</td>`;
    html += `</tr>`;
  }
  
  html += '</tbody></table>';
  
  changesPreview.innerHTML = html;
  previewSection.style.display = 'block';
}

async function confirmarImportacao(alteracoes) {
  const validas = alteracoes.filter(a => a.valido);
  
  if (validas.length === 0) {
    showToast('Nenhuma alteração válida para importar', 'warning');
    return;
  }
  
  showLoading(`Importando ${validas.length} registros...`);
  
  try {
    // Usar batch para atualizar múltiplos documentos
    const batch = db.batch();
    
    for (const alt of validas) {
      const pagamentoRef = db.collection('pagamentos')
        .where('apartamentoId', '==', alt.apartamentoId)
        .where('periodo', '==', alt.periodo)
        .limit(1);
      
      const snapshot = await pagamentoRef.get();
      
      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        batch.update(docRef, {
          status: alt.alteracoes.statusNovo,
          dataPagamento: alt.alteracoes.dataPagamentoNovo || null,
          observacoes: alt.alteracoes.observacoesNovo,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.email
        });
      }
    }
    
    await batch.commit();
    
    hideLoading();
    showToast(`✅ ${validas.length} registros importados com sucesso!`, 'success');
    
    // Fechar modal
    document.getElementById('importModal').style.display = 'none';
    
    // Recarregar painel
    if (typeof loadPainelData === 'function') {
      loadPainelData();
    }
    
  } catch (error) {
    hideLoading();
    showToast('Erro ao importar: ' + error.message, 'error');
  }
}
```

---

## 🎨 ESTILOS CSS

```css
/* Modal de Importação */
#importModal .modal-content {
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.import-steps {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.import-steps ol {
  margin: 10px 0 0 20px;
}

.file-upload {
  margin: 20px 0;
  text-align: center;
}

.file-upload input[type="file"] {
  display: none;
}

.file-upload label {
  display: inline-block;
  padding: 12px 24px;
  background: #4CAF50;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.file-upload label:hover {
  background: #45a049;
}

#previewSection {
  margin-top: 20px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.preview-table th,
.preview-table td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.preview-table thead {
  background: #f5f5f5;
}

.preview-table tr.valid {
  background: #f0f9f0;
}

.preview-table tr.error {
  background: #fff0f0;
}

.info {
  margin-top: 15px;
  padding: 10px;
  background: #e3f2fd;
  border-radius: 4px;
}
```

---

## 🔒 SEGURANÇA E PERMISSÕES

### Permissões Necessárias
```javascript
// Apenas admin pode importar
if (!requirePermission('managePayments')) {
  showToast('Você não tem permissão para importar dados', 'error');
  return;
}
```

### Validações de Segurança
1. ✅ Verificar autenticação do usuário
2. ✅ Verificar permissão de admin
3. ✅ Validar todos os dados antes de salvar
4. ✅ Registrar quem fez a importação (audit log)
5. ✅ Limitar tamanho do arquivo (max 5MB)
6. ✅ Limitar número de registros (max 1000 por vez)

---

## 📊 RELATÓRIO PÓS-IMPORTAÇÃO

```javascript
{
  dataImportacao: '06/05/2026 20:30:00',
  usuario: 'admin@condominio.com',
  totalLinhas: 150,
  importados: 145,
  ignorados: 3,
  erros: 2,
  detalhes: [
    { codigo: 'DES-01-101', status: 'sucesso' },
    { codigo: 'DES-01-102', status: 'erro', motivo: 'Data inválida' }
  ]
}
```

---

## 🧪 TESTES NECESSÁRIOS

### Testes Manuais
1. [ ] Importar planilha válida
2. [ ] Importar planilha com erros
3. [ ] Importar planilha vazia
4. [ ] Importar arquivo não-Excel
5. [ ] Importar com códigos inexistentes
6. [ ] Importar com datas inválidas
7. [ ] Importar com status inválidos
8. [ ] Cancelar importação
9. [ ] Verificar atualização no Firestore
10. [ ] Verificar logs de auditoria

### Testes Automatizados (Playwright)
```javascript
test('Importar planilha Excel com sucesso', async ({ page }) => {
  // Login como admin
  // Navegar para painel
  // Clicar em "Importar Excel"
  // Selecionar arquivo válido
  // Verificar prévia
  // Confirmar importação
  // Verificar mensagem de sucesso
});
```

---

## 📅 CRONOGRAMA DE IMPLEMENTAÇÃO

### Fase 1: Preparação (1-2 horas)
- [ ] Adicionar biblioteca SheetJS
- [ ] Criar estrutura HTML do modal
- [ ] Adicionar estilos CSS

### Fase 2: Leitura e Validação (2-3 horas)
- [ ] Implementar leitura de Excel
- [ ] Implementar validações
- [ ] Implementar comparação com Firestore

### Fase 3: Interface de Prévia (1-2 horas)
- [ ] Implementar exibição de alterações
- [ ] Implementar contadores
- [ ] Implementar tabela de prévia

### Fase 4: Importação (2-3 horas)
- [ ] Implementar batch update no Firestore
- [ ] Implementar tratamento de erros
- [ ] Implementar relatório final

### Fase 5: Testes (2-3 horas)
- [ ] Testes manuais completos
- [ ] Testes automatizados
- [ ] Correção de bugs

### Fase 6: Deploy (30 minutos)
- [ ] Atualizar version.json
- [ ] Deploy para produção
- [ ] Validação em produção

**Tempo Total Estimado**: 8-14 horas

---

## 🎯 BENEFÍCIOS

### Para o Admin
- ✅ Atualização em massa de pagamentos
- ✅ Trabalho offline no Excel
- ✅ Menos cliques e tempo
- ✅ Menos erros manuais

### Para o Sistema
- ✅ Auditoria completa de alterações
- ✅ Validação automática de dados
- ✅ Integridade dos dados mantida
- ✅ Performance (batch updates)

---

## ⚠️ CONSIDERAÇÕES

### Limitações
- Máximo 1000 registros por importação
- Arquivo máximo 5MB
- Apenas formatos .xlsx e .xls
- Não permite criar novos apartamentos (apenas atualizar)

### Melhorias Futuras
- [ ] Importação de múltiplos períodos
- [ ] Importação de novos apartamentos
- [ ] Histórico de importações
- [ ] Desfazer importação
- [ ] Importação agendada

---

**Preparado por**: Sistema de Gestão Condominial  
**Data**: 06/05/2026  
**Status**: 📋 Aguardando aprovação para implementação

**Deseja que eu implemente esta funcionalidade?** 🚀
