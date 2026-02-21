# 🤖 API para Chatbot - Gestão Condominial

API REST para conectar chatbot (Supabase) ao sistema de gestão condominial (Firebase).

## 🚀 Deploy Rápido (Grátis)

### Opção 1: Vercel (Recomendado)
```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Deploy
cd api-chatbot
vercel
```

### Opção 2: Railway
1. Acesse https://railway.app
2. Conecte seu GitHub
3. Deploy do repositório
4. Adicione variáveis de ambiente

### Opção 3: Render
1. Acesse https://render.com
2. New > Web Service
3. Conecte repositório
4. Deploy automático

## 📋 Configuração

### 1. Obter Service Account do Firebase

1. Acesse: https://console.firebase.google.com/project/gestaodoscondominios/settings/serviceaccounts/adminsdk
2. Clique em "Gerar nova chave privada"
3. Baixe o arquivo JSON
4. Cole o conteúdo em `server.js` na variável `serviceAccount`

### 2. Configurar API Key

Crie arquivo `.env`:
```bash
API_KEY=sua-chave-secreta-super-forte-aqui
PORT=3000
```

### 3. Instalar e Rodar

```bash
cd api-chatbot
npm install
npm start
```

## 🔗 Endpoints Disponíveis

### 1. Listar Condomínios
```
GET /api/condominios
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cond123",
      "nome": "Residencial Vidal",
      "endereco": "Rua X, 123"
    }
  ]
}
```

### 2. Dashboard do Mês
```
GET /api/dashboard?condominioId=cond123&ano=2026&mes=02
```

**Response:**
```json
{
  "success": true,
  "data": {
    "periodo": "02/2026",
    "pago": 15,
    "reciclado": 3,
    "pendente": 2,
    "acordo": 0,
    "total": 20,
    "percentualPago": 90
  }
}
```

### 3. Lista de Inadimplentes
```
GET /api/inadimplentes?condominioId=cond123&ano=2026&mes=02
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "numero": "101",
      "proprietario": "João Silva",
      "blocoNome": "Bloco A"
    }
  ],
  "total": 1,
  "periodo": "02/2026"
}
```

### 4. Status de Apartamento Específico
```
GET /api/apartamento?condominioId=cond123&numero=101&ano=2026&mes=02
```

**Response:**
```json
{
  "success": true,
  "data": {
    "numero": "101",
    "proprietario": "João Silva",
    "status": "pago",
    "valor": 285.00,
    "observacao": "Pago via PIX",
    "periodo": "02/2026"
  }
}
```

### 5. Reservas do Salão
```
GET /api/salao/reservas?condominioId=cond123&mes=02&ano=2026
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "data": "2026-02-15",
      "apartamento": "101",
      "status": "paid",
      "valor": 150.00,
      "observacao": "Aniversário"
    }
  ],
  "total": 1
}
```

### 6. Resumo Geral
```
GET /api/resumo?condominioId=cond123&ano=2026&mes=02
```

**Response:**
```json
{
  "success": true,
  "data": {
    "condominio": "Residencial Vidal",
    "periodo": "02/2026",
    "totalUnidades": 20,
    "pago": 15,
    "reciclado": 3,
    "pendente": 2,
    "acordo": 0,
    "valorArrecadado": "4275.00",
    "percentualPago": 90
  }
}
```

## 🔐 Autenticação

Todas as requisições precisam do header:
```
x-api-key: sua-chave-secreta
```

## 💬 Exemplo de Uso no Chatbot (Supabase)

```javascript
// Função Edge do Supabase
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const API_URL = 'https://sua-api.vercel.app';
const API_KEY = 'sua-chave-secreta';

serve(async (req) => {
  const { message, condominioId } = await req.json();
  
  // Exemplo: Usuário pergunta "quantos inadimplentes?"
  if (message.includes('inadimplente')) {
    const response = await fetch(
      `${API_URL}/api/inadimplentes?condominioId=${condominioId}&ano=2026&mes=02`,
      {
        headers: {
          'x-api-key': API_KEY
        }
      }
    );
    
    const data = await response.json();
    
    return new Response(
      JSON.stringify({
        reply: `Existem ${data.total} apartamentos inadimplentes em fevereiro/2026.`
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Exemplo: Usuário pergunta "status do 101"
  if (message.includes('status') && message.includes('101')) {
    const response = await fetch(
      `${API_URL}/api/apartamento?condominioId=${condominioId}&numero=101&ano=2026&mes=02`,
      {
        headers: {
          'x-api-key': API_KEY
        }
      }
    );
    
    const data = await response.json();
    const apt = data.data;
    
    return new Response(
      JSON.stringify({
        reply: `Apartamento ${apt.numero} - ${apt.proprietario}: Status ${apt.status.toUpperCase()}`
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  return new Response(
    JSON.stringify({ reply: 'Como posso ajudar?' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

## 🧪 Testar Localmente

```bash
# Testar com curl
curl -H "x-api-key: sua-chave" \
  "http://localhost:3000/api/dashboard?condominioId=cond123&ano=2026&mes=02"
```

## 📊 Casos de Uso do Chatbot

1. **"Quantos inadimplentes temos?"** → `/api/inadimplentes`
2. **"Qual o status do apartamento 101?"** → `/api/apartamento`
3. **"Mostre o resumo do mês"** → `/api/resumo`
4. **"Quem reservou o salão em fevereiro?"** → `/api/salao/reservas`
5. **"Quantos pagaram este mês?"** → `/api/dashboard`

## 🔒 Segurança

- ✅ API Key obrigatória
- ✅ CORS configurado
- ✅ Firebase Admin SDK (acesso total ao Firestore)
- ✅ Sem exposição de credenciais no frontend

## 📝 Notas

- A API usa Firebase Admin SDK (acesso total)
- Não precisa de autenticação de usuário
- Ideal para chatbots e integrações
- Hospedagem gratuita disponível

---

**Versão**: 1.0.0  
**Data**: 04/02/2026
