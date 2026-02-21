# Correção: Recarregamento de Dados ao Mudar Período - v77

## Problema Identificado
Quando o usuário mudava o período (ano/mês) através dos seletores, os dados exibidos não eram atualizados automaticamente. Por exemplo:
- Ano 2025 estava todo marcado como "Pago"
- Ao mudar para 2026, os blocos ainda mostravam "2 Em dia" (dados de 2025)
- Mas ao entrar no bloco, os apartamentos apareciam corretamente como "Pendente"

## Causa Raiz
A função `handlePeriodChange()` apenas atualizava as variáveis de estado (`appState.activeYear` e `appState.activeMonth`) mas **não recarregava os dados de pagamento** do novo período.

## Solução Implementada

### 1. Modificação da função `handlePeriodChange()`
Transformada em função `async` e adicionada lógica de recarregamento:

```javascript
async function handlePeriodChange() {
    // ... código existente ...
    
    // CORRECAO v77: Recarregar dados quando o período muda
    if (year && month) {
        console.log('🔄 [PERIOD] Recarregando dados para novo período:', { year, month });
        
        // Limpar pagamentos antigos
        appState.payments.condominio = [];
        
        // Recarregar dados baseado na tela atual
        if (appState.currentScreen === 'condominios') {
            await loadCondominiosData();
        } else if (appState.currentScreen === 'blocos' && appState.selectedCondominio) {
            await loadBlocosData(appState.selectedCondominio.id);
        } else if (appState.currentScreen === 'apartamentos' && appState.selectedBloco) {
            await loadApartamentosData(appState.selectedBloco.id);
        }
        
        console.log('✅ [PERIOD] Dados recarregados com sucesso');
    }
}
```

### 2. Fluxo de Recarregamento
1. **Limpa pagamentos antigos**: `appState.payments.condominio = []`
2. **Detecta tela atual**: Verifica `appState.currentScreen`
3. **Recarrega dados apropriados**:
   - Tela de condomínios → `loadCondominiosData()`
   - Tela de blocos → `loadBlocosData(condominioId)`
   - Tela de apartamentos → `loadApartamentosData(blocoId)`

### 3. Benefícios
- Dados sempre sincronizados com o período selecionado
- Percentuais corretos imediatamente após mudança de período
- Contadores de blocos atualizados automaticamente
- Não precisa recarregar a página manualmente

## Arquivos Modificados
- `app.js`: Função `handlePeriodChange()` (linha ~1479)
- `sw.js`: Cache version atualizada para v77

## Como Testar
1. Fazer login no sistema
2. Selecionar ano 2025, marcar alguns apartamentos como pagos
3. Mudar para ano 2026
4. Verificar que os blocos mostram "0 Em dia" imediatamente
5. Entrar no bloco e confirmar que apartamentos estão "Pendente"
6. Voltar para condomínios e verificar percentual correto (0%)

## Versão
- **v77** - 2026-02-01
- Correção: Recarregamento automático ao mudar período
