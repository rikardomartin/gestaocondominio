# Correção: Recarregamento de Dados dos Blocos Após Salvar

## Problema Identificado (Foto Analisada)

**Situação:**
- Bloco 01: Mostra 16/16 pagos (100%) - mas você marcou 2 como pendentes
- Bloco 02: Mostra 16/16 pagos (100%)
- Bloco 03: Mostra 2/16 pagos (13%) - **funcionando corretamente** ✅
- Bloco 04: Mostra 0/16 pagos (0%) - **funcionando corretamente** ✅

**Conclusão:** O problema está no Bloco 01 e 02, que não atualizam após você salvar mudanças.

## Causa Raiz - Problema de Contexto de Tela

Quando você salva o status de um apartamento:

```
1. Você está na tela de APARTAMENTOS (dentro do Bloco 01)
   ↓
2. saveApartmentStatusNew() executa:
   ✅ Atualiza appState.payments.condominio
   ✅ Salva no Firebase
   ✅ Chama renderApartamentos() - Você VÊ a atualização
   ❌ Chama renderBlocos() - Mas você NÃO VÊ (está em outra tela!)
   ↓
3. Você volta para a tela de blocos:
   ❌ Sistema mostra o que já estava renderizado (dados antigos)
   ❌ NÃO recarrega os dados do Firebase
```

### Por que Bloco 03 e 04 funcionam?

Porque você provavelmente:
1. Entrou no Bloco 03
2. Marcou apartamentos como pendentes
3. Voltou para tela de blocos
4. **Entrou novamente no Bloco 03** - Isso dispara `loadApartamentosData()` que recarrega os dados
5. Voltou - Agora vê os dados atualizados

## Solução Implementada

### Estratégia: Recarregar Dados em Background

Em vez de chamar `renderBlocos()` (que apenas renderiza o que já está em memória), chamamos `loadBlocosData()` que **recarrega todos os dados do Firebase**.

### Código ANTES (v62 - Problemático)
```javascript
// Fechar modal
if (typeof closeApartmentModal === 'function') {
    closeApartmentModal();
}

// Recarregar todas as visualizacoes
if (typeof renderApartamentos === 'function') {
    renderApartamentos(); // ✅ Funciona
}

if (typeof renderBlocos === 'function') {
    renderBlocos(); // ❌ Renderiza dados antigos em memória
}

if (typeof renderCondominios === 'function') {
    renderCondominios(); // ❌ Renderiza dados antigos em memória
}
```

**Problema:** `renderBlocos()` apenas renderiza o que está em `appState.blocos` e `appState.apartamentos`, mas esses dados não foram recarregados do Firebase após a mudança.

### Código DEPOIS (v63 - Corrigido)
```javascript
// Fechar modal
if (typeof closeApartmentModal === 'function') {
    closeApartmentModal();
}

// Recarregar visualizacao atual
if (typeof renderApartamentos === 'function') {
    renderApartamentos(); // ✅ Atualiza lista de apartamentos
}

// CORRECAO: Recarregar dados dos blocos do Firebase
if (appState.selectedCondominio && appState.selectedCondominio.id) {
    const condominioId = appState.selectedCondominio.id;
    
    // Recarregar dados em background (sem mudar de tela)
    if (typeof loadBlocosData === 'function') {
        loadBlocosData(condominioId).catch(err => {
            console.error('Erro ao recarregar blocos:', err);
        });
    }
}

// Atualizar painel se estiver aberto
if (appState.currentScreen === 'painel') {
    if (typeof updatePainelSummary === 'function') {
        updatePainelSummary();
    }
    if (typeof renderPaymentsTable === 'function') {
        renderPaymentsTable();
    }
}
```

## O que `loadBlocosData()` faz

```javascript
async function loadBlocosData(condominioId) {
    // 1. Busca blocos do Firebase
    const blocos = await getBlocosByCondominio(condominioId);
    appState.blocos = blocos;
    
    // 2. Busca TODOS os apartamentos de TODOS os blocos
    const apartamentosPromises = blocos.map(bloco => getApartamentosByBloco(bloco.id));
    const apartamentosArrays = await Promise.all(apartamentosPromises);
    appState.apartamentos = apartamentosArrays.flat();
    
    // 3. Busca TODOS os pagamentos do período ativo
    const paymentsPromises = blocos.map(bloco => 
        getPaymentsByBlocoAndPeriod(bloco.id, date)
    );
    const paymentsArrays = await Promise.all(paymentsPromises);
    appState.payments.condominio = paymentsArrays.flat();
    
    // 4. Renderiza com dados atualizados
    renderBlocos();
}
```

## Fluxo Corrigido

```
1. Usuário marca 2 apartamentos do Bloco 01 como pendentes
   ↓
2. saveApartmentStatusNew() executa:
   ✅ Atualiza appState.payments.condominio
   ✅ Salva no Firebase
   ✅ Chama renderApartamentos() - Lista atualiza
   ✅ Chama loadBlocosData() em background:
      - Recarrega blocos do Firebase
      - Recarrega TODOS os apartamentos
      - Recarrega TODOS os pagamentos
      - Renderiza blocos com dados atualizados
   ↓
3. Usuário volta para a tela de blocos:
   ✅ Vê Bloco 01 com 14/16 pagos (87%)
   ✅ Dados estão sincronizados com Firebase
```

## Vantagens da Solução

### 1. Recarregamento Completo
- Busca dados atualizados do Firebase
- Não depende de dados em memória
- Garante sincronização

### 2. Execução em Background
- Não bloqueia a UI
- Usa `.catch()` para tratar erros silenciosamente
- Não interfere com o fechamento do modal

### 3. Condicional Inteligente
- Só recarrega se houver condomínio selecionado
- Só atualiza painel se estiver na tela de painel
- Evita recarregamentos desnecessários

## Resultado

✅ **Dados sempre sincronizados** - Recarrega do Firebase após cada mudança
✅ **Blocos atualizados** - Quando voltar para tela de blocos, verá dados corretos
✅ **Performance mantida** - Recarregamento em background não bloqueia UI
✅ **Tratamento de erros** - Falhas não quebram a aplicação

## Teste

1. Entre no Bloco 01 (16 apartamentos pagos)
2. Marque 2 apartamentos como pendentes
3. Salve
4. **Aguarde 1-2 segundos** (recarregamento em background)
5. Volte para a tela de blocos
6. **Verifique**: Bloco 01 deve mostrar "14 em dia, 2 pendentes" (87%) ✅

## Versão
- **Anterior**: v62
- **Atual**: v63

## Arquivos Modificados
1. `fix-save-single-month-v2.js` - Função `saveApartmentStatusNew()`
2. `sw.js` - Atualização de versão do cache

## Princípio Aplicado
**"Recarregar dados da fonte, não renderizar cache"** - Quando dados mudam, recarregue do Firebase em vez de apenas re-renderizar o que está em memória.

---
**Data**: 31/01/2026
**Versão**: v63
