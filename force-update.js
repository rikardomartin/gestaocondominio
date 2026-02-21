// Script para forçar atualização do cache
console.log('🔄 Forçando atualização do cache...');

// Desregistrar todos os service workers
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
            registration.unregister().then(function(success) {
                console.log('✅ Service Worker desregistrado:', success);
            });
        }
    });
}

// Limpar todos os caches
if ('caches' in window) {
    caches.keys().then(function(names) {
        for (let name of names) {
            caches.delete(name).then(function(success) {
                console.log('✅ Cache deletado:', name, success);
            });
        }
    });
}

// Recarregar após 2 segundos
setTimeout(function() {
    console.log('🔄 Recarregando página...');
    window.location.reload(true);
}, 2000);
