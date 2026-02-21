# ✅ Chatbot com Dados Reais - Configurado!

## 🎯 O que foi feito

O chatbot agora está **conectado diretamente ao Firebase do sistema principal** e busca dados reais em tempo real!

### 🔥 Dual Firebase

O chatbot usa **2 projetos Firebase**:

1. **chatbotcond** - Para salvar mensagens do chat
2. **gestaodoscondominios** - Para buscar dados reais (pagamentos, apartamentos, etc)

### 📊 Dados Reais Disponíveis

✅ **Resumo do Mês** - Busca pagamentos reais do Firebase  
✅ **Inadimplentes** - Lista apartamentos com status pendente  
✅ **Status de Apartamento** - Consulta pagamento específico  
✅ **Reservas do Salão** - Lista reservas reais  
✅ **Listar Condomínios** - Mostra todos os condomínios ativos  

## 🚀 Como Usar

### 1. Deploy
```bash
cd chatbot-condominio
firebase deploy --only hosting
```

### 2. Acessar
```
https://chatbotcond.web.app
```

### 3. Testar

O chatbot vai **automaticamente**:
- Buscar o primeiro condomínio ativo
- Salvar no localStorage
- Usar esse condomínio para todas as consultas

## 💬 Perguntas que Funcionam

### Resumo Geral
- "Resumo do mês"
- "Dashboard"
- "Como está o condomínio?"

**Resposta**: Dados reais do mês atual (pago, pendente, valor arrecadado, etc)

### Inadimplentes
- "Quantos inadimplentes?"
- "Quem não pagou?"
- "Lista de pendentes"

**Resposta**: Lista real de apartamentos com status pendente

### Status de Apartamento
- "Status do 101"
- "O apartamento 205 pagou?"
- "Situação do 303"

**Resposta**: Status real do apartamento no mês atual

### Salão de Festas
- "Reservas do salão"
- "Quem reservou o salão?"
- "Salão disponível?"

**Resposta**: Lista real de reservas do mês

### Listar Condomínios
- "Listar condomínios"
- "Trocar condomínio"
- "Quais condomínios?"

**Resposta**: Lista todos os condomínios ativos

## 🔧 Configuração Avançada

### Trocar de Condomínio

No console do navegador (F12):
```javascript
// Ver condomínio atual
console.log(localStorage.getItem('condominioId'));
console.log(localStorage.getItem('condominioNome'));

// Trocar para outro condomínio
localStorage.setItem('condominioId', 'NOVO_ID_AQUI');
localStorage.setItem('condominioNome', 'Nome do Condomínio');

// Recarregar página
location.reload();
```

### Obter ID do Condomínio

1. Acesse: https://gestaodoscondominios.web.app
2. Faça login: admin@condominio.com / a10b20c30@
3. Abra console (F12)
4. Digite: `appState.selectedCondominio.id`
5. Copie o ID

## 🎨 Como Funciona

### Fluxo de Dados

```
Usuário → Chatbot → Firebase (gestaodoscondominios) → Dados Reais → Resposta
```

### Exemplo: "Resumo do mês"

1. Usuário digita "Resumo do mês"
2. Chatbot identifica a intenção
3. Busca no Firebase:
   - Collection: `payments`
   - Where: `condominioId == X`
   - Where: `date == 2026-02`
4. Processa os dados (conta pago, pendente, etc)
5. Formata resposta bonita
6. Mostra para o usuário

### Queries Reais Usadas

```javascript
// Resumo
query(
  collection(sistemaDb, 'payments'),
  where('condominioId', '==', CONDOMINIO_ID),
  where('date', '==', '2026-02')
)

// Inadimplentes
query(
  collection(sistemaDb, 'apartamentos'),
  where('condominioId', '==', CONDOMINIO_ID),
  where('active', '==', true)
)

// Status de Apartamento
query(
  collection(sistemaDb, 'apartamentos'),
  where('condominioId', '==', CONDOMINIO_ID),
  where('numero', '==', '101'),
  where('active', '==', true)
)

// Salão
query(
  collection(sistemaDb, 'salaoReservations'),
  where('condominioId', '==', CONDOMINIO_ID),
  where('date', '>=', '2026-02-01'),
  where('date', '<=', '2026-02-31')
)
```

## 🔐 Segurança

### Firestore Rules

O chatbot usa as **mesmas regras** do sistema principal:
- Leitura: Permitida (dados públicos do condomínio)
- Escrita: Apenas mensagens do chat (no projeto chatbotcond)

### API Keys

As API Keys estão no código, mas isso é **seguro** porque:
- Firebase usa regras de segurança no Firestore
- Não há operações sensíveis (apenas leitura)
- Dados são públicos para moradores

## 📊 Estrutura de Dados

### Sistema Principal (gestaodoscondominios)

**Collection: condominios**
```javascript
{
  nome: "Residencial Vidal",
  endereco: "Rua X, 123",
  active: true
}
```

**Collection: apartamentos**
```javascript
{
  condominioId: "cond123",
  numero: "101",
  proprietario: "João Silva",
  active: true
}
```

**Collection: payments**
```javascript
{
  condominioId: "cond123",
  apartamentoId: "apt123",
  ano: "2026",
  mes: "02",
  date: "2026-02",
  status: "pago", // ou "pendente", "reciclado", "acordo"
  value: 285.00,
  observacao: "Pago via PIX"
}
```

**Collection: salaoReservations**
```javascript
{
  condominioId: "cond123",
  apartamentoId: "apt123",
  apartamentoNumero: "101",
  date: "2026-02-15",
  status: "paid", // ou "reserved"
  value: 150.00
}
```

### Chatbot (chatbotcond)

**Collection: messages**
```javascript
{
  text: "Resumo do mês",
  sender: "user", // ou "bot"
  timestamp: Timestamp,
  condominioId: "cond123"
}
```

## 🎯 Próximos Passos

- [x] Conectar com dados reais
- [ ] Adicionar autenticação de usuários
- [ ] Implementar IA (OpenAI/Gemini)
- [ ] Adicionar gráficos visuais
- [ ] Notificações push
- [ ] Integração WhatsApp

## 🐛 Troubleshooting

### Erro: "Nenhum condomínio configurado"
**Solução**: Recarregue a página. O chatbot vai buscar automaticamente.

### Dados não aparecem
**Solução**: Verifique se há dados no sistema principal para o mês atual.

### Erro de permissão
**Solução**: Verifique as Firestore Rules do projeto gestaodoscondominios.

---

**Versão**: 2.0.0 (Dados Reais)  
**Data**: 04/02/2026  
**Status**: ✅ Funcionando com dados reais!
