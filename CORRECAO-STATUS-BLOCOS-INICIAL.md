# Correção: Status dos Blocos na Tela Inicial

## Problema Resolvido
Os blocos 1 e 2 estavam salvos como pagos no Firebase, mas ao entrar na tela de blocos pela primeira vez, apareciam como pendentes (vermelho). Só depois de entrar e sair de cada bloco é que o status visual era atualizado corretamente.

## Causa Raiz
A função `renderBlocos()` dependia de `appState.apartamentos` para calcular o percentual de pagamento de cada bloco, mas:

1. Quando você selecionava um condomínio, `loadBlocosData()` carregava apenas os blocos e casas
2. `appState.apartamentos` ficava **vazio**
3. `renderBlocos()` calculava 0 apartamentos para cada bloco
4. Resultado: todos os blocos apareciam como 0% (vermelho/pendente)

**Por que funcionava depois de entrar/sair?**
- Ao clicar no Bloco 01, `loadApartamentosData()` carregava os apartamentos do Bloco 01
- Ao voltar, `renderBlocos()` encontrava apartamentos em `appState.apartamentos`
- O cálculo funcionava corretamente para aquele bloco

## Solução Implementada

Modificamos `loadBlocosData()` para carregar **TODOS os apartamentos e pagamentos do condomínio** antes de renderizar os blocos.

### Código ANTES
```javascript
async function loadBlocosData(condominioId) {
    try {
        const [blocos, casas] = await Promise.all([
            getBlocosByCondominio(condominioId),
            getCasasByCondominio(condominioId)
        ]);
        appState.blocos = blocos;
        appState.casas = casas;
        renderBlocos(); // Renderiza sem apartamentos!
    }
}
```

### Código DEPOIS
```javascript
async function loadBlocosData(condominioId) {
    try {
        // 1. Carregar blocos e casas
        const [blocos, casas] = await Promise.all([
            getBlocosByCondominio(condominioId),
            getCasasByCondominio(condominioId)
        ]);
        appState.blocos = blocos;
        appState.casas = casas;
        
        // 2. Carregar TODOS os apartamentos do condomínio (em paralelo)
        if (blocos.length > 0) {
            const apartamentosPromises = blocos.map(bloco => 
                getApartamentosByBloco(bloco.id)
            );
            const apartamentosArrays = await Promise.all(apartamentosPromises);
            appState.apartamentos = apartamentosArrays.flat();
            
            // 3. Carregar pagamentos do período ativo (em paralelo)
            if (appState.activeYear && appState.activeMonth) {
                const date = `${appState.activeYear}-${appState.activeMonth}`;
                const paymentsPromises = blocos.map(bloco => 
                    getPaymentsByBlocoAndPeriod(bloco.id, date)
                );
                const paymentsArrays = await Promise.all(paymentsPromises);
                appState.payments.condominio = paymentsArrays.flat();
            }
        }
        
        renderBlocos(); // Agora renderiza com todos os dados!
    }
}
```

## Otimizações Aplicadas

### 1. Carregamento em Paralelo
Usamos `Promise.all()` para carregar apartamentos de todos os blocos simultaneamente:
```javascript
const apartamentosPromises = blocos.map(bloco => getApartamentosByBloco(bloco.id));
const apartamentosArrays = await Promise.all(apartamentosPromises);
```

**Benefício**: Se um condomínio tem 3 blocos, em vez de carregar sequencialmente (3x tempo), carrega tudo ao mesmo tempo.

### 2. Flat Array
Usamos `.flat()` para transformar array de arrays em array único:
```javascript
appState.apartamentos = apartamentosArrays.flat();
// [[apt1, apt2], [apt3, apt4], [apt5]] → [apt1, apt2, apt3, apt4, apt5]
```

### 3. Carregamento Condicional
Só carrega pagamentos se houver período ativo selecionado:
```javascript
if (appState.activeYear && appState.activeMonth) {
    // Carregar pagamentos
}
```

## Resultado

✅ **Status correto na primeira visualização** - Blocos mostram percentual correto imediatamente
✅ **Performance otimizada** - Carregamento em paralelo é mais rápido
✅ **Dados completos** - Todos os apartamentos e pagamentos carregados antes de renderizar
✅ **Consistência** - Não precisa mais entrar/sair dos blocos para ver status correto

## Fluxo Atualizado

```
Usuário seleciona Condomínio
  ↓
selectCondominio() limpa estado
  ↓
showScreen('blocos') - Mostra "Carregando..."
  ↓
loadBlocosData() executa:
  1. Carrega blocos e casas
  2. Carrega TODOS os apartamentos (paralelo)
  3. Carrega TODOS os pagamentos do período (paralelo)
  ↓
renderBlocos() - Calcula status correto de cada bloco
  ↓
Blocos aparecem com status correto (verde/amarelo/vermelho)
```

## Teste
1. Selecione um condomínio
2. Veja a tela de blocos - **Todos os blocos devem mostrar o status correto imediatamente**
3. Bloco 01 com 100% pago → Badge verde "100% em dia"
4. Bloco 02 com 100% pago → Badge verde "100% em dia"
5. Não precisa mais entrar/sair dos blocos

## Versão
- **Anterior**: v59
- **Atual**: v60

## Arquivos Modificados
1. `app.js` - Função `loadBlocosData()`
2. `sw.js` - Atualização de versão do cache

---
**Data**: 31/01/2026
**Versão**: v60
