/**
 * App Generator Module
 * Handles dynamic app creation and code generation
 */

class AppGenerator {
    constructor() {
        this.generatedApps = [];
        this.currentApp = null;
        this.templates = this.initializeTemplates();
        this.exportFormats = ['html', 'react', 'vue', 'angular'];
    }

    initializeTemplates() {
        return {
            calculator: {
                name: 'Calculator',
                icon: '🧮',
                description: 'Mathematical calculator with advanced functions',
                complexity: 'medium',
                features: ['basic-math', 'scientific', 'history', 'themes']
            },
            todo: {
                name: 'Todo List',
                icon: '📝',
                description: 'Task management and productivity app',
                complexity: 'simple',
                features: ['add-tasks', 'mark-complete', 'categories', 'due-dates']
            },
            gallery: {
                name: 'Photo Gallery',
                icon: '🖼️',
                description: 'Image gallery with slideshow and filters',
                complexity: 'medium',
                features: ['image-upload', 'slideshow', 'filters', 'sharing']
            },
            game: {
                name: 'Interactive Game',
                icon: '🎮',
                description: 'Fun and engaging browser games',
                complexity: 'complex',
                features: ['scoring', 'levels', 'animations', 'sound']
            },
            weather: {
                name: 'Weather App',
                icon: '🌤️',
                description: 'Weather forecast and current conditions',
                complexity: 'medium',
                features: ['current-weather', 'forecast', 'location', 'alerts']
            },
            chat: {
                name: 'Chat Application',
                icon: '💬',
                description: 'Real-time messaging and communication',
                complexity: 'complex',
                features: ['real-time', 'emoji', 'file-sharing', 'groups']
            },
            ecommerce: {
                name: 'E-commerce Store',
                icon: '🛒',
                description: 'Online shopping platform',
                complexity: 'complex',
                features: ['product-catalog', 'cart', 'checkout', 'payments']
            },
            blog: {
                name: 'Blog Platform',
                icon: '📝',
                description: 'Content management and blogging system',
                complexity: 'medium',
                features: ['posts', 'comments', 'categories', 'search']
            }
        };
    }

    async generateApp(userInput, appType = 'custom') {
        try {
            // Process user input with AI
            const analysis = await window.aiServices.processNaturalLanguage(userInput);
            
            // Generate app structure
            const appStructure = this.createAppStructure(analysis, appType);
            
            // Generate code
            const generatedCode = await this.generateCode(appStructure, analysis);
            
            // Create app instance
            const app = this.createAppInstance(appStructure, generatedCode, userInput);
            
            // Store generated app
            this.generatedApps.push(app);
            this.currentApp = app;
            
            // Render app in preview
            this.renderAppPreview(app);
            
            return app;
        } catch (error) {
            console.error('App generation failed:', error);
            throw new Error('Failed to generate app: ' + error.message);
        }
    }

    createAppStructure(analysis, appType) {
        const template = this.templates[appType] || this.templates.calculator;
        
        return {
            id: this.generateAppId(),
            type: appType,
            name: this.generateAppName(analysis, template),
            description: analysis.entities.description || template.description,
            features: this.selectFeatures(analysis, template),
            styling: this.generateStyling(analysis),
            layout: this.generateLayout(analysis, appType),
            interactions: this.generateInteractions(analysis, appType),
            data: this.generateDataStructure(appType),
            metadata: {
                created: new Date(),
                version: '1.0.0',
                author: 'TalkToApp User',
                complexity: template.complexity
            }
        };
    }

    generateAppId() {
        return 'app_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateAppName(analysis, template) {
        if (analysis.entities.name) {
            return analysis.entities.name;
        }
        
        const adjectives = ['Smart', 'Modern', 'Advanced', 'Simple', 'Beautiful', 'Powerful'];
        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        
        return `${randomAdjective} ${template.name}`;
    }

    selectFeatures(analysis, template) {
        let selectedFeatures = [...template.features];
        
        // Add features based on user requirements
        if (analysis.entities.features.includes('animated')) {
            selectedFeatures.push('animations');
        }
        
        if (analysis.entities.features.includes('responsive')) {
            selectedFeatures.push('responsive-design');
        }
        
        if (analysis.entities.complexity === 'advanced') {
            selectedFeatures.push('advanced-features');
        }
        
        return [...new Set(selectedFeatures)]; // Remove duplicates
    }

    generateStyling(analysis) {
        const colorSchemes = {
            blue: { primary: '#667eea', secondary: '#764ba2', accent: '#74b9ff' },
            red: { primary: '#ff6b6b', secondary: '#e17055', accent: '#fd79a8' },
            green: { primary: '#00b894', secondary: '#00a085', accent: '#55efc4' },
            purple: { primary: '#a29bfe', secondary: '#6c5ce7', accent: '#fd79a8' },
            rainbow: { primary: '#667eea', secondary: '#764ba2', accent: '#fd79a8' }
        };
        
        const primaryColor = analysis.entities.colors[0] || 'blue';
        const scheme = colorSchemes[primaryColor] || colorSchemes.blue;
        
        return {
            colorScheme: scheme,
            theme: analysis.entities.features.includes('dark') ? 'dark' : 'light',
            animations: analysis.entities.features.includes('animated'),
            responsive: analysis.entities.features.includes('responsive') || true,
            customCSS: this.generateCustomCSS(scheme, analysis)
        };
    }

    generateCustomCSS(colorScheme, analysis) {
        return `
            :root {
                --primary-color: ${colorScheme.primary};
                --secondary-color: ${colorScheme.secondary};
                --accent-color: ${colorScheme.accent};
                --text-color: #2c3e50;
                --background-color: #ffffff;
                --border-radius: 12px;
                --shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            
            .app-container {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                border-radius: var(--border-radius);
                box-shadow: var(--shadow);
                padding: 20px;
                color: var(--text-color);
            }
            
            .app-button {
                background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: var(--border-radius);
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            }
            
            .app-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            }
            
            .app-input {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid rgba(102, 126, 234, 0.2);
                border-radius: var(--border-radius);
                font-size: 1rem;
                outline: none;
                transition: all 0.3s ease;
            }
            
            .app-input:focus {
                border-color: var(--primary-color);
                box-shadow: 0 0 20px rgba(102, 126, 234, 0.2);
            }
            
            ${analysis.entities.features.includes('animated') ? this.getAnimationCSS() : ''}
            ${this.getResponsiveCSS()}
        `;
    }

    getAnimationCSS() {
        return `
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes slideIn {
                from { transform: translateX(-100%); }
                to { transform: translateX(0); }
            }
            
            @keyframes bounce {
                0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
                40%, 43% { transform: translate3d(0,-30px,0); }
                70% { transform: translate3d(0,-15px,0); }
                90% { transform: translate3d(0,-4px,0); }
            }
            
            .animated { animation: fadeInUp 0.6s ease; }
            .slide-in { animation: slideIn 0.5s ease; }
            .bounce { animation: bounce 1s ease; }
        `;
    }

    getResponsiveCSS() {
        return `
            @media (max-width: 768px) {
                .app-container { padding: 15px; }
                .app-button { padding: 14px 20px; font-size: 1rem; }
                .app-input { padding: 14px 16px; font-size: 1rem; }
                .grid { grid-template-columns: 1fr; }
            }
            
            @media (max-width: 480px) {
                .app-container { padding: 10px; }
                .app-button { padding: 16px 24px; font-size: 1.1rem; }
                .app-input { padding: 16px 20px; font-size: 1.1rem; }
            }
        `;
    }

    generateLayout(analysis, appType) {
        const layouts = {
            calculator: 'grid',
            todo: 'vertical',
            gallery: 'masonry',
            game: 'canvas',
            weather: 'card',
            chat: 'flex',
            ecommerce: 'grid',
            blog: 'article'
        };
        
        return {
            type: layouts[appType] || 'vertical',
            responsive: true,
            sections: this.generateSections(appType),
            navigation: this.generateNavigation(appType)
        };
    }

    generateSections(appType) {
        const sectionTemplates = {
            calculator: ['display', 'buttons'],
            todo: ['header', 'input', 'list', 'stats'],
            gallery: ['header', 'grid', 'modal'],
            game: ['header', 'canvas', 'controls', 'score'],
            weather: ['current', 'forecast', 'details'],
            chat: ['header', 'messages', 'input'],
            ecommerce: ['header', 'products', 'cart', 'footer'],
            blog: ['header', 'posts', 'sidebar', 'footer']
        };
        
        return sectionTemplates[appType] || ['header', 'content', 'footer'];
    }

    generateNavigation(appType) {
        const complexApps = ['ecommerce', 'blog', 'chat'];
        
        return {
            enabled: complexApps.includes(appType),
            type: 'horizontal',
            items: this.getNavigationItems(appType)
        };
    }

    getNavigationItems(appType) {
        const navItems = {
            ecommerce: ['Home', 'Products', 'Cart', 'Account'],
            blog: ['Home', 'Posts', 'Categories', 'About'],
            chat: ['Chats', 'Contacts', 'Settings']
        };
        
        return navItems[appType] || [];
    }

    generateInteractions(analysis, appType) {
        const interactions = {
            calculator: ['click', 'keyboard'],
            todo: ['click', 'keyboard', 'drag'],
            gallery: ['click', 'swipe', 'zoom'],
            game: ['click', 'keyboard', 'touch'],
            weather: ['click', 'location'],
            chat: ['click', 'keyboard', 'file-upload'],
            ecommerce: ['click', 'search', 'filter'],
            blog: ['click', 'search', 'scroll']
        };
        
        return {
            types: interactions[appType] || ['click'],
            gestures: this.generateGestures(appType),
            shortcuts: this.generateShortcuts(appType)
        };
    }

    generateGestures(appType) {
        const gestureMap = {
            gallery: ['swipe-left', 'swipe-right', 'pinch-zoom'],
            game: ['tap', 'swipe', 'long-press'],
            chat: ['swipe-to-delete', 'pull-to-refresh']
        };
        
        return gestureMap[appType] || [];
    }

    generateShortcuts(appType) {
        const shortcutMap = {
            calculator: [{ key: 'Enter', action: 'calculate' }, { key: 'Escape', action: 'clear' }],
            todo: [{ key: 'Enter', action: 'add-task' }, { key: 'Delete', action: 'delete-task' }],
            chat: [{ key: 'Enter', action: 'send-message' }, { key: 'Ctrl+K', action: 'search' }]
        };
        
        return shortcutMap[appType] || [];
    }

    generateDataStructure(appType) {
        const dataStructures = {
            calculator: { history: [], currentValue: '0' },
            todo: { tasks: [], categories: [], stats: {} },
            gallery: { photos: [], albums: [], settings: {} },
            game: { score: 0, level: 1, highScore: 0 },
            weather: { current: {}, forecast: [], location: {} },
            chat: { messages: [], contacts: [], settings: {} },
            ecommerce: { products: [], cart: [], orders: [] },
            blog: { posts: [], categories: [], comments: [] }
        };
        
        return dataStructures[appType] || {};
    }

    async generateCode(appStructure, analysis) {
        // Generate HTML
        const html = await this.generateHTML(appStructure);
        
        // Generate CSS
        const css = await this.generateCSS(appStructure);
        
        // Generate JavaScript
        const js = await this.generateJavaScript(appStructure);
        
        return { html, css, js };
    }

    async generateHTML(appStructure) {
        const { type, layout, features } = appStructure;
        
        let html = `<div class="app-container ${type}-app" id="${appStructure.id}">`;
        
        // Generate header
        html += this.generateHeader(appStructure);
        
        // Generate main content based on app type
        html += this.generateMainContent(appStructure);
        
        // Generate footer if needed
        if (layout.sections.includes('footer')) {
            html += this.generateFooter(appStructure);
        }
        
        html += '</div>';
        
        return html;
    }

    generateHeader(appStructure) {
        const { name, type } = appStructure;
        const icon = this.templates[type]?.icon || '📱';
        
        return `
            <div class="app-header">
                <h1 class="app-title">
                    <span class="app-icon">${icon}</span>
                    ${name}
                </h1>
                ${appStructure.layout.navigation.enabled ? this.generateNavigationHTML(appStructure) : ''}
            </div>
        `;
    }

    generateNavigationHTML(appStructure) {
        const navItems = appStructure.layout.navigation.items;
        
        return `
            <nav class="app-navigation">
                ${navItems.map(item => `<a href="#${item.toLowerCase()}" class="nav-item">${item}</a>`).join('')}
            </nav>
        `;
    }

    generateMainContent(appStructure) {
        const generators = {
            calculator: () => this.generateCalculatorHTML(appStructure),
            todo: () => this.generateTodoHTML(appStructure),
            gallery: () => this.generateGalleryHTML(appStructure),
            game: () => this.generateGameHTML(appStructure),
            weather: () => this.generateWeatherHTML(appStructure),
            chat: () => this.generateChatHTML(appStructure),
            ecommerce: () => this.generateEcommerceHTML(appStructure),
            blog: () => this.generateBlogHTML(appStructure)
        };
        
        const generator = generators[appStructure.type];
        return generator ? generator() : this.generateCustomHTML(appStructure);
    }

    generateCalculatorHTML(appStructure) {
        return `
            <div class="calculator-main">
                <div class="calculator-display">
                    <input type="text" id="calc-display" class="display-input" readonly value="0">
                    <div class="display-history" id="calc-history"></div>
                </div>
                <div class="calculator-buttons">
                    <button class="calc-btn clear" onclick="clearCalculator()">C</button>
                    <button class="calc-btn operator" onclick="appendToCalculator('/')">/</button>
                    <button class="calc-btn operator" onclick="appendToCalculator('*')">×</button>
                    <button class="calc-btn delete" onclick="deleteLastCalculator()">⌫</button>
                    
                    <button class="calc-btn number" onclick="appendToCalculator('7')">7</button>
                    <button class="calc-btn number" onclick="appendToCalculator('8')">8</button>
                    <button class="calc-btn number" onclick="appendToCalculator('9')">9</button>
                    <button class="calc-btn operator" onclick="appendToCalculator('-')">-</button>
                    
                    <button class="calc-btn number" onclick="appendToCalculator('4')">4</button>
                    <button class="calc-btn number" onclick="appendToCalculator('5')">5</button>
                    <button class="calc-btn number" onclick="appendToCalculator('6')">6</button>
                    <button class="calc-btn operator" onclick="appendToCalculator('+')">+</button>
                    
                    <button class="calc-btn number" onclick="appendToCalculator('1')">1</button>
                    <button class="calc-btn number" onclick="appendToCalculator('2')">2</button>
                    <button class="calc-btn number" onclick="appendToCalculator('3')">3</button>
                    <button class="calc-btn equals" onclick="calculateResult()" rowspan="2">=</button>
                    
                    <button class="calc-btn number zero" onclick="appendToCalculator('0')">0</button>
                    <button class="calc-btn decimal" onclick="appendToCalculator('.')">.</button>
                </div>
            </div>
        `;
    }

    generateTodoHTML(appStructure) {
        return `
            <div class="todo-main">
                <div class="todo-stats">
                    <div class="stat-item">
                        <span class="stat-number" id="total-tasks">0</span>
                        <span class="stat-label">Total Tasks</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number" id="completed-tasks">0</span>
                        <span class="stat-label">Completed</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number" id="pending-tasks">0</span>
                        <span class="stat-label">Pending</span>
                    </div>
                </div>
                
                <div class="todo-input-section">
                    <div class="input-group">
                        <input type="text" id="task-input" class="app-input" placeholder="What needs to be done?">
                        <select id="task-category" class="app-select">
                            <option value="general">General</option>
                            <option value="work">Work</option>
                            <option value="personal">Personal</option>
                            <option value="urgent">Urgent</option>
                        </select>
                        <button class="app-button" onclick="addNewTask()">Add Task</button>
                    </div>
                </div>
                
                <div class="todo-filters">
                    <button class="filter-btn active" onclick="filterTasks('all')">All</button>
                    <button class="filter-btn" onclick="filterTasks('pending')">Pending</button>
                    <button class="filter-btn" onclick="filterTasks('completed')">Completed</button>
                </div>
                
                <div class="todo-list" id="todo-list">
                    <div class="empty-state">
                        <div class="empty-icon">📝</div>
                        <p>No tasks yet. Add your first task above!</p>
                    </div>
                </div>
            </div>
        `;
    }

    generateGalleryHTML(appStructure) {
        return `
            <div class="gallery-main">
                <div class="gallery-controls">
                    <button class="app-button" onclick="addNewPhoto()">📷 Add Photo</button>
                    <div class="view-controls">
                        <button class="view-btn active" onclick="setView('grid')">Grid</button>
                        <button class="view-btn" onclick="setView('list')">List</button>
                    </div>
                </div>
                
                <div class="gallery-grid" id="gallery-grid">
                    <div class="empty-gallery">
                        <div class="empty-icon">🖼️</div>
                        <p>Your photos will appear here</p>
                        <button class="app-button" onclick="addNewPhoto()">Add First Photo</button>
                    </div>
                </div>
                
                <div class="photo-modal" id="photo-modal">
                    <div class="modal-content">
                        <span class="modal-close" onclick="closePhotoModal()">&times;</span>
                        <img id="modal-image" src="" alt="">
                        <div class="modal-info">
                            <h3 id="modal-title"></h3>
                            <p id="modal-description"></p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateGameHTML(appStructure) {
        return `
            <div class="game-main">
                <div class="game-header">
                    <div class="game-stats">
                        <div class="stat">Score: <span id="game-score">0</span></div>
                        <div class="stat">Level: <span id="game-level">1</span></div>
                        <div class="stat">High Score: <span id="high-score">0</span></div>
                    </div>
                    <div class="game-controls">
                        <button class="app-button" id="game-start" onclick="startGame()">Start Game</button>
                        <button class="app-button" id="game-pause" onclick="pauseGame()" disabled>Pause</button>
                        <button class="app-button" onclick="resetGame()">Reset</button>
                    </div>
                </div>
                
                <div class="game-area" id="game-area">
                    <canvas id="game-canvas" width="400" height="300"></canvas>
                    <div class="game-instructions">
                        <h3>How to Play</h3>
                        <p>Click the falling objects to score points!</p>
                        <p>Avoid the red objects - they'll cost you points.</p>
                    </div>
                </div>
                
                <div class="game-footer">
                    <div class="difficulty-selector">
                        <label>Difficulty:</label>
                        <select id="difficulty" onchange="setDifficulty()">
                            <option value="easy">Easy</option>
                            <option value="medium" selected>Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    generateWeatherHTML(appStructure) {
        return `
            <div class="weather-main">
                <div class="weather-search">
                    <input type="text" id="location-input" class="app-input" placeholder="Enter city name...">
                    <button class="app-button" onclick="searchWeather()">🔍 Search</button>
                    <button class="app-button" onclick="getCurrentLocation()">📍 Current Location</button>
                </div>
                
                <div class="weather-current" id="weather-current">
                    <div class="weather-placeholder">
                        <div class="weather-icon">🌤️</div>
                        <h2>Welcome to Weather App</h2>
                        <p>Search for a city or use your current location</p>
                    </div>
                </div>
                
                <div class="weather-forecast" id="weather-forecast">
                    <!-- Forecast will be populated here -->
                </div>
                
                <div class="weather-details" id="weather-details">
                    <!-- Weather details will be populated here -->
                </div>
            </div>
        `;
    }

    generateChatHTML(appStructure) {
        return `
            <div class="chat-main">
                <div class="chat-sidebar">
                    <div class="chat-search">
                        <input type="text" class="app-input" placeholder="Search conversations...">
                    </div>
                    <div class="chat-list" id="chat-list">
                        <!-- Chat conversations will be listed here -->
                    </div>
                </div>
                
                <div class="chat-content">
                    <div class="chat-header">
                        <div class="chat-info">
                            <h3 id="chat-title">Select a conversation</h3>
                            <span id="chat-status">Online</span>
                        </div>
                        <div class="chat-actions">
                            <button class="icon-btn" onclick="startVideoCall()">📹</button>
                            <button class="icon-btn" onclick="startVoiceCall()">📞</button>
                            <button class="icon-btn" onclick="showChatInfo()">ℹ️</button>
                        </div>
                    </div>
                    
                    <div class="chat-messages" id="chat-messages">
                        <div class="welcome-message">
                            <h3>Welcome to Chat!</h3>
                            <p>Start a conversation by selecting a contact or creating a new chat.</p>
                        </div>
                    </div>
                    
                    <div class="chat-input">
                        <button class="icon-btn" onclick="attachFile()">📎</button>
                        <input type="text" id="message-input" class="app-input" placeholder="Type a message...">
                        <button class="icon-btn" onclick="addEmoji()">😊</button>
                        <button class="app-button" onclick="sendMessage()">Send</button>
                    </div>
                </div>
            </div>
        `;
    }

    generateEcommerceHTML(appStructure) {
        return `
            <div class="ecommerce-main">
                <div class="shop-header">
                    <div class="search-bar">
                        <input type="text" id="product-search" class="app-input" placeholder="Search products...">
                        <button class="app-button" onclick="searchProducts()">Search</button>
                    </div>
                    <div class="cart-summary">
                        <button class="cart-btn" onclick="toggleCart()">
                            🛒 Cart (<span id="cart-count">0</span>)
                        </button>
                    </div>
                </div>
                
                <div class="shop-filters">
                    <select id="category-filter" onchange="filterByCategory()">
                        <option value="all">All Categories</option>
                        <option value="electronics">Electronics</option>
                        <option value="clothing">Clothing</option>
                        <option value="books">Books</option>
                        <option value="home">Home & Garden</option>
                    </select>
                    <select id="price-filter" onchange="filterByPrice()">
                        <option value="all">All Prices</option>
                        <option value="0-25">$0 - $25</option>
                        <option value="25-50">$25 - $50</option>
                        <option value="50-100">$50 - $100</option>
                        <option value="100+">$100+</option>
                    </select>
                </div>
                
                <div class="products-grid" id="products-grid">
                    <!-- Products will be populated here -->
                </div>
                
                <div class="cart-sidebar" id="cart-sidebar">
                    <div class="cart-header">
                        <h3>Shopping Cart</h3>
                        <button class="close-btn" onclick="toggleCart()">×</button>
                    </div>
                    <div class="cart-items" id="cart-items">
                        <div class="empty-cart">
                            <p>Your cart is empty</p>
                        </div>
                    </div>
                    <div class="cart-footer">
                        <div class="cart-total">Total: $<span id="cart-total">0.00</span></div>
                        <button class="app-button checkout-btn" onclick="checkout()">Checkout</button>
                    </div>
                </div>
            </div>
        `;
    }

    generateBlogHTML(appStructure) {
        return `
            <div class="blog-main">
                <div class="blog-header">
                    <h1>My Blog</h1>
                    <div class="blog-actions">
                        <button class="app-button" onclick="createNewPost()">✍️ New Post</button>
                        <input type="text" id="blog-search" class="app-input" placeholder="Search posts...">
                    </div>
                </div>
                
                <div class="blog-content">
                    <div class="blog-posts" id="blog-posts">
                        <div class="welcome-post">
                            <h2>Welcome to Your Blog!</h2>
                            <p>Start writing your first post by clicking the "New Post" button above.</p>
                            <div class="post-meta">
                                <span>📅 Today</span>
                                <span>👤 You</span>
                                <span>🏷️ Welcome</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="blog-sidebar">
                        <div class="sidebar-section">
                            <h3>Categories</h3>
                            <ul id="categories-list">
                                <li><a href="#" onclick="filterByCategory('all')">All Posts</a></li>
                                <li><a href="#" onclick="filterByCategory('personal')">Personal</a></li>
                                <li><a href="#" onclick="filterByCategory('tech')">Technology</a></li>
                                <li><a href="#" onclick="filterByCategory('travel')">Travel</a></li>
                            </ul>
                        </div>
                        
                        <div class="sidebar-section">
                            <h3>Recent Posts</h3>
                            <ul id="recent-posts">
                                <li>No posts yet</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateCustomHTML(appStructure) {
        return `
            <div class="custom-main">
                <div class="custom-header">
                    <h2>${appStructure.name}</h2>
                    <p>${appStructure.description}</p>
                </div>
                
                <div class="custom-content">
                    <div class="feature-grid">
                        ${appStructure.features.map(feature => `
                            <div class="feature-card">
                                <div class="feature-icon">⚡</div>
                                <h3>${feature.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                                <p>Custom ${feature} functionality</p>
                                <button class="app-button" onclick="useFeature('${feature}')">Try It</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="custom-actions">
                    <button class="app-button" onclick="customizeApp()">🎨 Customize</button>
                    <button class="app-button" onclick="addFeature()">➕ Add Feature</button>
                    <button class="app-button" onclick="shareApp()">📤 Share</button>
                </div>
            </div>
        `;
    }

    generateFooter(appStructure) {
        return `
            <div class="app-footer">
                <div class="footer-content">
                    <p>Created with TalkToApp • ${new Date().getFullYear()}</p>
                    <div class="footer-actions">
                        <button class="footer-btn" onclick="shareApp('${appStructure.id}')">Share</button>
                        <button class="footer-btn" onclick="exportApp('${appStructure.id}')">Export</button>
                        <button class="footer-btn" onclick="editApp('${appStructure.id}')">Edit</button>
                    </div>
                </div>
            </div>
        `;
    }

    async generateCSS(appStructure) {
        let css = appStructure.styling.customCSS;
        
        // Add app-specific styles
        css += this.getAppSpecificCSS(appStructure.type);
        
        // Add layout styles
        css += this.getLayoutCSS(appStructure.layout);
        
        // Add animation styles if enabled
        if (appStructure.styling.animations) {
            css += this.getAnimationCSS();
        }
        
        return css;
    }

    getAppSpecificCSS(appType) {
        const styles = {
            calculator: `
                .calculator-main { max-width: 400px; margin: 0 auto; }
                .calculator-display { 
                    background: rgba(255,255,255,0.9); 
                    padding: 20px; 
                    border-radius: 12px; 
                    margin-bottom: 20px; 
                }
                .display-input { 
                    font-size: 2rem; 
                    text-align: right; 
                    border: none; 
                    background: transparent; 
                    width: 100%; 
                }
                .calculator-buttons { 
                    display: grid; 
                    grid-template-columns: repeat(4, 1fr); 
                    gap: 10px; 
                }
                .calc-btn { 
                    padding: 20px; 
                    font-size: 1.2rem; 
                    border: none; 
                    border-radius: 8px; 
                    cursor: pointer; 
                    transition: all 0.2s; 
                }
                .calc-btn:hover { transform: scale(1.05); }
                .equals { grid-row: span 2; background: var(--accent-color) !important; color: white; }
                .zero { grid-column: span 2; }
            `,
            todo: `
                .todo-stats { 
                    display: grid; 
                    grid-template-columns: repeat(3, 1fr); 
                    gap: 15px; 
                    margin-bottom: 20px; 
                }
                .stat-item { 
                    background: rgba(255,255,255,0.9); 
                    padding: 15px; 
                    border-radius: 12px; 
                    text-align: center; 
                }
                .stat-number { 
                    display: block; 
                    font-size: 2rem; 
                    font-weight: bold; 
                    color: var(--primary-color); 
                }
                .input-group { 
                    display: flex; 
                    gap: 10px; 
                    margin-bottom: 20px; 
                }
                .todo-filters { 
                    display: flex; 
                    gap: 10px; 
                    margin-bottom: 20px; 
                }
                .filter-btn { 
                    padding: 8px 16px; 
                    border: 2px solid var(--primary-color); 
                    background: transparent; 
                    color: var(--primary-color); 
                    border-radius: 20px; 
                    cursor: pointer; 
                }
                .filter-btn.active { 
                    background: var(--primary-color); 
                    color: white; 
                }
            `,
            gallery: `
                .gallery-controls { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    margin-bottom: 20px; 
                }
                .view-controls { 
                    display: flex; 
                    gap: 5px; 
                }
                .view-btn { 
                    padding: 8px 16px; 
                    border: 1px solid var(--primary-color); 
                    background: transparent; 
                    color: var(--primary-color); 
                    border-radius: 6px; 
                    cursor: pointer; 
                }
                .view-btn.active { 
                    background: var(--primary-color); 
                    color: white; 
                }
                .gallery-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); 
                    gap: 15px; 
                }
                .photo-modal { 
                    display: none; 
                    position: fixed; 
                    top: 0; 
                    left: 0; 
                    width: 100%; 
                    height: 100%; 
                    background: rgba(0,0,0,0.8); 
                    z-index: 1000; 
                }
            `,
            game: `
                .game-header { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    margin-bottom: 20px; 
                }
                .game-stats { 
                    display: flex; 
                    gap: 20px; 
                }
                .stat { 
                    background: rgba(255,255,255,0.9); 
                    padding: 10px 15px; 
                    border-radius: 8px; 
                    font-weight: bold; 
                }
                .game-area { 
                    background: rgba(255,255,255,0.9); 
                    border-radius: 12px; 
                    padding: 20px; 
                    text-align: center; 
                }
                #game-canvas { 
                    border: 2px solid var(--primary-color); 
                    border-radius: 8px; 
                }
            `
        };
        
        return styles[appType] || '';
    }

    getLayoutCSS(layout) {
        const layoutStyles = {
            grid: `
                .grid { display: grid; gap: 20px; }
                .grid-2 { grid-template-columns: repeat(2, 1fr); }
                .grid-3 { grid-template-columns: repeat(3, 1fr); }
                .grid-4 { grid-template-columns: repeat(4, 1fr); }
            `,
            flex: `
                .flex { display: flex; }
                .flex-column { flex-direction: column; }
                .flex-center { justify-content: center; align-items: center; }
                .flex-between { justify-content: space-between; }
                .flex-wrap { flex-wrap: wrap; }
            `,
            masonry: `
                .masonry { 
                    column-count: 3; 
                    column-gap: 20px; 
                }
                .masonry-item { 
                    break-inside: avoid; 
                    margin-bottom: 20px; 
                }
            `
        };
        
        return layoutStyles[layout.type] || layoutStyles.flex;
    }

    async generateJavaScript(appStructure) {
        let js = `
            // App: ${appStructure.name}
            // Generated by TalkToApp
            
            class ${appStructure.type.charAt(0).toUpperCase() + appStructure.type.slice(1)}App {
                constructor() {
                    this.data = ${JSON.stringify(appStructure.data)};
                    this.init();
                }
                
                init() {
                    this.setupEventListeners();
                    this.loadData();
                    console.log('${appStructure.name} initialized');
                }
                
                setupEventListeners() {
                    // Add keyboard shortcuts
                    ${this.generateKeyboardShortcuts(appStructure.interactions.shortcuts)}
                    
                    // Add touch gestures
                    ${this.generateTouchGestures(appStructure.interactions.gestures)}
                }
                
                loadData() {
                    // Load saved data from localStorage
                    const savedData = localStorage.getItem('${appStructure.id}');
                    if (savedData) {
                        this.data = JSON.parse(savedData);
                    }
                }
                
                saveData() {
                    localStorage.setItem('${appStructure.id}', JSON.stringify(this.data));
                }
            }
            
            // Initialize app
            const app = new ${appStructure.type.charAt(0).toUpperCase() + appStructure.type.slice(1)}App();
        `;
        
        // Add app-specific JavaScript
        js += this.getAppSpecificJS(appStructure.type);
        
        return js;
    }

    generateKeyboardShortcuts(shortcuts) {
        if (!shortcuts.length) return '';
        
        return `
            document.addEventListener('keydown', (e) => {
                ${shortcuts.map(shortcut => `
                    if (e.key === '${shortcut.key}' ${shortcut.key.includes('Ctrl') ? '&& e.ctrlKey' : ''}) {
                        e.preventDefault();
                        this.${shortcut.action}();
                    }
                `).join('')}
            });
        `;
    }

    generateTouchGestures(gestures) {
        if (!gestures.length) return '';
        
        return `
            // Touch gesture handling
            let touchStartX = 0;
            let touchStartY = 0;
            
            document.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            });
            
            document.addEventListener('touchend', (e) => {
                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;
                const deltaX = touchEndX - touchStartX;
                const deltaY = touchEndY - touchStartY;
                
                ${gestures.includes('swipe-left') ? `
                    if (deltaX < -50 && Math.abs(deltaY) < 50) {
                        this.handleSwipeLeft();
                    }
                ` : ''}
                
                ${gestures.includes('swipe-right') ? `
                    if (deltaX > 50 && Math.abs(deltaY) < 50) {
                        this.handleSwipeRight();
                    }
                ` : ''}
            });
        `;
    }

    getAppSpecificJS(appType) {
        const jsCode = {
            calculator: `
                // Calculator specific functions
                function appendToCalculator(value) {
                    const display = document.getElementById('calc-display');
                    if (display.value === '0') {
                        display.value = value;
                    } else {
                        display.value += value;
                    }
                }
                
                function clearCalculator() {
                    document.getElementById('calc-display').value = '0';
                }
                
                function deleteLastCalculator() {
                    const display = document.getElementById('calc-display');
                    display.value = display.value.slice(0, -1) || '0';
                }
                
                function calculateResult() {
                    const display = document.getElementById('calc-display');
                    try {
                        const result = eval(display.value.replace('×', '*'));
                        display.value = result;
                        app.data.history.push(\`\${display.value} = \${result}\`);
                        app.saveData();
                    } catch (e) {
                        display.value = 'Error';
                    }
                }
            `,
            todo: `
                // Todo specific functions
                let taskId = 0;
                
                function addNewTask() {
                    const input = document.getElementById('task-input');
                    const category = document.getElementById('task-category').value;
                    const taskText = input.value.trim();
                    
                    if (!taskText) return;
                    
                    const task = {
                        id: taskId++,
                        text: taskText,
                        category: category,
                        completed: false,
                        created: new Date()
                    };
                    
                    app.data.tasks.push(task);
                    renderTasks();
                    updateStats();
                    input.value = '';
                    app.saveData();
                }
                
                function toggleTask(id) {
                    const task = app.data.tasks.find(t => t.id === id);
                    if (task) {
                        task.completed = !task.completed;
                        renderTasks();
                        updateStats();
                        app.saveData();
                    }
                }
                
                function deleteTask(id) {
                    app.data.tasks = app.data.tasks.filter(t => t.id !== id);
                    renderTasks();
                    updateStats();
                    app.saveData();
                }
                
                function renderTasks() {
                    const todoList = document.getElementById('todo-list');
                    if (app.data.tasks.length === 0) {
                        todoList.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div><p>No tasks yet. Add your first task above!</p></div>';
                        return;
                    }
                    
                    todoList.innerHTML = app.data.tasks.map(task => \`
                        <div class="task-item \${task.completed ? 'completed' : ''}">
                            <input type="checkbox" \${task.completed ? 'checked' : ''} onchange="toggleTask(\${task.id})">
                            <div class="task-content">
                                <span class="task-text">\${task.text}</span>
                                <span class="task-category">\${task.category}</span>
                            </div>
                            <button class="delete-btn" onclick="deleteTask(\${task.id})">🗑️</button>
                        </div>
                    \`).join('');
                }
                
                function updateStats() {
                    const total = app.data.tasks.length;
                    const completed = app.data.tasks.filter(t => t.completed).length;
                    const pending = total - completed;
                    
                    document.getElementById('total-tasks').textContent = total;
                    document.getElementById('completed-tasks').textContent = completed;
                    document.getElementById('pending-tasks').textContent = pending;
                }
                
                function filterTasks(filter) {
                    // Update filter buttons
                    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                    event.target.classList.add('active');
                    
                    // Filter tasks
                    const tasks = document.querySelectorAll('.task-item');
                    tasks.forEach(task => {
                        const isCompleted = task.classList.contains('completed');
                        switch(filter) {
                            case 'all':
                                task.style.display = 'flex';
                                break;
                            case 'pending':
                                task.style.display = isCompleted ? 'none' : 'flex';
                                break;
                            case 'completed':
                                task.style.display = isCompleted ? 'flex' : 'none';
                                break;
                        }
                    });
                }
            `,
            gallery: `
                // Gallery specific functions
                let photoId = 0;
                
                function addNewPhoto() {
                    const photoEmojis = ['🌅', '🏔️', '🌊', '🌸', '🦋', '🌈', '🎨', '📸', '🌺', '🍃'];
                    const randomEmoji = photoEmojis[Math.floor(Math.random() * photoEmojis.length)];
                    
                    const photo = {
                        id: photoId++,
                        emoji: randomEmoji,
                        title: \`Photo \${photoId}\`,
                        description: 'A beautiful moment captured',
                        created: new Date()
                    };
                    
                    app.data.photos.push(photo);
                    renderGallery();
                    app.saveData();
                }
                
                function renderGallery() {
                    const galleryGrid = document.getElementById('gallery-grid');
                    
                    if (app.data.photos.length === 0) {
                        galleryGrid.innerHTML = \`
                            <div class="empty-gallery">
                                <div class="empty-icon">🖼️</div>
                                <p>Your photos will appear here</p>
                                <button class="app-button" onclick="addNewPhoto()">Add First Photo</button>
                            </div>
                        \`;
                        return;
                    }
                    
                    galleryGrid.innerHTML = app.data.photos.map(photo => \`
                        <div class="photo-item" onclick="openPhotoModal(\${photo.id})">
                            <div class="photo-content">
                                <div class="photo-emoji">\${photo.emoji}</div>
                                <div class="photo-title">\${photo.title}</div>
                            </div>
                        </div>
                    \`).join('');
                }
                
                function openPhotoModal(photoId) {
                    const photo = app.data.photos.find(p => p.id === photoId);
                    if (!photo) return;
                    
                    document.getElementById('modal-image').src = \`data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23667eea"/><text x="200" y="150" text-anchor="middle" fill="white" font-size="60">\${photo.emoji}</text></svg>\`;
                    document.getElementById('modal-title').textContent = photo.title;
                    document.getElementById('modal-description').textContent = photo.description;
                    document.getElementById('photo-modal').style.display = 'flex';
                }
                
                function closePhotoModal() {
                    document.getElementById('photo-modal').style.display = 'none';
                }
                
                function setView(viewType) {
                    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
                    event.target.classList.add('active');
                    
                    const galleryGrid = document.getElementById('gallery-grid');
                    if (viewType === 'list') {
                        galleryGrid.style.gridTemplateColumns = '1fr';
                    } else {
                        galleryGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
                    }
                }
            `
        };
        
        return jsCode[appType] || '';
    }

    createAppInstance(appStructure, generatedCode, userInput) {
        return {
            id: appStructure.id,
            name: appStructure.name,
            type: appStructure.type,
            description: appStructure.description,
            userInput: userInput,
            structure: appStructure,
            code: generatedCode,
            created: new Date(),
            version: '1.0.0',
            status: 'generated',
            metadata: appStructure.metadata
        };
    }

    renderAppPreview(app) {
        const previewContainer = document.getElementById('appPreview');
        
        // Create complete HTML with embedded CSS and JS
        const completeHTML = `
            <style>${app.code.css}</style>
            ${app.code.html}
            <script>${app.code.js}</script>
        `;
        
        previewContainer.innerHTML = completeHTML;
        
        // Add app metadata to preview
        this.addAppMetadata(app);
    }

    addAppMetadata(app) {
        // Add a small metadata overlay
        const metadata = document.createElement('div');
        metadata.className = 'app-metadata';
        metadata.innerHTML = `
            <div class="metadata-toggle" onclick="this.parentElement.classList.toggle('expanded')">ℹ️</div>
            <div class="metadata-content">
                <h4>${app.name}</h4>
                <p>Type: ${app.type}</p>
                <p>Created: ${app.created.toLocaleDateString()}</p>
                <p>Features: ${app.structure.features.length}</p>
            </div>
        `;
        
        metadata.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            border-radius: 8px;
            padding: 8px;
            font-size: 0.8rem;
            z-index: 1000;
            max-width: 200px;
            transition: all 0.3s ease;
        `;
        
        const previewContainer = document.getElementById('appPreview');
        previewContainer.style.position = 'relative';
        previewContainer.appendChild(metadata);
    }

    async exportApp(appId, format = 'html') {
        const app = this.generatedApps.find(a => a.id === appId) || this.currentApp;
        if (!app) {
            throw new Error('App not found');
        }

        const exporters = {
            html: () => this.exportAsHTML(app),
            react: () => this.exportAsReact(app),
            vue: () => this.exportAsVue(app),
            angular: () => this.exportAsAngular(app)
        };

        const exporter = exporters[format];
        if (!exporter) {
            throw new Error(`Export format ${format} not supported`);
        }

        return exporter();
    }

    exportAsHTML(app) {
        return {
            filename: `${app.name.toLowerCase().replace(/\s+/g, '-')}.html`,
            content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${app.name}</title>
    <style>
        ${app.code.css}
    </style>
</head>
<body>
    ${app.code.html}
    <script>
        ${app.code.js}
    </script>
</body>
</html>`
        };
    }

    exportAsReact(app) {
        // Convert HTML/CSS/JS to React component
        const componentName = app.name.replace(/\s+/g, '');
        
        return {
            filename: `${componentName}.jsx`,
            content: `import React, { useState, useEffect } from 'react';
import './${componentName}.css';

const ${componentName} = () => {
    // Component logic here
    ${this.convertJSToReact(app.code.js)}
    
    return (
        <div className="app-container">
            ${this.convertHTMLToJSX(app.code.html)}
        </div>
    );
};

export default ${componentName};`
        };
    }

    convertJSToReact(js) {
        // Basic conversion of vanilla JS to React hooks
        return js
            .replace(/document\.getElementById\('([^']+)'\)/g, 'document.getElementById(\'$1\')')
            .replace(/function\s+(\w+)/g, 'const $1 = ')
            .replace(/var\s+/g, 'const ')
            .replace(/let\s+/g, 'const ');
    }

    convertHTMLToJSX(html) {
        // Basic conversion of HTML to JSX
        return html
            .replace(/class=/g, 'className=')
            .replace(/onclick=/g, 'onClick=')
            .replace(/onchange=/g, 'onChange=')
            .replace(/for=/g, 'htmlFor=');
    }

    exportAsVue(app) {
        const componentName = app.name.replace(/\s+/g, '');
        
        return {
            filename: `${componentName}.vue`,
            content: `<template>
    <div class="app-container">
        ${this.convertHTMLToVue(app.code.html)}
    </div>
</template>

<script>
export default {
    name: '${componentName}',
    data() {
        return {
            // Component data here
        };
    },
    methods: {
        ${this.convertJSToVue(app.code.js)}
    }
};
</script>

<style scoped>
${app.code.css}
</style>`
        };
    }

    convertHTMLToVue(html) {
        // Basic conversion of HTML to Vue template
        return html
            .replace(/onclick="([^"]+)"/g, '@click="$1"')
            .replace(/onchange="([^"]+)"/g, '@change="$1"');
    }

    convertJSToVue(js) {
        // Basic conversion of vanilla JS to Vue methods
        return js
            .replace(/function\s+(\w+)\s*\([^)]*\)\s*{/g, '$1() {')
            .replace(/document\.getElementById\('([^']+)'\)/g, 'this.$refs.$1');
    }

    exportAsAngular(app) {
        const componentName = app.name.replace(/\s+/g, '');
        
        return {
            filename: `${componentName.toLowerCase()}.component.ts`,
            content: `import { Component } from '@angular/core';

@Component({
    selector: 'app-${componentName.toLowerCase()}',
    template: \`
        <div class="app-container">
            ${this.convertHTMLToAngular(app.code.html)}
        </div>
    \`,
    styleUrls: ['./${componentName.toLowerCase()}.component.css']
})
export class ${componentName}Component {
    // Component properties here
    
    ${this.convertJSToAngular(app.code.js)}
}`
        };
    }

    convertHTMLToAngular(html) {
        // Basic conversion of HTML to Angular template
        return html
            .replace(/onclick="([^"]+)"/g, '(click)="$1"')
            .replace(/onchange="([^"]+)"/g, '(change)="$1"');
    }

    convertJSToAngular(js) {
        // Basic conversion of vanilla JS to Angular methods
        return js
            .replace(/function\s+(\w+)\s*\([^)]*\)\s*{/g, '$1() {')
            .replace(/document\.getElementById\('([^']+)'\)/g, 'document.getElementById(\'$1\')');
    }

    getAppById(appId) {
        return this.generatedApps.find(app => app.id === appId);
    }

    getAllApps() {
        return this.generatedApps;
    }

    deleteApp(appId) {
        this.generatedApps = this.generatedApps.filter(app => app.id !== appId);
        if (this.currentApp && this.currentApp.id === appId) {
            this.currentApp = null;
        }
    }

    duplicateApp(appId) {
        const originalApp = this.getAppById(appId);
        if (!originalApp) return null;

        const duplicatedApp = {
            ...originalApp,
            id: this.generateAppId(),
            name: `${originalApp.name} (Copy)`,
            created: new Date()
        };

        this.generatedApps.push(duplicatedApp);
        return duplicatedApp;
    }
}

// Initialize App Generator
window.appGenerator = new AppGenerator();