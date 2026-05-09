# 🔒 Análise de Segurança - Firebase Rules

**Sistema**: Gestão de Condomínios  
**Usuários**: 3 pessoas (uso privado)  
**Data**: 09/05/2026

---

## ⚠️ SITUAÇÃO ATUAL: RISCO ALTO

### 🔴 Problemas Críticos Identificados

#### 1. **Leitura Pública de Dados Sensíveis**
```javascript
// ❌ PROBLEMA: Qualquer pessoa na internet pode ler
match /condominios/{condominioId} {
  allow read: if true; // 🔴 LEITURA PÚBLICA
}

match /apartamentos/{apartamentoId} {
  allow read: if true; // 🔴 LEITURA PÚBLICA
}

match /payments/{paymentId} {
  allow read: if true; // 🔴 LEITURA PÚBLICA
}
```

**Risco:**
- ❌ Qualquer pessoa pode ver dados dos moradores
- ❌ Qualquer pessoa pode ver valores de pagamentos
- ❌ Qualquer pessoa pode ver quem está devendo
- ❌ Dados pessoais expostos (nomes, apartamentos, valores)

#### 2. **Escrita Apenas com Autenticação Básica**
```javascript
allow write: if request.auth != null;
```

**Risco:**
- ❌ Qualquer usuário autenticado pode modificar dados
- ❌ Não há verificação de perfil (admin, gerente, etc.)
- ❌ Um porteiro poderia deletar todos os pagamentos

---

## 🎯 Por Que Isso É Perigoso?

### Cenário 1: Vazamento de Dados
```
1. Alguém descobre a URL do seu Firebase
2. Acessa o console do navegador (F12)
3. Executa:
   firebase.firestore().collection('apartamentos').get()
4. 💥 Vê TODOS os apartamentos, moradores e valores
```

### Cenário 2: Ataque de Modificação
```
1. Alguém cria uma conta no seu sistema
2. Faz login (agora está autenticado)
3. Executa:
   firebase.firestore().collection('payments').doc('xxx').delete()
4. 💥 Deleta pagamentos de outros moradores
```

### Cenário 3: Chatbot Exposto
```
Motivo da leitura pública:
- "CHATBOT: Permitir leitura pública de dados do condomínio"

Problema:
- O chatbot precisa de leitura pública
- MAS isso expõe TODOS os dados para TODOS
```

---

## ✅ SOLUÇÃO RECOMENDADA

### Opção 1: Segurança Completa (RECOMENDADO)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Função auxiliar: verificar se é admin
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Função auxiliar: verificar se é gerente ou admin
    function isManager() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'gerente'];
    }
    
    // Licenças - leitura pública apenas para verificação
    match /licencas/{licencaId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // CHATBOT: Dados públicos limitados (apenas para chatbot)
    match /chatbot_public/{document=**} {
      allow read: if true; // Apenas dados não-sensíveis
      allow write: if false;
    }
    
    // Condomínios - apenas autenticados
    match /condominios/{condominioId} {
      allow read: if request.auth != null;
      allow create: if isAdmin();
      allow update: if isManager();
      allow delete: if isAdmin();
    }
    
    // Blocos - apenas autenticados
    match /blocos/{blocoId} {
      allow read: if request.auth != null;
      allow create: if isAdmin();
      allow update: if isManager();
      allow delete: if isAdmin();
    }
    
    // Apartamentos - apenas autenticados
    match /apartamentos/{apartamentoId} {
      allow read: if request.auth != null;
      allow create: if isAdmin();
      allow update: if isManager();
      allow delete: if isAdmin();
    }
    
    // Pagamentos - apenas autenticados, escrita restrita
    match /payments/{paymentId} {
      allow read: if request.auth != null;
      allow create: if isManager();
      allow update: if isManager();
      allow delete: if isAdmin(); // Apenas admin pode deletar
    }
    
    // Reservas do Salão - leitura autenticada, escrita restrita
    match /salaoReservations/{reservationId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null; // Qualquer autenticado pode reservar
      allow update: if isManager();
      allow delete: if isManager();
    }
    
    // Taxas - apenas gerentes e admins
    match /condominioTaxes/{taxId} {
      allow read: if request.auth != null;
      allow write: if isManager();
    }
    
    // Tokens FCM - usuários gerenciam seus próprios
    match /fcmTokens/{tokenId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == tokenId;
    }
    
    // Notificações - apenas gerentes podem criar
    match /notifications/{notificationId} {
      allow read: if request.auth != null;
      allow create: if isManager();
      allow update: if isManager();
      allow delete: if isAdmin();
    }
    
    // Usuários - cada um vê apenas seu próprio perfil
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Bloquear tudo que não foi explicitamente permitido
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

### Opção 2: Segurança Básica (Mínimo Aceitável)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Licenças - leitura pública
    match /licencas/{licencaId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // TUDO MAIS: Apenas usuários autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Vantagens:**
- ✅ Simples de implementar
- ✅ Bloqueia acesso público
- ✅ Funciona para 3 usuários confiáveis

**Desvantagens:**
- ⚠️ Qualquer usuário autenticado pode fazer tudo
- ⚠️ Sem controle de perfis (admin, gerente, etc.)

---

## 🤔 Você Precisa de Segurança?

### ✅ SIM, você precisa! Aqui está o porquê:

#### 1. **Proteção de Dados Pessoais (LGPD)**
- Nomes de moradores
- Números de apartamentos
- Valores de pagamentos
- Histórico de débitos

**Mesmo com 3 usuários, você é responsável pelos dados!**

#### 2. **Prevenção de Acidentes**
- Um usuário pode deletar dados sem querer
- Um script malicioso pode acessar o Firebase
- Um ex-funcionário pode manter acesso

#### 3. **Conformidade com Firebase**
- Firebase pode suspender projetos com regras muito abertas
- Você pode receber avisos de segurança no console

#### 4. **Proteção Contra Bots**
- Bots escaneiam a internet procurando Firebase aberto
- Podem roubar dados ou inserir lixo no banco

---

## 📋 Checklist de Segurança

### Situação Atual
- [ ] ❌ Leitura pública de dados sensíveis
- [ ] ❌ Escrita sem verificação de perfil
- [ ] ❌ Sem controle de permissões
- [ ] ❌ Chatbot expõe todos os dados
- [ ] ⚠️ Apenas 3 usuários (confiáveis)

### Recomendações
- [ ] ✅ Implementar Opção 1 (segurança completa)
- [ ] ✅ Ou no mínimo Opção 2 (segurança básica)
- [ ] ✅ Criar coleção separada para chatbot público
- [ ] ✅ Adicionar campo `role` nos usuários
- [ ] ✅ Testar regras antes de aplicar

---

## 🚀 Como Implementar

### Passo 1: Backup
```bash
# Fazer backup das regras atuais
firebase firestore:rules > firestore.rules.backup
```

### Passo 2: Atualizar Regras
```bash
# Copiar uma das opções acima para firestore.rules
# Testar localmente se possível
```

### Passo 3: Deploy
```bash
firebase deploy --only firestore:rules
```

### Passo 4: Validar
```bash
# Testar login e operações básicas
# Verificar se tudo funciona
```

---

## ⚠️ Impacto no Chatbot

**Problema**: O chatbot precisa de leitura pública

**Solução**: Criar coleção separada
```javascript
// Dados públicos para chatbot (não-sensíveis)
match /chatbot_public/{document=**} {
  allow read: if true;
  allow write: if false;
}

// Dados privados (sensíveis)
match /condominios/{condominioId} {
  allow read: if request.auth != null; // Apenas autenticados
}
```

**Migração**:
1. Criar coleção `chatbot_public`
2. Copiar apenas dados não-sensíveis (FAQ, horários, contatos)
3. Atualizar chatbot para usar `chatbot_public`
4. Remover leitura pública das coleções principais

---

## 💡 Recomendação Final

### Para 3 Usuários Confiáveis:

**Implementar no mínimo a Opção 2 (Segurança Básica)**

```javascript
// Bloquear leitura pública
match /{document=**} {
  allow read, write: if request.auth != null;
}
```

**Motivos:**
1. ✅ Protege contra acesso externo
2. ✅ Simples de implementar (5 minutos)
3. ✅ Não quebra funcionalidades
4. ✅ Conformidade com LGPD
5. ✅ Evita avisos do Firebase

**Tempo de implementação**: 5-10 minutos  
**Risco de quebrar**: Baixo (apenas chatbot precisa ajuste)  
**Benefício**: Alto (proteção completa de dados)

---

## 📞 Próximos Passos

1. **Decidir**: Opção 1 (completa) ou Opção 2 (básica)?
2. **Testar**: Fazer backup e testar em modo teste
3. **Implementar**: Deploy das novas regras
4. **Validar**: Testar login e operações
5. **Ajustar chatbot**: Se necessário

**Quer que eu implemente as regras de segurança agora?** 🔒
