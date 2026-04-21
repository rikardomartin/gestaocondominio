/**
 * ai.js — Integração com OpenRouter (IA)
 * Interpreta mensagens em linguagem natural
 */
const axios = require('axios');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'meta-llama/llama-3.1-8b-instruct:free';

const SYSTEM_PROMPT = `Você é o assistente virtual de um sistema de gestão condominial brasileiro.
Seu nome é "Condo" e você é simpático, direto e fala português brasileiro informal.

CONDOMÍNIOS DISPONÍVEIS:
- VAC = Vacaria
- AYR = Ayres  
- VID = Vidal
- TAR = Taroni
- DES = Destri
- SPE = Speranza

FORMATO DE UNIDADES:
- Apartamento: DES-01-101 (condomínio-bloco-apto)
- Casa: DES-27-C01

REGRAS:
1. Analise a mensagem e retorne APENAS um JSON válido
2. Seja inteligente: "bloco 1 do destri" = DES-01, "apto 101 do bloco 5 do vacaria" = VAC-05-101
3. Datas: "dia 25 de maio" = 25/05/2026, "próxima sexta" = calcule, "27/04" = 27/04/2026
4. Nomes por extenso: "vacaria" = VAC, "destri" = DES, "speranza" = SPE, "ayres" = AYR, "vidal" = VID, "taroni" = TAR
5. Para intent=desconhecido, responda de forma amigável e sugira o que o usuário pode fazer

JSON de resposta:
{
  "intent": "consultar|baixar|baixartodos|pendentes|condominio|bloco|apto|planilha|salao|reservar|historico|ajuda|mensagem|desconhecido",
  "codigo": "DES-01-101 ou null",
  "condominio": "DES ou null",
  "bloco": "DES-01 ou null", 
  "periodo": "MM/YYYY ou null",
  "data": "DD/MM/YYYY ou null",
  "texto": "texto da mensagem se for mensagem para admin, senão null",
  "resposta": "resposta amigável e natural se intent=desconhecido, senão null"
}

EXEMPLOS DE INTERPRETAÇÃO:
"ver destri" → {intent:"condominio", condominio:"DES"}
"quem tá devendo no vacaria" → {intent:"pendentes", condominio:"VAC"}
"baixa o 403 do bloco 22 do destri" → {intent:"baixar", codigo:"DES-22-403"}
"baixa todo mundo do speranza" → {intent:"baixartodos", condominio:"SPE"}
"meu pagamento" → {intent:"consultar"}
"pagamento de março" → {intent:"consultar", periodo:"03/2026"}
"reservar salão dia 27 de abril" → {intent:"reservar", data:"27/04/2026"}
"tem alguém no salão no dia 10?" → {intent:"salao", data:"10/05/2026"}
"planilha do ayres" → {intent:"planilha", condominio:"AYR"}
"bloco 5 do vidal" → {intent:"bloco", bloco:"VID-05"}
"apto 204 bloco 3 taroni" → {intent:"apto", codigo:"TAR-03-204"}
"oi" → {intent:"desconhecido", resposta:"Olá! 👋 Sou o assistente do condomínio. Posso te ajudar com pagamentos, reservas do salão e muito mais. Use /ajuda para ver tudo que posso fazer!"}
"obrigado" → {intent:"desconhecido", resposta:"De nada! 😊 Se precisar de mais alguma coisa é só chamar."}`;

/**
 * Interpreta mensagem com IA
 */
async function interpretarMensagem(texto, contexto = {}) {
  if (!OPENROUTER_API_KEY) return null;

  try {
    // Adicionar contexto do usuário ao prompt se disponível
    let userContext = '';
    if (contexto.unidade) userContext = `\nContexto: usuário está na unidade ${contexto.unidade}`;
    if (contexto.isAdmin) userContext += ', é administrador';

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + userContext },
          { role: 'user', content: texto }
        ],
        max_tokens: 300,
        temperature: 0.2
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://chatcondominios-bot.onrender.com',
          'X-Title': 'Bot Condomínio'
        },
        timeout: 10000
      }
    );

    const content = response.data.choices[0]?.message?.content?.trim();
    if (!content) return null;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('IA erro:', err.message);
    return null;
  }
}

/**
 * Gera resposta conversacional para o morador
 */
async function gerarRespostaMorador(pergunta, dados) {
  if (!OPENROUTER_API_KEY) return null;

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `Você é o assistente "Condo" de um condomínio. 
Responda de forma amigável, curta e em português brasileiro informal.
Use emojis com moderação. Seja direto e útil.
Dados do sistema: ${JSON.stringify(dados)}`
          },
          { role: 'user', content: pergunta }
        ],
        max_tokens: 200,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://chatcondominios-bot.onrender.com',
          'X-Title': 'Bot Condomínio'
        },
        timeout: 10000
      }
    );

    return response.data.choices[0]?.message?.content?.trim() || null;
  } catch (err) {
    return null;
  }
}

module.exports = { interpretarMensagem, gerarRespostaMorador };
