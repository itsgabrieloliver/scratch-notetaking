/* Scratch offline cache.
   The app holds no accounts and talks to no server, so the only thing standing
   between it and working offline is the shell itself. Strategy:
     - navigations  -> network first, fall back to the cached shell
     - same-origin assets (hashed by the build) -> cache first, refreshed in the background
   Nothing here touches note data: pages live in IndexedDB, not in this cache. */

const CACHE = 'scratch-shell-v1';
const SHELL = '/index.html';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE)
            .then((cache) => cache.addAll(['/', SHELL]))
            .catch(() => undefined)
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    const copy = res.clone();
                    caches.open(CACHE).then((cache) => cache.put(SHELL, copy));
                    return res;
                })
                .catch(() => caches.match(SHELL).then((hit) => hit ?? caches.match('/')))
        );
        return;
    }

    event.respondWith(
        caches.match(req).then((hit) => {
            if (hit) {
                // Refresh in the background so the next load gets the new build.
                fetch(req)
                    .then((res) => {
                        if (res && res.status === 200) {
                            const copy = res.clone();
                            caches.open(CACHE).then((cache) => cache.put(req, copy));
                        }
                    })
                    .catch(() => undefined);
                return hit;
            }
            return fetch(req)
                .then((res) => {
                    if (res && res.status === 200 && res.type === 'basic') {
                        const copy = res.clone();
                        caches.open(CACHE).then((cache) => cache.put(req, copy));
                    }
                    return res;
                })
                .catch(() => caches.match(SHELL));
        })
    );
});
