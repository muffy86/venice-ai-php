/**
 * TalkToApp Service Worker
 * Provides offline functionality and caching for the PWA
 */

const CACHE_NAME = 'talktoapp-v2.0.0';
const STATIC_CACHE = 'talktoapp-static-v2.0.0';
const DYNAMIC_CACHE = 'talktoapp-dynamic-v2.0.0';

// Files to cache for offline functionality
const STATIC_FILES = [
    '/',
    '/index.html',
    '/manifest.json',
    '/modules/mcp-integration.js',
    '/modules/ai-services.js',
    '/modules/app-generator.js',
    '/modules/persistence.js'
];

// Dynamic content patterns
const DYNAMIC_PATTERNS = [
    /\/api\//,
    /\/generated\//,
    /\/user\//
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: Static files cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Failed to cache static files', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated successfully');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle different types of requests
    if (isStaticFile(request.url)) {
        event.respondWith(handleStaticFile(request));
    } else if (isDynamicContent(request.url)) {
        event.respondWith(handleDynamicContent(request));
    } else if (isAPIRequest(request.url)) {
        event.respondWith(handleAPIRequest(request));
    } else {
        event.respondWith(handleGenericRequest(request));
    }
});

// Check if URL is a static file
function isStaticFile(url) {
    return STATIC_FILES.some(file => url.endsWith(file)) || 
           url.includes('.js') || 
           url.includes('.css') || 
           url.includes('.html');
}

// Check if URL is dynamic content
function isDynamicContent(url) {
    return DYNAMIC_PATTERNS.some(pattern => pattern.test(url));
}

// Check if URL is an API request
function isAPIRequest(url) {
    return url.includes('/api/') || url.includes('mcp://');
}

// Handle static file requests
async function handleStaticFile(request) {
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // If not in cache, fetch from network
        const networkResponse = await fetch(request);
        
        // Cache the response for future use
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Service Worker: Failed to handle static file', error);
        
        // Return offline fallback if available
        return getOfflineFallback(request);
    }
}

// Handle dynamic content requests
async function handleDynamicContent(request) {
    try {
        // Try network first for dynamic content
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Service Worker: Network failed, trying cache for dynamic content');
        
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline fallback
        return getOfflineFallback(request);
    }
}

// Handle API requests
async function handleAPIRequest(request) {
    try {
        // Always try network first for API requests
        const networkResponse = await fetch(request);
        return networkResponse;
    } catch (error) {
        console.log('Service Worker: API request failed, returning offline response');
        
        // Return offline API response
        return new Response(
            JSON.stringify({
                error: 'offline',
                message: 'API unavailable offline',
                cached: false
            }),
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
}

// Handle generic requests
async function handleGenericRequest(request) {
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Try network
        const networkResponse = await fetch(request);
        return networkResponse;
    } catch (error) {
        console.log('Service Worker: Generic request failed');
        return getOfflineFallback(request);
    }
}

// Get offline fallback response
function getOfflineFallback(request) {
    const url = new URL(request.url);
    
    // Return appropriate offline page based on request type
    if (request.headers.get('accept')?.includes('text/html')) {
        return caches.match('/index.html');
    }
    
    // Return offline JSON response for API-like requests
    if (request.headers.get('accept')?.includes('application/json')) {
        return new Response(
            JSON.stringify({
                error: 'offline',
                message: 'Content unavailable offline'
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
    
    // Generic offline response
    return new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable'
    });
}

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered', event.tag);
    
    if (event.tag === 'sync-apps') {
        event.waitUntil(syncUserApps());
    } else if (event.tag === 'sync-analytics') {
        event.waitUntil(syncAnalytics());
    }
});

// Sync user apps when online
async function syncUserApps() {
    try {
        console.log('Service Worker: Syncing user apps...');
        
        // Get pending sync data from IndexedDB or localStorage
        const pendingApps = await getPendingSyncData('apps');
        
        if (pendingApps.length > 0) {
            // Send to server
            const response = await fetch('/api/sync/apps', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ apps: pendingApps })
            });
            
            if (response.ok) {
                // Clear pending sync data
                await clearPendingSyncData('apps');
                console.log('Service Worker: Apps synced successfully');
                
                // Notify clients
                notifyClients('sync-complete', { type: 'apps', count: pendingApps.length });
            }
        }
    } catch (error) {
        console.error('Service Worker: Failed to sync apps', error);
    }
}

// Sync analytics data
async function syncAnalytics() {
    try {
        console.log('Service Worker: Syncing analytics...');
        
        const pendingAnalytics = await getPendingSyncData('analytics');
        
        if (pendingAnalytics.length > 0) {
            const response = await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ events: pendingAnalytics })
            });
            
            if (response.ok) {
                await clearPendingSyncData('analytics');
                console.log('Service Worker: Analytics synced successfully');
            }
        }
    } catch (error) {
        console.error('Service Worker: Failed to sync analytics', error);
    }
}

// Get pending sync data (mock implementation)
async function getPendingSyncData(type) {
    // In a real implementation, this would read from IndexedDB
    return [];
}

// Clear pending sync data (mock implementation)
async function clearPendingSyncData(type) {
    // In a real implementation, this would clear IndexedDB data
    console.log(`Service Worker: Cleared pending ${type} data`);
}

// Notify all clients
function notifyClients(type, data) {
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: type,
                data: data
            });
        });
    });
}

// Push notification handling
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push notification received');
    
    const options = {
        body: 'You have new updates in TalkToApp!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Open App',
                icon: '/icons/checkmark.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/icons/xmark.png'
            }
        ]
    };
    
    if (event.data) {
        const payload = event.data.json();
        options.body = payload.body || options.body;
        options.data = { ...options.data, ...payload.data };
    }
    
    event.waitUntil(
        self.registration.showNotification('TalkToApp', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked', event.action);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        // Open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    } else if (event.action === 'close') {
        // Just close the notification
        return;
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker: Message received', event.data);
    
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_APP':
            cacheGeneratedApp(data);
            break;
            
        case 'SYNC_REQUEST':
            // Register background sync
            self.registration.sync.register(data.tag);
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches();
            break;
            
        default:
            console.log('Service Worker: Unknown message type', type);
    }
});

// Cache generated app
async function cacheGeneratedApp(appData) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const response = new Response(JSON.stringify(appData), {
            headers: { 'Content-Type': 'application/json' }
        });
        
        await cache.put(`/generated-app/${appData.id}`, response);
        console.log('Service Worker: Generated app cached', appData.id);
    } catch (error) {
        console.error('Service Worker: Failed to cache generated app', error);
    }
}

// Clear all caches
async function clearAllCaches() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('Service Worker: All caches cleared');
    } catch (error) {
        console.error('Service Worker: Failed to clear caches', error);
    }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    console.log('Service Worker: Periodic sync triggered', event.tag);
    
    if (event.tag === 'sync-user-data') {
        event.waitUntil(performPeriodicSync());
    }
});

// Perform periodic sync
async function performPeriodicSync() {
    try {
        console.log('Service Worker: Performing periodic sync...');
        
        // Sync user data, analytics, etc.
        await Promise.all([
            syncUserApps(),
            syncAnalytics()
        ]);
        
        console.log('Service Worker: Periodic sync completed');
    } catch (error) {
        console.error('Service Worker: Periodic sync failed', error);
    }
}

// Handle app updates
self.addEventListener('appinstalled', (event) => {
    console.log('Service Worker: App installed successfully');
    
    // Track installation
    trackEvent('app_installed', {
        timestamp: Date.now(),
        userAgent: navigator.userAgent
    });
});

// Track events (simplified)
function trackEvent(eventName, data) {
    // In a real implementation, this would queue events for sync
    console.log('Service Worker: Event tracked', eventName, data);
}

// Error handling
self.addEventListener('error', (event) => {
    console.error('Service Worker: Error occurred', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker: Unhandled promise rejection', event.reason);
});

console.log('Service Worker: Loaded successfully');