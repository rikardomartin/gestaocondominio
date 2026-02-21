# 🤖 Integração Chatbot Supabase com Sistema Condominial

## 📋 Resumo

Para conectar seu chatbot (Supabase) ao sistema de gestão condominial (Firebase), você precisa:

1. **API REST** - Servidor Node.js que acessa o Firebase
2. **Deploy Gratuito** - Vercel, Railway ou Render
3. **Integração Supabase** - Edge Functions chamando a API

## 🎯 APIs Necessárias para o Chatbot

### 1. **Dashboard** - Visão geral do mês
```
GET /api/dashboard?condominioId=X&ano=2026&mes=02
```
**Retorna**: Total pago, pendente, reciclado, acordo, percentual

**Uso no chatbot**: "Mostre o resumo do mês", "Como está o condomínio?"

---

### 2. **Inadimplentes** - Lista de quem não pagou
```
GET /api/inadimplentes?condominioId=X&ano=2026&mes=02
```
**Retorna**: Lista com número, proprietário, bloco

**Uso no chatbot**: "Quantos inadimplentes?", "Quem não pagou?"

---

### 3. **Apartamento Específico** - Status de uma unidade
```
GET /api/apartamento?condominioId=X&numero=101&ano=2026&mes=02
```
**Retorna**: Status, valor, observação, proprietário

**Uso no chatbot**: "Status do 101", "O apartamento 205 pagou?"

---

### 4. **Salão de Festas** - Reservas
```
GET /api/salao/reservas?condominioId=X&mes=02&ano=2026
```
**Retorna**: Lista de reservas com data, apartamento, status

**Uso no chatbot**: "Quem reservou o salão?", "Salão disponível dia 15?"

---

### 5. **Resumo Geral** - Informações completas
```
GET /api/resumo?condominioId=X&ano=2026&mes=02
```
**Retorna**: Nome condomínio, totais, valor arrecadado, percentual

**Uso no chatbot**: "Relatório completo", "Quanto arrecadamos?"

---

### 6. **Listar Condomínios** - Para seleção
```
GET /api/condominios
```
**Retorna**: Lista de todos os condomínios

**Uso no chatbot**: "Quais condomínios?", Seleção inicial

---

## 🚀 Passo a Passo

### Passo 1: Deploy da API

#### Opção A: Vercel (Mais Fácil)
```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Fazer login
vercel login

# 3. Deploy
cd api-chatbot
vercel

# 4. Anotar a URL: https://seu-projeto.vercel.app
```

#### Opção B: Railway
1. Acesse https://railway.app
2. New Project > Deploy from GitHub
3. Selecione o repositório
4. Adicione variável `API_KEY` nas configurações
5. Deploy automático

### Passo 2: Obter Service Account do Firebase

1. Acesse: https://console.firebase.google.com/project/gestaodoscondominios/settings/serviceaccounts/adminsdk
2. Clique em **"Gerar nova chave privada"**
3. Baixe o arquivo JSON
4. Cole o conteúdo no `server.js` (variável `serviceAccount`)

### Passo 3: Configurar API Key

Crie uma chave secreta forte:
```bash
# Gerar chave aleatória
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Adicione no `.env` ou nas variáveis de ambiente do Vercel/Railway:
```
API_KEY=sua-chave-gerada-aqui
```

### Passo 4: Criar Edge Function no Supabase

No Supabase, crie uma Edge Function:

```typescript
// supabase/functions/chatbot/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const API_URL = 'https://sua-api.vercel.app';
const API_KEY = Deno.env.get('API_KEY') || '';
const CONDOMINIO_ID = 'seu-condominio-id'; // Pegar da lista

interface ChatMessage {
  message: string;
  userId: string;
}

serve(async (req) => {
  try {
    const { message, userId }: ChatMessage = await req.json();
    const messageLower = message.toLowerCase();
    
    // Detectar intenção do usuário
    let reply = '';
    
    // 1. Inadimplentes
    if (messageLower.includes('inadimplente') || messageLower.includes('não pagou')) {
      const response = await fetch(
        `${API_URL}/api/inadimplentes?condominioId=${CONDOMINIO_ID}&ano=2026&mes=02`,
        { headers: { 'x-api-key': API_KEY } }
      );
      const data = await response.json();
      
      if (data.total === 0) {
        reply = '🎉 Ótima notícia! Não há inadimplentes este mês.';
      } else {
        reply = `📊 Existem ${data.total} apartamento(s) inadimplente(s) em ${data.periodo}:\n\n`;
        data.data.slice(0, 5).forEach((apt: any) => {
          reply += `• Apt ${apt.numero} - ${apt.proprietario}\n`;
        });
        if (data.total > 5) {
          reply += `\n... e mais ${data.total - 5} apartamento(s).`;
        }
      }
    }
    
    // 2. Dashboard/Resumo
    else if (messageLower.includes('resumo') || messageLower.includes('dashboard')) {
      const response = await fetch(
        `${API_URL}/api/resumo?condominioId=${CONDOMINIO_ID}&ano=2026&mes=02`,
        { headers: { 'x-api-key': API_KEY } }
      );
      const data = await response.json();
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
    }
    
    // 3. Status de apartamento específico
    else if (messageLower.includes('status') || messageLower.includes('apartamento')) {
      // Extrair número do apartamento
      const match = message.match(/\d+/);
      if (match) {
        const numero = match[0];
        const response = await fetch(
          `${API_URL}/api/apartamento?condominioId=${CONDOMINIO_ID}&numero=${numero}&ano=2026&mes=02`,
          { headers: { 'x-api-key': API_KEY } }
        );
        
        if (response.ok) {
          const data = await response.json();
          const apt = data.data;
          
          const statusEmoji = {
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
        } else {
          reply = `❌ Apartamento ${numero} não encontrado.`;
        }
      } else {
        reply = '❓ Por favor, informe o número do apartamento. Ex: "Status do 101"';
      }
    }
    
    // 4. Salão de festas
    else if (messageLower.includes('salão') || messageLower.includes('salao') || messageLower.includes('reserva')) {
      const response = await fetch(
        `${API_URL}/api/salao/reservas?condominioId=${CONDOMINIO_ID}&mes=02&ano=2026`,
        { headers: { 'x-api-key': API_KEY } }
      );
      const data = await response.json();
      
      if (data.total === 0) {
        reply = '📅 Não há reservas do salão para este mês.';
      } else {
        reply = `📅 Reservas do Salão (${data.total}):\n\n`;
        data.data.forEach((res: any) => {
          const date = new Date(res.data);
          const dia = date.getDate();
          const statusEmoji = res.status === 'paid' ? '✅' : '⏳';
          reply += `${statusEmoji} Dia ${dia} - Apt ${res.apartamento}\n`;
        });
      }
    }
    
    // 5. Mensagem padrão
    else {
      reply = `👋 Olá! Sou o assistente do condomínio.\n\n`;
      reply += `Posso ajudar com:\n`;
      reply += `• "Resumo do mês"\n`;
      reply += `• "Quantos inadimplentes?"\n`;
      reply += `• "Status do apartamento 101"\n`;
      reply += `• "Reservas do salão"\n\n`;
      reply += `Como posso ajudar?`;
    }
    
    return new Response(
      JSON.stringify({ reply }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
```

### Passo 5: Deploy da Edge Function

```bash
# No Supabase CLI
supabase functions deploy chatbot

# Adicionar variável de ambiente
supabase secrets set API_KEY=sua-chave-secreta
```

### Passo 6: Testar

```bash
# Testar a Edge Function
curl -X POST https://seu-projeto.supabase.co/functions/v1/chatbot \
  -H "Content-Type: application/json" \
  -d '{"message": "Resumo do mês", "userId": "user123"}'
```

## 📊 Fluxo Completo

```
Usuário → Supabase Chatbot → Edge Function → API REST → Firebase → Resposta
```

1. Usuário envia mensagem no chat
2. Supabase Edge Function processa a mensagem
3. Edge Function chama a API REST (Vercel/Railway)
4. API REST consulta Firebase Firestore
5. Dados retornam para Edge Function
6. Edge Function formata resposta amigável
7. Usuário recebe resposta no chat

## 🔑 Informações Necessárias

Para configurar, você precisa:

1. **URL da API**: Após deploy (ex: https://seu-projeto.vercel.app)
2. **API Key**: Chave secreta gerada
3. **Condomínio ID**: ID do condomínio no Firebase
4. **Service Account**: JSON do Firebase Admin

## 🎯 Perguntas que o Chatbot Pode Responder

✅ "Quantos inadimplentes temos?"  
✅ "Qual o status do apartamento 101?"  
✅ "Mostre o resumo do mês"  
✅ "Quem reservou o salão?"  
✅ "Quanto arrecadamos este mês?"  
✅ "Lista de quem não pagou"  
✅ "O apartamento 205 está em dia?"  
✅ "Salão disponível dia 15?"  

## 🆘 Suporte

Se precisar de ajuda:
1. Verifique os logs da API
2. Teste os endpoints com curl
3. Verifique as variáveis de ambiente
4. Confirme que o Service Account está correto

---

**Versão**: 1.0.0  
**Data**: 04/02/2026
