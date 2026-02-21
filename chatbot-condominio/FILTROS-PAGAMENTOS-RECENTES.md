# Sistema de Filtros e Pagamentos Recentes - v4.0.0

## ✅ IMPLEMENTADO

### 1. Sistema de Filtros Completo
**Localização**: Botão "🔍 Filtros" na barra de ações rápidas

**Funcionalidades**:
- ✅ Seletor de **Ano** (2024, 2025, 2026)
- ✅ Seletor de **Mês** (Janeiro a Dezembro)
- ✅ Seletor de **Condomínio** (carrega todos os condomínios ativos)
- ✅ Seletor de **Bloco** (carrega blocos do condomínio selecionado)
- ✅ Seletor de **Apartamento** (carrega apartamentos do bloco selecionado)

**Perguntas Rápidas Geradas Automaticamente**:
- 📊 Resumo de [Mês]/[Ano]
- ⏳ Inadimplentes de [Mês]/[Ano]
- 🏠 Status do apartamento [Número] (se apartamento selecionado)
- 💰 Valor do apartamento [Número] em [Mês] (se apartamento selecionado)
- 🏗️ Resumo do [Bloco] (se bloco selecionado)
- 📅 Reservas do salão em [Mês]

### 2. Pagamentos de Hoje e Ontem
**Palavras-chave**: "hoje", "ontem", "recente"

**Funcionalidade**:
- Busca todos os pagamentos do condomínio
- Filtra por data de modificação (updatedAt ou createdAt)
- Separa em duas listas: HOJE e ONTEM
- Mostra até 10 pagamentos de cada dia
- Exibe: hora, apartamento, status, valor, quem modificou

**Exemplo de Resposta**:
```
📋 Pagamentos Recentes
🏢 Condomínio Vacaria

📅 HOJE (5)
✅ 14:30 - Apt 101
   PAGO • R$ 285.00
   Por: admin@condominio.com
⏳ 13:15 - Apt 202
   PENDENTE • R$ 285.00

📅 ONTEM (8)
✅ 16:45 - Apt 303
   PAGO • R$ 285.00
♻️ 15:20 - Apt 404
   RECICLADO • R$ 285.00
```

### 3. Botão de Ação Rápida
**Novo botão**: "🕐 Hoje" (primeiro botão da barra)

## 🎨 DESIGN

### Painel de Filtros
- Modal fullscreen com fundo escuro (overlay)
- Conteúdo centralizado com max-width 400px
- Header verde (#005c4b) com título e botão fechar
- Selects com estilo WhatsApp (fundo #2a3942)
- Perguntas rápidas em cards clicáveis
- Animações suaves de abertura/fechamento

### Cores WhatsApp
- Background: #0b141a
- Cards: #202c33
- Inputs: #2a3942
- Hover: #374045
- Accent: #005c4b
- Success: #25d366

## 📝 COMO USAR

### Filtros
1. Clique em "🔍 Filtros"
2. Selecione ano, mês, condomínio, bloco, apartamento
3. Veja as perguntas rápidas geradas automaticamente
4. Clique em uma pergunta para enviar

### Pagamentos Recentes
**Opção 1**: Clique no botão "🕐 Hoje"
**Opção 2**: Digite "hoje", "ontem" ou "recente"

## 🔧 FUNÇÕES JAVASCRIPT

### Filtros
- `showFilters()` - Abre o painel de filtros
- `hideFilters()` - Fecha o painel de filtros
- `loadCondominiosFilter()` - Carrega lista de condomínios
- `loadBlocosFilter()` - Carrega blocos do condomínio selecionado
- `loadApartamentosFilter()` - Carrega apartamentos do bloco selecionado
- `updateQuickQuestions()` - Gera perguntas baseadas nos filtros

### Pagamentos Recentes
- `getPagamentosRecentes()` - Busca pagamentos de hoje e ontem

## 📊 QUERIES FIRESTORE

### Filtros
```javascript
// Condomínios
query(collection(sistemaDb, 'condominios'), where('active', '==', true))

// Blocos
query(collection(sistemaDb, 'blocos'), 
  where('condominioId', '==', condominioId),
  where('active', '==', true))

// Apartamentos
query(collection(sistemaDb, 'apartamentos'),
  where('blocoId', '==', blocoId),
  where('active', '==', true))
```

### Pagamentos Recentes
```javascript
// Busca todos os pagamentos do condomínio
query(collection(sistemaDb, 'payments'),
  where('condominioId', '==', CONDOMINIO_ID))

// Filtra no cliente por updatedAt/createdAt
```

## 🚀 DEPLOY

```bash
cd chatbot-condominio
firebase deploy --only hosting
```

**URL**: https://chatbotcond.web.app

## 📌 VERSÃO

**v4.0.0** - Sistema de Filtros e Pagamentos Recentes

## 🎯 PRÓXIMOS PASSOS (OPCIONAL)

1. Adicionar filtro de status (pago, pendente, etc)
2. Exportar resultados filtrados
3. Gráficos de pagamentos por dia
4. Notificações de novos pagamentos
5. Histórico de alterações de status
