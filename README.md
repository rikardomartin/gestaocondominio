# Sistema de Gestão de Condomínios

Sistema completo para gestão de condomínios com controle de pagamentos, reservas de salão e chatbot integrado.

## 🚀 Versão Atual

- **Sistema Principal**: v131
- **Chatbot**: v3.0.0 (WhatsApp + PWA)

## 📋 Funcionalidades

- Gestão de múltiplos condomínios
- Controle de pagamentos mensais
- Sistema de reservas de salão
- Chatbot integrado (WhatsApp + PWA)
- Painel administrativo completo
- Relatórios e dashboards
- Sistema de notificações

## 🔧 Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Firebase (Firestore, Hosting, Authentication)
- **API Chatbot**: Node.js + Express
- **Banco de Dados**: Firebase Firestore

## 📦 Estrutura do Projeto

```
gestaocondominio/
├── api-chatbot/          # API REST para integração com chatbot
├── chatbot-condominio/   # PWA do chatbot
├── app.js                # Aplicação principal
├── firebase-*.js         # Módulos Firebase
├── styles.css            # Estilos globais
└── index.html            # Página principal
```

## 🛠️ Configuração

### 1. Pré-requisitos

- Node.js 16+ (para API do chatbot)
- Firebase CLI (`npm install -g firebase-tools`)
- Conta Firebase configurada

### 2. Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative Firestore Database
3. Ative Authentication (Email/Password)
4. Ative Hosting

### 3. Configuração da API do Chatbot

```bash
cd api-chatbot
npm install
```

Crie o arquivo `.env` baseado no `.env.example`:

```env
API_KEY=sua-chave-secreta-forte
PORT=3000
FIREBASE_SERVICE_ACCOUNT_PATH=../seu-arquivo-firebase-adminsdk.json
```

**IMPORTANTE**: Nunca commite o arquivo `.env` ou credenciais Firebase!

### 4. Credenciais Firebase

1. No Firebase Console, vá em Project Settings > Service Accounts
2. Clique em "Generate New Private Key"
3. Salve o arquivo JSON na raiz do projeto
4. Configure o caminho no `.env` da API

## 🚀 Deploy

### Sistema Principal

```bash
firebase deploy --only hosting
```

### Chatbot

```bash
cd chatbot-condominio
firebase deploy
```

### API do Chatbot

A API deve ser hospedada em um servidor Node.js (Heroku, Railway, etc.)

## 🔐 Segurança

### Arquivos Sensíveis (NÃO COMMITAR)

- `*-firebase-adminsdk-*.json` - Credenciais Firebase
- `.env` - Variáveis de ambiente
- `node_modules/` - Dependências

Estes arquivos já estão no `.gitignore`.

## 👥 Usuários Padrão

### Admin Principal
- Email: admin@condominio.com
- Senha: a10b20c30@

### Admin Secundário
- Email: admin2@condominio.com
- Senha: a10b20c30@

**IMPORTANTE**: Altere as senhas após o primeiro acesso!

## 🌐 URLs de Produção

- **Sistema**: https://gestaodoscondominios.web.app
- **Chatbot**: https://chatbotcond.web.app

## 📚 Documentação Adicional

- [API Documentation](API-DOCUMENTATION.md)
- [API Examples](API-EXAMPLES.md)
- [Chatbot Integration](CHATBOT-INTEGRACAO.md)
- [Como Iniciar o Sistema](COMO-INICIAR-SISTEMA.md)

## 🐛 Troubleshooting

### Cache do Navegador

Se as atualizações não aparecerem:

1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Abra em modo anônimo
3. Force refresh (Ctrl+F5)

### Problemas com Casas

As casas devem estar na collection `apartamentos` com `tipo: 'casa'` e aparecer em seção separada "Casas do Condomínio".

## 📝 Estrutura de Condomínios

Consulte o arquivo [condominio.md](condominio.md) para detalhes sobre a estrutura de cada condomínio.

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é privado e proprietário.

## 📞 Suporte

Para suporte, entre em contato com o administrador do sistema.
