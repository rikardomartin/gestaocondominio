# 🚀 Deploy Rápido - Notificações Push

## ✅ Passo 1: Chave VAPID (JÁ FEITO!)

A chave VAPID já foi configurada no código:
```
BKl3zSFNJs-D2MZRkxSS-sMuTPg15Tz-Zk8KW8vncSInWTPMmmv8weHRrCZxZKNPoTgcR7EmNmFrCm6UYdbDOZ8
```

## 📦 Passo 2: Deploy das Cloud Functions

### Opção A: Script Automático (Windows)

```bash
deploy-functions.bat
```

### Opção B: Manual

```bash
# 1. Instalar dependências
cd functions
npm install

# 2. Voltar para raiz
cd ..

# 3. Deploy
firebase deploy --only functions
```

## 🔒 Passo 3: Atualizar Regras do Firestore

```bash
firebase deploy --only firestore:rules
```

## 🧪 Passo 4: Testar Notificações

### Teste 1: Via HTTP (mais fácil)

Abra no navegador:
```
https://us-central1-gestaodoscondominios.cloudfunctions.net/sendTestNotification
```

Você verá:
```json
{
  "success": true,
  "message": "Notificação de teste criada",
  "notificationId": "abc123..."
}
```

### Teste 2: Via App

1. Faça login como `admin@condominio.com`
2. Aguarde 3 segundos (permissão será solicitada)
3. Clique em **Permitir** notificações
4. Marque um apartamento como **PAGO**
5. A notificação deve aparecer!

### Teste 3: Com App Fechado

1. Feche completamente o navegador
2. Use o endpoint HTTP para enviar notificação de teste
3. A notificação deve aparecer na tela bloqueada!

## 📱 Verificar se Funcionou

### No Console do Firebase

1. Vá em **Functions** no Firebase Console
2. Verifique se as 3 functions foram deployadas:
   - ✅ `sendPaymentNotification`
   - ✅ `cleanupOldTokens`
   - ✅ `sendTestNotification`

### No Firestore

1. Vá em **Firestore Database**
2. Verifique se existem as coleções:
   - ✅ `fcmTokens` (com seu token)
   - ✅ `notifications` (com notificações enviadas)

### No App

1. Abra o Console (F12)
2. Procure por:
   ```
   ✅ Token FCM obtido: ...
   ✅ Token salvo no Firestore
   ✅ Notificações habilitadas!
   ```

## 🎯 Fluxo Completo

```
1. Usuário marca apartamento como PAGO
   ↓
2. App cria documento em 'notifications'
   ↓
3. Cloud Function detecta novo documento
   ↓
4. Function busca tokens FCM dos admins
   ↓
5. Function envia notificação via FCM
   ↓
6. Service Worker recebe notificação
   ↓
7. Notificação aparece (mesmo com app fechado!)
```

## ⚠️ Troubleshooting

### Erro: "Firebase CLI not found"

```bash
npm install -g firebase-tools
firebase login
```

### Erro: "Permission denied"

```bash
firebase login --reauth
```

### Notificação não aparece

1. Verifique se a permissão foi concedida
2. Abra o Console e procure por erros
3. Verifique se o token foi salvo no Firestore
4. Teste manualmente com o endpoint HTTP

### Erro: "messaging/invalid-registration-token"

- Token expirou ou é inválido
- Limpe o cache e faça login novamente
- O token será regenerado automaticamente

## 🎉 Pronto!

Agora seu sistema envia notificações push como um banco! 

**Próximo passo:** Fazer um pagamento de teste e ver a mágica acontecer! 💰🔔
