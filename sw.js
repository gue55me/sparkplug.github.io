const version = '{{ site.time }}';

const CACHE_VERSION = 1;
let CURRENT_CACHE = 'sparkplug' + version;

const cacheFiles = [
  '/',
  '/404/',
  'css/sparkplug.css'
];

self.addEventListener('activate', evt =>
  evt.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CURRENT_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  )
);

self.addEventListener('install', evt =>
  evt.waitUntil(
    caches.open(CURRENT_CACHE)
      .then(cache => {
        return cache.addAll(cacheFiles);
      })
  )
);

const fromNetwork = (request, timeout) =>
  new Promise( (fulfill, reject) => {
    var timeoutId = setTimeout(reject, timeout);
    fetch(request).then(response => {
      clearTimeout(timeoutId);
      fulfill(response);
      update(request);
    }, reject);
  })

const fromCache = request =>
  caches.open(CURRENT_CACHE).then(cache =>
    cache.match(request).then(matching =>
      matching || cache.match('/offline.html')
    )
  );

const update = request =>
  caches.open(CURRENT_CACHE).then(cache =>
    fetch(request).then(response =>
      cache.put(request, response)
    )
  );

self.addEventListener('fetch', evt => {
  evt.respondWith(fromNetwork(evt.request, 10000).catch(
    () => fromCache(evt.request)
  ));
  evt.waitUntil(update(evt.request));
});