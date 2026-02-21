const functions = require('firebase-functions');
const admin = require('firebase-admin');
const api = require('./api');

admin.initializeApp();

/**
 * Cloud Function: Enviar notificação push quando novo pagamento é registrado
 * 
 * Trigger: Quando um documento é criado em 'notifications'
 * Ação: Envia notificação push para todos os admins via FCM
 */
exports.sendPaymentNotification = functions.firestore
    .document('notifications/{notificationId}')
    .onCreate(async (snap, context) => {
        const notification = snap.data();
        
        console.log('📬 Nova notificação criada:', notification);
        
        // Verificar se já foi enviada
        if (notification.sent) {
            console.log('⚠️ Notificação já foi enviada');
            return null;
        }

        try {
            // Buscar tokens FCM dos admins
            const tokensSnapshot = await admin.firestore()
                .collection('fcmTokens')
                .get();

            if (tokensSnapshot.empty) {
                console.log('⚠️ Nenhum token FCM encontrado');
                await snap.ref.update({ 
                    sent: true,
                    error: 'Nenhum token FCM encontrado',
                    sentAt: admin.firestore.FieldValue.serverTimestamp()
                });
                return null;
            }

            const tokens = [];
            tokensSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.token) {
                    tokens.push(data.token);
                }
            });

            console.log(`📱 ${tokens.length} token(s) encontrado(s)`);

            if (tokens.length === 0) {
                console.log('⚠️ Nenhum token válido encontrado');
                await snap.ref.update({ 
                    sent: true,
                    error: 'Nenhum token válido',
                    sentAt: admin.firestore.FieldValue.serverTimestamp()
                });
                return null;
            }

            // Criar mensagem FCM
            const message = {
                notification: {
                    title: notification.title || '💰 Novo Pagamento',
                    body: notification.body || 'Um pagamento foi registrado'
                },
                data: {
                    type: notification.type || 'payment',
                    timestamp: Date.now().toString(),
                    ...(notification.data || {})
                },
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        priority: 'high',
                        channelId: 'payments',
                        visibility: 'public',
                        defaultSound: true,
                        defaultVibrateTimings: false,
                        vibrateTimingsMillis: [200, 100, 200, 100, 200]
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1,
                            contentAvailable: true
                        }
                    }
                },
                webpush: {
                    notification: {
                        icon: '/icon-192.png',
                        badge: '/icon-192.png',
                        vibrate: [200, 100, 200, 100, 200],
                        requireInteraction: true,
                        tag: 'payment-notification',
                        renotify: true
                    },
                    fcmOptions: {
                        link: '/'
                    }
                },
                tokens: tokens
            };

            // Enviar notificação para múltiplos dispositivos
            const response = await admin.messaging().sendMulticast(message);
            
            console.log(`✅ ${response.successCount} notificação(ões) enviada(s)`);
            console.log(`❌ ${response.failureCount} falha(s)`);

            // Log de erros
            if (response.failureCount > 0) {
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        console.error(`❌ Erro no token ${idx}:`, resp.error);
                        
                        // Remover tokens inválidos
                        if (resp.error.code === 'messaging/invalid-registration-token' ||
                            resp.error.code === 'messaging/registration-token-not-registered') {
                            console.log(`🗑️ Removendo token inválido: ${tokens[idx]}`);
                            // Aqui você pode adicionar lógica para remover o token do Firestore
                        }
                    }
                });
            }

            // Marcar como enviada
            await snap.ref.update({ 
                sent: true, 
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                successCount: response.successCount,
                failureCount: response.failureCount
            });

            return response;

        } catch (error) {
            console.error('❌ Erro ao enviar notificação:', error);
            
            // Salvar erro no documento
            await snap.ref.update({ 
                sent: false,
                error: error.message,
                errorCode: error.code,
                attemptedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            return null;
        }
    });

/**
 * Cloud Function: Limpar tokens FCM antigos (executar semanalmente)
 */
exports.cleanupOldTokens = functions.pubsub
    .schedule('every sunday 03:00')
    .timeZone('America/Sao_Paulo')
    .onRun(async (context) => {
        console.log('🧹 Limpando tokens FCM antigos...');
        
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const oldTokensSnapshot = await admin.firestore()
                .collection('fcmTokens')
                .where('updatedAt', '<', thirtyDaysAgo)
                .get();

            if (oldTokensSnapshot.empty) {
                console.log('✅ Nenhum token antigo encontrado');
                return null;
            }

            const batch = admin.firestore().batch();
            oldTokensSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            console.log(`✅ ${oldTokensSnapshot.size} token(s) antigo(s) removido(s)`);

            return null;

        } catch (error) {
            console.error('❌ Erro ao limpar tokens:', error);
            return null;
        }
    });

/**
 * Cloud Function: Enviar notificação de teste
 * Chamar via HTTP: https://REGION-PROJECT_ID.cloudfunctions.net/sendTestNotification
 */
exports.sendTestNotification = functions.https.onRequest(async (req, res) => {
    try {
        // Criar notificação de teste
        const notificationRef = await admin.firestore()
            .collection('notifications')
            .add({
                title: '🧪 Notificação de Teste',
                body: 'Esta é uma notificação de teste do sistema',
                type: 'test',
                data: {
                    test: true,
                    timestamp: Date.now().toString()
                },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                sent: false,
                targetRole: 'admin'
            });

        res.status(200).json({
            success: true,
            message: 'Notificação de teste criada',
            notificationId: notificationRef.id
        });

    } catch (error) {
        console.error('❌ Erro:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


/**
 * API REST - Gestão Condominial
 * 
 * Base URL: https://REGION-PROJECT_ID.cloudfunctions.net/api
 * 
 * Autenticação: Bearer Token (Firebase Auth)
 * Header: Authorization: Bearer <token>
 * 
 * Endpoints disponíveis:
 * - GET  /condominios
 * - GET  /condominios/:id
 * - GET  /condominios/:id/blocos
 * - GET  /blocos/:id/apartamentos
 * - GET  /apartamentos/:id
 * - GET  /pagamentos
 * - POST /pagamentos
 * - PUT  /pagamentos/:id
 * - GET  /salao/reservas
 * - POST /salao/reservas
 * - GET  /relatorios/inadimplentes
 * - GET  /relatorios/dashboard
 */
exports.api = functions.https.onRequest(api);
