// src/sw.js
self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            caches.match(event.request).then((response) => {
                // Serve cached index.html for navigation requests
                return response || caches.match('/index.html');
            })
        );
    }
});