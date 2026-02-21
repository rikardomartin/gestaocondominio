# Correção Exportação Excel - v121

## Problema Identificado

Exportação Excel estava mostrando dados inconsistentes:
- Apartamento com status "PAGO" 
- Mas observação dizia "Foi pago somente a metade do mês"

## Causa Raiz

Quando o status de um apartamento mudava para PAGO, a observação antiga não era limpa automaticamente. Isso causava inconsistências onde:

1. Apartamento tinha observação "pagou metade" (status anterior: PENDENTE ou ACORDO)
2. Admin mudava status para PAGO
3. Observação antiga permanecia no registro
4. Exportação Excel mostrava: Status PAGO + Observação incompatível

## Solução Implementada

### 1. Limpeza Automática ao Salvar (app.js - saveApartmentStatusNew)

Quando status muda para PAGO, o sistema agora detecta e limpa observações incompatíveis:

```javascript
// CORRECAO v121: Limpar observações incompatíveis quando status muda
if (selectedStatus === 'pago') {
    const incompatiblePhrases = [
        'metade', 'parcial', 'falta', 'pendente',
        'não pagou', 'nao pagou', 'deve', 'devendo', 'atrasado'
    ];
    
    const hasIncompatiblePhrase = incompatiblePhrases.some(phrase => 
        observacoes.toLowerCase().includes(phrase)
    );
    
    if (hasIncompatiblePhrase) {
        console.log('⚠️ Observação incompatível com status PAGO detectada. Limpando...');
        observacoes = ''; // Limpar observação incompatível
    }
}
```

### 2. Validação na Exportação (app.js - exportToExcel e exportToCSV)

Camada extra de proteção que detecta inconsistências durante a exportação:

```javascript
// CORRECAO v121: Detectar e limpar observações incompatíveis com status PAGO
if (item.status === 'pago') {
    const incompatiblePhrases = [
        'metade', 'parcial', 'falta', 'pendente',
        'não pagou', 'nao pagou', 'deve', 'devendo', 'atrasado'
    ];
    
    const hasIncompatiblePhrase = incompatiblePhrases.some(phrase => 
        observacao.toLowerCase().includes(phrase)
    );
    
    if (hasIncompatiblePhrase) {
        console.warn(`⚠️ Inconsistência detectada: ${item.apartamento} - Status PAGO com observação incompatível. Limpando...`);
        observacao = ''; // Limpar observação incompatível
    }
}
```

## Palavras-Chave Detectadas

O sistema detecta as seguintes palavras/frases incompatíveis com status PAGO:
- metade
- parcial
- falta
- pendente
- não pagou / nao pagou
- deve
- devendo
- atrasado

## Arquivos Modificados

1. **app.js**
   - Função `saveApartmentStatusNew()` - linha ~2940
   - Função `exportToExcel()` - linha ~440
   - Função `exportToCSV()` - linha ~490

2. **sw.js**
   - Versão atualizada: v120 → v121

3. **index.html**
   - Versão atualizada: v120 → v121

## Comportamento Esperado

### Cenário 1: Salvamento Manual
1. Admin abre modal de apartamento com status PENDENTE
2. Observação diz: "Foi pago somente a metade do mês"
3. Admin muda status para PAGO
4. Sistema detecta incompatibilidade e limpa observação automaticamente
5. Salva no Firebase: Status PAGO + Observação vazia

### Cenário 2: Exportação Excel
1. Admin exporta relatório
2. Sistema encontra registro: Status PAGO + Observação "pagou metade"
3. Sistema detecta inconsistência e limpa observação
4. Excel exportado: Status PAGO + Observação vazia
5. Console mostra warning: "⚠️ Inconsistência detectada: Apt 101 - Status PAGO com observação incompatível"

## Dados Antigos

Para dados já existentes no Firestore com inconsistências:
- Serão corrigidos automaticamente na próxima exportação
- Não é necessário script de migração
- Inconsistências serão logadas no console para auditoria

## Testes Recomendados

1. ✅ Criar apartamento com status PENDENTE + observação "pagou metade"
2. ✅ Mudar status para PAGO
3. ✅ Verificar que observação foi limpa
4. ✅ Exportar Excel e verificar consistência
5. ✅ Verificar console para warnings de inconsistências detectadas

## Deploy

```bash
firebase deploy --only hosting
```

Versão: **v121**
Data: 2026-02-03
