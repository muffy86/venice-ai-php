/**
 * Progressive Web App Enhancement
 * Transforms TalkToApp into a full PWA experience
 */

class PWAEnhancement {
    constructor() {
        this.isInstalled = false;
        this.deferredPrompt = null;
        this.updateAvailable = false;
        this.registration = null;
        
        this.init();
    }

    async init() {
        this.checkPWASupport();
        await this.registerServiceWorker();
        this.createManifest();
        this.setupInstallPrompt();
        this.setupUpdateNotifications();
        this.createPWAUI();
        this.enableOfflineMode();
    }

    checkPWASupport() {
        const support = {
            serviceWorker: 'serviceWorker' in navigator,
            manifest: 'manifest' in document.createElement('link'),
            installPrompt: 'BeforeInstallPromptEvent' in window,
            notifications: 'Notification' in window,
            backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype
        };

        console.log('PWA Support:', support);
        return support;
    }

    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.log('Service Worker not supported');
            return;
        }

        try {
            // Use the existing service worker file instead of blob URL
            this.registration = await navigator.serviceWorker.register('/sw.js');
            
            console.log('Service Worker registered:', this.registration);

            // Listen for updates
            this.registration.addEventListener('updatefound', () => {
                const newWorker = this.registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.updateAvailable = true;
                        this.showUpdateNotification();
                    }
                });
            });

        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }

    generateServiceWorkerCode() {
        return `
const CACHE_NAME = 'talktoapp-v1.0.0';
const STATIC_CACHE = 'talktoapp-static-v1';
const DYNAMIC_CACHE = 'talktoapp-dynamic-v1';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/modules/ai-services.js',
    '/modules/app-generator.js',
    '/modules/mcp-integration.js',
    '/modules/persistence.js',
    '/modules/performance-monitor.js',
    '/modules/advanced-chat.js',
    '/modules/template-library.js',
    '/modules/pwa-enhancement.js'
];

// Install event
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch(error => {
                console.log('Cache failed:', error);
                // Continue even if some assets fail to cache
                return Promise.resolve();
            })
    );
    
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', event => {
    const { request } = event;
    
    // Skip non-GET requests
    if (request.method !== 'GET') return;
    
    // Skip external requests
    if (!request.url.startsWith(self.location.origin)) return;
    
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                return fetch(request)
                    .then(response => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response
                        const responseToCache = response.clone();
                        
                        caches.open(DYNAMIC_CACHE)
                            .then(cache => {
                                cache.put(request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // Return offline page for navigation requests
                        if (request.destination === 'document') {
                            return caches.match('/offline.html');
                        }
                    });
            })
    );
});

// Background sync
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    // Sync offline data when connection is restored
    console.log('Background sync triggered');
    
    try {
        // Get offline data from IndexedDB
        const offlineData = await getOfflineData();
        
        // Sync with server
        for (const data of offlineData) {
            await syncDataToServer(data);
        }
        
        // Clear offline data
        await clearOfflineData();
        
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Push notifications
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'New update available!',
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
    
    event.waitUntil(
        self.registration.showNotification('TalkToApp', options)
    );
});

// Notification click
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Helper functions for offline data management
async function getOfflineData() {
    // Implementation would use IndexedDB
    return [];
}

async function syncDataToServer(data) {
    // Implementation would sync to server
    console.log('Syncing data:', data);
}

async function clearOfflineData() {
    // Implementation would clear IndexedDB
    console.log('Clearing offline data');
}
`;
    }

    createManifest() {
        const manifest = {
            name: "TalkToApp - AI App Builder",
            short_name: "TalkToApp",
            description: "Create amazing apps with AI assistance",
            start_url: "/",
            display: "standalone",
            background_color: "#1a1a1a",
            theme_color: "#00ff88",
            orientation: "portrait-primary",
            categories: ["productivity", "developer", "utilities"],
            lang: "en",
            dir: "ltr",
            icons: [
                {
                    src: this.generateIcon(72),
                    sizes: "72x72",
                    type: "image/png",
                    purpose: "any maskable"
                },
                {
                    src: this.generateIcon(96),
                    sizes: "96x96",
                    type: "image/png",
                    purpose: "any maskable"
                },
                {
                    src: this.generateIcon(128),
                    sizes: "128x128",
                    type: "image/png",
                    purpose: "any maskable"
                },
                {
                    src: this.generateIcon(144),
                    sizes: "144x144",
                    type: "image/png",
                    purpose: "any maskable"
                },
                {
                    src: this.generateIcon(152),
                    sizes: "152x152",
                    type: "image/png",
                    purpose: "any maskable"
                },
                {
                    src: this.generateIcon(192),
                    sizes: "192x192",
                    type: "image/png",
                    purpose: "any maskable"
                },
                {
                    src: this.generateIcon(384),
                    sizes: "384x384",
                    type: "image/png",
                    purpose: "any maskable"
                },
                {
                    src: this.generateIcon(512),
                    sizes: "512x512",
                    type: "image/png",
                    purpose: "any maskable"
                }
            ],
            screenshots: [
                {
                    src: this.generateScreenshot(1280, 720),
                    sizes: "1280x720",
                    type: "image/png",
                    form_factor: "wide"
                },
                {
                    src: this.generateScreenshot(750, 1334),
                    sizes: "750x1334",
                    type: "image/png",
                    form_factor: "narrow"
                }
            ],
            shortcuts: [
                {
                    name: "Create New App",
                    short_name: "New App",
                    description: "Start creating a new application",
                    url: "/?action=new",
                    icons: [{ src: this.generateIcon(96), sizes: "96x96" }]
                },
                {
                    name: "Browse Templates",
                    short_name: "Templates",
                    description: "Browse available app templates",
                    url: "/?action=templates",
                    icons: [{ src: this.generateIcon(96), sizes: "96x96" }]
                },
                {
                    name: "AI Chat",
                    short_name: "Chat",
                    description: "Chat with AI assistant",
                    url: "/?action=chat",
                    icons: [{ src: this.generateIcon(96), sizes: "96x96" }]
                }
            ],
            related_applications: [],
            prefer_related_applications: false
        };

        // Create manifest blob and URL
        const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {
            type: 'application/json'
        });
        const manifestUrl = URL.createObjectURL(manifestBlob);

        // Add manifest link to head
        const manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = manifestUrl;
        document.head.appendChild(manifestLink);

        // Add theme color meta tag
        const themeColorMeta = document.createElement('meta');
        themeColorMeta.name = 'theme-color';
        themeColorMeta.content = '#00ff88';
        document.head.appendChild(themeColorMeta);

        // Add apple-specific meta tags
        this.addApplePWAMeta();
    }

    generateIcon(size) {
        // Create SVG icon
        const svg = `
            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#00ff88;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#00cc6a;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
                <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" 
                      font-weight="bold" text-anchor="middle" dy="0.35em" fill="black">💬</text>
                <text x="50%" y="75%" font-family="Arial, sans-serif" font-size="${size * 0.15}" 
                      font-weight="bold" text-anchor="middle" fill="black">APP</text>
            </svg>
        `;

        // Convert SVG to data URL
        return 'data:image/svg+xml;base64,' + btoa(svg);
    }

    generateScreenshot(width, height) {
        // Create a simple screenshot representation
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#1a1a1a');
        gradient.addColorStop(1, '#2d2d2d');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // App interface mockup
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(20, 20, width - 40, 60);
        
        ctx.fillStyle = 'black';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TalkToApp - AI App Builder', width / 2, 55);

        // Content areas
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(20, 100, width - 40, height - 140);

        return canvas.toDataURL('image/png');
    }

    addApplePWAMeta() {
        const appleMetas = [
            { name: 'apple-mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
            { name: 'apple-mobile-web-app-title', content: 'TalkToApp' }
        ];

        appleMetas.forEach(meta => {
            const metaTag = document.createElement('meta');
            metaTag.name = meta.name;
            metaTag.content = meta.content;
            document.head.appendChild(metaTag);
        });

        // Apple touch icons
        const appleTouchIcon = document.createElement('link');
        appleTouchIcon.rel = 'apple-touch-icon';
        appleTouchIcon.href = this.generateIcon(180);
        document.head.appendChild(appleTouchIcon);
    }

    setupInstallPrompt() {
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            this.hideInstallButton();
            this.showInstalledMessage();
        });

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
        }
    }

    showInstallButton() {
        const installBtn = document.getElementById('pwa-install-btn');
        if (installBtn) {
            installBtn.style.display = 'block';
            installBtn.addEventListener('click', () => this.promptInstall());
        }
    }

    hideInstallButton() {
        const installBtn = document.getElementById('pwa-install-btn');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
    }

    async promptInstall() {
        if (!this.deferredPrompt) return;

        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        console.log('Install prompt outcome:', outcome);
        
        if (outcome === 'accepted') {
            this.deferredPrompt = null;
        }
    }

    showInstalledMessage() {
        const notification = document.createElement('div');
        notification.className = 'pwa-notification success';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">✅</span>
                <span class="notification-text">App installed successfully!</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    setupUpdateNotifications() {
        // Check for updates periodically
        setInterval(() => {
            if (this.registration) {
                this.registration.update();
            }
        }, 60000); // Check every minute
    }

    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'pwa-notification update';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">🔄</span>
                <span class="notification-text">Update available!</span>
                <button onclick="pwaEnhancement.applyUpdate()" class="update-btn">Update</button>
            </div>
        `;
        
        document.body.appendChild(notification);
    }

    async applyUpdate() {
        if (this.registration && this.registration.waiting) {
            this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        }
    }

    createPWAUI() {
        // Add PWA-specific UI elements
        const pwaUI = document.createElement('div');
        pwaUI.id = 'pwa-ui';
        pwaUI.innerHTML = `
            <button id="pwa-install-btn" class="pwa-btn install-btn" style="display: none;">
                📱 Install App
            </button>
            
            <div id="pwa-status" class="pwa-status">
                <span class="status-indicator ${navigator.onLine ? 'online' : 'offline'}"></span>
                <span class="status-text">${navigator.onLine ? 'Online' : 'Offline'}</span>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #pwa-ui {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .pwa-btn {
                background: linear-gradient(135deg, #00ff88, #00cc6a);
                color: black;
                border: none;
                padding: 10px 15px;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.3s ease;
                box-shadow: 0 2px 10px rgba(0, 255, 136, 0.3);
            }

            .pwa-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(0, 255, 136, 0.4);
            }

            .pwa-status {
                display: flex;
                align-items: center;
                gap: 8px;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                padding: 8px 12px;
                border-radius: 20px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                font-size: 12px;
                color: white;
            }

            .status-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #ccc;
            }

            .status-indicator.online {
                background: #00ff88;
                box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
            }

            .status-indicator.offline {
                background: #ff6b6b;
                box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
            }

            .pwa-notification {
                position: fixed;
                top: 80px;
                right: 20px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 12px;
                padding: 15px;
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
                z-index: 10001;
                animation: slideInRight 0.3s ease;
                max-width: 300px;
            }

            .pwa-notification.success {
                border-left: 4px solid #00ff88;
            }

            .pwa-notification.update {
                border-left: 4px solid #4ecdc4;
            }

            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
                color: #333;
            }

            .notification-icon {
                font-size: 18px;
            }

            .notification-text {
                flex: 1;
                font-weight: 500;
            }

            .update-btn {
                background: #4ecdc4;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: bold;
            }

            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            @media (max-width: 768px) {
                #pwa-ui {
                    top: 10px;
                    right: 10px;
                }
                
                .pwa-notification {
                    right: 10px;
                    top: 70px;
                    max-width: calc(100vw - 20px);
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(pwaUI);

        // Monitor online/offline status
        this.setupNetworkMonitoring();
    }

    setupNetworkMonitoring() {
        const updateStatus = () => {
            const statusIndicator = document.querySelector('.status-indicator');
            const statusText = document.querySelector('.status-text');
            
            if (statusIndicator && statusText) {
                if (navigator.onLine) {
                    statusIndicator.className = 'status-indicator online';
                    statusText.textContent = 'Online';
                } else {
                    statusIndicator.className = 'status-indicator offline';
                    statusText.textContent = 'Offline';
                }
            }
        };

        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
    }

    enableOfflineMode() {
        // Create offline page
        this.createOfflinePage();
        
        // Setup offline data storage
        this.setupOfflineStorage();
        
        // Enable background sync
        this.enableBackgroundSync();
    }

    createOfflinePage() {
        const offlineHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TalkToApp - Offline</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
            color: white;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .offline-container {
            text-align: center;
            max-width: 500px;
        }
        .offline-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        .offline-title {
            font-size: 24px;
            margin-bottom: 15px;
            color: #00ff88;
        }
        .offline-message {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 30px;
            color: #ccc;
        }
        .retry-btn {
            background: linear-gradient(135deg, #00ff88, #00cc6a);
            color: black;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
        }
        .retry-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0, 255, 136, 0.4);
        }
    </style>
</head>
<body>
    <div class="offline-container">
        <div class="offline-icon">📱</div>
        <h1 class="offline-title">You're Offline</h1>
        <p class="offline-message">
            Don't worry! TalkToApp works offline too. 
            Your work is automatically saved and will sync when you're back online.
        </p>
        <button class="retry-btn" onclick="window.location.reload()">
            Try Again
        </button>
    </div>
</body>
</html>
        `;

        // Store offline page in cache
        if ('caches' in window) {
            caches.open('talktoapp-static-v1').then(cache => {
                cache.put('/offline.html', new Response(offlineHTML, {
                    headers: { 'Content-Type': 'text/html' }
                }));
            });
        }
    }

    setupOfflineStorage() {
        // Initialize IndexedDB for offline data storage
        const request = indexedDB.open('TalkToAppOffline', 1);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create object stores
            if (!db.objectStoreNames.contains('apps')) {
                const appsStore = db.createObjectStore('apps', { keyPath: 'id' });
                appsStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('chats')) {
                const chatsStore = db.createObjectStore('chats', { keyPath: 'id' });
                chatsStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
        
        request.onsuccess = (event) => {
            this.offlineDB = event.target.result;
            console.log('Offline database initialized');
        };
    }

    async enableBackgroundSync() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            try {
                await this.registration.sync.register('background-sync');
                console.log('Background sync registered');
            } catch (error) {
                console.log('Background sync registration failed:', error);
            }
        }
    }

    // Offline data management methods
    async saveOfflineData(type, data) {
        if (!this.offlineDB) return;
        
        const transaction = this.offlineDB.transaction([type], 'readwrite');
        const store = transaction.objectStore(type);
        
        data.id = data.id || Date.now();
        data.timestamp = Date.now();
        data.synced = false;
        
        await store.put(data);
    }

    async getOfflineData(type) {
        if (!this.offlineDB) return [];
        
        const transaction = this.offlineDB.transaction([type], 'readonly');
        const store = transaction.objectStore(type);
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // PWA Analytics
    trackPWAUsage() {
        const analytics = {
            isInstalled: this.isInstalled,
            isOnline: navigator.onLine,
            displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
            timestamp: Date.now()
        };

        // Store analytics data
        localStorage.setItem('pwa_analytics', JSON.stringify(analytics));
        
        // Send to performance monitor if available
        if (window.performanceMonitor) {
            window.performanceMonitor.recordCustomMetric('pwa_usage', analytics);
        }
    }
}

// Global instance
window.pwaEnhancement = new PWAEnhancement();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAEnhancement;
}