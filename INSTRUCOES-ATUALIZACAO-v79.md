# Instruções de Atualização para v79

## 🔴 PROBLEMA IDENTIFICADO

O console mostra que o sistema está carregando **v76** em vez de **v79**:
```
📋 Versão: v76 - Correcao calculo com casas
```

Isso acontece porque:
1. Service Worker está cacheando versão antiga
2. Navegador não detectou mudança nos arquivos
3. Cache do navegador não foi limpo

---

## ✅ SOLUÇÃO 1: Atualização Forçada Automática (RECOMENDADO)

### Passo 1: Acessar Script de Atualização
```
https://gestaodoscondominios.web.app/force-update-v79.html
```

### Passo 2: Clicar no Botão
- Clique em "🚀 Executar Atualização Forçada"
- Aguarde o processo (5-10 segundos)
- Sistema redirecionará automaticamente

### Passo 3: Verificar
- Fazer login novamente
- Verificar no canto inferior direito: deve aparecer "v 79"
- Console deve mostrar: `📋 Versão: v79`

---

## ✅ SOLUÇÃO 2: Limpeza Manual (ALTERNATIVA)

### Opção A: Chrome/Edge

1. **Abrir DevTools**
   - Pressionar `F12` ou `Ctrl+Shift+I`

2. **Ir para Application**
   - Clicar na aba "Application"
   - No menu lateral, clicar em "Storage"

3. **Limpar Tudo**
   - Clicar em "Clear site data"
   - Marcar todas as opções:
     - ✅ Local and session storage
     - ✅ IndexedDB
     - ✅ Web SQL
     - ✅ Cookies
     - ✅ Cache storage
     - ✅ Service workers
   - Clicar em "Clear site data"

4. **Desregistrar Service Worker**
   - No menu lateral, clicar em "Service Workers"
   - Clicar em "Unregister" em todos os workers listados

5. **Recarregar**
   - Pressionar `Ctrl+Shift+R` (hard reload)
   - Ou `Ctrl+F5`

### Opção B: Firefox

1. **Abrir DevTools**
   - Pressionar `F12`

2. **Ir para Storage**
   - Clicar na aba "Storage"

3. **Limpar Service Workers**
   - Expandir "Service Workers"
   - Clicar em "Unregister" em cada worker

4. **Limpar Cache**
   - Expandir "Cache Storage"
   - Deletar todos os caches (gestao-condominial-v76, v77, v78, etc.)

5. **Limpar Storage**
   - Clicar com botão direito em "Local Storage"
   - Selecionar "Delete All"
   - Repetir para "Session Storage"

6. **Recarregar**
   - Pressionar `Ctrl+Shift+R`

### Opção C: Safari

1. **Abrir Preferências**
   - Safari → Preferências → Avançado
   - Marcar "Mostrar menu Desenvolver"

2. **Limpar Cache**
   - Desenvolver → Esvaziar Caches
   - Ou `Cmd+Option+E`

3. **Limpar Dados do Site**
   - Safari → Preferências → Privacidade
   - Gerenciar Dados de Sites
   - Buscar "gestaodoscondominios.web.app"
   - Remover

4. **Recarregar**
   - `Cmd+Shift+R`

---

## ✅ SOLUÇÃO 3: Modo Anônimo (TESTE RÁPIDO)

Para testar se a v79 está funcionando sem afetar sua sessão atual:

1. Abrir janela anônima/privada:
   - Chrome/Edge: `Ctrl+Shift+N`
   - Firefox: `Ctrl+Shift+P`
   - Safari: `Cmd+Shift+N`

2. Acessar: `https://gestaodoscondominios.web.app`

3. Verificar versão no canto inferior direito

Se aparecer "v 79" no modo anônimo, significa que a v79 está no servidor e o problema é só cache local.

---

## 🔍 VERIFICAÇÃO PÓS-ATUALIZAÇÃO

### 1. Verificar Versão Visual
- Canto inferior direito deve mostrar: **v 79**
- Badge deve ter gradiente azul

### 2. Verificar Console
Abrir console (F12) e verificar:
```
✅ Deve aparecer:
📋 Versão: v79 - Correcao sincronizacao painel geral

❌ NÃO deve aparecer:
📋 Versão: v76 - Correcao calculo com casas
```

### 3. Verificar Service Worker
No DevTools → Application → Service Workers:
```
✅ Deve mostrar:
gestao-condominial-v79

❌ NÃO deve mostrar:
gestao-condominial-v76
gestao-condominial-v77
gestao-condominial-v78
```

### 4. Verificar Cache Storage
No DevTools → Application → Cache Storage:
```
✅ Deve ter apenas:
- gestao-condominial-v79
- static-v79
- dynamic-v79

❌ NÃO deve ter:
- Versões antigas (v76, v77, v78)
```

### 5. Testar Funcionalidades
- [ ] Login funciona
- [ ] Condomínios carregam
- [ ] Blocos carregam
- [ ] Apartamentos carregam
- [ ] Modal abre corretamente
- [ ] Salvar status funciona
- [ ] Painel Geral sincroniza
- [ ] Indicador de versão aparece

---

## 🐛 TROUBLESHOOTING

### Problema: Versão ainda aparece como v76

**Causa**: Cache muito persistente

**Solução**:
1. Fechar TODAS as abas do site
2. Fechar navegador completamente
3. Reabrir navegador
4. Acessar site novamente
5. Se ainda não funcionar, usar SOLUÇÃO 1 (force-update-v79.html)

### Problema: Service Worker não desregistra

**Causa**: Service Worker travado

**Solução**:
1. DevTools → Application → Service Workers
2. Marcar "Update on reload"
3. Marcar "Bypass for network"
4. Recarregar página
5. Desmarcar as opções
6. Desregistrar worker

### Problema: Erro no console sobre Firestore

**Causa**: Service Worker antigo interceptando requisições

**Solução**:
1. Desregistrar TODOS os Service Workers
2. Limpar TODOS os caches
3. Hard reload (Ctrl+Shift+R)

### Problema: Indicador de versão não aparece

**Causa**: HTML antigo em cache

**Solução**:
1. Limpar cache completamente
2. Hard reload
3. Verificar se `index.html` tem:
   ```html
   <div id="versionIndicator" class="version-indicator">
   ```

---

## 📝 CHECKLIST DE DEPLOY

Para evitar problemas futuros:

### Antes do Deploy
- [ ] Atualizar versão em `index.html` (3 lugares)
- [ ] Atualizar versão em `app.js` (2 lugares)
- [ ] Atualizar versão em `sw.js` (3 lugares)
- [ ] Testar localmente

### Durante o Deploy
- [ ] `firebase deploy --only hosting`
- [ ] Aguardar confirmação de sucesso
- [ ] Verificar URL de produção

### Após o Deploy
- [ ] Testar em modo anônimo
- [ ] Verificar versão no console
- [ ] Verificar Service Worker
- [ ] Limpar cache local
- [ ] Testar funcionalidades principais

---

## 🚀 DEPLOY ATUAL (v79)

### Arquivos Modificados
```
✅ index.html - Badge de versão + scripts v79
✅ app.js - Função setupVersionIndicator() + v79
✅ styles.css - CSS do indicador de versão
✅ sw.js - Cache v79
```

### Comando de Deploy
```bash
firebase deploy --only hosting
```

### Verificação
```bash
# Deve retornar v79 em todos
grep -r "v79" index.html app.js sw.js
```

---

## 📞 SUPORTE

Se após todas as tentativas a versão ainda não atualizar:

1. Enviar screenshot do console (F12)
2. Enviar screenshot do Service Worker (DevTools → Application)
3. Enviar screenshot do Cache Storage
4. Informar navegador e versão

---

**Última atualização**: 01/02/2026  
**Versão do documento**: 1.0  
**Versão do sistema**: v79
