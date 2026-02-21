# Configuração Local do Projeto

Este guia explica como configurar o projeto localmente após clonar do GitHub.

## 🔐 Credenciais Firebase (OBRIGATÓRIO)

As credenciais Firebase foram removidas do repositório por segurança. Você precisa configurá-las localmente.

### 1. Obter Credenciais Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Selecione o projeto `gestaodoscondominios`
3. Vá em **Project Settings** (⚙️) > **Service Accounts**
4. Clique em **Generate New Private Key**
5. Salve o arquivo JSON na raiz do projeto

### 2. Configurar API do Chatbot

```bash
cd api-chatbot
cp .env.example .env
```

Edite o arquivo `.env` e configure:

```env
# API Key para autenticação (crie uma chave forte)
API_KEY=sua-chave-secreta-forte-aqui

# Porta do servidor
PORT=3000

# Caminho para o arquivo de credenciais Firebase
FIREBASE_SERVICE_ACCOUNT_PATH=../gestaodoscondominios-firebase-adminsdk-fbsvc-XXXXX.json
```

### 3. Instalar Dependências

```bash
# API do Chatbot
cd api-chatbot
npm install

# Voltar para raiz
cd ..
```

## 🚀 Executar Localmente

### Sistema Principal

O sistema principal roda direto no Firebase Hosting. Para testar localmente:

```bash
firebase serve
```

Acesse: http://localhost:5000

### API do Chatbot

```bash
cd api-chatbot
npm start
```

Acesse: http://localhost:3000

## 📝 Estrutura de Arquivos Sensíveis

Estes arquivos NÃO devem ser commitados (já estão no .gitignore):

```
gestaocondominio/
├── gestaodoscondominios-firebase-adminsdk-*.json  ❌ NÃO COMMITAR
├── api-chatbot/
│   └── .env                                        ❌ NÃO COMMITAR
└── .firebase/                                      ❌ NÃO COMMITAR
```

## ⚠️ IMPORTANTE

1. **NUNCA** commite arquivos com credenciais
2. **SEMPRE** use `.env` para variáveis sensíveis
3. **SEMPRE** adicione arquivos sensíveis no `.gitignore`
4. **NUNCA** compartilhe a API Key publicamente

## 🔄 Sincronizar com Produção

Após configurar localmente, você pode fazer deploy:

```bash
# Sistema principal
firebase deploy --only hosting

# Chatbot
cd chatbot-condominio
firebase deploy
```

## 🆘 Problemas Comuns

### Erro: "Missing or insufficient permissions"

- Verifique se o arquivo de credenciais Firebase está correto
- Verifique se o caminho no `.env` está correto
- Verifique se a service account tem permissões no Firestore

### Erro: "API Key inválida"

- Verifique se a API_KEY no `.env` está configurada
- Verifique se está enviando o header `x-api-key` nas requisições

### Erro: "Cannot find module"

```bash
cd api-chatbot
npm install
```

## 📞 Suporte

Se tiver problemas, verifique:

1. Arquivo `.env` está configurado corretamente
2. Credenciais Firebase estão no lugar certo
3. Dependências foram instaladas (`npm install`)
4. Firebase CLI está instalado (`npm install -g firebase-tools`)
