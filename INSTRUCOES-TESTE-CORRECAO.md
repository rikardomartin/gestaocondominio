# INSTRUCOES: Como Testar a Correcao

## O Que Foi Corrigido?
O sistema agora salva o status de pagamento APENAS para o mes ativo selecionado, em vez de marcar todos os meses.

---

## PASSO 1: Limpar Cache

### Opcao A - Usar Ferramenta de Limpeza:
1. Abrir no navegador: `limpar-cache.html`
2. Clicar em "Limpar Cache Completo"
3. Aguardar mensagem de sucesso
4. Fechar a aba

### Opcao B - Limpeza Manual:
1. Pressionar `Ctrl + Shift + Delete` (Windows) ou `Cmd + Shift + Delete` (Mac)
2. Selecionar "Todo o periodo"
3. Marcar: "Imagens e arquivos em cache"
4. Clicar em "Limpar dados"

---

## PASSO 2: Recarregar Sistema

1. Abrir `index.html` no navegador
2. Pressionar `Ctrl + F5` (Windows) ou `Cmd + Shift + R` (Mac) para recarregar forçadamente
3. Fazer login normalmente

---

## PASSO 3: Verificar se Correcao Foi Aplicada

1. Abrir Console do navegador (pressionar `F12`)
2. Procurar pela mensagem:
   ```
   🔧 Carregando correcao para salvar apenas mes ativo...
   ✅ Funcao saveApartmentStatusNew() sobrescrita com sucesso!
   ```

### Se NAO aparecer essa mensagem:
- Limpar cache novamente
- Recarregar pagina com `Ctrl + F5`
- Verificar se arquivo `fix-save-single-month.js` existe na pasta

---

## PASSO 4: Testar Salvamento

### Teste 1: Salvar Janeiro
1. Selecionar condominio
2. No topo da tela, selecionar:
   - **Ano:** 2026
   - **Mes:** 01 (Janeiro)
3. Clicar em um apartamento (ex: 101)
4. Marcar como **PAGO**
5. Clicar em **Salvar**
6. Verificar mensagem: "Status salvo para 01/2026"

### Teste 2: Verificar Outros Meses
1. Mudar mes para **02 (Fevereiro)**
2. Clicar no mesmo apartamento (101)
3. Verificar que status esta **PENDENTE** (nao foi afetado)

### Teste 3: Salvar Fevereiro
1. Com mes em **02 (Fevereiro)**
2. Marcar apartamento 101 como **PAGO**
3. Salvar
4. Verificar mensagem: "Status salvo para 02/2026"

### Teste 4: Confirmar Janeiro Continua Pago
1. Voltar mes para **01 (Janeiro)**
2. Clicar em apartamento 101
3. Verificar que status continua **PAGO**

---

## PASSO 5: Testar Painel Geral

1. Ir para "Painel Geral"
2. Clicar em "Atualizar"
3. Verificar que aparecem APENAS os meses com pagamentos registrados:
   - Janeiro/2026 - Apartamento 101 - PAGO - R$ 80,00
   - Fevereiro/2026 - Apartamento 101 - PAGO - R$ 80,00
4. Verificar que outros meses NAO aparecem na lista

---

## Resultado Esperado

### ✅ CORRETO:
- Ao marcar Janeiro como PAGO, apenas Janeiro fica PAGO
- Fevereiro continua PENDENTE (sem registro)
- Cada mes precisa ser marcado individualmente
- Painel geral mostra apenas meses com registros

### ❌ ERRADO (problema antigo):
- Ao marcar Janeiro como PAGO, todos os meses ficam PAGO
- Dezembro, Novembro, Outubro aparecem como PAGO
- Sistema cria registros automaticamente

---

## Solucao de Problemas

### Problema: Botao "Criar Estrutura" ainda aparece
**Solucao:** Limpar cache novamente e recarregar com Ctrl + F5

### Problema: Modal de alerta ainda esta grande
**Solucao:** Limpar cache novamente e recarregar com Ctrl + F5

### Problema: Ao salvar Janeiro, outros meses ficam PAGO
**Solucao:**
1. Verificar no Console se aparece a mensagem de correcao
2. Se NAO aparecer, verificar se `fix-save-single-month.js` esta na pasta
3. Verificar se `index.html` tem a linha:
   ```html
   <script src="fix-save-single-month.js"></script>
   ```
4. Limpar cache e recarregar

### Problema: Erro ao salvar
**Solucao:**
1. Verificar se ano E mes estao selecionados
2. Verificar no Console qual erro aparece
3. Se erro for "createPayment is not a function", recarregar pagina

---

## Teste Automatizado (Opcional)

Para teste mais detalhado:
1. Abrir `teste-salvar-mes-unico.html`
2. Seguir instrucoes na pagina
3. Verificar se todos os testes passam

---

## Arquivos da Correcao

- `fix-save-single-month.js` - Funcao corrigida
- `index.html` - Carrega o script de correcao
- `sw.js` - Cache atualizado para v34
- `teste-salvar-mes-unico.html` - Pagina de teste
- `CORRECAO-MES-UNICO-APLICADA.md` - Documentacao tecnica
- `INSTRUCOES-TESTE-CORRECAO.md` - Este arquivo

---

## Contato para Suporte

Se problema persistir apos seguir todos os passos:
1. Tirar print do Console (F12)
2. Tirar print da tela mostrando o problema
3. Anotar exatamente o que foi feito
4. Enviar informacoes para analise

---

**Data:** 30/01/2026
**Versao:** v34
**Status:** ✅ PRONTO PARA TESTE
