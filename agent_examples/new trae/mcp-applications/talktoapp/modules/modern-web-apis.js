/**
 * Modern Web APIs Integration Module
 * Integrates cutting-edge web APIs including File System Access, Web Share,
 * Web Bluetooth, WebRTC, WebXR, Payment Request, Web Locks, and Background Sync
 */

class ModernWebAPIs {
    constructor() {
        this.isInitialized = false;
        this.supportedAPIs = new Map();
        this.activeConnections = new Map();
        this.apiPanel = null;
        this.features = {
            fileSystem: null,
            webShare: null,
            webBluetooth: null,
            webRTC: null,
            webXR: null,
            paymentRequest: null,
            webLocks: null,
            backgroundSync: null,
            webCrypto: null,
            notifications: null
        };
        
        this.init();
    }

    async init() {
        console.log('🌐 Initializing Modern Web APIs Integration...');
        
        try {
            await this.detectAPISupport();
            await this.initializeFileSystemAPI();
            await this.initializeWebShareAPI();
            await this.initializeWebBluetoothAPI();
            await this.initializeWebRTCAPI();
            await this.initializeWebXRAPI();
            await this.initializePaymentRequestAPI();
            await this.initializeWebLocksAPI();
            await this.initializeBackgroundSyncAPI();
            await this.initializeWebCryptoAPI();
            await this.initializeNotificationsAPI();
            await this.createAPIPanel();
            
            this.isInitialized = true;
            
            console.log('✅ Modern Web APIs Integration initialized successfully');
            console.log('📊 Supported APIs:', Array.from(this.supportedAPIs.keys()));
            
            // Dispatch initialization event
            window.dispatchEvent(new CustomEvent('modernWebAPIsReady', {
                detail: { apis: this }
            }));
            
        } catch (error) {
            console.error('❌ Failed to initialize Modern Web APIs Integration:', error);
        }
    }

    async detectAPISupport() {
        const apis = [
            { name: 'File System Access', check: () => 'showOpenFilePicker' in window },
            { name: 'Web Share', check: () => 'share' in navigator },
            { name: 'Web Bluetooth', check: () => 'bluetooth' in navigator },
            { name: 'WebRTC', check: () => 'RTCPeerConnection' in window },
            { name: 'WebXR', check: () => 'xr' in navigator },
            { name: 'Payment Request', check: () => 'PaymentRequest' in window },
            { name: 'Web Locks', check: () => 'locks' in navigator },
            { name: 'Background Sync', check: () => 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype },
            { name: 'Web Crypto', check: () => 'crypto' in window && 'subtle' in window.crypto },
            { name: 'Notifications', check: () => 'Notification' in window },
            { name: 'Geolocation', check: () => 'geolocation' in navigator },
            { name: 'Device Orientation', check: () => 'DeviceOrientationEvent' in window },
            { name: 'Vibration', check: () => 'vibrate' in navigator },
            { name: 'Battery Status', check: () => 'getBattery' in navigator },
            { name: 'Network Information', check: () => 'connection' in navigator },
            { name: 'Web Workers', check: () => 'Worker' in window },
            { name: 'Service Workers', check: () => 'serviceWorker' in navigator },
            { name: 'IndexedDB', check: () => 'indexedDB' in window },
            { name: 'WebGL', check: () => {
                const canvas = document.createElement('canvas');
                return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
            }},
            { name: 'WebAssembly', check: () => 'WebAssembly' in window }
        ];
        
        apis.forEach(api => {
            try {
                const supported = api.check();
                this.supportedAPIs.set(api.name, supported);
                if (supported) {
                    console.log(`✅ ${api.name} is supported`);
                } else {
                    console.log(`❌ ${api.name} is not supported`);
                }
            } catch (error) {
                this.supportedAPIs.set(api.name, false);
                console.log(`❌ ${api.name} check failed:`, error.message);
            }
        });
    }

    async initializeFileSystemAPI() {
        if (!this.supportedAPIs.get('File System Access')) return;
        
        this.features.fileSystem = {
            async openFile(options = {}) {
                try {
                    const [fileHandle] = await window.showOpenFilePicker({
                        types: [{
                            description: 'Text files',
                            accept: { 'text/plain': ['.txt'] }
                        }],
                        ...options
                    });
                    
                    const file = await fileHandle.getFile();
                    const content = await file.text();
                    
                    return { fileHandle, file, content };
                } catch (error) {
                    console.error('File open failed:', error);
                    throw error;
                }
            },
            
            async saveFile(content, options = {}) {
                try {
                    const fileHandle = await window.showSaveFilePicker({
                        types: [{
                            description: 'Text files',
                            accept: { 'text/plain': ['.txt'] }
                        }],
                        ...options
                    });
                    
                    const writable = await fileHandle.createWritable();
                    await writable.write(content);
                    await writable.close();
                    
                    return fileHandle;
                } catch (error) {
                    console.error('File save failed:', error);
                    throw error;
                }
            },
            
            async openDirectory() {
                try {
                    const directoryHandle = await window.showDirectoryPicker();
                    const files = [];
                    
                    for await (const [name, handle] of directoryHandle.entries()) {
                        files.push({ name, handle, type: handle.kind });
                    }
                    
                    return { directoryHandle, files };
                } catch (error) {
                    console.error('Directory open failed:', error);
                    throw error;
                }
            }
        };
        
        console.log('📁 File System Access API initialized');
    }

    async initializeWebShareAPI() {
        if (!this.supportedAPIs.get('Web Share')) return;
        
        this.features.webShare = {
            async share(data) {
                try {
                    if (navigator.canShare && !navigator.canShare(data)) {
                        throw new Error('Data cannot be shared');
                    }
                    
                    await navigator.share(data);
                    return true;
                } catch (error) {
                    console.error('Share failed:', error);
                    throw error;
                }
            },
            
            async shareText(text, title = '', url = '') {
                return this.share({ text, title, url });
            },
            
            async shareFile(file, title = '') {
                if (!navigator.canShare || !navigator.canShare({ files: [file] })) {
                    throw new Error('File sharing not supported');
                }
                
                return this.share({ files: [file], title });
            },
            
            canShare(data) {
                return navigator.canShare ? navigator.canShare(data) : false;
            }
        };
        
        console.log('📤 Web Share API initialized');
    }

    async initializeWebBluetoothAPI() {
        if (!this.supportedAPIs.get('Web Bluetooth')) return;
        
        this.features.webBluetooth = {
            async scanDevices(options = {}) {
                try {
                    const device = await navigator.bluetooth.requestDevice({
                        acceptAllDevices: true,
                        optionalServices: ['battery_service', 'device_information'],
                        ...options
                    });
                    
                    return device;
                } catch (error) {
                    console.error('Bluetooth scan failed:', error);
                    throw error;
                }
            },
            
            async connectDevice(device) {
                try {
                    const server = await device.gatt.connect();
                    this.activeConnections.set(device.id, { device, server });
                    
                    device.addEventListener('gattserverdisconnected', () => {
                        this.activeConnections.delete(device.id);
                        console.log('Bluetooth device disconnected:', device.name);
                    });
                    
                    return server;
                } catch (error) {
                    console.error('Bluetooth connection failed:', error);
                    throw error;
                }
            },
            
            async readBatteryLevel(device) {
                try {
                    const server = await this.connectDevice(device);
                    const service = await server.getPrimaryService('battery_service');
                    const characteristic = await service.getCharacteristic('battery_level');
                    const value = await characteristic.readValue();
                    
                    return value.getUint8(0);
                } catch (error) {
                    console.error('Battery level read failed:', error);
                    throw error;
                }
            },
            
            getConnectedDevices() {
                return Array.from(this.activeConnections.values());
            }
        };
        
        console.log('📶 Web Bluetooth API initialized');
    }

    async initializeWebRTCAPI() {
        if (!this.supportedAPIs.get('WebRTC')) return;
        
        this.features.webRTC = {
            async createPeerConnection(configuration = {}) {
                const defaultConfig = {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' }
                    ]
                };
                
                const pc = new RTCPeerConnection({ ...defaultConfig, ...configuration });
                
                pc.addEventListener('icecandidate', (event) => {
                    if (event.candidate) {
                        console.log('ICE candidate:', event.candidate);
                    }
                });
                
                pc.addEventListener('connectionstatechange', () => {
                    console.log('Connection state:', pc.connectionState);
                });
                
                return pc;
            },
            
            async getUserMedia(constraints = { video: true, audio: true }) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia(constraints);
                    return stream;
                } catch (error) {
                    console.error('getUserMedia failed:', error);
                    throw error;
                }
            },
            
            async getDisplayMedia(constraints = { video: true }) {
                try {
                    const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
                    return stream;
                } catch (error) {
                    console.error('getDisplayMedia failed:', error);
                    throw error;
                }
            },
            
            async createDataChannel(peerConnection, label, options = {}) {
                const channel = peerConnection.createDataChannel(label, options);
                
                channel.addEventListener('open', () => {
                    console.log('Data channel opened:', label);
                });
                
                channel.addEventListener('message', (event) => {
                    console.log('Data channel message:', event.data);
                });
                
                return channel;
            }
        };
        
        console.log('🎥 WebRTC API initialized');
    }

    async initializeWebXRAPI() {
        if (!this.supportedAPIs.get('WebXR')) return;
        
        this.features.webXR = {
            async isSessionSupported(mode = 'immersive-vr') {
                try {
                    return await navigator.xr.isSessionSupported(mode);
                } catch (error) {
                    console.error('XR session support check failed:', error);
                    return false;
                }
            },
            
            async requestSession(mode = 'immersive-vr', options = {}) {
                try {
                    const session = await navigator.xr.requestSession(mode, options);
                    
                    session.addEventListener('end', () => {
                        console.log('XR session ended');
                    });
                    
                    return session;
                } catch (error) {
                    console.error('XR session request failed:', error);
                    throw error;
                }
            },
            
            async startARSession() {
                const supported = await this.isSessionSupported('immersive-ar');
                if (!supported) {
                    throw new Error('AR not supported');
                }
                
                return this.requestSession('immersive-ar', {
                    requiredFeatures: ['local-floor']
                });
            },
            
            async startVRSession() {
                const supported = await this.isSessionSupported('immersive-vr');
                if (!supported) {
                    throw new Error('VR not supported');
                }
                
                return this.requestSession('immersive-vr', {
                    requiredFeatures: ['local-floor']
                });
            }
        };
        
        console.log('🥽 WebXR API initialized');
    }

    async initializePaymentRequestAPI() {
        if (!this.supportedAPIs.get('Payment Request')) return;
        
        this.features.paymentRequest = {
            async createPaymentRequest(methodData, details, options = {}) {
                try {
                    const request = new PaymentRequest(methodData, details, options);
                    
                    request.addEventListener('paymentmethodchange', (event) => {
                        console.log('Payment method changed:', event.methodName);
                    });
                    
                    return request;
                } catch (error) {
                    console.error('Payment request creation failed:', error);
                    throw error;
                }
            },
            
            async processPayment(amount, currency = 'USD', label = 'Total') {
                const methodData = [{
                    supportedMethods: 'basic-card',
                    data: {
                        supportedNetworks: ['visa', 'mastercard', 'amex']
                    }
                }];
                
                const details = {
                    total: {
                        label: label,
                        amount: {
                            currency: currency,
                            value: amount.toString()
                        }
                    }
                };
                
                const request = await this.createPaymentRequest(methodData, details);
                
                try {
                    const response = await request.show();
                    await response.complete('success');
                    return response;
                } catch (error) {
                    console.error('Payment processing failed:', error);
                    throw error;
                }
            },
            
            async canMakePayment(methodData, details) {
                try {
                    const request = await this.createPaymentRequest(methodData, details);
                    return await request.canMakePayment();
                } catch (error) {
                    console.error('Payment capability check failed:', error);
                    return false;
                }
            }
        };
        
        console.log('💳 Payment Request API initialized');
    }

    async initializeWebLocksAPI() {
        if (!this.supportedAPIs.get('Web Locks')) return;
        
        this.features.webLocks = {
            async acquireLock(name, callback, options = {}) {
                try {
                    return await navigator.locks.request(name, options, callback);
                } catch (error) {
                    console.error('Lock acquisition failed:', error);
                    throw error;
                }
            },
            
            async query() {
                try {
                    return await navigator.locks.query();
                } catch (error) {
                    console.error('Lock query failed:', error);
                    throw error;
                }
            },
            
            async withLock(name, callback, options = {}) {
                return this.acquireLock(name, async (lock) => {
                    console.log(`Lock acquired: ${name}`);
                    try {
                        return await callback(lock);
                    } finally {
                        console.log(`Lock released: ${name}`);
                    }
                }, options);
            }
        };
        
        console.log('🔒 Web Locks API initialized');
    }

    async initializeBackgroundSyncAPI() {
        if (!this.supportedAPIs.get('Background Sync')) return;
        
        this.features.backgroundSync = {
            async register(tag) {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    await registration.sync.register(tag);
                    console.log('Background sync registered:', tag);
                } catch (error) {
                    console.error('Background sync registration failed:', error);
                    throw error;
                }
            },
            
            async getTags() {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    return await registration.sync.getTags();
                } catch (error) {
                    console.error('Background sync tags query failed:', error);
                    throw error;
                }
            }
        };
        
        console.log('🔄 Background Sync API initialized');
    }

    async initializeWebCryptoAPI() {
        if (!this.supportedAPIs.get('Web Crypto')) return;
        
        this.features.webCrypto = {
            async generateKey(algorithm, extractable = false, keyUsages = ['encrypt', 'decrypt']) {
                try {
                    return await crypto.subtle.generateKey(algorithm, extractable, keyUsages);
                } catch (error) {
                    console.error('Key generation failed:', error);
                    throw error;
                }
            },
            
            async encrypt(algorithm, key, data) {
                try {
                    const encoder = new TextEncoder();
                    const encodedData = typeof data === 'string' ? encoder.encode(data) : data;
                    return await crypto.subtle.encrypt(algorithm, key, encodedData);
                } catch (error) {
                    console.error('Encryption failed:', error);
                    throw error;
                }
            },
            
            async decrypt(algorithm, key, encryptedData) {
                try {
                    const decryptedData = await crypto.subtle.decrypt(algorithm, key, encryptedData);
                    const decoder = new TextDecoder();
                    return decoder.decode(decryptedData);
                } catch (error) {
                    console.error('Decryption failed:', error);
                    throw error;
                }
            },
            
            async hash(algorithm, data) {
                try {
                    const encoder = new TextEncoder();
                    const encodedData = typeof data === 'string' ? encoder.encode(data) : data;
                    const hashBuffer = await crypto.subtle.digest(algorithm, encodedData);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                } catch (error) {
                    console.error('Hashing failed:', error);
                    throw error;
                }
            },
            
            generateRandomBytes(length) {
                return crypto.getRandomValues(new Uint8Array(length));
            }
        };
        
        console.log('🔐 Web Crypto API initialized');
    }

    async initializeNotificationsAPI() {
        if (!this.supportedAPIs.get('Notifications')) return;
        
        this.features.notifications = {
            async requestPermission() {
                try {
                    const permission = await Notification.requestPermission();
                    console.log('Notification permission:', permission);
                    return permission;
                } catch (error) {
                    console.error('Notification permission request failed:', error);
                    throw error;
                }
            },
            
            async showNotification(title, options = {}) {
                if (Notification.permission !== 'granted') {
                    await this.requestPermission();
                }
                
                if (Notification.permission === 'granted') {
                    const notification = new Notification(title, {
                        icon: '/favicon.ico',
                        badge: '/favicon.ico',
                        ...options
                    });
                    
                    notification.addEventListener('click', () => {
                        window.focus();
                        notification.close();
                    });
                    
                    return notification;
                } else {
                    throw new Error('Notification permission denied');
                }
            },
            
            getPermission() {
                return Notification.permission;
            }
        };
        
        console.log('🔔 Notifications API initialized');
    }

    async createAPIPanel() {
        const panel = document.createElement('div');
        panel.id = 'modern-apis-panel';
        panel.innerHTML = `
            <style>
                #modern-apis-panel {
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    width: 400px;
                    max-height: 70vh;
                    background: rgba(0, 0, 0, 0.95);
                    color: white;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    font-size: 14px;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                    z-index: 10004;
                    transform: translateY(100%);
                    transition: transform 0.3s ease;
                    border: 1px solid #333;
                    overflow: hidden;
                }
                
                #modern-apis-panel.active {
                    transform: translateY(0);
                }
                
                .apis-header {
                    background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
                    padding: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .apis-title {
                    font-weight: bold;
                    font-size: 16px;
                }
                
                .apis-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                }
                
                .apis-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                
                .apis-content {
                    max-height: calc(70vh - 80px);
                    overflow-y: auto;
                }
                
                .apis-tabs {
                    display: flex;
                    background: #1a1a1a;
                    border-bottom: 1px solid #333;
                }
                
                .api-tab {
                    flex: 1;
                    background: none;
                    border: none;
                    color: #ccc;
                    padding: 12px 8px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s;
                    border-bottom: 2px solid transparent;
                }
                
                .api-tab:hover {
                    background: #333;
                    color: white;
                }
                
                .api-tab.active {
                    color: #4ecdc4;
                    border-bottom-color: #4ecdc4;
                    background: #222;
                }
                
                .api-section {
                    padding: 16px;
                    display: none;
                }
                
                .api-section.active {
                    display: block;
                }
                
                .api-feature {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid #333;
                    border-radius: 8px;
                    margin-bottom: 12px;
                    overflow: hidden;
                }
                
                .feature-header {
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.02);
                    border-bottom: 1px solid #333;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .feature-name {
                    font-weight: bold;
                    color: #4ecdc4;
                }
                
                .feature-status {
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: bold;
                }
                
                .feature-status.supported {
                    background: #4caf50;
                    color: white;
                }
                
                .feature-status.unsupported {
                    background: #f44336;
                    color: white;
                }
                
                .feature-actions {
                    padding: 12px;
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                
                .api-btn {
                    background: #4ecdc4;
                    border: none;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: background 0.2s;
                }
                
                .api-btn:hover {
                    background: #45b7aa;
                }
                
                .api-btn:disabled {
                    background: #666;
                    cursor: not-allowed;
                }
                
                .api-btn.secondary {
                    background: #333;
                }
                
                .api-btn.secondary:hover {
                    background: #444;
                }
                
                .api-output {
                    background: #1a1a1a;
                    border: 1px solid #333;
                    border-radius: 4px;
                    padding: 8px;
                    margin-top: 8px;
                    font-family: monospace;
                    font-size: 11px;
                    max-height: 100px;
                    overflow-y: auto;
                    color: #4ecdc4;
                }
                
                .apis-toggle {
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
                    border: none;
                    color: white;
                    padding: 12px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 16px;
                    box-shadow: 0 4px 15px rgba(78, 205, 196, 0.4);
                    z-index: 10005;
                    transition: all 0.3s ease;
                }
                
                .apis-toggle:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 20px rgba(78, 205, 196, 0.6);
                }
                
                .apis-toggle.panel-open {
                    left: 440px;
                }
            </style>
            
            <div class="apis-header">
                <div class="apis-title">🌐 Modern Web APIs</div>
                <button class="apis-close">×</button>
            </div>
            
            <div class="apis-content">
                <div class="apis-tabs">
                    <button class="api-tab active" data-tab="file">File</button>
                    <button class="api-tab" data-tab="share">Share</button>
                    <button class="api-tab" data-tab="bluetooth">BT</button>
                    <button class="api-tab" data-tab="rtc">RTC</button>
                    <button class="api-tab" data-tab="xr">XR</button>
                    <button class="api-tab" data-tab="crypto">Crypto</button>
                </div>
                
                <div class="api-section active" id="file-section">
                    <div class="api-feature">
                        <div class="feature-header">
                            <div class="feature-name">File System Access</div>
                            <div class="feature-status ${this.supportedAPIs.get('File System Access') ? 'supported' : 'unsupported'}">
                                ${this.supportedAPIs.get('File System Access') ? 'Supported' : 'Unsupported'}
                            </div>
                        </div>
                        <div class="feature-actions">
                            <button class="api-btn" onclick="window.modernWebAPIs.demoFileOpen()" ${!this.supportedAPIs.get('File System Access') ? 'disabled' : ''}>
                                Open File
                            </button>
                            <button class="api-btn" onclick="window.modernWebAPIs.demoFileSave()" ${!this.supportedAPIs.get('File System Access') ? 'disabled' : ''}>
                                Save File
                            </button>
                            <button class="api-btn" onclick="window.modernWebAPIs.demoDirectoryOpen()" ${!this.supportedAPIs.get('File System Access') ? 'disabled' : ''}>
                                Open Directory
                            </button>
                        </div>
                        <div class="api-output" id="file-output"></div>
                    </div>
                </div>
                
                <div class="api-section" id="share-section">
                    <div class="api-feature">
                        <div class="feature-header">
                            <div class="feature-name">Web Share</div>
                            <div class="feature-status ${this.supportedAPIs.get('Web Share') ? 'supported' : 'unsupported'}">
                                ${this.supportedAPIs.get('Web Share') ? 'Supported' : 'Unsupported'}
                            </div>
                        </div>
                        <div class="feature-actions">
                            <button class="api-btn" onclick="window.modernWebAPIs.demoShareText()" ${!this.supportedAPIs.get('Web Share') ? 'disabled' : ''}>
                                Share Text
                            </button>
                            <button class="api-btn" onclick="window.modernWebAPIs.demoShareURL()" ${!this.supportedAPIs.get('Web Share') ? 'disabled' : ''}>
                                Share URL
                            </button>
                        </div>
                        <div class="api-output" id="share-output"></div>
                    </div>
                </div>
                
                <div class="api-section" id="bluetooth-section">
                    <div class="api-feature">
                        <div class="feature-header">
                            <div class="feature-name">Web Bluetooth</div>
                            <div class="feature-status ${this.supportedAPIs.get('Web Bluetooth') ? 'supported' : 'unsupported'}">
                                ${this.supportedAPIs.get('Web Bluetooth') ? 'Supported' : 'Unsupported'}
                            </div>
                        </div>
                        <div class="feature-actions">
                            <button class="api-btn" onclick="window.modernWebAPIs.demoBluetoothScan()" ${!this.supportedAPIs.get('Web Bluetooth') ? 'disabled' : ''}>
                                Scan Devices
                            </button>
                            <button class="api-btn secondary" onclick="window.modernWebAPIs.demoBluetoothStatus()">
                                Show Status
                            </button>
                        </div>
                        <div class="api-output" id="bluetooth-output"></div>
                    </div>
                </div>
                
                <div class="api-section" id="rtc-section">
                    <div class="api-feature">
                        <div class="feature-header">
                            <div class="feature-name">WebRTC</div>
                            <div class="feature-status ${this.supportedAPIs.get('WebRTC') ? 'supported' : 'unsupported'}">
                                ${this.supportedAPIs.get('WebRTC') ? 'Supported' : 'Unsupported'}
                            </div>
                        </div>
                        <div class="feature-actions">
                            <button class="api-btn" onclick="window.modernWebAPIs.demoGetUserMedia()" ${!this.supportedAPIs.get('WebRTC') ? 'disabled' : ''}>
                                Get Camera
                            </button>
                            <button class="api-btn" onclick="window.modernWebAPIs.demoGetDisplayMedia()" ${!this.supportedAPIs.get('WebRTC') ? 'disabled' : ''}>
                                Screen Share
                            </button>
                            <button class="api-btn secondary" onclick="window.modernWebAPIs.demoCreatePeerConnection()" ${!this.supportedAPIs.get('WebRTC') ? 'disabled' : ''}>
                                Create Peer
                            </button>
                        </div>
                        <div class="api-output" id="rtc-output"></div>
                    </div>
                </div>
                
                <div class="api-section" id="xr-section">
                    <div class="api-feature">
                        <div class="feature-header">
                            <div class="feature-name">WebXR</div>
                            <div class="feature-status ${this.supportedAPIs.get('WebXR') ? 'supported' : 'unsupported'}">
                                ${this.supportedAPIs.get('WebXR') ? 'Supported' : 'Unsupported'}
                            </div>
                        </div>
                        <div class="feature-actions">
                            <button class="api-btn" onclick="window.modernWebAPIs.demoCheckVRSupport()" ${!this.supportedAPIs.get('WebXR') ? 'disabled' : ''}>
                                Check VR
                            </button>
                            <button class="api-btn" onclick="window.modernWebAPIs.demoCheckARSupport()" ${!this.supportedAPIs.get('WebXR') ? 'disabled' : ''}>
                                Check AR
                            </button>
                        </div>
                        <div class="api-output" id="xr-output"></div>
                    </div>
                </div>
                
                <div class="api-section" id="crypto-section">
                    <div class="api-feature">
                        <div class="feature-header">
                            <div class="feature-name">Web Crypto</div>
                            <div class="feature-status ${this.supportedAPIs.get('Web Crypto') ? 'supported' : 'unsupported'}">
                                ${this.supportedAPIs.get('Web Crypto') ? 'Supported' : 'Unsupported'}
                            </div>
                        </div>
                        <div class="feature-actions">
                            <button class="api-btn" onclick="window.modernWebAPIs.demoHash()" ${!this.supportedAPIs.get('Web Crypto') ? 'disabled' : ''}>
                                Hash Text
                            </button>
                            <button class="api-btn" onclick="window.modernWebAPIs.demoEncryption()" ${!this.supportedAPIs.get('Web Crypto') ? 'disabled' : ''}>
                                Encrypt/Decrypt
                            </button>
                            <button class="api-btn secondary" onclick="window.modernWebAPIs.demoRandomBytes()" ${!this.supportedAPIs.get('Web Crypto') ? 'disabled' : ''}>
                                Random Bytes
                            </button>
                        </div>
                        <div class="api-output" id="crypto-output"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'apis-toggle';
        toggleBtn.innerHTML = '🌐';
        toggleBtn.title = 'Toggle Modern Web APIs';
        
        document.body.appendChild(panel);
        document.body.appendChild(toggleBtn);
        
        this.apiPanel = panel;
        this.setupPanelInteractions(panel, toggleBtn);
        
        console.log('🎛️ Modern Web APIs Panel created');
    }

    setupPanelInteractions(panel, toggleBtn) {
        // Toggle panel
        toggleBtn.addEventListener('click', () => {
            const isActive = panel.classList.contains('active');
            if (isActive) {
                panel.classList.remove('active');
                toggleBtn.classList.remove('panel-open');
            } else {
                panel.classList.add('active');
                toggleBtn.classList.add('panel-open');
            }
        });
        
        // Close panel
        panel.querySelector('.apis-close').addEventListener('click', () => {
            panel.classList.remove('active');
            toggleBtn.classList.remove('panel-open');
        });
        
        // Tab switching
        const tabs = panel.querySelectorAll('.api-tab');
        const sections = panel.querySelectorAll('.api-section');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));
                
                tab.classList.add('active');
                const targetSection = document.getElementById(`${tab.dataset.tab}-section`);
                if (targetSection) {
                    targetSection.classList.add('active');
                }
            });
        });
    }

    // Demo methods for the panel
    async demoFileOpen() {
        if (!this.features.fileSystem) return;
        
        try {
            const result = await this.features.fileSystem.openFile();
            this.updateOutput('file-output', `File opened: ${result.file.name} (${result.file.size} bytes)`);
        } catch (error) {
            this.updateOutput('file-output', `Error: ${error.message}`);
        }
    }

    async demoFileSave() {
        if (!this.features.fileSystem) return;
        
        try {
            const content = `TalkToApp Demo File\nGenerated at: ${new Date().toISOString()}`;
            await this.features.fileSystem.saveFile(content, {
                suggestedName: 'talktoapp-demo.txt'
            });
            this.updateOutput('file-output', 'File saved successfully');
        } catch (error) {
            this.updateOutput('file-output', `Error: ${error.message}`);
        }
    }

    async demoDirectoryOpen() {
        if (!this.features.fileSystem) return;
        
        try {
            const result = await this.features.fileSystem.openDirectory();
            this.updateOutput('file-output', `Directory opened with ${result.files.length} items`);
        } catch (error) {
            this.updateOutput('file-output', `Error: ${error.message}`);
        }
    }

    async demoShareText() {
        if (!this.features.webShare) return;
        
        try {
            await this.features.webShare.shareText(
                'Check out TalkToApp - Advanced AI Chat Application!',
                'TalkToApp',
                window.location.href
            );
            this.updateOutput('share-output', 'Text shared successfully');
        } catch (error) {
            this.updateOutput('share-output', `Error: ${error.message}`);
        }
    }

    async demoShareURL() {
        if (!this.features.webShare) return;
        
        try {
            await this.features.webShare.share({
                title: 'TalkToApp',
                text: 'Advanced AI Chat Application with Modern Web APIs',
                url: window.location.href
            });
            this.updateOutput('share-output', 'URL shared successfully');
        } catch (error) {
            this.updateOutput('share-output', `Error: ${error.message}`);
        }
    }

    async demoBluetoothScan() {
        if (!this.features.webBluetooth) return;
        
        try {
            const device = await this.features.webBluetooth.scanDevices({
                acceptAllDevices: true
            });
            this.updateOutput('bluetooth-output', `Device found: ${device.name || 'Unknown'} (${device.id})`);
        } catch (error) {
            this.updateOutput('bluetooth-output', `Error: ${error.message}`);
        }
    }

    demoBluetoothStatus() {
        const connected = this.features.webBluetooth?.getConnectedDevices() || [];
        this.updateOutput('bluetooth-output', `Connected devices: ${connected.length}`);
    }

    async demoGetUserMedia() {
        if (!this.features.webRTC) return;
        
        try {
            const stream = await this.features.webRTC.getUserMedia({ video: true, audio: false });
            this.updateOutput('rtc-output', `Camera stream obtained: ${stream.getVideoTracks().length} video tracks`);
            
            // Stop the stream after demo
            setTimeout(() => {
                stream.getTracks().forEach(track => track.stop());
            }, 3000);
        } catch (error) {
            this.updateOutput('rtc-output', `Error: ${error.message}`);
        }
    }

    async demoGetDisplayMedia() {
        if (!this.features.webRTC) return;
        
        try {
            const stream = await this.features.webRTC.getDisplayMedia();
            this.updateOutput('rtc-output', `Screen share obtained: ${stream.getVideoTracks().length} video tracks`);
            
            // Stop the stream after demo
            setTimeout(() => {
                stream.getTracks().forEach(track => track.stop());
            }, 3000);
        } catch (error) {
            this.updateOutput('rtc-output', `Error: ${error.message}`);
        }
    }

    async demoCreatePeerConnection() {
        if (!this.features.webRTC) return;
        
        try {
            const pc = await this.features.webRTC.createPeerConnection();
            this.updateOutput('rtc-output', `Peer connection created: ${pc.connectionState}`);
        } catch (error) {
            this.updateOutput('rtc-output', `Error: ${error.message}`);
        }
    }

    async demoCheckVRSupport() {
        if (!this.features.webXR) return;
        
        try {
            const supported = await this.features.webXR.isSessionSupported('immersive-vr');
            this.updateOutput('xr-output', `VR support: ${supported ? 'Yes' : 'No'}`);
        } catch (error) {
            this.updateOutput('xr-output', `Error: ${error.message}`);
        }
    }

    async demoCheckARSupport() {
        if (!this.features.webXR) return;
        
        try {
            const supported = await this.features.webXR.isSessionSupported('immersive-ar');
            this.updateOutput('xr-output', `AR support: ${supported ? 'Yes' : 'No'}`);
        } catch (error) {
            this.updateOutput('xr-output', `Error: ${error.message}`);
        }
    }

    async demoHash() {
        if (!this.features.webCrypto) return;
        
        try {
            const text = 'Hello, TalkToApp!';
            const hash = await this.features.webCrypto.hash('SHA-256', text);
            this.updateOutput('crypto-output', `SHA-256: ${hash.substring(0, 32)}...`);
        } catch (error) {
            this.updateOutput('crypto-output', `Error: ${error.message}`);
        }
    }

    async demoEncryption() {
        if (!this.features.webCrypto) return;
        
        try {
            const key = await this.features.webCrypto.generateKey(
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt', 'decrypt']
            );
            
            const text = 'Secret message';
            const iv = this.features.webCrypto.generateRandomBytes(12);
            
            const encrypted = await this.features.webCrypto.encrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                text
            );
            
            const decrypted = await this.features.webCrypto.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                encrypted
            );
            
            this.updateOutput('crypto-output', `Encrypted and decrypted: "${decrypted}"`);
        } catch (error) {
            this.updateOutput('crypto-output', `Error: ${error.message}`);
        }
    }

    demoRandomBytes() {
        if (!this.features.webCrypto) return;
        
        const bytes = this.features.webCrypto.generateRandomBytes(16);
        const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
        this.updateOutput('crypto-output', `Random bytes: ${hex}`);
    }

    updateOutput(elementId, message) {
        const output = document.getElementById(elementId);
        if (output) {
            output.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
        }
    }

    // Public API
    getFeature(name) {
        return this.features[name];
    }

    isSupported(apiName) {
        return this.supportedAPIs.get(apiName) || false;
    }

    getSupportedAPIs() {
        return Array.from(this.supportedAPIs.entries())
            .filter(([name, supported]) => supported)
            .map(([name]) => name);
    }

    getUnsupportedAPIs() {
        return Array.from(this.supportedAPIs.entries())
            .filter(([name, supported]) => !supported)
            .map(([name]) => name);
    }

    // Cleanup
    destroy() {
        // Close active connections
        this.activeConnections.forEach((connection, id) => {
            if (connection.server && connection.server.connected) {
                connection.server.disconnect();
            }
        });
        this.activeConnections.clear();
        
        // Remove panel
        if (this.apiPanel) {
            this.apiPanel.remove();
        }
        
        const toggleBtn = document.querySelector('.apis-toggle');
        if (toggleBtn) {
            toggleBtn.remove();
        }
        
        console.log('🧹 Modern Web APIs destroyed');
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.modernWebAPIs = new ModernWebAPIs();
    });
} else {
    window.modernWebAPIs = new ModernWebAPIs();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModernWebAPIs;
}