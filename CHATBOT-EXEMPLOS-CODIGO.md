# 💡 Exemplos de Código - Chatbot Condomínio

## 📋 Índice
1. [Configuração Inicial](#configuração-inicial)
2. [Exemplos JavaScript/Node.js](#javascript)
3. [Exemplos Python](#python)
4. [Exemplos Supabase](#supabase)
5. [Webhooks e Notificações](#webhooks)

---

## ⚙️ Configuração Inicial

### Variáveis de Ambiente (.env)

```env
# API REST
API_URL=https://sua-api.vercel.app
API_KEY=sua-chave-secreta-aqui

# Firebase (opcional, se usar SDK direto)
FIREBASE_PROJECT_ID=gestaodoscondominios
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@gestaodoscondominios.iam.gserviceaccount.com

# Condomínio padrão
CONDOMINIO_ID=seu-condominio-id

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon
```

---

## 🟨 JavaScript/Node.js

### Exemplo 1: Cliente API Simples

```javascript
// api-client.js
const axios = require('axios');

class CondominioAPI {
  constructor(apiUrl, apiKey) {
    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  async getCondominios() {
    const response = await this.client.get('/api/condominios');
    return response.data;
  }

  async getDashboard(condominioId, ano, mes) {
    const response = await this.client.get('/api/dashboard', {
      params: { condominioId, ano, mes }
    });
    return response.data;
  }

  async getInadimplentes(condominioId, ano, mes) {
    const response = await this.client.get('/api/inadimplentes', {
      params: { condominioId, ano, mes }
    });
    return response.data;
  }

  async getApartamento(condominioId, numero, ano, mes) {
    const response = await this.client.get('/api/apartamento', {
      params: { condominioId, numero, ano, mes }
    });
    return response.data;
  }

  async getSalaoReservas(condominioId, mes, ano) {
    const response = await this.client.get('/api/salao/reservas', {
      params: { condominioId, mes, ano }
    });
    return response.data;
  }

  async getResumo(condominioId, ano, mes) {
    const response = await this.client.get('/api/resumo', {
      params: { condominioId, ano, mes }
    });
    return response.data;
  }
}

module.exports = CondominioAPI;
```

### Exemplo 2: Chatbot com Express

```javascript
// chatbot-server.js
const express = require('express');
const CondominioAPI = require('./api-client');
require('dotenv').config();

const app = express();
app.use(express.json());

const api = new CondominioAPI(
  process.env.API_URL,
  process.env.API_KEY
);

const CONDOMINIO_ID = process.env.CONDOMINIO_ID;

// Detectar intenção
function detectIntent(message) {
  const msg = message.toLowerCase();
  
  if (msg.includes('inadimplente') || msg.includes('não pagou')) {
    return 'inadimplentes';
  }
  if (msg.includes('resumo') || msg.includes('dashboard')) {
    return 'resumo';
  }
  if (msg.includes('status') || msg.includes('apartamento')) {
    return 'apartamento';
  }
  if (msg.includes('salão') || msg.includes('reserva')) {
    return 'salao';
  }
  return 'help';
}

// Extrair número
function extractNumber(message) {
  const match = message.match(/\d+/);
  return match ? match[0] : null;
}

// Endpoint do chatbot
app.post('/chat', async (req, res) => {
  try {
    const { message, userId } = req.body;
    const intent = detectIntent(message);
    
    const now = new Date();
    const ano = now.getFullYear().toString();
    const mes = (now.getMonth() + 1).toString().padStart(2, '0');
    
    let reply = '';
    
    switch (intent) {
      case 'inadimplentes': {
        const data = await api.getInadimplentes(CONDOMINIO_ID, ano, mes);
        
        if (data.total === 0) {
          reply = '🎉 Não há inadimplentes este mês!';
        } else {
          reply = `📊 ${data.total} inadimplente(s):\n\n`;
          data.data.slice(0, 5).forEach(apt => {
            reply += `• Apt ${apt.numero} - ${apt.proprietario}\n`;
          });
        }
        break;
      }
      
      case 'resumo': {
        const data = await api.getResumo(CONDOMINIO_ID, ano, mes);
        const info = data.data;
        
        reply = `📊 ${info.condominio}\n`;
        reply += `Período: ${info.periodo}\n\n`;
        reply += `✅ Pago: ${info.pago}\n`;
        reply += `⏳ Pendente: ${info.pendente}\n`;
        reply += `💰 Arrecadado: R$ ${info.valorArrecadado}`;
        break;
      }
      
      case 'apartamento': {
        const numero = extractNumber(message);
        if (!numero) {
          reply = 'Informe o número do apartamento';
          break;
        }
        
        try {
          const data = await api.getApartamento(CONDOMINIO_ID, numero, ano, mes);
          const apt = data.data;
          
          reply = `🏠 Apt ${apt.numero}\n`;
          reply += `👤 ${apt.proprietario}\n`;
          reply += `Status: ${apt.status.toUpperCase()}`;
        } catch (error) {
          reply = `Apartamento ${numero} não encontrado`;
        }
        break;
      }
      
      case 'salao': {
        const data = await api.getSalaoReservas(CONDOMINIO_ID, mes, ano);
        
        if (data.total === 0) {
          reply = '📅 Sem reservas este mês';
        } else {
          reply = `📅 ${data.total} reserva(s):\n\n`;
          data.data.forEach(res => {
            const date = new Date(res.data);
            reply += `• Dia ${date.getDate()} - Apt ${res.apartamento}\n`;
          });
        }
        break;
      }
      
      default:
        reply = 'Posso ajudar com:\n• Resumo do mês\n• Inadimplentes\n• Status de apartamento\n• Reservas do salão';
    }
    
    res.json({ reply, intent });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Erro ao processar mensagem' });
  }
});

app.listen(3001, () => {
  console.log('🤖 Chatbot rodando na porta 3001');
});
```

---

## 🐍 Python

### Exemplo 1: Cliente API Python

```python
# condominio_api.py
import requests
from typing import Dict, List, Optional

class CondominioAPI:
    def __init__(self, api_url: str, api_key: str):
        self.api_url = api_url
        self.headers = {
            'x-api-key': api_key,
            'Content-Type': 'application/json'
        }
    
    def _get(self, endpoint: str, params: Dict = None) -> Dict:
        url = f"{self.api_url}{endpoint}"
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()
    
    def get_condominios(self) -> List[Dict]:
        data = self._get('/api/condominios')
        return data['data']
    
    def get_dashboard(self, condominio_id: str, ano: str, mes: str) -> Dict:
        params = {
            'condominioId': condominio_id,
            'ano': ano,
            'mes': mes
        }
        data = self._get('/api/dashboard', params)
        return data['data']
    
    def get_inadimplentes(self, condominio_id: str, ano: str, mes: str) -> Dict:
        params = {
            'condominioId': condominio_id,
            'ano': ano,
            'mes': mes
        }
        return self._get('/api/inadimplentes', params)
    
    def get_apartamento(self, condominio_id: str, numero: str, ano: str, mes: str) -> Dict:
        params = {
            'condominioId': condominio_id,
            'numero': numero,
            'ano': ano,
            'mes': mes
        }
        data = self._get('/api/apartamento', params)
        return data['data']
    
    def get_salao_reservas(self, condominio_id: str, mes: str, ano: str) -> Dict:
        params = {
            'condominioId': condominio_id,
            'mes': mes,
            'ano': ano
        }
        return self._get('/api/salao/reservas', params)
    
    def get_resumo(self, condominio_id: str, ano: str, mes: str) -> Dict:
        params = {
            'condominioId': condominio_id,
            'ano': ano,
            'mes': mes
        }
        data = self._get('/api/resumo', params)
        return data['data']
```

### Exemplo 2: Chatbot Flask

```python
# chatbot_flask.py
from flask import Flask, request, jsonify
from condominio_api import CondominioAPI
from datetime import datetime
import os
import re

app = Flask(__name__)

api = CondominioAPI(
    api_url=os.getenv('API_URL'),
    api_key=os.getenv('API_KEY')
)

CONDOMINIO_ID = os.getenv('CONDOMINIO_ID')

def detect_intent(message: str) -> str:
    msg = message.lower()
    
    if 'inadimplente' in msg or 'não pagou' in msg or 'nao pagou' in msg:
        return 'inadimplentes'
    if 'resumo' in msg or 'dashboard' in msg:
        return 'resumo'
    if 'status' in msg or 'apartamento' in msg:
        return 'apartamento'
    if 'salão' in msg or 'salao' in msg or 'reserva' in msg:
        return 'salao'
    return 'help'

def extract_number(message: str) -> str:
    match = re.search(r'\d+', message)
    return match.group(0) if match else None

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        message = data.get('message', '')
        user_id = data.get('userId', '')
        
        intent = detect_intent(message)
        
        now = datetime.now()
        ano = str(now.year)
        mes = str(now.month).zfill(2)
        
        reply = ''
        
        if intent == 'inadimplentes':
            result = api.get_inadimplentes(CONDOMINIO_ID, ano, mes)
            
            if result['total'] == 0:
                reply = '🎉 Não há inadimplentes este mês!'
            else:
                reply = f"📊 {result['total']} inadimplente(s):\n\n"
                for apt in result['data'][:5]:
                    reply += f"• Apt {apt['numero']} - {apt['proprietario']}\n"
        
        elif intent == 'resumo':
            result = api.get_resumo(CONDOMINIO_ID, ano, mes)
            
            reply = f"📊 {result['condominio']}\n"
            reply += f"Período: {result['periodo']}\n\n"
            reply += f"✅ Pago: {result['pago']}\n"
            reply += f"⏳ Pendente: {result['pendente']}\n"
            reply += f"💰 Arrecadado: R$ {result['valorArrecadado']}"
        
        elif intent == 'apartamento':
            numero = extract_number(message)
            if not numero:
                reply = 'Informe o número do apartamento'
            else:
                try:
                    apt = api.get_apartamento(CONDOMINIO_ID, numero, ano, mes)
                    
                    reply = f"🏠 Apt {apt['numero']}\n"
                    reply += f"👤 {apt['proprietario']}\n"
                    reply += f"Status: {apt['status'].upper()}"
                except:
                    reply = f"Apartamento {numero} não encontrado"
        
        elif intent == 'salao':
            result = api.get_salao_reservas(CONDOMINIO_ID, mes, ano)
            
            if result['total'] == 0:
                reply = '📅 Sem reservas este mês'
            else:
                reply = f"📅 {result['total']} reserva(s):\n\n"
                for res in result['data']:
                    date = datetime.fromisoformat(res['data'])
                    reply += f"• Dia {date.day} - Apt {res['apartamento']}\n"
        
        else:
            reply = 'Posso ajudar com:\n• Resumo do mês\n• Inadimplentes\n• Status de apartamento\n• Reservas do salão'
        
        return jsonify({'reply': reply, 'intent': intent})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=3001, debug=True)
```

---

## 🟦 Supabase Edge Functions

### Exemplo 1: Edge Function Básica

```typescript
// supabase/functions/chatbot-basic/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const API_URL = Deno.env.get('API_URL') || '';
const API_KEY = Deno.env.get('API_KEY') || '';
const CONDOMINIO_ID = Deno.env.get('CONDOMINIO_ID') || '';

async function fetchAPI(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${API_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  const response = await fetch(url.toString(), {
    headers: { 'x-api-key': API_KEY }
  });
  
  return await response.json();
}

serve(async (req) => {
  const { message } = await req.json();
  
  const now = new Date();
  const ano = now.getFullYear().toString();
  const mes = (now.getMonth() + 1).toString().padStart(2, '0');
  
  let reply = '';
  
  if (message.toLowerCase().includes('resumo')) {
    const data = await fetchAPI('/api/resumo', { 
      condominioId: CONDOMINIO_ID, 
      ano, 
      mes 
    });
    
    const info = data.data;
    reply = `📊 ${info.condominio}\n`;
    reply += `✅ Pago: ${info.pago}\n`;
    reply += `⏳ Pendente: ${info.pendente}\n`;
    reply += `💰 R$ ${info.valorArrecadado}`;
  } else {
    reply = 'Digite "resumo" para ver o resumo do mês';
  }
  
  return new Response(
    JSON.stringify({ reply }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

### Exemplo 2: Edge Function com Contexto

```typescript
// supabase/functions/chatbot-context/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const API_URL = Deno.env.get('API_URL') || '';
const API_KEY = Deno.env.get('API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface ChatContext {
  userId: string;
  condominioId: string;
  lastIntent?: string;
  lastApartamento?: string;
}

async function getContext(userId: string): Promise<ChatContext | null> {
  const { data } = await supabase
    .from('chat_context')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  return data;
}

async function saveContext(context: ChatContext) {
  await supabase
    .from('chat_context')
    .upsert({
      user_id: context.userId,
      condominio_id: context.condominioId,
      last_intent: context.lastIntent,
      last_apartamento: context.lastApartamento,
      updated_at: new Date().toISOString()
    });
}

async function fetchAPI(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${API_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  const response = await fetch(url.toString(), {
    headers: { 'x-api-key': API_KEY }
  });
  
  return await response.json();
}

serve(async (req) => {
  try {
    const { message, userId, condominioId } = await req.json();
    
    // Buscar contexto do usuário
    let context = await getContext(userId);
    if (!context) {
      context = { userId, condominioId };
    }
    
    const now = new Date();
    const ano = now.getFullYear().toString();
    const mes = (now.getMonth() + 1).toString().padStart(2, '0');
    
    let reply = '';
    let intent = '';
    
    const msg = message.toLowerCase();
    
    // Detectar intenção com contexto
    if (msg.includes('sim') || msg.includes('confirma')) {
      // Continuar com última intenção
      intent = context.lastIntent || 'help';
    } else if (msg.includes('inadimplente')) {
      intent = 'inadimplentes';
    } else if (msg.includes('resumo')) {
      intent = 'resumo';
    } else if (msg.includes('apartamento') || /\d+/.test(msg)) {
      intent = 'apartamento';
    } else {
      intent = 'help';
    }
    
    // Processar intenção
    switch (intent) {
      case 'inadimplentes': {
        const data = await fetchAPI('/api/inadimplentes', {
          condominioId: context.condominioId,
          ano,
          mes
        });
        
        if (data.total === 0) {
          reply = '🎉 Não há inadimplentes!';
        } else {
          reply = `📊 ${data.total} inadimplente(s):\n\n`;
          data.data.slice(0, 3).forEach((apt: any) => {
            reply += `• Apt ${apt.numero} - ${apt.proprietario}\n`;
          });
          
          if (data.total > 3) {
            reply += `\nDeseja ver mais? (sim/não)`;
          }
        }
        break;
      }
      
      case 'resumo': {
        const data = await fetchAPI('/api/resumo', {
          condominioId: context.condominioId,
          ano,
          mes
        });
        
        const info = data.data;
        reply = `📊 ${info.condominio}\n\n`;
        reply += `✅ Pago: ${info.pago}\n`;
        reply += `⏳ Pendente: ${info.pendente}\n`;
        reply += `💰 R$ ${info.valorArrecadado}\n\n`;
        reply += `Deseja ver os inadimplentes?`;
        break;
      }
      
      case 'apartamento': {
        const numero = message.match(/\d+/)?.[0];
        if (!numero) {
          reply = 'Qual apartamento deseja consultar?';
          break;
        }
        
        try {
          const data = await fetchAPI('/api/apartamento', {
            condominioId: context.condominioId,
            numero,
            ano,
            mes
          });
          
          const apt = data.data;
          reply = `🏠 Apt ${apt.numero}\n`;
          reply += `👤 ${apt.proprietario}\n`;
          reply += `Status: ${apt.status.toUpperCase()}`;
          
          context.lastApartamento = numero;
        } catch {
          reply = `Apartamento ${numero} não encontrado`;
        }
        break;
      }
      
      default:
        reply = 'Como posso ajudar?\n';
        reply += '• Resumo do mês\n';
        reply += '• Inadimplentes\n';
        reply += '• Status do apartamento';
    }
    
    // Salvar contexto
    context.lastIntent = intent;
    await saveContext(context);
    
    return new Response(
      JSON.stringify({ reply, intent }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## 🔔 Webhooks e Notificações

### Exemplo 1: Webhook para Novos Pagamentos

```javascript
// webhook-pagamentos.js
const express = require('express');
const CondominioAPI = require('./api-client');
require('dotenv').config();

const app = express();
app.use(express.json());

const api = new CondominioAPI(
  process.env.API_URL,
  process.env.API_KEY
);

// Webhook que recebe notificação de novo pagamento
app.post('/webhook/pagamento', async (req, res) => {
  try {
    const { apartamentoId, condominioId, ano, mes } = req.body;
    
    // Buscar dados do apartamento
    const aptData = await api.getApartamento(condominioId, apartamentoId, ano, mes);
    
    // Enviar notificação (exemplo com Telegram)
    await sendTelegramNotification(
      `✅ Novo pagamento!\n` +
      `Apt ${aptData.numero} - ${aptData.proprietario}\n` +
      `Valor: R$ ${aptData.valor}`
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function sendTelegramNotification(message) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message
    })
  });
}

app.listen(3002, () => {
  console.log('🔔 Webhook rodando na porta 3002');
});
```

### Exemplo 2: Notificação Diária de Inadimplentes

```javascript
// cron-inadimplentes.js
const cron = require('node-cron');
const CondominioAPI = require('./api-client');
require('dotenv').config();

const api = new CondominioAPI(
  process.env.API_URL,
  process.env.API_KEY
);

const CONDOMINIO_ID = process.env.CONDOMINIO_ID;

// Executar todo dia às 9h
cron.schedule('0 9 * * *', async () => {
  console.log('🔄 Verificando inadimplentes...');
  
  const now = new Date();
  const ano = now.getFullYear().toString();
  const mes = (now.getMonth() + 1).toString().padStart(2, '0');
  
  try {
    const data = await api.getInadimplentes(CONDOMINIO_ID, ano, mes);
    
    if (data.total > 0) {
      let message = `⚠️ Relatório Diário - ${data.periodo}\n\n`;
      message += `Total de inadimplentes: ${data.total}\n\n`;
      
      data.data.slice(0, 10).forEach(apt => {
        message += `• Apt ${apt.numero} - ${apt.proprietario}\n`;
      });
      
      // Enviar por email, Telegram, WhatsApp, etc
      await sendNotification(message);
      
      console.log(`✅ Notificação enviada: ${data.total} inadimplentes`);
    } else {
      console.log('✅ Sem inadimplentes hoje!');
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  }
});

async function sendNotification(message) {
  // Implementar envio (email, Telegram, etc)
  console.log(message);
}

console.log('⏰ Cron job iniciado - Verificação diária às 9h');
```

---

## 🧪 Testes

### Exemplo: Testes com Jest

```javascript
// api-client.test.js
const CondominioAPI = require('./api-client');

describe('CondominioAPI', () => {
  let api;
  
  beforeAll(() => {
    api = new CondominioAPI(
      process.env.API_URL,
      process.env.API_KEY
    );
  });
  
  test('deve listar condomínios', async () => {
    const data = await api.getCondominios();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
  
  test('deve buscar dashboard', async () => {
    const data = await api.getDashboard('cond123', '2026', '02');
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('pago');
    expect(data.data).toHaveProperty('pendente');
  });
  
  test('deve buscar inadimplentes', async () => {
    const data = await api.getInadimplentes('cond123', '2026', '02');
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('total');
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

---

**Versão**: 1.0.0  
**Data**: 05/02/2026  
**Sistema**: Gestão Condominial v131
