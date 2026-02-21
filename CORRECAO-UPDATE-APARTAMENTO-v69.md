# CORREÇÃO ERRO "No document to update" - v69

## PROBLEMA RESOLVIDO
Ao salvar o status de uma casa ou apartamento, aparecia erro:
```
Erro ao atualizar apartamento: FirebaseError: No document to update: 
projects/gestaodoscondominios/databases/(default)/documents/apartamentos/uQMljYRpcJLAbqI3f0ek
```

## CAUSA RAIZ
O código estava tentando atualizar o documento do apartamento/casa após salvar o pagamento usando `updateApartamento()`. Isso causava dois problemas:

1. **CASAS não estão na coleção `apartamentos`** - Elas estão em subcoleções `condominios/{id}/casas`, então a função `updateApartamento()` procurava no lugar errado
2. **DUPLICAÇÃO DESNECESSÁRIA** - O status já estava sendo salvo corretamente na coleção `payments`, que é a fonte de verdade do sistema

## ARQUITETURA CORRETA
```
✅ CORRETO: Status salvo em payments
condominios/{id}/
  blocos/{id}/
    apartamentos/{id}/ (documento básico, sem status)
  casas/{id}/ (documento básico, sem status)

payments/{id}
  - apartamentoId
  - ano, mes
  - status ← FONTE DE VERDADE
  - observacao

❌ ERRADO: Tentar duplicar status no documento do apartamento/casa
```

## CORREÇÕES APLICADAS

### app.js - Função saveApartmentStatusNew (linha ~2450)
**ANTES:**
```javascript
// Atualizar também o status do apartamento
const updateData = {
    status: selectedStatus,
    observacao: observacoes,
    updatedAt: new Date()
};
await updateApartamento(apartamento.id, updateData); // ❌ ERRO!
```

**DEPOIS:**
```javascript
// CORRECAO: NAO atualizar o documento do apartamento/casa
// O status ja esta salvo no pagamento, que e a fonte de verdade
// Atualizar o documento causa erro para casas (que estao em subcoleção)

// Atualizar estado local do apartamento para refletir na UI
apartamento.status = selectedStatus;
apartamento.observacao = observacoes;
```

### app.js - Função saveApartmentStatus (linha ~2920)
**AÇÃO:** Comentada completamente - função antiga que não salvava pagamentos, apenas atualizava o documento do apartamento. Substituída por `saveApartmentStatusNew`.

### app.js - Função do Painel Geral (linha ~5370)
**ANTES:**
```javascript
if (typeof updateApartamento === 'function') {
    updateApartamento(apartmentId, { status: newStatus, observacao: apartamento.observacao || '' })
        .catch(err => console.warn('Falha ao salvar status no Firebase:', err));
}
```

**DEPOIS:**
```javascript
// CORRECAO: NAO atualizar documento do apartamento
// O status ja esta sendo salvo no pagamento abaixo
// Atualizar o documento causa erro para casas (que estao em subcoleção)
// (código comentado)
```

## POR QUE ESSA ARQUITETURA?

### Vantagens de usar payments como fonte de verdade:
1. ✅ **Histórico completo** - Cada mês tem seu próprio registro
2. ✅ **Auditoria** - Sabe quando e quem alterou cada status
3. ✅ **Flexibilidade** - Pode ter status diferentes por mês
4. ✅ **Funciona para casas E apartamentos** - Mesma estrutura para ambos
5. ✅ **Sem duplicação** - Uma única fonte de verdade

### Problemas de duplicar status no documento:
1. ❌ **Inconsistência** - Status pode ficar diferente entre documento e payment
2. ❌ **Erro para casas** - Casas estão em subcoleção diferente
3. ❌ **Perda de histórico** - Só guarda o último status
4. ❌ **Complexidade** - Precisa manter dois lugares sincronizados

## RESULTADO
- ✅ Casas podem ser salvas sem erro
- ✅ Apartamentos podem ser salvos sem erro
- ✅ Status é lido corretamente dos pagamentos
- ✅ Não há duplicação de dados
- ✅ Arquitetura mais limpa e consistente

## TESTE
1. Entre em um condomínio com casas
2. Clique em uma casa
3. Marque como "pago" para o mês ativo
4. **VERIFICAR:** Deve salvar sem erro
5. **VERIFICAR:** Status aparece corretamente no card da casa
6. Repita com um apartamento
7. **VERIFICAR:** Deve funcionar normalmente

## DEPLOY
✅ Concluído - https://gestaodoscondominios.web.app

## DATA
2026-02-01
