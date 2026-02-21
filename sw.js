const CACHE_NAME = 'gestao-condominial-v125';
const STATIC_CACHE = 'static-v125';
const DYNAMIC_CACHE = 'dynamic-v125';
const APP_VERSION = 'v125';

// URL do arquivo de versão
const VERSION_URL = '/version.json';

// Intervalo de verificação de atualização (5 minutos)
const UPDATE_CHECK_INTERVAL = 5 * 60 * 1000;

// Lista de todas as versões antigas para forçar limpeza
const OLD_CACHES = [
  'gestao-condominial-v114', 'static-v114', 'dynamic-v114',
  'gestao-condominial-v113', 'static-v113', 'dynamic-v113',
  'gestao-condominial-v112', 'static-v112', 'dynamic-v112',
  'gestao-condominial-v111', 'static-v111', 'dynamic-v111',
  'gestao-condominial-v110', 'static-v110', 'dynamic-v110',
  'gestao-condominial-v109', 'static-v109', 'dynamic-v109',
  'gestao-condominial-v108', 'static-v108', 'dynamic-v108',
  'gestao-condominial-v107', 'static-v107', 'dynamic-v107',
  'gestao-condominial-v106', 'static-v106', 'dynamic-v106',
  'gestao-condominial-v105', 'static-v105', 'dynamic-v105',
  'gestao-condominial-v104', 'static-v104', 'dynamic-v104',
  'gestao-condominial-v103', 'static-v103', 'dynamic-v103',
  'gestao-condominial-v102', 'static-v102', 'dynamic-v102',
  'gestao-condominial-v101', 'static-v101', 'dynamic-v101',
  'gestao-condominial-v100', 'static-v100', 'dynamic-v100',
  'gestao-condominial-v99', 'static-v99', 'dynamic-v99',
  'gestao-condominial-v98', 'static-v98', 'dynamic-v98',
  'gestao-condominial-v97', 'static-v97', 'dynamic-v97',
  'gestao-condominial-v96', 'static-v96', 'dynamic-v96',
  'gestao-condominial-v95', 'static-v95', 'dynamic-v95',
  'gestao-condominial-v94', 'static-v94', 'dynamic-v94',
  'gestao-condominial-v93', 'static-v93', 'dynamic-v93',
  'gestao-condominial-v92', 'static-v92', 'dynamic-v92',
  'gestao-condominial-v91', 'static-v91', 'dynamic-v91',
  'gestao-condominial-v90', 'static-v90', 'dynamic-v90',
  'gestao-condominial-v89', 'static-v89', 'dynamic-v89',
  'gestao-condominial-v88', 'static-v88', 'dynamic-v88',
  'gestao-condominial-v87', 'static-v87', 'dynamic-v87',
  'gestao-condominial-v86', 'static-v86', 'dynamic-v86',
  'gestao-condominial-v85', 'static-v85', 'dynamic-v85',
  'gestao-condominial-v84', 'static-v84', 'dynamic-v84',
  'gestao-condominial-v83', 'static-v83', 'dynamic-v83',
  'gestao-condominial-v82', 'static-v82', 'dynamic-v82',
  'gestao-condominial-v81', 'static-v81', 'dynamic-v81',
  'gestao-condominial-v80', 'static-v80', 'dynamic-v80',
  'gestao-condominial-v79', 'static-v79', 'dynamic-v79',
  'gestao-condominial-v78', 'static-v78', 'dynamic-v78',
  'gestao-condominial-v77', 'static-v77', 'dynamic-v77',
  'gestao-condominial-v76', 'static-v76', 'dynamic-v76',
  'gestao-condominial-v72', 'static-v72', 'dynamic-v72',
  'gestao-condominial-v71', 'static-v71', 'dynamic-v71',
  'gestao-condominial-v70', 'static-v70', 'dynamic-v70',
  'gestao-condominial-v69', 'static-v69', 'dynamic-v69',
  'gestao-condominial-v68', 'static-v68', 'dynamic-v68',
  'gestao-condominial-v67', 'static-v67', 'dynamic-v67',
  'gestao-condominial-v66', 'static-v66', 'dynamic-v66',
  'gestao-condominial-v65', 'static-v65', 'dynamic-v65',
  'gestao-condominial-v64', 'static-v64', 'dynamic-v64',
  'gestao-condominial-v63', 'static-v63', 'dynamic-v63',
  'gestao-condominial-v53', 'static-v53', 'dynamic-v53',
  'gestao-condominial-v52', 'static-v52', 'dynamic-v52',
  'gestao-condominial-v51', 'static-v51', 'dynamic-v51',
  'gestao-condominial-v50', 'static-v50', 'dynamic-v50',
  'gestao-condominial-v41', 'static-v41', 'dynamic-v41',
  'gestao-condominial-v40', 'static-v40', 'dynamic-v40',
  'gestao-condominial-v39', 'static-v39', 'dynamic-v39',
  'gestao-condominial-v38', 'static-v38', 'dynamic-v38',
  'gestao-condominial-v37', 'static-v37', 'dynamic-v37',
  'gestao-condominial-v36', 'static-v36', 'dynamic-v36',
  'gestao-condominial-v35', 'static-v35', 'dynamic-v35',
  'gestao-condominial-v34', 'static-v34', 'dynamic-v34',
  'gestao-condominial-v33', 'static-v33', 'dynamic-v33',
  'gestao-condominial-v29', 'static-v29', 'dynamic-v29',
  'gestao-condominial-v28', 'static-v28', 'dynamic-v28',
  'gestao-condominial-v27', 'static-v27', 'dynamic-v27',
  'gestao-condominial-v26', 'static-v26', 'dynamic-v26',
  'gestao-condominial-v25', 'static-v25', 'dynamic-v25'
];

// Recursos essenciais para funcionamento offline
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  // Fontes do Google Fonts
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Recursos que podem ser cacheados dinamicamente
const DYNAMIC_ASSETS = [
  // Imagens, dados adicionais, etc.
];

// Install event - cache recursos estáticos
self.addEventListener('install', event => {
  console.log('[SW v30] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW v30] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW v30] Static assets cached');
        return self.skipWaiting(); // Ativar imediatamente
      })
      .catch(error => {
        console.error('[SW v30] Failed to cache static assets:', error);
      })
  );
});

// Activate event - limpar caches antigos FORÇADAMENTE
self.addEventListener('activate', event => {
  console.log('[SW v30] Activating and cleaning old caches...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        // Deletar TODOS os caches antigos
        const deletePromises = cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW v30] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        });
        
        return Promise.all(deletePromises);
      })
      .then(() => {
        console.log('[SW v30] All old caches deleted');
        return self.clients.claim(); // Tomar controle imediatamente
      })
  );
});

// Fetch event - estratégia de cache
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requests não-HTTP
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // CRÍTICO: NÃO interceptar requisições do Firebase/Firestore
  if (url.hostname.includes('firebaseio.com') || 
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firebase.com') ||
      url.hostname.includes('firestore.googleapis.com')) {
    // Deixar passar direto, sem cache
    return;
  }
  
  // Estratégia para recursos estáticos
  if (STATIC_ASSETS.includes(url.pathname) || url.pathname === '/') {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // Estratégia para Google Fonts
  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // Estratégia para outros recursos
  event.respondWith(networkFirst(request));
});

// Cache First - para recursos estáticos
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    // Cache apenas respostas válidas
    if (networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    
    // Fallback para página offline se disponível
    if (request.destination === 'document') {
      const cachedResponse = await caches.match('/');
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    throw error;
  }
}

// Network First - para dados dinâmicos
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache apenas respostas GET válidas (não POST, PUT, DELETE)
    if (networkResponse.status === 200 && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    // Só buscar no cache para métodos GET
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    throw error;
  }
}

// Background sync para dados offline
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  try {
    // Implementar sincronização de dados offline
    console.log('[SW] Syncing offline data...');
    
    // Aqui você pode implementar lógica para sincronizar
    // dados que foram modificados offline
    
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error;
  }
}

// Push notifications (para futuro uso)
self.addEventListener('push', event => {
  console.log('[SW] Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do Condomínio',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Abrir App',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icon-192.png'
      }
    ],
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification('Gestão Condominial', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handler para comunicação com a app
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});


// ============================================
// FIREBASE CLOUD MESSAGING - NOTIFICAÇÕES PUSH
// ============================================

// Importar Firebase Messaging para Service Worker
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

// Receber mensagens em background (app fechado)
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] 📬 Mensagem recebida em background:', payload);
    
    const { notification, data } = payload;
    
    const title = notification?.title || '💰 Novo Pagamento';
    const body = notification?.body || 'Um pagamento foi registrado';
    
    // Opções da notificação (estilo PIX bancário)
    const notificationOptions = {
        body: body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200, 100, 200], // Vibração forte
        tag: 'payment-notification',
        requireInteraction: true, // Fica na tela até o usuário interagir
        silent: false, // Com som
        renotify: true, // Notifica mesmo se já existe uma com a mesma tag
        data: {
            ...data,
            url: '/',
            timestamp: Date.now()
        },
        actions: [
            {
                action: 'view',
                title: '👁️ Ver Detalhes'
            },
            {
                action: 'close',
                title: '✖️ Fechar'
            }
        ],
        // Configurações para aparecer na tela bloqueada
        priority: 'high',
        urgency: 'high'
    };

    // Mostrar notificação
    return self.registration.showNotification(title, notificationOptions);
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] 🖱️ Notificação clicada:', event.action);
    
    event.notification.close();

    // Abrir ou focar na janela do app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Se já tem uma janela aberta, focar nela
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        return client.focus().then(client => {
                            // Enviar mensagem para abrir o modal
                            client.postMessage({
                                type: 'NOTIFICATION_CLICK',
                                data: event.notification.data
                            });
                        });
                    }
                }
                
                // Se não tem janela aberta, abrir uma nova
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
    );
});

// Fechar notificação
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] ❌ Notificação fechada');
});

console.log('[SW] ✅ Firebase Cloud Messaging configurado');


// ============================================
// SISTEMA DE ATUALIZAÇÃO AUTOMÁTICA v125
// ============================================

// Verificar atualizações periodicamente
let updateCheckTimer = null;

function startUpdateCheck() {
    if (updateCheckTimer) {
        clearInterval(updateCheckTimer);
    }
    
    updateCheckTimer = setInterval(async () => {
        try {
            console.log('[SW v125] 🔍 Verificando atualizações...');
            const response = await fetch(VERSION_URL, { cache: 'no-store' });
            const data = await response.json();
            
            if (data.version !== APP_VERSION.replace('v', '')) {
                console.log(`[SW v125] 🆕 Nova versão disponível: v${data.version} (atual: ${APP_VERSION})`);
                
                // Notificar todos os clientes
                const clients = await self.clients.matchAll();
                clients.forEach(client => {
                    client.postMessage({
                        type: 'UPDATE_AVAILABLE',
                        version: data.version,
                        currentVersion: APP_VERSION
                    });
                });
                
                // Limpar todos os caches
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
                console.log('[SW v125] 🗑️ Caches limpos');
                
                // Forçar atualização do Service Worker
                await self.skipWaiting();
            } else {
                console.log('[SW v125] ✅ Versão atualizada');
            }
        } catch (error) {
            console.error('[SW v125] ❌ Erro ao verificar atualização:', error);
        }
    }, UPDATE_CHECK_INTERVAL);
}

// Iniciar verificação quando SW ativar
self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.resolve().then(() => {
            startUpdateCheck();
            console.log('[SW v125] ✅ Verificação automática de atualização iniciada');
        })
    );
});

// Parar verificação quando SW for desativado
self.addEventListener('deactivate', () => {
    if (updateCheckTimer) {
        clearInterval(updateCheckTimer);
        console.log('[SW v125] ⏹️ Verificação automática de atualização parada');
    }
});

// Handler de mensagens atualizado
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CHECK_UPDATE') {
        // Verificação manual de atualização
        fetch(VERSION_URL, { cache: 'no-store' })
            .then(response => response.json())
            .then(data => {
                event.ports[0].postMessage({
                    type: 'VERSION_INFO',
                    serverVersion: data.version,
                    clientVersion: APP_VERSION.replace('v', ''),
                    updateAvailable: data.version !== APP_VERSION.replace('v', '')
                });
            })
            .catch(error => {
                console.error('[SW v125] Erro ao verificar versão:', error);
            });
    }
    
    if (event.data && event.data.type === 'FORCE_UPDATE') {
        // Forçar atualização imediata
        caches.keys().then(names => {
            return Promise.all(names.map(name => caches.delete(name)));
        }).then(() => {
            self.skipWaiting();
            event.ports[0].postMessage({ type: 'UPDATE_COMPLETE' });
        });
    }
});

console.log('[SW v125] 🚀 Sistema de atualização automática carregado');
