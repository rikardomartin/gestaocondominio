# Configuração do Firebase

## 🚀 Configuração Inicial

### 1. Criar Projeto no Firebase
1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Criar projeto"
3. Nome do projeto: `condominio-management`
4. Ative o Google Analytics (opcional)

### 2. Configurar Authentication
1. No console do Firebase, vá para **Authentication**
2. Clique em **Começar**
3. Na aba **Sign-in method**, ative:
   - **E-mail/senha** ✅
4. Na aba **Settings**, configure:
   - Nome do projeto: "Gestão Condominial"
   - E-mail de suporte: seu@email.com

### 3. Configurar Firestore Database
1. No console do Firebase, vá para **Firestore Database**
2. Clique em **Criar banco de dados**
3. Escolha **Modo de produção**
4. Selecione a localização (ex: `southamerica-east1`)

### 4. Configurar Regras de Segurança
1. Na aba **Regras** do Firestore, cole o conteúdo do arquivo `firestore.rules`
2. Clique em **Publicar**

### 5. Obter Configuração do Projeto
1. No console do Firebase, vá para **Configurações do projeto** (ícone de engrenagem)
2. Na seção **Seus apps**, clique em **Web** (`</>`)
3. Registre o app com nome: "Gestão Condominial"
4. Copie a configuração `firebaseConfig`
5. Cole no arquivo `firebase-config.js`

## 🔧 Configuração do Código

### 1. Atualizar firebase-config.js
```javascript
const firebaseConfig = {
  apiKey: "sua-api-key-aqui",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### 2. Instalar Dependências (se usando npm)
```bash
npm install firebase
```

### 3. Configurar Usuários de Demonstração
Execute o script para criar usuários de teste:
```javascript
// No console do navegador ou Node.js
import { setupDemoUsers } from './setup-demo-users.js';
await setupDemoUsers();
```

## 👥 Usuários de Demonstração

Após executar o setup, os seguintes usuários estarão disponíveis:

### 🔑 Administrador
- **E-mail:** `admin@condominio.com`
- **Senha:** `123456`
- **Permissões:** Acesso total

### 👨‍💼 Operador  
- **E-mail:** `operador@condominio.com`
- **Senha:** `123456`
- **Permissões:** Registrar pagamentos e consultar

### 👁️ Visualização
- **E-mail:** `viewer@condominio.com`
- **Senha:** `123456`
- **Permissões:** Apenas leitura

## 🗄️ Estrutura do Banco de Dados

### Coleções Principais

#### `users` - Usuários do Sistema
```javascript
{
  name: "Nome do Usuário",
  email: "email@exemplo.com", 
  role: "admin|operator|viewer",
  active: true,
  createdAt: timestamp,
  createdBy: "uid_do_criador"
}
```

#### `condominios` - Condomínios
```javascript
{
  nome: "Condomínio Exemplo",
  endereco: "Rua Exemplo, 123",
  totalUnidades: 100,
  totalBlocos: 5,
  totalCasas: 10,
  active: true,
  createdAt: timestamp,
  createdBy: "uid_do_usuario"
}
```

#### `blocos` - Blocos dos Condomínios
```javascript
{
  nome: "Bloco A",
  condominioId: "id_do_condominio",
  apartamentos: 20,
  active: true,
  createdAt: timestamp
}
```

#### `apartamentos` - Apartamentos/Casas
```javascript
{
  numero: "101",
  proprietario: "Nome do Proprietário",
  blocoId: "id_do_bloco", 
  condominioId: "id_do_condominio",
  tipo: "apartamento|casa",
  active: true,
  createdAt: timestamp
}
```

#### `payments` - Pagamentos
```javascript
{
  apartamentoId: "id_do_apartamento",
  date: "2025-01", // YYYY-MM
  value: 285.50,
  type: "condominio|salao",
  registeredBy: "Nome do Operador",
  createdAt: timestamp,
  createdBy: "uid_do_usuario"
}
```

#### `salaoReservations` - Reservas do Salão
```javascript
{
  condominioId: "id_do_condominio",
  apartamentoId: "id_do_apartamento", 
  date: "2025-01-15", // YYYY-MM-DD
  status: "reserved|paid",
  value: 150.00,
  createdAt: timestamp,
  createdBy: "uid_do_usuario"
}
```

## 🛡️ Regras de Segurança

### Hierarquia de Permissões
- **Admin:** Acesso total (CRUD em todas as coleções)
- **Operator:** Leitura geral + CRUD em pagamentos
- **Viewer:** Apenas leitura

### Validações Implementadas
- Usuários devem estar autenticados e ativos
- Campos obrigatórios validados
- Valores numéricos devem ser positivos
- Referências entre documentos verificadas
- Logs de auditoria automáticos

## 🔄 Sincronização em Tempo Real

O sistema usa listeners do Firestore para atualizações em tempo real:
- **Condomínios:** Atualização automática da lista
- **Pagamentos:** Sincronização instantânea entre usuários
- **Reservas:** Calendário sempre atualizado

## 📊 Monitoramento

### Firebase Console
- **Authentication:** Gerenciar usuários
- **Firestore:** Visualizar dados e consultas
- **Usage:** Monitorar cotas e custos

### Logs de Auditoria
Todas as operações são registradas com:
- Usuário responsável
- Timestamp da operação
- Dados alterados
- IP de origem (via Cloud Functions)

## 🚀 Deploy e Produção

### Configurações de Produção
1. Ativar **App Check** para segurança adicional
2. Configurar **Cloud Functions** para logs de auditoria
3. Implementar **Backup automático** do Firestore
4. Configurar **Alertas** de uso e segurança

### Domínio Personalizado
1. No Firebase Hosting, adicionar domínio customizado
2. Configurar SSL automático
3. Atualizar `authDomain` na configuração

### Otimizações
- Índices compostos para consultas complexas
- Cache de dados frequentes
- Paginação para listas grandes
- Compressão de imagens (se implementar upload)

## 💰 Custos Estimados

### Firebase Spark (Gratuito)
- **Firestore:** 50k leituras/dia, 20k escritas/dia
- **Authentication:** Usuários ilimitados
- **Hosting:** 10GB armazenamento, 10GB transferência

### Firebase Blaze (Pay-as-you-go)
- **Firestore:** $0.18/100k leituras, $0.18/100k escritas
- **Authentication:** Gratuito até 50k MAU
- **Hosting:** $0.026/GB armazenamento

Para um condomínio médio (500 unidades), o custo mensal estimado é de **$5-15 USD**.

## 🆘 Troubleshooting

### Erros Comuns
1. **Permission denied:** Verificar regras do Firestore
2. **User not found:** Executar setup de usuários demo
3. **Invalid API key:** Verificar configuração do projeto
4. **CORS errors:** Configurar domínios autorizados

### Suporte
- [Documentação Firebase](https://firebase.google.com/docs)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)
- [Firebase Support](https://firebase.google.com/support)