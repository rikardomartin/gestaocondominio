# 🚀 Deploy do Chatbot - Guia Rápido

## ⚡ 3 Passos para Deploy

### 1️⃣ Login no Firebase
```bash
firebase login
```

### 2️⃣ Ir para a pasta do chatbot
```bash
cd chatbot-condominio
```

### 3️⃣ Deploy
```bash
firebase deploy
```

## ✅ Pronto!

Seu chatbot estará disponível em:
```
https://chatbotcond.web.app
```

## 🔧 Comandos Úteis

### Ver projetos disponíveis
```bash
firebase projects:list
```

### Selecionar projeto
```bash
firebase use chatbotcond
```

### Deploy apenas Hosting
```bash
firebase deploy --only hosting
```

### Deploy apenas Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Testar localmente
```bash
firebase serve
```

### Ver logs
```bash
firebase hosting:channel:list
```

## 📱 Testar no Celular

1. Acesse: https://chatbotcond.web.app
2. Adicione à tela inicial (PWA)
3. Use como app nativo!

## 🎨 Personalizar Antes do Deploy

### 1. Nome do Condomínio
Edite `index.html` linha 145:
```html
<h1>🏢 Seu Condomínio Aqui</h1>
```

### 2. Cores
Edite `index.html` linha 12:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### 3. Mensagem Inicial
Edite `index.html` linha 163:
```html
👋 Olá! Sou o assistente do [Nome do Condomínio].
```

## 🔗 Conectar com Sistema Principal

### Passo 1: Obter ID do Condomínio

1. Acesse: https://gestaodoscondominios.web.app
2. Login: admin@condominio.com / a10b20c30@
3. Console (F12): `appState.selectedCondominio.id`
4. Copie o ID

### Passo 2: Atualizar no Chatbot

Edite `index.html` linha 234:
```javascript
const CONDOMINIO_ID = 'cole-o-id-aqui';
```

### Passo 3: Deploy Novamente
```bash
firebase deploy
```

## 🐛 Solução de Problemas

### Erro: "Not logged in"
```bash
firebase login --reauth
```

### Erro: "Project not found"
```bash
firebase use --add
# Selecione: chatbotcond
```

### Erro: "Permission denied"
```bash
firebase deploy --only firestore:rules
```

### Limpar cache e redeploy
```bash
firebase hosting:channel:delete preview
firebase deploy
```

## 📊 Verificar Deploy

1. Acesse: https://console.firebase.google.com/project/chatbotcond
2. Vá em **Hosting**
3. Veja o histórico de deploys
4. Clique em "View" para testar

## 🎯 Checklist Pré-Deploy

- [ ] Personalizei o nome do condomínio
- [ ] Ajustei as cores (opcional)
- [ ] Testei localmente (`firebase serve`)
- [ ] Fiz login no Firebase (`firebase login`)
- [ ] Estou na pasta correta (`cd chatbot-condominio`)
- [ ] Pronto para deploy! (`firebase deploy`)

## 🌐 Compartilhar

Após o deploy, compartilhe o link:
```
https://chatbotcond.web.app
```

Ou crie um QR Code:
1. Acesse: https://www.qr-code-generator.com
2. Cole o link
3. Baixe o QR Code
4. Compartilhe com os moradores!

---

**Tempo estimado**: 2 minutos  
**Custo**: Grátis (Firebase Spark Plan)  
**Dificuldade**: ⭐ Fácil
