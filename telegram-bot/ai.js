/**
 * ai.js — Integração com OpenRouter (IA)
 * Interpreta mensagens em linguagem natural
 */
const axios = require('axios');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'meta-llama/llama-3.1-8b-instruct:free'; // Modelo gratuito e rápido

const SYSTEM_PROMPT = `Você é um assistente de gestão condominial. 
Analise a mensagem do usuário e retorne um JSON com a intenção detectada.

Condomínios disponíveis: VAC (Vacaria), AYR (Ayres), VID (Vidal), TAR (Taroni), DES (Destri), SPE (Speranza)
Formato de unidade: COND-BLOCO-APT (ex: DES-01-101) ou casa: DES-27-C01

Retorne APENAS um JSON válido, sem texto adicional:
{
  "intent": "consultar|baixar|baixartodos|pendentes|condominio|bloco|apto|planilha|salao|reservar|historico|ajuda|mensagem|desconhecido",
  "codigo": "DES-01-101 ou null",
  "condominio": "DES ou null",
  "bloco": "DES-01 ou null",
  "periodo": "03/2026 ou null",
  "data": "27/04/2026 ou null",
  "texto": "mensagem original ou null",
  "resposta": "resposta amigável se intent=desconhecido, senão null"
}

Exemplos:
- "quero ver o destri" → intent: condominio, condominio: DES
- "baixa o 101 do bloco 1 do destri" → intent: baixar, codigo: DES-01-101
- "quem está devendo no vacaria" → intent: pendentes, condominio: VAC
- "reservar salão dia 25 de maio" → intent: reservar, data: 25/05/2026
- "gera planilha do speranza" → intent: planilha, condominio: SPE
- "meu pagamento" → intent: consultar
- "oi tudo bem" → intent: desconhecido, resposta: "Olá! Use /ajuda para ver os comandos disponíveis."`;

/**
 * Interpreta mensagem com IA e retorna intenção estruturada
 */
async function interpretarMensagem(texto) {
  if (!OPENROUTER_API_KEY) return null;

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: texto }
        ],
        max_tokens: 200,
        temperature: 0.1
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://chatcondominios-bot.onrender.com',
          'X-Title': 'Bot Condomínio'
        },
        timeout: 8000
      }
    );

    const content = response.data.choices[0]?.message?.content?.trim();
    if (!content) return null;

    // Extrair JSON da resposta
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('IA erro:', err.message);
    return null; // Fallback para regex se IA falhar
  }
}

module.exports = { interpretarMensagem };
