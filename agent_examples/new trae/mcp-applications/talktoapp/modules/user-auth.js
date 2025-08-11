/**
 * User Authentication & Personalization System
 * Handles user accounts, preferences, and personalized experiences
 */

class UserAuthentication {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.authProviders = new Map();
        this.userPreferences = {};
        this.userProjects = [];
        this.authModal = null;
        
        this.init();
    }

    async init() {
        this.loadStoredAuth();
        this.createAuthUI();
        this.setupEventListeners();
        await this.checkAuthStatus();
        this.loadUserPreferences();
        this.setupPersonalization();
        
        // Setup auth providers after everything else is initialized
        setTimeout(() => {
            this.setupAuthProviders();
        }, 0);
    }

    setupAuthProviders() {
        try {
            // Local authentication
            this.authProviders.set('local', {
                name: 'Local Account',
                icon: '👤',
                color: '#4ecdc4',
                authenticate: this.authenticateLocal ? this.authenticateLocal.bind(this) : () => Promise.reject('Method not available'),
                register: this.registerLocal ? this.registerLocal.bind(this) : () => Promise.reject('Method not available')
            });

            // Guest mode
            this.authProviders.set('guest', {
                name: 'Continue as Guest',
                icon: '👻',
                color: '#95a5a6',
                authenticate: this.authenticateGuest ? this.authenticateGuest.bind(this) : () => Promise.reject('Method not available')
            });

            // Demo OAuth providers (would integrate with real services)
            this.authProviders.set('google', {
                name: 'Google',
                icon: '🔍',
                color: '#db4437',
                authenticate: this.authenticateOAuth ? this.authenticateOAuth.bind(this, 'google') : () => Promise.reject('Method not available')
            });

            this.authProviders.set('github', {
                name: 'GitHub',
                icon: '🐙',
                color: '#333',
                authenticate: this.authenticateOAuth ? this.authenticateOAuth.bind(this, 'github') : () => Promise.reject('Method not available')
            });
        } catch (error) {
            console.warn('Error setting up auth providers:', error);
            // Fallback providers
            this.authProviders.set('guest', {
                name: 'Continue as Guest',
                icon: '👻',
                color: '#95a5a6',
                authenticate: () => Promise.resolve({ id: 'guest', name: 'Guest User', email: 'guest@talktoapp.com' })
            });
        }
    }

    loadStoredAuth() {
        const storedAuth = localStorage.getItem('talktoapp_auth');
        if (storedAuth) {
            try {
                const authData = JSON.parse(storedAuth);
                if (this.isValidAuthData(authData)) {
                    this.currentUser = authData.user;
                    this.isAuthenticated = true;
                }
            } catch (error) {
                console.error('Failed to load stored auth:', error);
                localStorage.removeItem('talktoapp_auth');
            }
        }
    }

    isValidAuthData(authData) {
        return authData && 
               authData.user && 
               authData.timestamp && 
               (Date.now() - authData.timestamp) < (30 * 24 * 60 * 60 * 1000); // 30 days
    }

    createAuthUI() {
        // Create auth modal
        this.authModal = document.createElement('div');
        this.authModal.id = 'auth-modal';
        this.authModal.className = 'auth-modal hidden';
        this.authModal.innerHTML = this.getAuthModalHTML();

        // Create user menu
        const userMenu = document.createElement('div');
        userMenu.id = 'user-menu';
        userMenu.className = 'user-menu';
        userMenu.innerHTML = this.getUserMenuHTML();

        // Add styles
        const style = document.createElement('style');
        style.textContent = this.getAuthStyles();
        document.head.appendChild(style);

        document.body.appendChild(this.authModal);
        document.body.appendChild(userMenu);

        this.updateAuthUI();
    }

    getAuthModalHTML() {
        return `
            <div class="auth-modal-overlay" onclick="userAuth.hideAuthModal()"></div>
            <div class="auth-modal-content">
                <div class="auth-header">
                    <h2 id="auth-title">Welcome to TalkToApp</h2>
                    <button class="auth-close" onclick="userAuth.hideAuthModal()">×</button>
                </div>
                
                <div class="auth-tabs">
                    <button class="auth-tab active" data-tab="signin" onclick="userAuth.switchAuthTab('signin')">
                        Sign In
                    </button>
                    <button class="auth-tab" data-tab="signup" onclick="userAuth.switchAuthTab('signup')">
                        Sign Up
                    </button>
                </div>
                
                <div class="auth-content">
                    <!-- Sign In Form -->
                    <div id="signin-form" class="auth-form active">
                        <div class="auth-providers">
                            ${this.getAuthProvidersHTML()}
                        </div>
                        
                        <div class="auth-divider">
                            <span>or</span>
                        </div>
                        
                        <form onsubmit="userAuth.handleLocalAuth(event, 'signin')">
                            <div class="form-group">
                                <input type="email" id="signin-email" placeholder="Email" required>
                            </div>
                            <div class="form-group">
                                <input type="password" id="signin-password" placeholder="Password" required>
                            </div>
                            <button type="submit" class="auth-submit-btn">Sign In</button>
                        </form>
                        
                        <div class="auth-footer">
                            <a href="#" onclick="userAuth.showForgotPassword()">Forgot password?</a>
                        </div>
                    </div>
                    
                    <!-- Sign Up Form -->
                    <div id="signup-form" class="auth-form">
                        <div class="auth-providers">
                            ${this.getAuthProvidersHTML()}
                        </div>
                        
                        <div class="auth-divider">
                            <span>or</span>
                        </div>
                        
                        <form onsubmit="userAuth.handleLocalAuth(event, 'signup')">
                            <div class="form-group">
                                <input type="text" id="signup-name" placeholder="Full Name" required>
                            </div>
                            <div class="form-group">
                                <input type="email" id="signup-email" placeholder="Email" required>
                            </div>
                            <div class="form-group">
                                <input type="password" id="signup-password" placeholder="Password" required>
                            </div>
                            <div class="form-group">
                                <input type="password" id="signup-confirm" placeholder="Confirm Password" required>
                            </div>
                            <button type="submit" class="auth-submit-btn">Create Account</button>
                        </form>
                        
                        <div class="auth-footer">
                            <small>By signing up, you agree to our Terms of Service and Privacy Policy.</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getAuthProvidersHTML() {
        let html = '';
        this.authProviders.forEach((provider, key) => {
            html += `
                <button class="auth-provider-btn" 
                        style="border-color: ${provider.color}; color: ${provider.color};"
                        onclick="userAuth.authenticateWith('${key}')">
                    <span class="provider-icon">${provider.icon}</span>
                    <span class="provider-name">${provider.name}</span>
                </button>
            `;
        });
        return html;
    }

    getUserMenuHTML() {
        return `
            <div class="user-menu-trigger" onclick="userAuth.toggleUserMenu()">
                <div class="user-avatar" id="user-avatar">
                    <span id="user-avatar-text">?</span>
                </div>
                <span id="user-name">Guest</span>
                <span class="menu-arrow">▼</span>
            </div>
            
            <div class="user-menu-dropdown" id="user-menu-dropdown">
                <div class="user-info">
                    <div class="user-avatar-large">
                        <span id="user-avatar-large-text">?</span>
                    </div>
                    <div class="user-details">
                        <div class="user-name-large" id="user-name-large">Guest User</div>
                        <div class="user-email" id="user-email">guest@talktoapp.com</div>
                    </div>
                </div>
                
                <div class="menu-divider"></div>
                
                <div class="menu-items">
                    <a href="#" class="menu-item" onclick="userAuth.showProfile()">
                        <span class="menu-icon">👤</span>
                        <span>Profile</span>
                    </a>
                    <a href="#" class="menu-item" onclick="userAuth.showPreferences()">
                        <span class="menu-icon">⚙️</span>
                        <span>Preferences</span>
                    </a>
                    <a href="#" class="menu-item" onclick="userAuth.showProjects()">
                        <span class="menu-icon">📁</span>
                        <span>My Projects</span>
                    </a>
                    <a href="#" class="menu-item" onclick="userAuth.showUsage()">
                        <span class="menu-icon">📊</span>
                        <span>Usage Stats</span>
                    </a>
                    
                    <div class="menu-divider"></div>
                    
                    <a href="#" class="menu-item" onclick="userAuth.exportData()">
                        <span class="menu-icon">📤</span>
                        <span>Export Data</span>
                    </a>
                    <a href="#" class="menu-item" onclick="userAuth.showHelp()">
                        <span class="menu-icon">❓</span>
                        <span>Help & Support</span>
                    </a>
                    
                    <div class="menu-divider"></div>
                    
                    <a href="#" class="menu-item danger" onclick="userAuth.signOut()">
                        <span class="menu-icon">🚪</span>
                        <span>Sign Out</span>
                    </a>
                </div>
            </div>
        `;
    }

    getAuthStyles() {
        return `
            .auth-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }

            .auth-modal.hidden {
                opacity: 0;
                pointer-events: none;
            }

            .auth-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(5px);
            }

            .auth-modal-content {
                position: relative;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 20px;
                padding: 0;
                width: 90%;
                max-width: 450px;
                max-height: 90vh;
                overflow: hidden;
                animation: modalSlideIn 0.3s ease;
            }

            @keyframes modalSlideIn {
                from { transform: translateY(-50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            .auth-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 25px 30px;
                background: linear-gradient(135deg, #00ff88, #00cc6a);
                color: black;
            }

            .auth-header h2 {
                margin: 0;
                font-size: 20px;
                font-weight: bold;
            }

            .auth-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: black;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.2s ease;
            }

            .auth-close:hover {
                background: rgba(0, 0, 0, 0.1);
            }

            .auth-tabs {
                display: flex;
                background: rgba(255, 255, 255, 0.05);
            }

            .auth-tab {
                flex: 1;
                padding: 15px;
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.7);
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.3s ease;
                border-bottom: 2px solid transparent;
            }

            .auth-tab.active {
                color: #00ff88;
                border-bottom-color: #00ff88;
                background: rgba(0, 255, 136, 0.1);
            }

            .auth-content {
                padding: 30px;
                color: white;
            }

            .auth-form {
                display: none;
            }

            .auth-form.active {
                display: block;
            }

            .auth-providers {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-bottom: 25px;
            }

            .auth-provider-btn {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                color: white;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.3s ease;
                text-align: left;
            }

            .auth-provider-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                transform: translateY(-1px);
            }

            .provider-icon {
                font-size: 18px;
            }

            .provider-name {
                flex: 1;
            }

            .auth-divider {
                text-align: center;
                margin: 25px 0;
                position: relative;
                color: rgba(255, 255, 255, 0.5);
            }

            .auth-divider::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 0;
                right: 0;
                height: 1px;
                background: rgba(255, 255, 255, 0.2);
            }

            .auth-divider span {
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
                padding: 0 15px;
                position: relative;
            }

            .form-group {
                margin-bottom: 20px;
            }

            .form-group input {
                width: 100%;
                padding: 12px 16px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                color: white;
                font-size: 14px;
                outline: none;
                transition: all 0.3s ease;
                box-sizing: border-box;
            }

            .form-group input:focus {
                border-color: #00ff88;
                box-shadow: 0 0 0 2px rgba(0, 255, 136, 0.2);
            }

            .form-group input::placeholder {
                color: rgba(255, 255, 255, 0.5);
            }

            .auth-submit-btn {
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, #00ff88, #00cc6a);
                border: none;
                border-radius: 8px;
                color: black;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-top: 10px;
            }

            .auth-submit-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);
            }

            .auth-footer {
                text-align: center;
                margin-top: 20px;
                font-size: 12px;
                color: rgba(255, 255, 255, 0.7);
            }

            .auth-footer a {
                color: #00ff88;
                text-decoration: none;
            }

            .auth-footer a:hover {
                text-decoration: underline;
            }

            /* User Menu Styles */
            .user-menu {
                position: fixed;
                top: 20px;
                left: 20px;
                z-index: 9999;
            }

            .user-menu-trigger {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 25px;
                color: white;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s ease;
            }

            .user-menu-trigger:hover {
                background: rgba(255, 255, 255, 0.15);
                transform: translateY(-1px);
            }

            .user-avatar {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: linear-gradient(135deg, #00ff88, #00cc6a);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: black;
                font-size: 12px;
            }

            .menu-arrow {
                font-size: 10px;
                transition: transform 0.3s ease;
            }

            .user-menu.open .menu-arrow {
                transform: rotate(180deg);
            }

            .user-menu-dropdown {
                position: absolute;
                top: 100%;
                left: 0;
                margin-top: 10px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                min-width: 280px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                opacity: 0;
                transform: translateY(-10px);
                pointer-events: none;
                transition: all 0.3s ease;
                color: #333;
            }

            .user-menu.open .user-menu-dropdown {
                opacity: 1;
                transform: translateY(0);
                pointer-events: all;
            }

            .user-info {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 20px;
                border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            }

            .user-avatar-large {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: linear-gradient(135deg, #00ff88, #00cc6a);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: black;
                font-size: 18px;
            }

            .user-details {
                flex: 1;
            }

            .user-name-large {
                font-weight: bold;
                font-size: 16px;
                margin-bottom: 4px;
            }

            .user-email {
                font-size: 12px;
                color: #666;
            }

            .menu-divider {
                height: 1px;
                background: rgba(0, 0, 0, 0.1);
                margin: 8px 0;
            }

            .menu-items {
                padding: 8px 0;
            }

            .menu-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 20px;
                color: #333;
                text-decoration: none;
                font-size: 14px;
                transition: background 0.2s ease;
            }

            .menu-item:hover {
                background: rgba(0, 0, 0, 0.05);
            }

            .menu-item.danger {
                color: #e74c3c;
            }

            .menu-item.danger:hover {
                background: rgba(231, 76, 60, 0.1);
            }

            .menu-icon {
                font-size: 16px;
                width: 20px;
                text-align: center;
            }

            @media (max-width: 768px) {
                .auth-modal-content {
                    width: 95%;
                    margin: 20px;
                }

                .auth-content {
                    padding: 20px;
                }

                .user-menu {
                    position: relative;
                    top: auto;
                    left: auto;
                }

                .user-menu-dropdown {
                    position: fixed;
                    top: 60px;
                    left: 10px;
                    right: 10px;
                    width: auto;
                    min-width: auto;
                }
            }
        `;
    }

    setupEventListeners() {
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                this.closeUserMenu();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAuthModal();
                this.closeUserMenu();
            }
        });
    }

    async checkAuthStatus() {
        if (this.isAuthenticated && this.currentUser) {
            this.updateAuthUI();
            await this.loadUserData();
        } else {
            // Show auth modal for new users
            setTimeout(() => {
                if (!this.isAuthenticated) {
                    this.showAuthModal();
                }
            }, 2000);
        }
    }

    showAuthModal() {
        this.authModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    hideAuthModal() {
        this.authModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    switchAuthTab(tab) {
        // Update tabs
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Update forms
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById(`${tab}-form`).classList.add('active');

        // Update title
        const title = tab === 'signin' ? 'Welcome Back!' : 'Create Your Account';
        document.getElementById('auth-title').textContent = title;
    }

    async authenticateWith(provider) {
        try {
            const authProvider = this.authProviders.get(provider);
            if (!authProvider) throw new Error('Invalid provider');

            const user = await authProvider.authenticate();
            await this.handleAuthSuccess(user, provider);
        } catch (error) {
            this.handleAuthError(error);
        }
    }

    async authenticateLocal(email, password, isSignUp = false) {
        // Simulate local authentication
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (isSignUp) {
                    // Simulate account creation
                    const user = {
                        id: Date.now(),
                        email: email,
                        name: document.getElementById('signup-name')?.value || 'User',
                        provider: 'local',
                        avatar: null,
                        createdAt: new Date().toISOString(),
                        preferences: this.getDefaultPreferences()
                    };
                    resolve(user);
                } else {
                    // Simulate login validation
                    const storedUsers = JSON.parse(localStorage.getItem('talktoapp_users') || '[]');
                    const user = storedUsers.find(u => u.email === email);
                    
                    if (user) {
                        resolve(user);
                    } else {
                        reject(new Error('Invalid credentials'));
                    }
                }
            }, 1000);
        });
    }

    async authenticateGuest() {
        return {
            id: 'guest',
            email: 'guest@talktoapp.com',
            name: 'Guest User',
            provider: 'guest',
            avatar: null,
            isGuest: true,
            preferences: this.getDefaultPreferences()
        };
    }

    async authenticateOAuth(provider) {
        // Simulate OAuth authentication
        return new Promise((resolve) => {
            setTimeout(() => {
                const user = {
                    id: `${provider}_${Date.now()}`,
                    email: `user@${provider}.com`,
                    name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
                    provider: provider,
                    avatar: null,
                    preferences: this.getDefaultPreferences()
                };
                resolve(user);
            }, 1500);
        });
    }

    async handleLocalAuth(event, type) {
        event.preventDefault();
        
        const email = document.getElementById(`${type}-email`).value;
        const password = document.getElementById(`${type}-password`).value;
        
        if (type === 'signup') {
            const confirmPassword = document.getElementById('signup-confirm').value;
            if (password !== confirmPassword) {
                this.showAuthError('Passwords do not match');
                return;
            }
        }

        try {
            this.showAuthLoading(true);
            const user = await this.authenticateLocal(email, password, type === 'signup');
            
            if (type === 'signup') {
                // Store user for local auth
                const storedUsers = JSON.parse(localStorage.getItem('talktoapp_users') || '[]');
                storedUsers.push(user);
                localStorage.setItem('talktoapp_users', JSON.stringify(storedUsers));
            }
            
            await this.handleAuthSuccess(user, 'local');
        } catch (error) {
            this.handleAuthError(error);
        } finally {
            this.showAuthLoading(false);
        }
    }

    async handleAuthSuccess(user, provider) {
        this.currentUser = user;
        this.isAuthenticated = true;

        // Store auth data
        const authData = {
            user: user,
            provider: provider,
            timestamp: Date.now()
        };
        localStorage.setItem('talktoapp_auth', JSON.stringify(authData));

        // Load user data
        await this.loadUserData();
        
        // Update UI
        this.updateAuthUI();
        this.hideAuthModal();
        
        // Show welcome message
        this.showWelcomeMessage();

        // Track authentication
        if (window.performanceMonitor) {
            window.performanceMonitor.recordCustomMetric('user_auth', {
                provider: provider,
                isNewUser: !user.lastLogin
            });
        }
    }

    handleAuthError(error) {
        console.error('Authentication error:', error);
        this.showAuthError(error.message || 'Authentication failed');
    }

    showAuthError(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'auth-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10002;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    showAuthLoading(show) {
        const submitBtns = document.querySelectorAll('.auth-submit-btn');
        submitBtns.forEach(btn => {
            if (show) {
                btn.disabled = true;
                btn.textContent = 'Please wait...';
            } else {
                btn.disabled = false;
                btn.textContent = btn.closest('#signin-form') ? 'Sign In' : 'Create Account';
            }
        });
    }

    updateAuthUI() {
        if (this.isAuthenticated && this.currentUser) {
            // Update user menu
            const userName = document.getElementById('user-name');
            const userEmail = document.getElementById('user-email');
            const userNameLarge = document.getElementById('user-name-large');
            const userAvatar = document.getElementById('user-avatar-text');
            const userAvatarLarge = document.getElementById('user-avatar-large-text');

            if (userName) userName.textContent = this.currentUser.name;
            if (userEmail) userEmail.textContent = this.currentUser.email;
            if (userNameLarge) userNameLarge.textContent = this.currentUser.name;
            
            const initials = this.getInitials(this.currentUser.name);
            if (userAvatar) userAvatar.textContent = initials;
            if (userAvatarLarge) userAvatarLarge.textContent = initials;
        }
    }

    getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    toggleUserMenu() {
        const userMenu = document.getElementById('user-menu');
        userMenu.classList.toggle('open');
    }

    closeUserMenu() {
        const userMenu = document.getElementById('user-menu');
        userMenu.classList.remove('open');
    }

    async loadUserData() {
        if (!this.currentUser) return;

        // Load user preferences
        const prefsKey = `talktoapp_prefs_${this.currentUser.id}`;
        const storedPrefs = localStorage.getItem(prefsKey);
        if (storedPrefs) {
            this.userPreferences = { ...this.getDefaultPreferences(), ...JSON.parse(storedPrefs) };
        } else {
            this.userPreferences = this.getDefaultPreferences();
        }

        // Load user projects
        const projectsKey = `talktoapp_projects_${this.currentUser.id}`;
        const storedProjects = localStorage.getItem(projectsKey);
        if (storedProjects) {
            this.userProjects = JSON.parse(storedProjects);
        }

        // Update last login
        this.currentUser.lastLogin = new Date().toISOString();
        this.saveUserData();
    }

    saveUserData() {
        if (!this.currentUser) return;

        // Save preferences
        const prefsKey = `talktoapp_prefs_${this.currentUser.id}`;
        localStorage.setItem(prefsKey, JSON.stringify(this.userPreferences));

        // Save projects
        const projectsKey = `talktoapp_projects_${this.currentUser.id}`;
        localStorage.setItem(projectsKey, JSON.stringify(this.userProjects));

        // Update auth data
        const authData = {
            user: this.currentUser,
            provider: this.currentUser.provider,
            timestamp: Date.now()
        };
        localStorage.setItem('talktoapp_auth', JSON.stringify(authData));
    }

    getDefaultPreferences() {
        return {
            theme: 'dark',
            language: 'en',
            aiModel: 'gpt-4',
            autoSave: true,
            notifications: true,
            soundEffects: true,
            animationsEnabled: true,
            defaultTemplate: 'blank',
            codeStyle: 'modern',
            fontSize: 'medium',
            layout: 'default'
        };
    }

    loadUserPreferences() {
        if (!this.userPreferences) return;

        // Apply theme
        document.body.setAttribute('data-theme', this.userPreferences.theme);
        
        // Apply other preferences
        this.applyPreferences();
    }

    applyPreferences() {
        // Apply font size
        document.body.setAttribute('data-font-size', this.userPreferences.fontSize);
        
        // Apply animations
        if (!this.userPreferences.animationsEnabled) {
            document.body.classList.add('no-animations');
        }
        
        // Apply layout
        document.body.setAttribute('data-layout', this.userPreferences.layout);
    }

    setupPersonalization() {
        // Personalize based on user behavior and preferences
        this.personalizeUI();
        this.setupAdaptiveFeatures();
    }

    personalizeUI() {
        if (!this.isAuthenticated) return;

        // Customize greeting based on time
        const hour = new Date().getHours();
        let greeting = 'Hello';
        if (hour < 12) greeting = 'Good morning';
        else if (hour < 18) greeting = 'Good afternoon';
        else greeting = 'Good evening';

        // Update any greeting elements
        const greetingElements = document.querySelectorAll('.user-greeting');
        greetingElements.forEach(el => {
            el.textContent = `${greeting}, ${this.currentUser.name}!`;
        });
    }

    setupAdaptiveFeatures() {
        // Implement adaptive features based on user behavior
        this.trackUserBehavior();
        this.suggestPersonalizedContent();
    }

    trackUserBehavior() {
        // Track user interactions for personalization
        const behaviorData = {
            sessionsCount: 0,
            appsCreated: 0,
            favoriteTemplates: [],
            preferredFeatures: [],
            lastActivity: Date.now()
        };

        const storedBehavior = localStorage.getItem(`talktoapp_behavior_${this.currentUser?.id}`);
        if (storedBehavior) {
            Object.assign(behaviorData, JSON.parse(storedBehavior));
        }

        behaviorData.sessionsCount++;
        behaviorData.lastActivity = Date.now();

        localStorage.setItem(`talktoapp_behavior_${this.currentUser?.id}`, JSON.stringify(behaviorData));
    }

    suggestPersonalizedContent() {
        // Suggest content based on user preferences and behavior
        // This would integrate with the template library and other features
    }

    showWelcomeMessage() {
        const isNewUser = !this.currentUser.lastLogin;
        const message = isNewUser ? 
            `Welcome to TalkToApp, ${this.currentUser.name}! Let's create something amazing together.` :
            `Welcome back, ${this.currentUser.name}! Ready to build more apps?`;

        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `user-notification ${type}`;
        notification.textContent = message;
        
        const colors = {
            success: '#00ff88',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: ${type === 'success' ? 'black' : 'white'};
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10002;
            max-width: 300px;
            font-weight: 500;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        `;

        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // Menu action handlers
    showProfile() {
        this.closeUserMenu();
        // Implementation for profile modal
        console.log('Show profile');
    }

    showPreferences() {
        this.closeUserMenu();
        // Implementation for preferences modal
        console.log('Show preferences');
    }

    showProjects() {
        this.closeUserMenu();
        // Implementation for projects view
        console.log('Show projects');
    }

    showUsage() {
        this.closeUserMenu();
        // Implementation for usage statistics
        console.log('Show usage stats');
    }

    exportData() {
        this.closeUserMenu();
        // Implementation for data export
        console.log('Export user data');
    }

    showHelp() {
        this.closeUserMenu();
        // Implementation for help system
        console.log('Show help');
    }

    signOut() {
        this.closeUserMenu();
        
        // Clear auth data
        localStorage.removeItem('talktoapp_auth');
        
        // Reset state
        this.currentUser = null;
        this.isAuthenticated = false;
        this.userPreferences = {};
        this.userProjects = [];
        
        // Update UI
        this.updateAuthUI();
        
        // Show sign out message
        this.showNotification('You have been signed out successfully.', 'info');
        
        // Show auth modal after delay
        setTimeout(() => {
            this.showAuthModal();
        }, 1000);
    }

    showForgotPassword() {
        // Implementation for password reset
        console.log('Show forgot password');
    }

    async registerLocal(name, email, password) {
        try {
            // Simulate registration process
            const userData = {
                id: 'user_' + Date.now(),
                name: name,
                email: email,
                provider: 'local',
                avatar: null,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                preferences: this.getDefaultPreferences()
            };

            // Store user data (in real app, this would be sent to server)
            const users = JSON.parse(localStorage.getItem('talktoapp_users') || '[]');
            
            // Check if user already exists
            if (users.find(u => u.email === email)) {
                throw new Error('User with this email already exists');
            }
            
            users.push(userData);
            localStorage.setItem('talktoapp_users', JSON.stringify(users));

            // Set as current user
            this.currentUser = userData;
            this.isAuthenticated = true;
            
            // Store auth session
            this.storeAuthSession(userData);
            
            return userData;
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    }
}

// Global instance
window.userAuth = new UserAuthentication();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserAuthentication;
}