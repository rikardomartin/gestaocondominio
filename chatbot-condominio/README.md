# 🤖 Chatbot Condomínio

Chatbot inteligente para gestão condominial com interface moderna e integração Firebase.

## ✨ Funcionalidades

- 💬 Chat em tempo real
- 📊 Resumo do mês (pagos, pendentes, inadimplentes)
- 🏠 Status de apartamentos específicos
- 📅 Consulta de reservas do salão
- ⚡ Respostas rápidas
- 💾 Histórico de conversas salvo no Firestore
- 📱 Design responsivo (mobile e desktop)

## 🚀 Deploy Rápido

### 1. Fazer Login no Firebase
```bash
firebase login
```

### 2. Inicializar Projeto (se necessário)
```bash
cd chatbot-condominio
firebase init
```

Selecione:
- ✅ Firestore
- ✅ Hosting

Projeto: **chatbotcond**

### 3. Deploy
```bash
firebase deploy
```

### 4. Acessar
```
https://chatbotcond.web.app
```

## 🔧 Configuração

### Conectar com Sistema Principal

No arquivo `index.html`, localize e atualize:

```javascript
const API_URL = 'https://sua-api.vercel.app'; // URL da API REST
const CONDOMINIO_ID = 'seu-condominio-id'; // ID do condomínio
```

### Obter ID do Condomínio

1. Acesse: https://gestaodoscondominios.web.app
2. Faça login como admin
3. Abra o console (F12)
4. Digite: `appState.selectedCondominio.id`
5. Copie o ID

## 💬 Perguntas que o Chatbot Responde

### Resumo Geral
- "Resumo do mês"
- "Dashboard"
- "Como está o condomínio?"

### Inadimplentes
- "Quantos inadimplentes?"
- "Quem não pagou?"
- "Lista de pendentes"

### Status de Apartamento
- "Status do 101"
- "O apartamento 205 pagou?"
- "Situação do 303"

### Salão de Festas
- "Reservas do salão"
- "Quem reservou o salão?"
- "Salão disponível?"

### Ajuda
- "Ajuda"
- "O que você faz?"
- "Oi"

## 🎨 Personalização

### Cores
Edite as cores no CSS (linhas 12-13):
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Nome do Condomínio
Linha 145:
```html
<h1>🏢 Assistente do Condomínio</h1>
```

### Mensagem de Boas-Vindas
Linha 163:
```html
👋 Olá! Sou o assistente do condomínio.
```

## 📊 Estrutura do Firestore

### Collection: messages
```javascript
{
  text: "Resumo do mês",
  sender: "user", // ou "bot"
  timestamp: Timestamp,
  userId: "user123"
}
```

## 🔐 Segurança

As regras do Firestore estão abertas para facilitar o desenvolvimento.

Para produção, atualize `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /messages/{messageId} {
      allow read: if true;
      allow write: if request.auth != null; // Apenas usuários autenticados
    }
  }
}
```

## 🌐 Integração com API

### Modo Atual: Simulado
O chatbot está com respostas simuladas para você testar.

### Modo Real: Conectado à API

1. Deploy da API REST (ver pasta `api-chatbot`)
2. Atualize as funções no `index.html`:

```javascript
async function getResumo() {
    const response = await fetch(
        `${API_URL}/api/resumo?condominioId=${CONDOMINIO_ID}&ano=2026&mes=02`,
        {
            headers: {
                'x-api-key': 'SUA_API_KEY'
            }
        }
    );
    const data = await response.json();
    
    return `📊 Resumo de ${data.data.periodo}
    
🏢 ${data.data.condominio}
📦 Total: ${data.data.totalUnidades}

✅ Pago: ${data.data.pago}
♻️ Reciclado: ${data.data.reciclado}
⏳ Pendente: ${data.data.pendente}

💰 Arrecadado: R$ ${data.data.valorArrecadado}
📈 Taxa: ${data.data.percentualPago}%`;
}
```

## 📱 Testar Localmente

```bash
firebase serve
```

Acesse: http://localhost:5000

## 🆘 Problemas Comuns

### Erro: "Firebase not initialized"
- Verifique se o projeto está correto no `.firebaserc`
- Rode: `firebase use chatbotcond`

### Mensagens não salvam
- Verifique as regras do Firestore
- Abra o console e veja erros

### Deploy falha
- Verifique se está logado: `firebase login`
- Confirme o projeto: `firebase projects:list`

## 📚 Próximos Passos

1. ✅ Deploy do chatbot
2. ⏳ Deploy da API REST (pasta `api-chatbot`)
3. ⏳ Conectar chatbot à API
4. ⏳ Adicionar autenticação de usuários
5. ⏳ Implementar IA (OpenAI, Gemini, etc)

## 🎯 Roadmap

- [ ] Autenticação de usuários
- [ ] Notificações push
- [ ] Integração com WhatsApp
- [ ] IA para respostas mais inteligentes
- [ ] Gráficos e relatórios visuais
- [ ] Exportar conversas
- [ ] Multi-idioma

---

**Versão**: 1.0.0  
**Data**: 04/02/2026  
**Firebase Project**: chatbotcond
