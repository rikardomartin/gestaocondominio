# Como Limpar Cache do Navegador

## ⚠️ IMPORTANTE
O sistema foi atualizado para v39. Você PRECISA limpar o cache do navegador para ver as correções!

---

## Google Chrome / Edge / Brave

### Método 1: Atalho Rápido (RECOMENDADO)
1. Pressione **Ctrl + Shift + Delete** (Windows) ou **Cmd + Shift + Delete** (Mac)
2. Selecione **"Todo o período"**
3. Marque apenas:
   - ✅ **Imagens e arquivos em cache**
   - ✅ **Cookies e outros dados do site** (opcional, mas recomendado)
4. Clique em **"Limpar dados"**
5. Feche e reabra o navegador
6. Acesse: https://gestaodoscondominios.web.app
7. Pressione **Ctrl + F5** para recarregar forçadamente

### Método 2: Modo Anônimo (Teste Rápido)
1. Pressione **Ctrl + Shift + N** (Windows) ou **Cmd + Shift + N** (Mac)
2. Acesse: https://gestaodoscondominios.web.app
3. Se funcionar no modo anônimo, o problema é cache!

### Método 3: DevTools
1. Pressione **F12** para abrir DevTools
2. Clique com botão direito no ícone de **Recarregar** (ao lado da barra de endereço)
3. Selecione **"Esvaziar cache e recarregar forçadamente"**

---

## Firefox

1. Pressione **Ctrl + Shift + Delete** (Windows) ou **Cmd + Shift + Delete** (Mac)
2. Selecione **"Tudo"** no intervalo de tempo
3. Marque:
   - ✅ **Cache**
   - ✅ **Cookies**
4. Clique em **"Limpar agora"**
5. Feche e reabra o navegador
6. Acesse: https://gestaodoscondominios.web.app
7. Pressione **Ctrl + F5**

---

## Safari (Mac)

1. Pressione **Cmd + Option + E** para esvaziar cache
2. Ou vá em **Safari > Preferências > Avançado**
3. Marque **"Mostrar menu Desenvolver"**
4. Vá em **Desenvolver > Esvaziar Caches**
5. Recarregue a página com **Cmd + R**

---

## Celular Android (Chrome)

1. Abra o Chrome
2. Toque nos **3 pontos** (menu)
3. Vá em **Configurações**
4. Toque em **Privacidade e segurança**
5. Toque em **Limpar dados de navegação**
6. Selecione **"Todo o período"**
7. Marque:
   - ✅ **Imagens e arquivos em cache**
   - ✅ **Cookies e dados do site**
8. Toque em **Limpar dados**
9. Feche e reabra o Chrome
10. Acesse: https://gestaodoscondominios.web.app

---

## iPhone/iPad (Safari)

1. Vá em **Ajustes**
2. Role até **Safari**
3. Toque em **Limpar Histórico e Dados de Sites**
4. Confirme
5. Abra o Safari
6. Acesse: https://gestaodoscondominios.web.app

---

## Verificar se Funcionou

Após limpar o cache:

1. Abra o Console (F12)
2. Procure por:
   ```
   🔧 Carregando correcao para salvar apenas mes ativo...
   ✅ Funcao saveApartmentStatusNew() sobrescrita com sucesso!
   ```
3. Se aparecer essas mensagens, o cache foi limpo com sucesso!

---

## Se AINDA não funcionar:

1. Feche TODAS as abas do navegador
2. Feche o navegador completamente
3. Reabra o navegador
4. Acesse: https://gestaodoscondominios.web.app
5. Pressione **Ctrl + Shift + R** (recarregar forçadamente)

---

## Última Opção: Desinstalar Service Worker

1. Abra: https://gestaodoscondominios.web.app
2. Pressione **F12**
3. Vá na aba **Application** (Chrome) ou **Armazenamento** (Firefox)
4. No menu lateral, clique em **Service Workers**
5. Clique em **Unregister** ou **Cancelar registro**
6. Feche o DevTools
7. Recarregue a página com **Ctrl + F5**

---

**Versão Atual:** v39
**Deploy:** Concluído
**Status:** ✅ Sistema atualizado e funcionando
