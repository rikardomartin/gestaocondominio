# Cache Busting v113 - Solução Agressiva

## 🎯 OBJETIVO

Forçar o navegador a recarregar TODOS os arquivos quando houver nova versão, eliminando problemas de cache.

## ✅ IMPLEMENTAÇÕES

### 1. Meta Tags de Cache Control (index.html)
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
```

**O que faz**: Instrui o navegador a NUNCA cachear a página HTML.

### 2. Query Strings com Versão
Todos os recursos agora têm `?v=113`:
- `styles.css?v=113`
- `app.js?v=113`
- `firebase-database.js?v=113`
- `manifest.json?v=113`
- `icon-192.png?v=113`
- `icon-512.png?v=113`

**O que faz**: Navegador trata como arquivo novo quando versão muda.

### 3. Script de Cache Buster Automático
Script inline no `<head>` que:
1. Verifica versão armazenada no localStorage
2. Se versão mudou, limpa TUDO:
   - Todos os caches
   - Service Workers
   - localStorage
   - sessionStorage
3. Força reload da página
4. Usa sessionStorage para evitar loop infinito

**Código**:
```javascript
const CURRENT_VERSION = '113';
const storedVersion = localStorage.getItem('app_version');

if (storedVersion !== CURRENT_VERSION) {
    // Limpar tudo
    caches.keys().then(names => names.forEach(name => caches.delete(name)));
    navigator.serviceWorker.getRegistrations().then(regs => 
        regs.forEach(reg => reg.unregister())
    );
    
    // Atualizar versão e recarregar
    localStorage.setItem('app_version', CURRENT_VERSION);
    window.location.reload(true);
}
```

### 4. Headers HTTP no Firebase (firebase.json)
```json
{
  "source": "**/*.@(js|css)",
  "headers": [
    {
      "key": "Cache-Control",
      "value": "no-cache, no-store, must-revalidate"
    },
    {
      "key": "Pragma",
      "value": "no-cache"
    },
    {
      "key": "Expires",
      "value": "0"
    }
  ]
}
```

**O que faz**: Servidor envia headers que proíbem cache.

### 5. Force Reload Manual (force-reload-v113.html)
Página standalone que:
- Lista tudo que será limpo
- Mostra log em tempo real
- Limpa TUDO manualmente
- Redireciona para o sistema

## 🔄 FLUXO DE ATUALIZAÇÃO

### Primeira Visita (Usuário Novo)
```
1. Carrega index.html
2. Script verifica: localStorage vazio
3. Salva versão 113
4. Carrega normalmente
```

### Atualização (v112 → v113)
```
1. Carrega index.html
2. Script verifica: localStorage = "112"
3. Detecta mudança!
4. Limpa todos os caches
5. Desregistra Service Workers
6. Salva versão 113
7. Força reload
8. Carrega tudo novo
```

### Visita Subsequente (Já na v113)
```
1. Carrega index.html
2. Script verifica: localStorage = "113"
3. Versão OK, não faz nada
4. Carrega normalmente
```

## 📁 ARQUIVOS MODIFICADOS

### index.html
- **Linha 10-12**: Meta tags de cache control
- **Linha 14**: manifest.json?v=113
- **Linha 23-26**: Icons com ?v=113
- **Linha 42**: styles.css?v=113
- **Linha 44-100**: Script de cache buster
- **Linha 1023-1027**: Scripts com ?v=113

### firebase.json
- **Linha 30-80**: Headers HTTP agressivos de no-cache

### Novo Arquivo
- `force-reload-v113.html`: Ferramenta manual de limpeza

## 🧪 COMO TESTAR

### Teste 1: Primeira Visita
1. Abrir DevTools (F12)
2. Application → Storage → Clear site data
3. Acessar o sistema
4. Console deve mostrar: "✅ Versão atual OK"
5. localStorage deve ter: `app_version: "113"`

### Teste 2: Simular Atualização
1. Abrir DevTools (F12)
2. Console: `localStorage.setItem('app_version', '112')`
3. Recarregar página (F5)
4. Console deve mostrar:
   ```
   🔍 Cache Buster: {current: "113", stored: "112"}
   🔄 Nova versão detectada! Forçando reload...
   🗑️ Deletando cache: gestao-condominial-v112
   🗑️ Desregistrando SW
   🔄 Recarregando página...
   ```
5. Página deve recarregar automaticamente
6. localStorage deve ter: `app_version: "113"`

### Teste 3: Force Reload Manual
1. Acessar: `force-reload-v113.html`
2. Clicar "Limpar Tudo e Recarregar"
3. Ver log em tempo real
4. Aguardar redirecionamento

### Teste 4: Verificar Headers HTTP
1. Abrir DevTools (F12)
2. Aba Network
3. Recarregar página
4. Clicar em `app.js`
5. Headers → Response Headers
6. Verificar:
   ```
   Cache-Control: no-cache, no-store, must-revalidate
   Pragma: no-cache
   Expires: 0
   ```

## 🚀 INSTRUÇÕES DE DEPLOY

### 1. Atualizar Versão
Quando fizer mudanças, atualizar em 3 lugares:

**index.html** (linha 47):
```javascript
const CURRENT_VERSION = '114'; // Próxima versão
```

**index.html** (todas as query strings):
```html
<link rel="stylesheet" href="styles.css?v=114">
<script src="app.js?v=114"></script>
```

**app.js** (setupVersionIndicator):
```javascript
const CURRENT_VERSION = '114';
```

**sw.js** (linhas 1-4):
```javascript
const CACHE_NAME = 'gestao-condominial-v114';
const STATIC_CACHE = 'static-v114';
const DYNAMIC_CACHE = 'dynamic-v114';
```

### 2. Deploy
```bash
firebase deploy --only hosting
```

### 3. Testar
1. Acessar o sistema
2. Deve recarregar automaticamente
3. Verificar versão no canto inferior esquerdo: v114

## ⚠️ TROUBLESHOOTING

### Problema: Página não recarrega automaticamente
**Causa**: Script de cache buster não executou

**Solução**:
1. Abrir DevTools → Console
2. Verificar se há erros
3. Verificar se script está no `<head>`
4. Usar `force-reload-v113.html` manualmente

### Problema: Ainda vê versão antiga
**Causa**: Cache muito agressivo do navegador

**Solução**:
1. Ctrl + Shift + Delete → Limpar tudo
2. Fechar TODAS as abas
3. Fechar navegador completamente
4. Reabrir e acessar
5. Se persistir, usar `force-reload-v113.html`

### Problema: Loop infinito de reload
**Causa**: sessionStorage não está funcionando

**Solução**:
1. Verificar se navegador suporta sessionStorage
2. Verificar se não está em modo privado
3. Limpar sessionStorage manualmente:
   ```javascript
   sessionStorage.clear()
   ```

### Problema: Service Worker não desregistra
**Causa**: SW está em uso

**Solução**:
1. DevTools → Application → Service Workers
2. Clicar "Unregister" manualmente
3. Recarregar página
4. Usar `force-reload-v113.html`

## 📊 MONITORAMENTO

### Logs Importantes
```javascript
// Versão OK
✅ Versão atual OK

// Atualização detectada
🔍 Cache Buster: {current: "113", stored: "112"}
🔄 Nova versão detectada! Forçando reload...
🗑️ Deletando cache: gestao-condominial-v112
🗑️ Desregistrando SW
🔄 Recarregando página...

// Primeira visita
🔍 Cache Buster: {current: "113", stored: null}
✅ Versão atual OK
```

### Verificações
- [ ] localStorage tem `app_version: "113"`
- [ ] Console não mostra erros
- [ ] Versão no rodapé: v113
- [ ] FAB aparece (se admin)
- [ ] Modal abre corretamente

## 🎯 BENEFÍCIOS

1. **Atualização Automática**: Usuários sempre têm versão mais recente
2. **Sem Cache Antigo**: Elimina problemas de arquivos desatualizados
3. **Sem Intervenção Manual**: Não precisa instruir usuário a limpar cache
4. **Fallback Manual**: `force-reload-v113.html` para casos extremos
5. **Logs Claros**: Fácil debug de problemas de cache

## 📝 CHECKLIST DE DEPLOY

- [ ] Atualizar CURRENT_VERSION em index.html
- [ ] Atualizar ?v=XXX em todos os recursos
- [ ] Atualizar versão em app.js
- [ ] Atualizar versão em sw.js
- [ ] Deploy: `firebase deploy --only hosting`
- [ ] Testar em navegador limpo
- [ ] Testar atualização (localStorage com versão antiga)
- [ ] Verificar logs no console
- [ ] Confirmar versão no rodapé

---

**Versão**: v113  
**Data**: 2026-02-03  
**Status**: ✅ Cache busting agressivo implementado
