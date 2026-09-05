// Service worker for Squad Builder.
// Host this file in the same folder as squad-builder.html (or whatever
// you rename it to) so the browser can find it at "./sw.js".
//
// Strategy: stale-while-revalidate. Every GET request is served from
// cache immediately if available (instant load, works offline), while a
// fresh copy is fetched in the background to update the cache for next
// time. If there's no cached copy yet, it waits on the network.

const CACHE_NAME = 'squad-builder-v1';

self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names
          .filter(function (name) { return name !== CACHE_NAME; })
          .map(function (name) { return caches.delete(name); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.match(event.request).then(function (cached) {
        var networkFetch = fetch(event.request)
          .then(function (response) {
            if (response && response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(function () {
            return cached; // offline and nothing new to serve - fall back to cache
          });

        return cached || networkFetch;
      });
    })
  );
});
