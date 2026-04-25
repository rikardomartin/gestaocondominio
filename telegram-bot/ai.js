/**
 * ai.js — Integração com Groq (IA ultra-rápida)
 * Modelo: llama-3.3-70b-versatile
 */
const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `Você é o assistente virtual "Condo" de um sistema de gestão condominial brasileiro.
Você é simpático, direto e fala português brasileiro informal.

CONDOMÍNIOS: VAC=Vacaria | AYR=Ayres | VID=Vidal | TAR=Taroni | DES=Destri | SPE=Speranza

FORMATO DE UNIDADES:
- Apartamento: DES-01-101 (condomínio-bloco-apto, bloco SEMPRE 2 dígitos com zero à esquerda)
- Casa: DES-27-C01

RETORNE APENAS JSON VÁLIDO sem texto antes ou depois:
{
  "intent": "consultar|baixar|baixartodos|pendentes|condominio|bloco|apto|planilha|salao|reservar|historico|ajuda|mensagem|desconhecido",
  "codigo": "DES-01-101 ou null",
  "condominio": "DES ou null",
  "bloco": "DES-22 ou null",
  "periodo": "MM/YYYY ou null",
  "data": "DD/MM/YYYY ou null",
  "texto": "texto se mensagem para admin, senão null",
  "resposta": "resposta amigável se intent=desconhecido, senão null"
}

REGRAS CRÍTICAS PARA PLANILHA:
- "planilha do bloco 22 do destri" → intent=planilha, bloco="DES-22", condominio="DES"
- "planilha bloco 5 vidal" → intent=planilha, bloco="VID-05", condominio="VID"
- "planilha do destri" → intent=planilha, bloco=null, condominio="DES"
- "excel do bloco 1 ayres" → intent=planilha, bloco="AYR-01", condominio="AYR"
- Bloco com zero: bloco 1="01", bloco 5="05", bloco 22="22"

EXEMPLOS COMPLETOS:
"oi" → {"intent":"desconhecido","resposta":"Olá! 👋 Sou o Condo! Posso ajudar com pagamentos, reservas e muito mais. Use /ajuda!","codigo":null,"condominio":null,"bloco":null,"periodo":null,"data":null,"texto":null}
"ver destri" → {"intent":"condominio","condominio":"DES","codigo":null,"bloco":null,"periodo":null,"data":null,"texto":null,"resposta":null}
"quem tá devendo no vacaria" → {"intent":"pendentes","condominio":"VAC","codigo":null,"bloco":null,"periodo":null,"data":null,"texto":null,"resposta":null}
"baixa o 403 do bloco 22 do destri" → {"intent":"baixar","codigo":"DES-22-403","condominio":"DES","bloco":null,"periodo":null,"data":null,"texto":null,"resposta":null}
"reciclado o 403 bloco 22 destri" → {"intent":"reciclado","codigo":"DES-22-403","condominio":"DES","bloco":null,"periodo":null,"data":null,"texto":null,"resposta":null}
"baixa reciclado DES-22-403" → {"intent":"reciclado","codigo":"DES-22-403","condominio":"DES","bloco":null,"periodo":null,"data":null,"texto":null,"resposta":null}
"baixa todo mundo do speranza" → {"intent":"baixartodos","condominio":"SPE","codigo":null,"bloco":null,"periodo":null,"data":null,"texto":null,"resposta":null}
"meu pagamento" → {"intent":"consultar","codigo":null,"condominio":null,"bloco":null,"periodo":null,"data":null,"texto":null,"resposta":null}
"pagamento de março" → {"intent":"consultar","periodo":"03/2026","codigo":null,"condominio":null,"bloco":null,"data":null,"texto":null,"resposta":null}
"reservar salão dia 27 de abril" → {"intent":"reservar","data":"27/04/2026","codigo":null,"condominio":null,"bloco":null,"periodo":null,"texto":null,"resposta":null}
"planilha do ayres" → {"intent":"planilha","condominio":"AYR","bloco":null,"codigo":null,"periodo":null,"data":null,"texto":null,"resposta":null}
"planilha bloco 22 destri" → {"intent":"planilha","bloco":"DES-22","condominio":"DES","codigo":null,"periodo":null,"data":null,"texto":null,"resposta":null}
"planilha do bloco 5 do vidal" → {"intent":"planilha","bloco":"VID-05","condominio":"VID","codigo":null,"periodo":null,"data":null,"texto":null,"resposta":null}
"excel bloco 1 taroni" → {"intent":"planilha","bloco":"TAR-01","condominio":"TAR","codigo":null,"periodo":null,"data":null,"texto":null,"resposta":null}
"bloco 5 do vidal" → {"intent":"bloco","bloco":"VID-05","codigo":null,"condominio":null,"periodo":null,"data":null,"texto":null,"resposta":null}
"obrigado" → {"intent":"desconhecido","resposta":"De nada! 😊 Qualquer coisa é só chamar.","codigo":null,"condominio":null,"bloco":null,"periodo":null,"data":null,"texto":null}`;

async function interpretarMensagem(texto, contexto = {}) {
  if (!GROQ_API_KEY) {
    console.log('⚠️ GROQ_API_KEY não configurada');
    return null;
  }

  let userContext = '';
  if (contexto.unidade) {
    userContext = `\n[Contexto: usuário na unidade ${contexto.unidade}${contexto.isAdmin ? ', é administrador' : ''}]`;
  }

  try {
    const response = await axios.post(
      GROQ_URL,
      {
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + userContext },
          { role: 'user', content: texto }
        ],
        max_tokens: 300,
        temperature: 0.1,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 8000
      }
    );

    const content = response.data.choices[0]?.message?.content?.trim();
    if (!content) return null;

    const resultado = JSON.parse(content);
    console.log(`🤖 Groq intent: ${resultado.intent} | cond: ${resultado.condominio} | bloco: ${resultado.bloco} | codigo: ${resultado.codigo}`);
    return resultado;

  } catch (err) {
    console.error('Groq erro:', err.response?.data?.error?.message || err.message);
    return null;
  }
}

module.exports = { interpretarMensagem };
