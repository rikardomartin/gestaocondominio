# 🔔 Configuração de Notificações Push - Firebase Cloud Messaging

## Passo 1: Gerar Chave VAPID no Firebase Console

1. Acesse: https://console.firebase.google.com/
2. Selecione seu projeto: **gestaodoscondominios**
3. Vá em **Project Settings** (⚙️ no canto superior esquerdo)
4. Clique na aba **Cloud Messaging**
5. Role até **Web Push certificates**
6. Clique em **Generate key pair**
7. Copie a chave gerada (começa com `B...`)

## Passo 2: Atualizar a Chave VAPID no Código

Abra o arquivo `firebase-messaging.js` e substitua:

```javascript
const VAPID_KEY = 'BNxYourVapidKeyHere'; // ← SUBSTITUIR AQUI
```

Pela chave que você copiou:

```javascript
const VAPID_KEY = 'BMa1b2c3d4e5f6g7h8i9j0...'; // Sua chave real
```

## Passo 3: Criar Cloud Function para Enviar Notificações

Você precisa criar uma Cloud Function que escuta novos documentos na coleção `notifications` e envia via FCM.

### 3.1 Instalar Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 3.2 Inicializar Functions

```bash
firebase init functions
```

### 3.3 Criar a Function

Crie o arquivo `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Enviar notificação quando novo documento é criado
exports.sendPaymentNotification = functions.firestore
    .document('notifications/{notificationId}')
    .onCreate(async (snap, context) => {
        const notification = snap.data();
        
        // Verificar se já foi enviada
        if (notification.sent) {
            return null;
        }

        try {
            // Buscar tokens FCM dos admins
            const tokensSnapshot = await admin.firestore()
                .collection('fcmTokens')
                .get();

            const tokens = [];
            tokensSnapshot.forEach(doc => {
                tokens.push(doc.data().token);
            });

            if (tokens.length === 0) {
                console.log('Nenhum token FCM encontrado');
                return null;
            }

            // Criar mensagem
            const message = {
                notification: {
                    title: notification.title,
                    body: notification.body
                },
                data: notification.data || {},
                tokens: tokens
            };

            // Enviar notificação
            const response = await admin.messaging().sendMulticast(message);
            
            console.log(`✅ ${response.successCount} notificações enviadas`);
            console.log(`❌ ${response.failureCount} falhas`);

            // Marcar como enviada
            await snap.ref.update({ 
                sent: true, 
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                successCount: response.successCount,
                failureCount: response.failureCount
            });

            return response;

        } catch (error) {
            console.error('Erro ao enviar notificação:', error);
            return null;
        }
    });
```

### 3.4 Deploy da Function

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

## Passo 4: Configurar Regras do Firestore

Adicione as regras para as coleções de notificações:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Tokens FCM
    match /fcmTokens/{tokenId} {
      allow read, write: if request.auth != null;
    }
    
    // Notificações
    match /notifications/{notificationId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && request.auth.token.role == 'admin';
    }
  }
}
```

## Passo 5: Testar Notificações

### Teste Manual no Console

1. Abra o Firebase Console
2. Vá em **Cloud Messaging**
3. Clique em **Send your first message**
4. Preencha:
   - **Notification title**: 💰 Novo Pagamento
   - **Notification text**: Apt 101 - R$ 80,00
5. Clique em **Send test message**
6. Cole o token FCM do seu dispositivo
7. Clique em **Test**

### Teste Automático no App

Quando um pagamento for marcado como PAGO, o sistema automaticamente:
1. Cria um documento em `notifications`
2. A Cloud Function detecta e envia via FCM
3. O Service Worker recebe e mostra a notificação
4. Funciona mesmo com o app fechado!

## Passo 6: Verificar Permissões

### Android

- Notificações funcionam automaticamente
- Aparecem na tela bloqueada
- Som e vibração incluídos

### iOS (Safari)

- Requer iOS 16.4+
- Usuário precisa adicionar o PWA à tela inicial
- Depois, solicitar permissão de notificações

### Desktop

- Chrome, Edge, Firefox suportam
- Notificações aparecem no sistema operacional

## Comportamento Esperado

✅ **App Fechado**: Notificação aparece na tela bloqueada com som  
✅ **App em Background**: Notificação aparece na barra de status  
✅ **App Aberto**: Notificação aparece dentro do app  
✅ **Vibração**: Padrão de vibração forte (200ms, 100ms, 200ms)  
✅ **Som**: Som padrão do sistema  
✅ **Ações**: Botões "Ver Detalhes" e "Fechar"  

## Troubleshooting

### Notificações não aparecem

1. Verifique se a permissão foi concedida
2. Abra o console e procure por erros
3. Verifique se o token FCM foi salvo no Firestore
4. Teste manualmente pelo Firebase Console

### Erro "messaging/unsupported-browser"

- Navegador não suporta notificações push
- Use Chrome, Edge ou Firefox

### Erro "messaging/permission-blocked"

- Usuário bloqueou notificações
- Precisa desbloquear nas configurações do navegador

## Próximos Passos

1. ✅ Gerar chave VAPID
2. ✅ Atualizar `firebase-messaging.js`
3. ✅ Criar Cloud Function
4. ✅ Deploy da function
5. ✅ Testar notificações
6. ✅ Configurar regras do Firestore

Pronto! Seu sistema agora envia notificações push como um banco! 🎉
