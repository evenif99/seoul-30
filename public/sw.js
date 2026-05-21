const CACHE_VERSION = 'v2'
const STATIC_CACHE  = `seoul30-static-${CACHE_VERSION}`
const API_CACHE     = `seoul30-api-${CACHE_VERSION}`
const PAGE_CACHE    = `seoul30-pages-${CACHE_VERSION}`
const IMAGE_CACHE   = `seoul30-images-${CACHE_VERSION}`
const ALL_CACHES    = [STATIC_CACHE, API_CACHE, PAGE_CACHE, IMAGE_CACHE]

const OFFLINE_URL    = '/offline'
const API_TTL_MS     = 5 * 60 * 1000   // 5분
const IMAGE_TTL_MS   = 7 * 24 * 60 * 60 * 1000  // 7일

// ── install: 오프라인 페이지 사전 캐시 ───────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE).then((cache) => cache.add(OFFLINE_URL))
  )
  self.skipWaiting()
})

// ── activate: 이전 버전 캐시 정리 ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('seoul30-') && !ALL_CACHES.includes(k))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

// ── fetch: 요청 유형별 전략 ──────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 1) Next.js 정적 자산 — cache-first (빌드 해시 불변)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // 2) /api/places — network-first, 5분 TTL 캐시 fallback
  if (url.pathname === '/api/places') {
    event.respondWith(networkFirstWithTTL(request, API_CACHE, API_TTL_MS))
    return
  }

  // 3) 외부 이미지 (Unsplash) — cache-first, 7일 TTL
  if (url.hostname === 'images.unsplash.com') {
    event.respondWith(cacheFirstWithTTL(request, IMAGE_CACHE, IMAGE_TTL_MS))
    return
  }

  // 4) 페이지 네비게이션 — network-first, 캐시 fallback, 최후 /offline
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request))
    return
  }
})

// ────────────────────────────────────────────────────────────────────────────
// 전략 함수
// ────────────────────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request, { cacheName })
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(cacheName)
    cache.put(request, response.clone())
  }
  return response
}

async function cacheFirstWithTTL(request, cacheName, ttlMs) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) {
    const cachedAt = cached.headers.get('x-sw-cached-at')
    if (cachedAt && Date.now() - Number(cachedAt) < ttlMs) return cached
  }
  try {
    const response = await fetch(request)
    if (response.ok) {
      const headers = new Headers(response.headers)
      headers.set('x-sw-cached-at', String(Date.now()))
      const stamped = new Response(await response.clone().blob(), {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
      cache.put(request, stamped)
    }
    return response
  } catch {
    return cached ?? Response.error()
  }
}

async function networkFirstWithTTL(request, cacheName, ttlMs) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response.ok) {
      const headers = new Headers(response.headers)
      headers.set('x-sw-cached-at', String(Date.now()))
      const stamped = new Response(await response.clone().blob(), {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
      cache.put(request, stamped)
    }
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) {
      const cachedAt = cached.headers.get('x-sw-cached-at')
      if (cachedAt && Date.now() - Number(cachedAt) < ttlMs) return cached
    }
    return Response.error()
  }
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    return cache.match(OFFLINE_URL)
  }
}

// ── 클라이언트로부터 SKIP_WAITING 메시지 수신 ────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

// ── Push 알림 수신 ───────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'Seoul 30', body: '새로운 추천 장소가 있습니다.', url: '/' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url },
    })
  )
})

// ── 알림 클릭 시 해당 URL로 이동 ─────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes(self.location.origin))
      if (existing) return existing.focus()
      return clients.openWindow(url)
    })
  )
})
