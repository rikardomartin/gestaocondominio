// Service Worker para Teste de Notificações FCM
console.log('[SW-TEST] Service Worker carregado');

// Importar Firebase Messaging
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuração do Firebase
firebase.initializeApp({
    apiKey: "AIzaSyDw1XIkVyMMPfGLCeF4GpMJ6kEZ8HeeuF8",
    authDomain: "gestaodoscondominios.firebaseapp.com",
    projectId: "gestaodoscondominios",
    storageBucket: "gestaodoscondominios.firebasestorage.app",
    messagingSenderId: "20572242752",
    appId: "1:20572242752:web:c1b533c1bb905e81b0f0a5"
});

const messaging = firebase.messaging();

console.log('[SW-TEST] Firebase Messaging inicializado');

// Receber mensagens em background
messaging.onBackgroundMessage((payload) => {
    console.log('[SW-TEST] 📬 Mensagem recebida em background:', payload);
    
    const notificationTitle = payload.notification?.title || '💰 Novo Pagamento';
    const notificationOptions = {
        body: payload.notification?.body || 'Um pagamento foi registrado',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: 'payment-notification',
        requireInteraction: true,
        data: payload.data || {}
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
    console.log('[SW-TEST] 🖱️ Notificação clicada');
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/')
    );
});

// Install
self.addEventListener('install', (event) => {
    console.log('[SW-TEST] ⚙️ Instalando...');
    self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
    console.log('[SW-TEST] ✅ Ativado');
    event.waitUntil(clients.claim());
});

console.log('[SW-TEST] ✅ Service Worker configurado');
