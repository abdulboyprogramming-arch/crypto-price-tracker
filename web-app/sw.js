/**
 * CRYPTO PRICE TRACKER V1.0 - Service Worker
 * Provides offline support, caching, and PWA functionality
 */

const CACHE_NAME = 'crypto-tracker-v1.0.0';
const OFFLINE_URL = '/web-app/offline.html';

// Assets to cache on install
const STATIC_CACHE_URLS = [
  '/web-app/',
  '/web-app/index.html',
  '/web-app/style.css',
  '/web-app/script.js',
  '/web-app/manifest.json',
  '/web-app/offline.html',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// API endpoints to cache (stale-while-revalidate strategy)
const API_CACHE_URLS = [
  'https://api.coingecko.com/api/v3/coins/markets',
  'https://api.coingecko.com/api/v3/global'
];

// ============================================
// INSTALL EVENT
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// ============================================
// ACTIVATE EVENT
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Now ready to handle fetches');
      return self.clients.claim();
    })
  );
});

// ============================================
// FETCH EVENT - CACHING STRATEGIES
// ============================================

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests and chrome extensions
  if (event.request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle API requests - Stale While Revalidate
  if (url.pathname.includes('/api/v3/')) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }
  
  // Handle static assets - Cache First
  if (STATIC_CACHE_URLS.some(cacheUrl => event.request.url.includes(cacheUrl))) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
  
  // Handle images and fonts - Cache First with fallback
  if (event.request.destination === 'image' || event.request.destination === 'font') {
    event.respondWith(cacheFirstWithFallback(event.request));
    return;
  }
  
  // Default - Network First with offline fallback
  event.respondWith(networkFirst(event.request));
});

// ============================================
// CACHING STRATEGIES
// ============================================

/**
 * Cache First Strategy
 * Returns cached response if available, otherwise fetches from network
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] CacheFirst failed:', error);
    return new Response('Network error occurred', { status: 408 });
  }
}

/**
 * Network First Strategy
 * Tries network first, falls back to cache
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // If response is not OK, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If offline page is requested, return offline page
    if (request.destination === 'document') {
      return caches.match(OFFLINE_URL);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network request failed, falling back to cache:', error);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for document requests
    if (request.destination === 'document') {
      return caches.match(OFFLINE_URL);
    }
    
    return new Response('You are offline', { status: 503 });
  }
}

/**
 * Stale While Revalidate Strategy
 * Returns cached response immediately, then updates cache in background
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch((error) => {
    console.log('[SW] Background revalidation failed:', error);
  });
  
  // Return cached response immediately if available
  if (cachedResponse) {
    // Don't wait for fetch, but trigger it
    event.waitUntil(fetchPromise);
    return cachedResponse;
  }
  
  // No cache, wait for network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] StaleWhileRevalidate failed:', error);
    return new Response('API unavailable', { status: 503 });
  }
}

/**
 * Cache First with Fallback (for images)
 */
async function cacheFirstWithFallback(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error('Image fetch failed');
  } catch (error) {
    // Return a default placeholder image
    return new Response('/web-app/assets/default-coin.png', { status: 200 });
  }
}

// ============================================
// BACKGROUND SYNC FOR OFFLINE ACTIONS
// ============================================

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'sync-watchlist') {
    event.waitUntil(syncWatchlist());
  }
});

async function syncWatchlist() {
  const cache = await caches.open(CACHE_NAME);
  const watchlistRequests = await cache.keys('watchlist-*');
  
  for (const request of watchlistRequests) {
    const watchlistData = await cache.match(request);
    if (watchlistData) {
      // Attempt to sync to server (future feature)
      console.log('[SW] Syncing watchlist data');
    }
  }
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);
  
  let data = {
    title: 'Crypto Alert',
    body: 'Price alert triggered!',
    icon: '/web-app/assets/icons/icon-192x192.png',
    badge: '/web-app/assets/icons/badge-72x72.png'
  };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'view', title: 'View Details' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/web-app/index.html?page=alerts')
    );
  }
});

// ============================================
// MESSAGE HANDLING
// ============================================

self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache cleared');
      event.ports[0].postMessage({ success: true });
    });
  }
  
  if (event.data.type === 'GET_CACHE_SIZE') {
    caches.open(CACHE_NAME).then((cache) => {
      cache.keys().then((keys) => {
        event.ports[0].postMessage({ size: keys.length });
      });
    });
  }
});

// ============================================
// PERIODIC BACKGROUND SYNC (Chrome only)
// ============================================

if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-prices') {
      event.waitUntil(periodicPriceUpdate());
    }
  });
}

async function periodicPriceUpdate() {
  console.log('[SW] Periodic price update started');
  
  try {
    const cache = await caches.open(CACHE_NAME);
    const priceUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50';
    
    const response = await fetch(priceUrl);
    if (response && response.status === 200) {
      await cache.put('/api/cached-prices', response.clone());
      console.log('[SW] Periodic price update successful');
    }
  } catch (error) {
    console.error('[SW] Periodic price update failed:', error);
  }
}

// ============================================
// VERSION MANAGEMENT
// ============================================

self.addEventListener('message', (event) => {
  if (event.data.type === 'CHECK_UPDATE') {
    caches.open(CACHE_NAME).then((cache) => {
      cache.match('/web-app/manifest.json').then(async (response) => {
        if (response) {
          const manifest = await response.json();
          event.ports[0].postMessage({ version: manifest.version });
        }
      });
    });
  }
});
