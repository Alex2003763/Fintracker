// Custom service worker for enhanced offline functionality
const CACHE_NAME = 'finance-flow-v1';
const OFFLINE_URL = '/offline.html';

// Install event - cache essential resources (avoiding conflicts with main SW)
self.addEventListener('install', (event) => {
  console.log('Custom Service Worker installing');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/offline.html'
      ]).catch((error) => {
        console.log('Custom SW cache failed for some resources:', error);
        // Continue even if some resources fail to cache
        return Promise.resolve();
      });
    }).then(() => {
      console.log('Custom Service Worker installation completed');
      self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - only handle offline scenarios to avoid conflicts
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Only handle offline scenarios and specific requests to avoid conflicts
  if (event.request.mode === 'navigate' && !navigator.onLine) {
    event.respondWith(
      caches.match(OFFLINE_URL).then((response) => {
        if (response) {
          return response;
        }
        // Fallback to main cache if our custom cache fails
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Only handle requests for our specific offline resources
  if (event.request.url.includes('/offline.html')) {
    event.respondWith(
      caches.match(OFFLINE_URL).then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'background-sync-transactions') {
    event.waitUntil(syncTransactions());
  }
});

// Push notifications (if needed in the future)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || 1
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

// Helper function for background sync
async function syncTransactions() {
  try {
    // Get pending transactions from IndexedDB or localStorage
    const pendingTransactions = await getPendingTransactions();

    for (const transaction of pendingTransactions) {
      try {
        // Attempt to sync with server (if implemented)
        // For now, just mark as synced in localStorage
        await markTransactionAsSynced(transaction.id);
      } catch (error) {
        console.error('Failed to sync transaction:', transaction.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper functions (these would need to be implemented based on your storage strategy)
async function getPendingTransactions() {
  // Implementation depends on how you store pending transactions
  return [];
}

async function markTransactionAsSynced(transactionId) {
  // Implementation depends on how you store pending transactions
  console.log('Marked transaction as synced:', transactionId);
}