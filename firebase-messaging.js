// Firebase Cloud Messaging - Notificações Push
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js';

const firebaseConfig = {
    apiKey: "AIzaSyDw1XIkVyMMPfGLCeF4GpMJ6kEZ8HeeuF8",
    authDomain: "gestaodoscondominios.firebaseapp.com",
    projectId: "gestaodoscondominios",
    storageBucket: "gestaodoscondominios.firebasestorage.app",
    messagingSenderId: "20572242752",
    appId: "1:20572242752:web:c1b533c1bb905e81b0f0a5",
    measurementId: "G-DSGCBWM9Q1"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Chave VAPID pública (gerada no Firebase Console)
const VAPID_KEY = 'BKl3zSFNJs-D2MZRkxSS-sMuTPg15Tz-Zk8KW8vncSInWTPMmmv8weHRrCZxZKNPoTgcR7EmNmFrCm6UYdbDOZ8';

let notificationPermission = 'default';

// Solicitar permissão para notificações
export async function requestNotificationPermission() {
    console.log('🔔 Solicitando permissão para notificações...');
    
    try {
        // Verificar se o navegador suporta notificações
        if (!('Notification' in window)) {
            console.warn('⚠️ Este navegador não suporta notificações');
            return false;
        }

        // Verificar se já tem permissão
        if (Notification.permission === 'granted') {
            console.log('✅ Permissão já concedida');
            notificationPermission = 'granted';
            await registerFCMToken();
            return true;
        }

        // Solicitar permissão
        const permission = await Notification.requestPermission();
        notificationPermission = permission;

        if (permission === 'granted') {
            console.log('✅ Permissão concedida!');
            await registerFCMToken();
            return true;
        } else {
            console.log('❌ Permissão negada');
            return false;
        }

    } catch (error) {
        console.error('❌ Erro ao solicitar permissão:', error);
        return false;
    }
}

// Registrar token FCM no servidor
async function registerFCMToken() {
    try {
        console.log('📝 Registrando token FCM...');
        
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        
        if (token) {
            console.log('✅ Token FCM obtido:', token);
            
            // Salvar token no Firestore para o usuário atual
            await saveTokenToFirestore(token);
            
            return token;
        } else {
            console.warn('⚠️ Não foi possível obter o token FCM');
            return null;
        }

    } catch (error) {
        console.error('❌ Erro ao obter token FCM:', error);
        return null;
    }
}

// Salvar token no Firestore
async function saveTokenToFirestore(token) {
    try {
        const { db } = await import('./firebase-config.js');
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const { getCurrentUser } = await import('./firebase-auth.js');
        
        const user = getCurrentUser();
        if (!user) {
            console.warn('⚠️ Usuário não autenticado');
            return;
        }

        const tokenRef = doc(db, 'fcmTokens', user.uid);
        await setDoc(tokenRef, {
            token: token,
            userId: user.uid,
            email: user.email,
            updatedAt: new Date(),
            platform: navigator.platform,
            userAgent: navigator.userAgent
        }, { merge: true });

        console.log('✅ Token salvo no Firestore');

    } catch (error) {
        console.error('❌ Erro ao salvar token:', error);
    }
}

// Escutar mensagens em foreground (app aberto)
export function listenToMessages(callback) {
    onMessage(messaging, (payload) => {
        console.log('📬 Mensagem recebida (foreground):', payload);
        
        // Mostrar notificação customizada
        showCustomNotification(payload);
        
        // Callback opcional
        if (callback) {
            callback(payload);
        }
    });
}

// Mostrar notificação customizada
function showCustomNotification(payload) {
    const { notification, data } = payload;
    
    const title = notification?.title || 'Novo Pagamento';
    const body = notification?.body || 'Um novo pagamento foi registrado';
    const icon = '/icon-192.png';
    const badge = '/icon-192.png';
    
    // Opções da notificação (estilo PIX)
    const options = {
        body: body,
        icon: icon,
        badge: badge,
        vibrate: [200, 100, 200], // Padrão de vibração
        tag: 'payment-notification',
        requireInteraction: true, // Não desaparece automaticamente
        silent: false, // Com som
        data: data,
        actions: [
            {
                action: 'view',
                title: 'Ver Detalhes',
                icon: '/icon-192.png'
            },
            {
                action: 'close',
                title: 'Fechar'
            }
        ]
    };

    // Mostrar notificação
    if (Notification.permission === 'granted') {
        const notification = new Notification(title, options);
        
        notification.onclick = (event) => {
            event.preventDefault();
            window.focus();
            notification.close();
            
            // Abrir modal de pagamentos
            if (window.openPagamentosHoje) {
                window.openPagamentosHoje();
            }
        };
    }
}

// Enviar notificação de teste
export async function sendTestNotification() {
    try {
        const { db } = await import('./firebase-config.js');
        const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Adicionar documento na coleção de notificações
        // (você precisará criar uma Cloud Function para enviar via FCM)
        const notificationsRef = collection(db, 'notifications');
        await addDoc(notificationsRef, {
            title: '💰 Novo Pagamento Recebido',
            body: 'Apt 101 - Bloco 01 - R$ 80,00',
            type: 'payment',
            createdAt: new Date(),
            sent: false
        });

        console.log('✅ Notificação de teste criada');
        return true;

    } catch (error) {
        console.error('❌ Erro ao enviar notificação:', error);
        return false;
    }
}

export { messaging, notificationPermission };
