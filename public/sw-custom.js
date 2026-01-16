// Custom service worker for enhanced offline functionality
const CACHE_NAME = 'fintrack-v1';
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

// Handle messages from main thread with enhanced mobile support
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data);

  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, urgent, data } = event.data.payload;

    const options = {
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: tag || 'fintrack-notification',
      requireInteraction: urgent || false,
      // Enhanced mobile options
      vibrate: urgent ? [200, 100, 200] : [100, 50, 100],
      timestamp: Date.now(),
      data: data || {},
      actions: [
        {
          action: 'view',
          title: 'View Details',
          icon: '/icon-192x192.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    self.registration.showNotification(title, options).then(() => {
      console.log('Notification shown successfully from message handler');
    }).catch(error => {
      console.error('Error showing notification from service worker:', error);
      // Try fallback notification if main notification fails
      self.registration.showNotification('FinTrack', {
        body: 'Budget notification available',
        icon: '/icon-192x192.png',
        tag: 'fintrack-fallback'
      }).catch(fallbackError => {
        console.error('Fallback notification also failed:', fallbackError);
      });
    });
  }
});

// Enhanced push notifications with mobile optimization
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  if (event.data) {
    const data = event.data.json();
    console.log('Push data:', data);

    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: data.tag || 'fintrack-notification',
      requireInteraction: data.urgent || false,
      silent: data.silent || false,
      // Enhanced vibration for mobile devices
      vibrate: data.urgent ? [200, 100, 200, 100, 200] : [100, 50, 100],
      // Add timestamp for better mobile UX
      timestamp: Date.now(),
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || 1,
        url: data.url || '/',
        action: data.action || 'default',
        type: data.type || 'general'
      },
      actions: data.actions || [
        {
          action: 'view',
          title: 'View Details',
          icon: '/icon-192x192.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options).then(() => {
        console.log('Notification shown successfully');
      }).catch(error => {
        console.error('Error showing notification:', error);
      })
    );
  } else {
    console.log('No data in push event, showing fallback notification');
    // Fallback notification if no data provided
    const options = {
      body: 'You have a new notification from FinTrack',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'fintrack-fallback',
      vibrate: [100, 50, 100],
      timestamp: Date.now()
    };

    event.waitUntil(
      self.registration.showNotification('FinTrack', options).then(() => {
        console.log('Fallback notification shown successfully');
      }).catch(error => {
        console.error('Error showing fallback notification:', error);
      })
    );
  }
});

// Enhanced notification click handler with mobile optimization
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification.data);
  console.log('Action clicked:', event.action);

  event.notification.close();

  const data = event.notification.data || {};
  const action = event.action || data.action || 'default';
  let url = data.url || '/';

  // Handle different notification types and actions for mobile
  if (data.type === 'bill_reminder' && data.relatedId) {
    url = `/?focus=bills&billId=${data.relatedId}`;
  } else if (data.type === 'goal_progress' && data.relatedId) {
    url = `/?focus=goals&goalId=${data.relatedId}`;
  } else if (data.type === 'budget' && data.relatedId) {
    url = `/?focus=budgets&budgetId=${data.relatedId}`;
  }

  // Handle action buttons
  if (action === 'view') {
    // View action - open specific page
    console.log('View action triggered, opening:', url);
  } else if (action === 'dismiss') {
    // Dismiss action - just close notification
    console.log('Dismiss action triggered');
    return;
  } else {
    console.log('Default action triggered, opening:', url);
  }

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      console.log('Found clients:', clientList.length);

      // Check if app is already open
      for (const client of clientList) {
        console.log('Checking client:', client.url);
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          console.log('Focusing existing window');
          // Focus existing window and navigate if needed
          return client.focus().then(client => {
            console.log('Client focused, current URL:', client.url, 'Target URL:', url);
            if (client.url !== url && client.url.includes(self.location.origin)) {
              console.log('Navigating to:', url);
              return client.navigate(url).catch(error => {
                console.error('Navigation failed, opening new window:', error);
                return clients.openWindow(url);
              });
            }
          }).catch(error => {
            console.error('Failed to focus client:', error);
            return clients.openWindow(url);
          });
        }
      }

      // Open new window if app is not open
      console.log('Opening new window:', url);
      return clients.openWindow(url).catch(error => {
        console.error('Failed to open window:', error);
        // Fallback to root URL
        return clients.openWindow('/');
      });
    }).catch(error => {
      console.error('Error in notification click handler:', error);
      // Final fallback
      clients.openWindow('/');
    })
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