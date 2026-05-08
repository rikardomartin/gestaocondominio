/*
 * Force Update Utility (v134)
 * - Remove Service Workers
 * - Remove Cache Storage entries
 * - Clear local/session storage
 * - Try to remove IndexedDB databases
 * - Redirect with version + timestamp to bypass stale assets
 *
 * Usage (console):
 *   await window.runForceUpdate({ version: "134", targetPath: "/" });
 */

(function initForceUpdate() {
    const DEFAULTS = {
        version: null,
        targetPath: '/',
        clearStorage: true,
        clearIndexedDb: true,
        redirect: true,
        logPrefix: '[force-update v134]'
    };

    function log(message, data) {
        if (typeof data !== 'undefined') {
            console.log(`${DEFAULTS.logPrefix} ${message}`, data);
        } else {
            console.log(`${DEFAULTS.logPrefix} ${message}`);
        }
    }

    async function unregisterServiceWorkers() {
        if (!('serviceWorker' in navigator)) {
            return { supported: false, removed: 0 };
        }

        const registrations = await navigator.serviceWorker.getRegistrations();
        let removed = 0;

        for (const registration of registrations) {
            try {
                const ok = await registration.unregister();
                if (ok) removed++;
            } catch (error) {
                log('Failed to unregister SW', error);
            }
        }

        return { supported: true, removed, total: registrations.length };
    }

    async function clearCaches() {
        if (!('caches' in window)) {
            return { supported: false, removed: 0 };
        }

        const names = await caches.keys();
        let removed = 0;

        for (const name of names) {
            try {
                const ok = await caches.delete(name);
                if (ok) removed++;
            } catch (error) {
                log(`Failed to delete cache "${name}"`, error);
            }
        }

        return { supported: true, removed, total: names.length };
    }

    function clearWebStorage() {
        const result = { localStorage: false, sessionStorage: false };

        try {
            window.localStorage.clear();
            result.localStorage = true;
        } catch (error) {
            log('Failed to clear localStorage', error);
        }

        try {
            window.sessionStorage.clear();
            result.sessionStorage = true;
        } catch (error) {
            log('Failed to clear sessionStorage', error);
        }

        return result;
    }

    async function clearIndexedDb() {
        const result = { supported: false, deleted: 0, total: 0 };

        if (!window.indexedDB || typeof window.indexedDB.databases !== 'function') {
            return result;
        }

        result.supported = true;

        try {
            const dbs = await window.indexedDB.databases();
            result.total = dbs.length;

            await Promise.all(dbs.map((dbInfo) => new Promise((resolve) => {
                if (!dbInfo || !dbInfo.name) {
                    resolve();
                    return;
                }

                const request = window.indexedDB.deleteDatabase(dbInfo.name);
                request.onsuccess = function () {
                    result.deleted++;
                    resolve();
                };
                request.onerror = function () {
                    resolve();
                };
                request.onblocked = function () {
                    resolve();
                };
            })));
        } catch (error) {
            log('Failed to clear IndexedDB', error);
        }

        return result;
    }

    function buildRedirectUrl(targetPath, version) {
        const url = new URL(targetPath || '/', window.location.origin);
        const forcedVersion = version || String(Date.now());

        url.searchParams.set('v', forcedVersion);
        url.searchParams.set('t', String(Date.now()));
        url.searchParams.set('cacheBust', '1');
        return url.toString();
    }

    async function runForceUpdate(options) {
        const cfg = { ...DEFAULTS, ...(options || {}) };
        const summary = {
            startedAt: new Date().toISOString(),
            serviceWorkers: null,
            caches: null,
            storage: null,
            indexedDb: null,
            redirectUrl: null
        };

        log('Starting forced update...');

        summary.serviceWorkers = await unregisterServiceWorkers();
        log('Service Workers cleanup done', summary.serviceWorkers);

        summary.caches = await clearCaches();
        log('Cache Storage cleanup done', summary.caches);

        if (cfg.clearStorage) {
            summary.storage = clearWebStorage();
            log('Web storage cleanup done', summary.storage);
        }

        if (cfg.clearIndexedDb) {
            summary.indexedDb = await clearIndexedDb();
            log('IndexedDB cleanup done', summary.indexedDb);
        }

        summary.redirectUrl = buildRedirectUrl(cfg.targetPath, cfg.version);
        log('Prepared redirect URL', summary.redirectUrl);

        if (cfg.redirect) {
            log('Redirecting now...');
            window.location.href = summary.redirectUrl;
        }

        return summary;
    }

    window.runForceUpdate = runForceUpdate;
    log('Ready. Call window.runForceUpdate()');
})();
