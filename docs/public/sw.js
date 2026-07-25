// Mi Intestino en Órbita — Service Worker
// Cache-first para la app shell, network-first para HTML (para que se actualice).
const CACHE_VERSION = 'eii-v1'
const APP_SHELL = [
  '/',
  '/tablero',
  '/recursos',
  '/guerra-invisible',
  '/parte-de-guerra',
  '/manifest.webmanifest',
  '/favicon.svg'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== location.origin) return

  // HTML: network-first con fallback a caché
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {})
          return res
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/')))
    )
    return
  }

  // Resto: cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached
      return fetch(req)
        .then((res) => {
          if (res.ok && (res.type === 'basic' || res.type === 'default')) {
            const copy = res.clone()
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {})
          }
          return res
        })
        .catch(() => cached)
    })
  )
})
