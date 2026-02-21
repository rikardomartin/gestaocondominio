# Correção: Intermitência no Status dos Blocos

## Problema Resolvido
Ao acessar o condomínio, os blocos apareciam verdes (pagos). Mas ao entrar e sair de um bloco, voltavam a ficar vermelhos. O comportamento era intermitente: entrar/sair ficava verde, atualizar ficava verde novamente.

## Causa Raiz - Conflito de Estado

Duas funções estavam manipulando o mesmo estado global de formas conflitantes:

### 1. `loadBlocosData()` - Carrega TODOS os dados
```javascript
appState.apartamentos = [apt1, apt2, apt3, apt4, apt5, ...]; // TODOS os apartamentos
appState.payments.condominio = [pag1, pag2, pag3, ...]; // TODOS os pagamentos
```

### 2. `loadApartamentosData()` - SUBSTITUÍA com dados de UM bloco
```javascript
appState.apartamentos = apartamentos; // ❌ SUBSTITUÍA todos por apenas um bloco
appState.payments.condominio = payments; // ❌ SUBSTITUÍA todos por apenas um bloco
```

### Fluxo do Problema

```
1. Seleciona Condomínio
   → loadBlocosData() carrega TODOS
   → Blocos aparecem VERDES ✅

2. Clica no Bloco 01
   → loadApartamentosData() SUBSTITUI com apenas Bloco 01
   → appState.apartamentos agora só tem Bloco 01

3. Volta para tela de blocos
   → renderBlocos() tenta calcular Bloco 02
   → Mas appState.apartamentos só tem Bloco 01!
   → Bloco 02 = 0% → VERMELHO ❌

4. Atualiza página
   → loadBlocosData() carrega TODOS novamente
   → VERDE ✅ (até clicar em um bloco novamente)
```

## Solução Implementada

### Estratégia: Mesclar em vez de Substituir

Modificamos `loadApartamentosData()` para **atualizar apenas os dados do bloco específico**, mantendo os dados dos outros blocos intactos.

### Código ANTES (Problemático)
```javascript
async function loadApartamentosData(blocoId) {
    const apartamentos = await getApartamentosByBloco(blocoId);
    appState.apartamentos = apartamentos; // ❌ SUBSTITUI todos
    
    const payments = await getPaymentsByBlocoAndPeriod(blocoId, date);
    appState.payments.condominio = payments; // ❌ SUBSTITUI todos
}
```

### Código DEPOIS (Corrigido)
```javascript
async function loadApartamentosData(blocoId) {
    const apartamentos = await getApartamentosByBloco(blocoId);
    
    // ✅ MESCLAR: Remover apartamentos antigos deste bloco
    appState.apartamentos = appState.apartamentos.filter(a => a.blocoId !== blocoId);
    // ✅ MESCLAR: Adicionar apartamentos atualizados deste bloco
    appState.apartamentos = appState.apartamentos.concat(apartamentos);
    
    const payments = await getPaymentsByBlocoAndPeriod(blocoId, date);
    
    // ✅ MESCLAR: Remover pagamentos antigos deste bloco
    appState.payments.condominio = appState.payments.condominio.filter(p => p.blocoId !== blocoId);
    // ✅ MESCLAR: Adicionar pagamentos atualizados deste bloco
    appState.payments.condominio = appState.payments.condominio.concat(payments);
}
```

### Modificação em `renderApartamentos()`

Adicionamos filtro para garantir que apenas apartamentos do bloco selecionado sejam exibidos:

```javascript
function renderApartamentos() {
    // ✅ Filtrar apenas apartamentos do bloco selecionado
    const apartamentos = appState.selectedBloco 
        ? appState.apartamentos.filter(a => a.blocoId === appState.selectedBloco.id)
        : appState.apartamentos;
    
    // ... resto do código
}
```

### Modificação em `selectBloco()`

Removemos a limpeza de `appState.apartamentos` pois agora queremos manter todos:

```javascript
async function selectBloco(bloco) {
    appState.selectedBloco = bloco;
    // ❌ REMOVIDO: appState.apartamentos = [];
    showScreen('apartamentos');
    await loadApartamentosData(bloco.id);
}
```

## Lógica de Mesclagem

### Apartamentos
```javascript
// 1. Estado inicial (todos os blocos)
appState.apartamentos = [
  {id: 1, blocoId: 'bloco1', numero: '101'},
  {id: 2, blocoId: 'bloco1', numero: '102'},
  {id: 3, blocoId: 'bloco2', numero: '201'},
  {id: 4, blocoId: 'bloco2', numero: '202'}
]

// 2. Usuário clica no Bloco 01
// Remover apartamentos do Bloco 01
appState.apartamentos = appState.apartamentos.filter(a => a.blocoId !== 'bloco1');
// Resultado: [{id: 3, blocoId: 'bloco2'}, {id: 4, blocoId: 'bloco2'}]

// 3. Adicionar apartamentos atualizados do Bloco 01
appState.apartamentos = appState.apartamentos.concat(novosApartamentosBloco1);
// Resultado: [
//   {id: 3, blocoId: 'bloco2', numero: '201'},
//   {id: 4, blocoId: 'bloco2', numero: '202'},
//   {id: 1, blocoId: 'bloco1', numero: '101'}, // Atualizado
//   {id: 2, blocoId: 'bloco1', numero: '102'}  // Atualizado
// ]
```

### Pagamentos
Mesma lógica aplicada para `appState.payments.condominio`.

## Resultado

✅ **Status consistente** - Blocos mantêm status correto independente da navegação
✅ **Sem intermitência** - Entrar/sair de blocos não afeta outros blocos
✅ **Dados sempre completos** - appState mantém dados de todos os blocos
✅ **Atualização inteligente** - Apenas o bloco clicado é atualizado, outros preservados

## Fluxo Corrigido

```
1. Seleciona Condomínio
   → loadBlocosData() carrega TODOS
   → appState.apartamentos = [todos]
   → Blocos aparecem VERDES ✅

2. Clica no Bloco 01
   → loadApartamentosData() MESCLA dados do Bloco 01
   → appState.apartamentos = [bloco2, bloco3, bloco1_atualizado]
   → Mantém dados dos outros blocos

3. Volta para tela de blocos
   → renderBlocos() calcula todos os blocos
   → Bloco 01 = 100% → VERDE ✅
   → Bloco 02 = 100% → VERDE ✅
   → Bloco 03 = 100% → VERDE ✅

4. Clica no Bloco 02
   → loadApartamentosData() MESCLA dados do Bloco 02
   → Todos os blocos continuam com dados corretos
   → Status permanece consistente
```

## Teste

1. Selecione um condomínio → Blocos aparecem verdes
2. Clique no Bloco 01 → Veja apartamentos
3. Volte para blocos → **Todos os blocos continuam verdes** ✅
4. Clique no Bloco 02 → Veja apartamentos
5. Volte para blocos → **Todos os blocos continuam verdes** ✅
6. Repita quantas vezes quiser → **Status permanece consistente** ✅

## Versão
- **Anterior**: v60
- **Atual**: v61

## Arquivos Modificados
1. `app.js` - Funções `loadApartamentosData()`, `renderApartamentos()`, `selectBloco()`
2. `sw.js` - Atualização de versão do cache

## Princípio Aplicado
**"Mesclar, não substituir"** - Ao atualizar dados de uma entidade específica, preserve os dados das outras entidades no estado global.

---
**Data**: 31/01/2026
**Versão**: v61
