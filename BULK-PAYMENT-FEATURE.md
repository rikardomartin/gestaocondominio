# Funcionalidade de Pagamento em Massa - v51

## Implementado em: 2026-01-31

## Funcionalidade
Sistema para marcar todos os apartamentos de um condomínio como PAGO para um ano inteiro (12 meses) de uma só vez.

## Como Usar

1. **Acesse a tela de Condomínios**
2. **Selecione um ANO** no seletor de período (ex: 2025)
3. **Botão "Marcar Ano Inteiro como Pago" aparecerá** automaticamente
4. **Clique no botão** para iniciar o processo
5. **Confirme a ação** no diálogo que aparece
6. **Aguarde o processamento** - o sistema criará pagamentos para todos os 12 meses
7. **Veja o resultado** - mostra quantos foram criados, atualizados e erros

## Detalhes Técnicos

### Arquivos Modificados

1. **index.html** (v51)
   - Adicionado botão de pagamento em massa no seletor de período
   - Botão fica oculto até selecionar um ano

2. **styles.css** (v51)
   - Estilos para o botão de pagamento em massa
   - Design responsivo para mobile
   - Botão branco com texto azul, integrado ao design do seletor

3. **app.js** (v51)
   - Adicionado elemento `bulkPaymentBtn` na lista de elementos DOM
   - Event listener para o botão
   - Lógica para mostrar/ocultar botão quando ano é selecionado

4. **fix-save-single-month-v2.js** (v51)
   - Nova função `window.bulkPaymentForYear()`
   - Processa todos os apartamentos do bloco atual
   - Cria/atualiza pagamentos para todos os 12 meses
   - Mostra progresso e resultado final

5. **sw.js** (v51)
   - Atualizado cache para v51

### Lógica de Processamento

```javascript
Para cada apartamento no bloco:
  Para cada mês (01 a 12):
    - Verificar se pagamento já existe
    - Se existe: atualizar status para "pago"
    - Se não existe: criar novo pagamento com status "pago"
    - Adicionar observação: "Pagamento em massa - {ano}"
    - Atualizar estado local (appState.payments.condominio)
```

### Estrutura do Pagamento

```javascript
{
  apartamentoId: string,
  condominioId: string,
  blocoId: string,
  apartamentoNumero: string,
  ano: string,        // ex: "2025"
  mes: string,        // ex: "01", "02", etc
  date: string,       // ex: "2025-01"
  type: "condominio",
  status: "pago",
  observacao: "Pagamento em massa - 2025",
  createdAt: Date,
  updatedAt: Date
}
```

### Validações

- Verifica se um ano foi selecionado
- Verifica se há um condomínio selecionado
- Solicita confirmação do usuário antes de processar
- Trata erros individuais sem interromper o processo completo

### Feedback ao Usuário

1. **Botão visível** apenas quando ano está selecionado
2. **Estado de processamento** - botão mostra "Processando..." durante execução
3. **Diálogo de confirmação** antes de iniciar
4. **Resultado detalhado** ao final:
   - Quantos pagamentos foram criados
   - Quantos foram atualizados
   - Quantos erros ocorreram
5. **Toast de sucesso** após conclusão

## Exemplo de Uso

**Cenário:** Marcar todo o ano de 2025 como pago

1. Selecione ano: **2025**
2. Clique em **"Marcar Ano Inteiro como Pago"**
3. Confirme: **"Deseja marcar TODOS os apartamentos como PAGO para o ano inteiro de 2025?"**
4. Aguarde processamento
5. Resultado: **"✅ Pagamento em massa concluído! Criados: 144, Atualizados: 0, Erros: 0"**
   (Exemplo: 12 apartamentos × 12 meses = 144 pagamentos)

## Notas Importantes

- O processo é **irreversível** - use com cuidado
- Todos os pagamentos são marcados como **"pago"** (não pendente, reciclado ou acordo)
- A observação padrão é **"Pagamento em massa - {ano}"**
- O sistema atualiza a visualização automaticamente após conclusão
- Funciona apenas para o **bloco atualmente selecionado**

## Versão
- **v51** - 2026-01-31
- Deploy: https://gestaodoscondominios.web.app
