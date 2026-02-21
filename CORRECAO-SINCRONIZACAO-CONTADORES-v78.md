# Correção: Sincronização de Contadores com Listagem Individual - v78

## Problema Identificado
Os contadores de resumo no card do bloco (ex: "2 Em Dia" e "14 Pendentes") não coincidiam com o status real dos apartamentos exibidos na listagem detalhada.

### Exemplo do Problema:
- **Card do Bloco 01**: Mostrava "2 Em dia" e "14 Pendentes"
- **Listagem Detalhada**: Todos os 16 apartamentos (101, 102, 103, etc.) apareciam como "Pendente"

## Causa Raiz
As duas funções usavam lógicas **diferentes** para determinar o status:

### renderBlocos (Contadores) - LÓGICA ANTIGA:
```javascript
const payment = appState.payments.condominio.find(p =>
    p.apartamentoId === apt.id &&
    (condições de período) &&
    p.status === 'pago'  // ← Filtrava APENAS status 'pago'
);
return payment !== undefined;  // Contava se encontrou pagamento
```

### renderApartamentos (Listagem) - LÓGICA CORRETA:
```javascript
const payment = appState.payments.condominio.find(p =>
    p.apartamentoId === apartamento.id &&
    (condições de período)
    // ← Não filtrava por status
);

if (payment) {
    status = payment.status || 'pendente';  // Usava o status real
}
```

### O Problema:
- Se existia um pagamento com `status: 'pendente'` ou `status: 'acordo'`:
  - **Contador**: Não contava como "Em Dia" (porque filtrava `p.status === 'pago'`)
  - **Listagem**: Mostrava o status real ('pendente' ou 'acordo')
- Isso criava inconsistência: o contador dizia "2 Em Dia" mas a listagem mostrava todos como "Pendente"

## Solução Implementada

### 1. Unificação da Lógica em renderBlocos
```javascript
apartamentosPagos = apartamentosDoBloco.filter(apt => {
    const payment = appState.payments.condominio.find(p =>
        p.apartamentoId === apt.id &&
        (
            (p.ano === appState.activeYear && p.mes === appState.activeMonth) ||
            (p.date === `${appState.activeYear}-${appState.activeMonth}`)
        )
    );
    
    // CORRECAO v78: Mesma lógica da listagem
    // Se encontrou pagamento, verificar se status é 'pago' ou 'reciclado'
    // Se não encontrou pagamento, considerar pendente
    if (payment) {
        return payment.status === 'pago' || payment.status === 'reciclado';
    }
    return false;
}).length;
```

### 2. Logs de Debug Adicionados
Para facilitar a verificação da consistência:

```javascript
// No renderBlocos:
console.log(`📊 [BLOCO] ${bloco.nome}: ${apartamentosPagos}/${apartamentosCount} pagos (${percentualPago}%)`);

// No renderApartamentos:
console.log(`🏠 [APT] ${apartamento.numero}: status=${status}, payment=${payment ? 'SIM' : 'NÃO'}`);
```

### 3. Regras de Contagem Unificadas
**"Em Dia"** = Apartamentos com pagamento onde `status === 'pago'` OU `status === 'reciclado'`

**"Pendente"** = Todos os outros casos:
- Sem pagamento registrado
- Pagamento com `status === 'pendente'`
- Pagamento com `status === 'acordo'`

## Benefícios
✅ Contadores do bloco refletem exatamente o que aparece na listagem  
✅ Lógica consistente em todo o sistema  
✅ Logs de debug facilitam verificação  
✅ Status 'reciclado' também conta como "Em Dia"  

## Como Testar
1. Fazer login no sistema
2. Selecionar um condomínio e visualizar os blocos
3. Anotar os contadores (ex: "2 Em dia, 14 Pendentes")
4. Entrar no bloco e contar manualmente:
   - Quantos aparecem como "Pago" ou "Pago Reciclado"
   - Quantos aparecem como "Pendente" ou "Acordo"
5. Verificar que os números batem exatamente
6. Verificar logs no console:
   ```
   📊 [BLOCO] Bloco 01: 2/16 pagos (12%)
   🏠 [APT] 101: status=pendente, payment=NÃO
   🏠 [APT] 102: status=pago, payment=SIM
   ...
   ```

## Arquivos Modificados
- `app.js`: Função `renderBlocos()` (linha ~1830)
- `app.js`: Função `renderApartamentos()` (linha ~2020)
- `sw.js`: Cache version atualizada para v78

## Versão
- **v78** - 2026-02-01
- Correção: Sincronização de contadores com listagem individual
