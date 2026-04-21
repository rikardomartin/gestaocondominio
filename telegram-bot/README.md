# 🤖 Bot Telegram — Gestão de Condomínios

Bot Telegram integrado ao Firebase para gestão de 6 condomínios com 2.200+ unidades.

## 🚀 Instalação

```bash
cd telegram-bot
npm install
cp .env.example .env
# Editar .env com suas credenciais
npm start
```

## ⚙️ Configuração (.env)

```env
TELEGRAM_BOT_TOKEN=seu-token-do-botfather
ADMIN_IDS=123456789,987654321
FIREBASE_SERVICE_ACCOUNT_PATH=../gestaodoscondominios-firebase-adminsdk-fbsvc-XXXXX.json
```

### Como obter o Token do Bot
1. Abra o Telegram e procure por `@BotFather`
2. Envie `/newbot`
3. Siga as instruções e copie o token

### Como obter seu Telegram ID
1. Procure por `@userinfobot` no Telegram
2. Envie qualquer mensagem
3. Ele retorna seu ID

## 📋 Comandos

### Moradores
| Comando | Descrição |
|---------|-----------|
| `/start` | Cadastrar unidade |
| `/consultar` | Ver status do pagamento atual |
| `/historico` | Ver últimos 6 meses |
| 📎 Enviar foto/PDF | Enviar comprovante |

### Administradores
| Comando | Descrição |
|---------|-----------|
| `/apto DES-01-101` | Consultar unidade específica |
| `/bloco DES-01` | Consultar bloco completo |
| `/condominio DES` | Resumo do condomínio |
| `/pendentes DES` | Listar inadimplentes |
| `/baixar DES-01-101` | Dar baixa no pagamento |
| `/planilha DES` | Gerar planilha Excel |

## 🏷️ Códigos dos Condomínios

| Código | Condomínio |
|--------|-----------|
| VAC | Vacaria |
| AYR | Ayres |
| VID | Vidal |
| TAR | Taroni |
| DES | Destri |
| SPE | Speranza |

## 🏠 Formato dos Códigos de Unidade

```
CONDOMÍNIO-BLOCO-UNIDADE

Apartamento: DES-01-101
Casa:        VID-20-C01
```

## 🧠 Linguagem Natural (Admin)

O bot entende comandos em texto livre:
- `baixar DES-01-101`
- `consultar bloco DES-01`
- `pendentes DES`
- `planilha VAC`
- `quem está devendo DES`

## 📁 Estrutura

```
telegram-bot/
├── bot.js          # Ponto de entrada, registro de handlers
├── handlers.js     # Lógica de cada comando
├── firebase.js     # Integração com Firestore
├── permissions.js  # Controle de acesso admin/morador
├── utils.js        # Helpers (Excel, formatação)
├── config.js       # Configurações e constantes
├── package.json
└── .env.example
```

## 🔐 Segurança

- Moradores só acessam a própria unidade
- Apenas admins podem dar baixa, gerar planilhas e consultar outros
- IDs de admin configurados via variável de ambiente
