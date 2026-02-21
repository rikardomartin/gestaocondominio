# Instruções para Deploy da v68

## Problema Identificado

Você está vendo a **versão antiga (v57)** em cache, não a v68 que acabei de criar.

## Arquivos Já Atualizados

✅ `fix-save-single-month-v2.js` - Botão verde marca apenas mês ativo
✅ `sw.js` - Service Worker v68
✅ `index.html` - Scripts com ?v=68

## Arquivo que Precisa Atualização Manual

❌ `app.js` - Linha 239

### Mudança Necessária:

**Linha 239 do app.js:**

**ANTES:**
```javascript
console.log('📋 Versão: v28 - Cache atualizado');
```

**DEPOIS:**
```javascript
console.log('📋 Versão: v68 - Botão verde marca apenas mês ativo');
```

## Passos para Deploy

### 1. Edite o app.js

Abra o arquivo `app.js` e na linha 239, mude:
- De: `v28 - Cache atualizado`
- Para: `v68 - Botão verde marca apenas mês ativo`

### 2. Faça o Deploy

```bash
firebase deploy
```

### 3. Limpe o Cache do Navegador

**Opção 1: Hard Refresh**
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**Opção 2: Limpar Cache Completo**
- Pressione `Ctrl + Shift + Delete`
- Selecione "Imagens e arquivos em cache"
- Clique em "Limpar dados"

### 4. Verifique a Versão

Abra o Console (F12) e veja:
```
📋 Versão: v68 - Botão verde marca apenas mês ativo
```

Se ainda aparecer v57 ou v28, force o Service Worker a atualizar:
1. Abra DevTools (F12)
2. Vá em "Application" → "Service Workers"
3. Clique em "Unregister"
4. Recarregue a página

### 5. Teste o Botão Verde

1. Selecione **Janeiro/2025**
2. Clique no botão verde (✓) de um condomínio
3. Deve aparecer:
   ```
   Deseja marcar TODOS os X apartamentos do condominio "Nome" como PAGO para:
   
   📅 Janeiro/2025
   
   Isso criará X pagamentos.
   ```

**Se aparecer "ano inteiro de 2025"**, ainda está na versão antiga!

## Verificação Final

### Console deve mostrar:
```
🚀 Sistema de Gestao Condominial - Inicializando...
📋 Versão: v68 - Botão verde marca apenas mês ativo
💰 [FIX v2] Iniciando pagamento em massa para condominio - MES ATIVO
```

### Alerta deve mostrar:
```
Deseja marcar TODOS os 464 apartamentos do condominio "Ayres" como PAGO para:

📅 Janeiro/2025

Isso criará 464 pagamentos.
```

## Se Ainda Não Funcionar

Execute este comando no Console do navegador (F12):
```javascript
caches.keys().then(keys => keys.forEach(key => caches.delete(key))).then(() => location.reload(true));
```

Isso vai:
1. Deletar todos os caches
2. Recarregar a página forçadamente

---

**Versão**: v68
**Data**: 01/02/2026
**Status**: Aguardando deploy manual
