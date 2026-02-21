# 🤖 GUIA COMPLETO - Integração Chatbot Supabase

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Credenciais Firebase](#credenciais-firebase)
3. [Estrutura do Banco de Dados](#estrutura-do-banco)
4. [APIs Disponíveis](#apis-disponíveis)
5. [Exemplos de Integração](#exemplos-integração)
6. [Deploy e Configuração](#deploy-configuração)

---

## 🎯 Visão Geral

### Sistema Atual
- **Frontend**: PWA (Progressive Web App)
- **Backend**: Firebase (Firestore + Auth)
- **Banco de Dados**: Firestore NoSQL
- **Autenticação**: Firebase Auth

### Seu Chatbot
- **Backend**: Supabase
- **Integração**: Via API REST intermediária
- **Autenticação**: API Key

---

## 🔑 Credenciais Firebase

### Configuração do Projeto
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDw1XIkVyMMPfGLCeF4GpMJ6kEZ8HeeuF8",
  authDomain: "gestaodoscondominios.firebaseapp.com",
  projectId: "gestaodoscondominios",
  storageBucket: "gestaodoscondominios.firebasestorage.app",
  messagingSenderId: "20572242752",
  appId: "1:20572242752:web:c1b533c1bb905e81b0f0a5",
  measurementId: "G-DSGCBWM9Q1"
};
```

### Service Account (Firebase Admin SDK)
**IMPORTANTE**: Já está configurado no arquivo `api-chatbot/server.js`

```json
{
  "type": "service_account",
  "project_id": "gestaodoscondominios",
  "private_key_id": "1731411f19fa2a2123ead65f32a628cefd34c0a5",
  "client_email": "firebase-adminsdk-fbsvc@gestaodoscondominios.iam.gserviceaccount.com"
}
```

---

## 🗄️ Estrutura do Banco de Dados

### Coleções Firestore

#### 1. `condominios`
```javascript
{
  id: "auto-generated",
  nome: "Residencial Vidal",
  endereco: "Rua X, 123",
  active: true,
  createdAt: Timestamp
}
```

#### 2. `blocos`
```javascript
{
  id: "auto-generated",
  nome: "Bloco A",
  condominioId: "ref-condominio",
  active: true
}
```

#### 3. `apartamentos`
```javascript
{
  id: "auto-generated",
  numero: "101",
  proprietario: "João Silva",
  blocoId: "ref-bloco",
  condominioId: "ref-condominio",
  blocoNome: "Bloco A",
  active: true
}
```

#### 4. `casas` (Casas sem bloco)
```javascript
{
  id: "auto-generated",
  numero: "Casa 1",
  residentName: "Maria Santos",
  condominioId: "ref-condominio",
  active: true
}
```

#### 5. `payments` (Pagamentos)
```javascript
{
  id: "auto-generated",
  apartamentoId: "ref-apartamento",
  condominioId: "ref-condominio",
  blocoId: "ref-bloco",
  ano: "2026",
  mes: "02",
  date: "2026-02",
  status: "pago", // pago, pendente, reciclado, acordo
  value: 285.00,
  observacao: "Pago via PIX",
  type: "condominio",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 6. `salaoReservations` (Reservas do Salão)
```javascript
{
  id: "auto-generated",
  condominioId: "ref-condominio",
  apartamentoId: "ref-apartamento",
  apartamentoNumero: "101",
  date: "2026-02-15",
  value: 150.00,
  status: "paid", // reserved, paid
  observacao: "Aniversário",
  createdAt: Timestamp
}
```

---

## 🚀 APIs Disponíveis

### Base URL
```
http://localhost:3000/api  (desenvolvimento)
https://sua-api.vercel.app/api  (produção)
```

### Autenticação
Todas as rotas requerem header:
```
x-api-key: sua-chave-secreta
```

---

### 📊 1. Dashboard - Resumo do Mês

**Endpoint**: `GET /api/dashboard`

**Parâmetros**:
- `condominioId` (obrigatório)
- `ano` (obrigatório) - Ex: "2026"
- `mes` (obrigatório) - Ex: "02"

**Exemplo**:
```bash
curl -X GET "http://localhost:3000/api/dashboard?condominioId=abc123&ano=2026&mes=02" \
  -H "x-api-key: sua-chave"
```

**Response**:
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

**Uso no Chatbot**:
- "Mostre o resumo do mês"
- "Como está o condomínio?"
- "Quantos pagaram?"

---

### 🏠 2. Inadimplentes - Lista de Pendentes

**Endpoint**: `GET /api/inadimplentes`

**Parâmetros**:
- `condominioId` (obrigatório)
- `ano` (obrigatório)
- `mes` (obrigatório)

**Exemplo**:
```bash
curl -X GET "http://localhost:3000/api/inadimplentes?condominioId=abc123&ano=2026&mes=02" \
  -H "x-api-key: sua-chave"
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "numero": "101",
      "proprietario": "João Silva",
      "blocoNome": "Bloco A"
    },
    {
      "numero": "205",
      "proprietario": "Maria Santos",
      "blocoNome": "Bloco B"
    }
  ],
  "total": 2,
  "periodo": "02/2026"
}
```

**Uso no Chatbot**:
- "Quantos inadimplentes?"
- "Quem não pagou?"
- "Lista de pendentes"

---

### 🔍 3. Apartamento Específico

**Endpoint**: `GET /api/apartamento`

**Parâmetros**:
- `condominioId` (obrigatório)
- `numero` (obrigatório) - Ex: "101"
- `ano` (obrigatório)
- `mes` (obrigatório)

**Exemplo**:
```bash
curl -X GET "http://localhost:3000/api/apartamento?condominioId=abc123&numero=101&ano=2026&mes=02" \
  -H "x-api-key: sua-chave"
```

**Response**:
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

**Uso no Chatbot**:
- "Status do 101"
- "O apartamento 205 pagou?"
- "Situação do 303"

---

### 📅 4. Reservas do Salão

**Endpoint**: `GET /api/salao/reservas`

**Parâmetros**:
- `condominioId` (obrigatório)
- `mes` (opcional)
- `ano` (opcional)

**Exemplo**:
```bash
curl -X GET "http://localhost:3000/api/salao/reservas?condominioId=abc123&mes=02&ano=2026" \
  -H "x-api-key: sua-chave"
```

**Response**:
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

**Uso no Chatbot**:
- "Quem reservou o salão?"
- "Salão disponível dia 15?"
- "Reservas de fevereiro"

---

### 📈 5. Resumo Completo

**Endpoint**: `GET /api/resumo`

**Parâmetros**:
- `condominioId` (obrigatório)
- `ano` (obrigatório)
- `mes` (obrigatório)

**Exemplo**:
```bash
curl -X GET "http://localhost:3000/api/resumo?condominioId=abc123&ano=2026&mes=02" \
  -H "x-api-key: sua-chave"
```

**Response**:
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

**Uso no Chatbot**:
- "Relatório completo"
- "Quanto arrecadamos?"
- "Resumo geral"

---

### 🏢 6. Listar Condomínios

**Endpoint**: `GET /api/condominios`

**Parâmetros**: Nenhum

**Exemplo**:
```bash
curl -X GET "http://localhost:3000/api/condominios" \
  -H "x-api-key: sua-chave"
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "nome": "Residencial Vidal",
      "endereco": "Rua X, 123"
    },
    {
      "id": "def456",
      "nome": "Condomínio Jardim",
      "endereco": "Av. Y, 456"
    }
  ]
}
```

**Uso no Chatbot**:
- "Quais condomínios?"
- Seleção inicial do condomínio

---

## 💻 Exemplos de Integração

### Exemplo 1: Supabase Edge Function Completa

```typescript
// supabase/functions/chatbot-condominio/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const API_URL = Deno.env.get('API_URL') || 'http://localhost:3000';
const API_KEY = Deno.env.get('API_KEY') || '';
const CONDOMINIO_ID = Deno.env.get('CONDOMINIO_ID') || '';

interface ChatMessage {
  message: string;
  userId: string;
  condominioId?: string;
}

// Helper para fazer requisições
async function fetchAPI(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${API_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  const response = await fetch(url.toString(), {
    headers: { 'x-api-key': API_KEY }
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  return await response.json();
}

// Detectar intenção do usuário
function detectIntent(message: string) {
  const msg = message.toLowerCase();
  
  if (msg.includes('inadimplente') || msg.includes('não pagou') || msg.includes('nao pagou')) {
    return 'inadimplentes';
  }
  
  if (msg.includes('resumo') || msg.includes('dashboard') || msg.includes('como está')) {
    return 'resumo';
  }
  
  if (msg.includes('status') || msg.includes('apartamento') || msg.includes('apt')) {
    return 'apartamento';
  }
  
  if (msg.includes('salão') || msg.includes('salao') || msg.includes('reserva')) {
    return 'salao';
  }
  
  if (msg.includes('arrecad') || msg.includes('valor') || msg.includes('quanto')) {
    return 'resumo';
  }
  
  return 'help';
}

// Extrair número do apartamento
function extractApartmentNumber(message: string): string | null {
  const match = message.match(/\d+/);
  return match ? match[0] : null;
}

serve(async (req) => {
  try {
    const { message, userId, condominioId }: ChatMessage = await req.json();
    
    const cond = condominioId || CONDOMINIO_ID;
    const ano = new Date().getFullYear().toString();
    const mes = (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    const intent = detectIntent(message);
    let reply = '';
    
    switch (intent) {
      case 'inadimplentes': {
        const data = await fetchAPI('/api/inadimplentes', { condominioId: cond, ano, mes });
        
        if (data.total === 0) {
          reply = '🎉 Ótima notícia! Não há inadimplentes este mês.';
        } else {
          reply = `📊 Existem ${data.total} apartamento(s) inadimplente(s) em ${data.periodo}:\n\n`;
          data.data.slice(0, 5).forEach((apt: any) => {
            reply += `• Apt ${apt.numero} - ${apt.proprietario} (${apt.blocoNome})\n`;
          });
          if (data.total > 5) {
            reply += `\n... e mais ${data.total - 5} apartamento(s).`;
          }
        }
        break;
      }
      
      case 'resumo': {
        const data = await fetchAPI('/api/resumo', { condominioId: cond, ano, mes });
        const info = data.data;
        
        reply = `📊 Resumo de ${info.periodo}\n\n`;
        reply += `🏢 ${info.condominio}\n`;
        reply += `📦 Total de unidades: ${info.totalUnidades}\n\n`;
        reply += `✅ Pago: ${info.pago}\n`;
        reply += `♻️ Reciclado: ${info.reciclado}\n`;
        reply += `⏳ Pendente: ${info.pendente}\n`;
        reply += `🤝 Acordo: ${info.acordo}\n\n`;
        reply += `💰 Valor arrecadado: R$ ${info.valorArrecadado}\n`;
        reply += `📈 Taxa de pagamento: ${info.percentualPago}%`;
        break;
      }
      
      case 'apartamento': {
        const numero = extractApartmentNumber(message);
        
        if (!numero) {
          reply = '❓ Por favor, informe o número do apartamento. Ex: "Status do 101"';
          break;
        }
        
        try {
          const data = await fetchAPI('/api/apartamento', { 
            condominioId: cond, 
            numero, 
            ano, 
            mes 
          });
          
          const apt = data.data;
          const statusEmoji: Record<string, string> = {
            'pago': '✅',
            'pendente': '⏳',
            'reciclado': '♻️',
            'acordo': '🤝'
          };
          
          reply = `🏠 Apartamento ${apt.numero}\n`;
          reply += `👤 ${apt.proprietario}\n\n`;
          reply += `${statusEmoji[apt.status]} Status: ${apt.status.toUpperCase()}\n`;
          if (apt.valor > 0) {
            reply += `💰 Valor: R$ ${apt.valor.toFixed(2)}\n`;
          }
          if (apt.observacao) {
            reply += `📝 Obs: ${apt.observacao}`;
          }
        } catch (error) {
          reply = `❌ Apartamento ${numero} não encontrado.`;
        }
        break;
      }
      
      case 'salao': {
        const data = await fetchAPI('/api/salao/reservas', { condominioId: cond, mes, ano });
        
        if (data.total === 0) {
          reply = '📅 Não há reservas do salão para este mês.';
        } else {
          reply = `📅 Reservas do Salão (${data.total}):\n\n`;
          data.data.forEach((res: any) => {
            const date = new Date(res.data + 'T00:00:00');
            const dia = date.getDate();
            const statusEmoji = res.status === 'paid' ? '✅' : '⏳';
            reply += `${statusEmoji} Dia ${dia} - Apt ${res.apartamento}`;
            if (res.observacao) {
              reply += ` - ${res.observacao}`;
            }
            reply += '\n';
          });
        }
        break;
      }
      
      default: {
        reply = `👋 Olá! Sou o assistente do condomínio.\n\n`;
        reply += `Posso ajudar com:\n`;
        reply += `• "Resumo do mês"\n`;
        reply += `• "Quantos inadimplentes?"\n`;
        reply += `• "Status do apartamento 101"\n`;
        reply += `• "Reservas do salão"\n`;
        reply += `• "Quanto arrecadamos?"\n\n`;
        reply += `Como posso ajudar?`;
      }
    }
    
    return new Response(
      JSON.stringify({ reply, intent }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao processar mensagem',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
```

---

## 🚀 Deploy e Configuração

### Passo 1: Preparar API REST

```bash
# 1. Navegar para pasta da API
cd api-chatbot

# 2. Instalar dependências
npm install

# 3. Testar localmente
node server.js
# Deve aparecer: 🚀 API Chatbot rodando em http://localhost:3000
```

### Passo 2: Deploy no Vercel (Recomendado)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Anotar URL: https://seu-projeto.vercel.app
```

### Passo 3: Configurar Variáveis de Ambiente

No Vercel Dashboard:
1. Acesse seu projeto
2. Settings > Environment Variables
3. Adicione:
   - `API_KEY`: Sua chave secreta (gere com: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `PORT`: 3000

### Passo 4: Deploy Edge Function no Supabase

```bash
# 1. Criar função
supabase functions new chatbot-condominio

# 2. Copiar código acima para o arquivo criado

# 3. Deploy
supabase functions deploy chatbot-condominio

# 4. Configurar secrets
supabase secrets set API_URL=https://sua-api.vercel.app
supabase secrets set API_KEY=sua-chave-secreta
supabase secrets set CONDOMINIO_ID=id-do-condominio
```

### Passo 5: Obter ID do Condomínio

```bash
# Testar API para listar condomínios
curl -X GET "https://sua-api.vercel.app/api/condominios" \
  -H "x-api-key: sua-chave"

# Copiar o "id" do condomínio desejado
```

### Passo 6: Testar Integração

```bash
# Testar Edge Function
curl -X POST https://seu-projeto.supabase.co/functions/v1/chatbot-condominio \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_SUPABASE_ANON_KEY" \
  -d '{"message": "Resumo do mês", "userId": "user123"}'
```

---

## 📊 Fluxo de Dados

```
┌─────────────┐
│   Usuário   │
└──────┬──────┘
       │ "Resumo do mês"
       ▼
┌─────────────────┐
│ Supabase Chat   │
└──────┬──────────┘
       │
       ▼
┌──────────────────┐
│  Edge Function   │ (Detecta intenção)
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│   API REST       │ (Vercel/Railway)
│  /api/resumo     │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Firebase Admin   │
│   Firestore      │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│   Resposta       │
│ "📊 Resumo..."   │
└──────────────────┘
```

---

## 🔧 Troubleshooting

### Erro: "API Key inválida"
- Verifique se o header `x-api-key` está correto
- Confirme que a variável `API_KEY` está configurada

### Erro: "Condomínio não encontrado"
- Liste os condomínios com `/api/condominios`
- Verifique se o ID está correto

### Erro: "Token inválido" (Firebase)
- Confirme que o Service Account está correto no `server.js`
- Verifique se o projeto Firebase está ativo

### API não responde
- Verifique logs: `vercel logs` ou `railway logs`
- Teste localmente primeiro: `node server.js`

---

## 📝 Checklist de Implementação

- [ ] API REST rodando localmente
- [ ] Deploy da API (Vercel/Railway)
- [ ] Variáveis de ambiente configuradas
- [ ] Teste de endpoints com curl
- [ ] Edge Function criada no Supabase
- [ ] Secrets configurados no Supabase
- [ ] ID do condomínio obtido
- [ ] Teste completo da integração
- [ ] Chatbot respondendo corretamente

---

## 🎯 Perguntas Suportadas

✅ "Quantos inadimplentes temos?"  
✅ "Qual o status do apartamento 101?"  
✅ "Mostre o resumo do mês"  
✅ "Quem reservou o salão?"  
✅ "Quanto arrecadamos este mês?"  
✅ "Lista de quem não pagou"  
✅ "O apartamento 205 está em dia?"  
✅ "Salão disponível dia 15?"  
✅ "Relatório completo"  
✅ "Como está o condomínio?"

---

## 📞 Suporte

Se precisar de ajuda:
1. Verifique os logs da API
2. Teste os endpoints individualmente
3. Confirme as variáveis de ambiente
4. Valide o Service Account do Firebase

---

**Versão**: 1.0.0  
**Data**: 05/02/2026  
**Sistema**: Gestão Condominial v131
