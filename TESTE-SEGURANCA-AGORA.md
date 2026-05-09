# 🧪 Teste de Segurança - Guia Rápido

**Versão**: v140.4  
**Status**: Regras de segurança implementadas  
**Ação**: Testar agora!

---

## ✅ Teste Rápido (5 minutos)

### 1️⃣ Teste SEM Login (Verificar Bloqueio)

1. Abrir o sistema: https://gestaodoscondominios.web.app
2. **NÃO FAZER LOGIN**
3. Abrir console do navegador (F12)
4. Colar este código:

```javascript
// Tentar ler condominios sem login
firebase.firestore().collection('condominios').get()
  .then(snap => {
    console.log('❌ ERRO: Conseguiu ler sem login!', snap.size);
    alert('❌ PROBLEMA: Sistema inseguro!');
  })
  .catch(err => {
    console.log('✅ CORRETO: Bloqueado sem login');
    console.log('Mensagem:', err.message);
    alert('✅ SEGURO: Acesso bloqueado sem login!');
  });
```

**Resultado esperado:**
```
✅ CORRETO: Bloqueado sem login
Mensagem: Missing or insufficient permissions
```

---

### 2️⃣ Teste COM Login (Verificar Acesso)

1. Fazer login: `admin@condominio.com` / `admin123`
2. Abrir console do navegador (F12)
3. Colar este código:

```javascript
// Tentar ler condominios após login
firebase.firestore().collection('condominios').get()
  .then(snap => {
    console.log('✅ CORRETO: Conseguiu ler após login!');
    console.log('Total de condomínios:', snap.size);
    alert(`✅ FUNCIONANDO: ${snap.size} condomínios encontrados`);
  })
  .catch(err => {
    console.log('❌ ERRO: Não conseguiu ler após login');
    console.log('Mensagem:', err.message);
    alert('❌ PROBLEMA: Não consegue acessar dados!');
  });
```

**Resultado esperado:**
```
✅ CORRETO: Conseguiu ler após login!
Total de condomínios: X
```

---

### 3️⃣ Teste de Funcionalidades

**Testar se o sistema funciona normalmente:**

- [ ] ✅ Login funciona
- [ ] ✅ Vê lista de condomínios
- [ ] ✅ Abre painel de condomínio
- [ ] ✅ Vê apartamentos
- [ ] ✅ Registra pagamento
- [ ] ✅ Exporta Excel
- [ ] ✅ Baixa em massa funciona

---

## 🚨 Se Algo Não Funcionar

### Problema: "Missing or insufficient permissions" APÓS LOGIN

**Causa**: Usuário não tem campo `role`

**Solução Rápida**:
1. Abrir console Firebase: https://console.firebase.google.com/project/gestaodoscondominios/firestore
2. Ir em `users` → encontrar seu usuário
3. Adicionar campo: `role` = `admin`
4. Fazer logout e login novamente

**Ou via código (console do navegador após login)**:
```javascript
// Adicionar role ao usuário atual
const uid = firebase.auth().currentUser.uid;
firebase.firestore().collection('users').doc(uid).update({
  role: 'admin'
}).then(() => {
  console.log('✅ Role adicionado! Faça logout e login novamente.');
  alert('✅ Role adicionado! Faça logout e login novamente.');
});
```

---

## 🔄 Rollback (Se Necessário)

Se o sistema não funcionar, você pode voltar às regras antigas:

```bash
# 1. Restaurar backup
cp firestore.rules.backup firestore.rules

# 2. Deploy
firebase deploy --only firestore:rules

# 3. Testar novamente
```

---

## ✅ Checklist Final

- [ ] Teste 1: Bloqueio sem login ✅
- [ ] Teste 2: Acesso com login ✅
- [ ] Teste 3: Funcionalidades normais ✅
- [ ] Todos os usuários têm campo `role`
- [ ] Sistema funcionando 100%

---

## 📞 Resultado Esperado

**Tudo funcionando normalmente, MAS agora com segurança! 🔒**

- ✅ Sem login = Bloqueado
- ✅ Com login = Funciona
- ✅ Dados protegidos
- ✅ LGPD em conformidade

---

**Teste agora e me avise se tudo está funcionando! 🚀**
