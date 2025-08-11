/**
 * AI Services Module
 * Handles AI-powered app generation and natural language processing
 */

class AIServices {
    constructor() {
        this.apiKey = null;
        this.models = {
            textGeneration: 'gpt-4',
            codeGeneration: 'codex',
            imageGeneration: 'dall-e-3'
        };
        this.conversationHistory = [];
    }

    async processNaturalLanguage(userInput) {
        // Enhanced NLP processing
        const intent = this.detectIntent(userInput);
        const entities = this.extractEntities(userInput);
        const appType = this.determineAppType(userInput);
        
        return {
            intent,
            entities,
            appType,
            confidence: this.calculateConfidence(userInput, appType),
            suggestions: this.generateSuggestions(userInput, appType)
        };
    }

    detectIntent(input) {
        const intents = {
            create: ['create', 'make', 'build', 'generate', 'develop'],
            modify: ['change', 'update', 'modify', 'edit', 'improve'],
            help: ['help', 'how', 'what', 'explain', 'guide'],
            share: ['share', 'export', 'publish', 'send'],
            save: ['save', 'store', 'keep', 'preserve']
        };

        const lowerInput = input.toLowerCase();
        
        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(keyword => lowerInput.includes(keyword))) {
                return intent;
            }
        }
        
        return 'create'; // Default intent
    }

    extractEntities(input) {
        const entities = {
            colors: [],
            features: [],
            style: null,
            complexity: 'simple'
        };

        // Color extraction
        const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'black', 'white', 'rainbow', 'colorful'];
        colors.forEach(color => {
            if (input.toLowerCase().includes(color)) {
                entities.colors.push(color);
            }
        });

        // Feature extraction
        const features = ['responsive', 'animated', 'interactive', 'modern', 'simple', 'advanced', 'professional'];
        features.forEach(feature => {
            if (input.toLowerCase().includes(feature)) {
                entities.features.push(feature);
            }
        });

        // Complexity detection
        if (input.toLowerCase().includes('advanced') || input.toLowerCase().includes('complex')) {
            entities.complexity = 'advanced';
        } else if (input.toLowerCase().includes('professional')) {
            entities.complexity = 'professional';
        }

        return entities;
    }

    determineAppType(input) {
        const appTypes = {
            calculator: ['calculator', 'math', 'calculate', 'numbers', 'arithmetic'],
            todo: ['todo', 'task', 'list', 'homework', 'checklist', 'organize'],
            gallery: ['gallery', 'photo', 'image', 'picture', 'album'],
            game: ['game', 'play', 'fun', 'catch', 'puzzle', 'quiz'],
            weather: ['weather', 'forecast', 'temperature', 'climate'],
            timer: ['timer', 'stopwatch', 'clock', 'countdown'],
            drawing: ['draw', 'paint', 'art', 'sketch', 'canvas'],
            music: ['music', 'sound', 'audio', 'piano', 'instrument'],
            research: ['research', 'search', 'find', 'information', 'study'],
            news: ['news', 'updates', 'current', 'latest', 'headlines'],
            chat: ['chat', 'message', 'talk', 'conversation'],
            social: ['social', 'friends', 'share', 'community'],
            fitness: ['fitness', 'exercise', 'workout', 'health'],
            finance: ['money', 'budget', 'finance', 'expense', 'cost']
        };

        const lowerInput = input.toLowerCase();
        
        for (const [type, keywords] of Object.entries(appTypes)) {
            if (keywords.some(keyword => lowerInput.includes(keyword))) {
                return type;
            }
        }
        
        return 'custom';
    }

    calculateConfidence(input, appType) {
        // Simple confidence calculation based on keyword matches
        const keywords = this.getKeywordsForAppType(appType);
        const matches = keywords.filter(keyword => 
            input.toLowerCase().includes(keyword)
        ).length;
        
        return Math.min(0.9, 0.3 + (matches * 0.2));
    }

    getKeywordsForAppType(appType) {
        const keywords = {
            calculator: ['calculator', 'math', 'calculate', 'numbers'],
            todo: ['todo', 'task', 'list', 'homework'],
            gallery: ['gallery', 'photo', 'image', 'picture'],
            game: ['game', 'play', 'fun', 'catch'],
            custom: ['app', 'application', 'tool']
        };
        
        return keywords[appType] || keywords.custom;
    }

    generateSuggestions(input, appType) {
        const suggestions = {
            calculator: [
                'Add scientific functions',
                'Include history feature',
                'Add colorful themes',
                'Include unit converter'
            ],
            todo: [
                'Add due dates',
                'Include categories',
                'Add priority levels',
                'Include progress tracking'
            ],
            gallery: [
                'Add photo filters',
                'Include slideshow mode',
                'Add sharing options',
                'Include photo editing'
            ],
            game: [
                'Add scoring system',
                'Include multiple levels',
                'Add sound effects',
                'Include leaderboard'
            ],
            custom: [
                'Add user authentication',
                'Include data persistence',
                'Add responsive design',
                'Include accessibility features'
            ]
        };

        return suggestions[appType] || suggestions.custom;
    }

    async generateAppCode(appType, userRequirements, entities) {
        // Enhanced code generation with AI
        const baseTemplate = await this.getBaseTemplate(appType);
        const customizations = this.applyCustomizations(baseTemplate, entities);
        const enhancedCode = this.addAIEnhancements(customizations, userRequirements);
        
        return enhancedCode;
    }

    async getBaseTemplate(appType) {
        // Return base templates for different app types
        const templates = {
            calculator: {
                html: this.getCalculatorHTML(),
                css: this.getCalculatorCSS(),
                js: this.getCalculatorJS()
            },
            todo: {
                html: this.getTodoHTML(),
                css: this.getTodoCSS(),
                js: this.getTodoJS()
            },
            gallery: {
                html: this.getGalleryHTML(),
                css: this.getGalleryCSS(),
                js: this.getGalleryJS()
            }
            // Add more templates as needed
        };

        return templates[appType] || templates.calculator;
    }

    applyCustomizations(template, entities) {
        let customizedTemplate = { ...template };

        // Apply color customizations
        if (entities.colors.length > 0) {
            customizedTemplate.css = this.applyColorScheme(customizedTemplate.css, entities.colors);
        }

        // Apply feature customizations
        if (entities.features.includes('animated')) {
            customizedTemplate.css += this.getAnimationCSS();
        }

        if (entities.features.includes('responsive')) {
            customizedTemplate.css += this.getResponsiveCSS();
        }

        return customizedTemplate;
    }

    applyColorScheme(css, colors) {
        // Apply color scheme based on detected colors
        const colorMappings = {
            rainbow: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7, #fd79a8)',
            blue: 'linear-gradient(45deg, #74b9ff, #0984e3)',
            red: 'linear-gradient(45deg, #ff6b6b, #e17055)',
            green: 'linear-gradient(45deg, #00b894, #00a085)',
            purple: 'linear-gradient(45deg, #a29bfe, #6c5ce7)'
        };

        const primaryColor = colors[0];
        const gradient = colorMappings[primaryColor] || colorMappings.blue;

        return css.replace(/linear-gradient\([^)]+\)/g, gradient);
    }

    getAnimationCSS() {
        return `
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animated { animation: fadeInUp 0.5s ease; }
        `;
    }

    getResponsiveCSS() {
        return `
            @media (max-width: 768px) {
                .app-container { padding: 10px; }
                .app-button { font-size: 1.1rem; padding: 12px 20px; }
            }
        `;
    }

    // Template getters
    getCalculatorHTML() {
        return `
            <div class="calculator-container">
                <div class="calculator-display">
                    <input type="text" id="display" readonly>
                </div>
                <div class="calculator-buttons">
                    <button onclick="clearDisplay()">C</button>
                    <button onclick="appendToDisplay('/')">/</button>
                    <button onclick="appendToDisplay('*')">*</button>
                    <button onclick="deleteLast()">←</button>
                    <button onclick="appendToDisplay('7')">7</button>
                    <button onclick="appendToDisplay('8')">8</button>
                    <button onclick="appendToDisplay('9')">9</button>
                    <button onclick="appendToDisplay('-')">-</button>
                    <button onclick="appendToDisplay('4')">4</button>
                    <button onclick="appendToDisplay('5')">5</button>
                    <button onclick="appendToDisplay('6')">6</button>
                    <button onclick="appendToDisplay('+')">+</button>
                    <button onclick="appendToDisplay('1')">1</button>
                    <button onclick="appendToDisplay('2')">2</button>
                    <button onclick="appendToDisplay('3')">3</button>
                    <button onclick="calculate()" class="equals">=</button>
                    <button onclick="appendToDisplay('0')" class="zero">0</button>
                    <button onclick="appendToDisplay('.')">.</button>
                </div>
            </div>
        `;
    }

    getCalculatorCSS() {
        return `
            .calculator-container {
                background: linear-gradient(45deg, #667eea, #764ba2);
                padding: 20px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            .calculator-display input {
                width: 100%;
                padding: 15px;
                font-size: 1.5rem;
                text-align: right;
                border: none;
                border-radius: 8px;
                margin-bottom: 15px;
            }
            .calculator-buttons {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 10px;
            }
            .calculator-buttons button {
                padding: 15px;
                font-size: 1.2rem;
                border: none;
                border-radius: 8px;
                background: white;
                cursor: pointer;
                transition: all 0.2s;
            }
            .calculator-buttons button:hover {
                transform: scale(1.05);
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
            .equals { background: #fd79a8 !important; color: white; }
            .zero { grid-column: span 2; }
        `;
    }

    getCalculatorJS() {
        return `
            function appendToDisplay(value) {
                document.getElementById('display').value += value;
            }
            function clearDisplay() {
                document.getElementById('display').value = '';
            }
            function deleteLast() {
                const display = document.getElementById('display');
                display.value = display.value.slice(0, -1);
            }
            function calculate() {
                const display = document.getElementById('display');
                try {
                    display.value = eval(display.value);
                } catch (e) {
                    display.value = 'Error';
                }
            }
        `;
    }

    getTodoHTML() {
        return `
            <div class="todo-container">
                <div class="todo-header">
                    <h2>My Tasks</h2>
                    <div class="task-counter">
                        <span id="completed">0</span> / <span id="total">0</span> completed
                    </div>
                </div>
                <div class="todo-input">
                    <input type="text" id="taskInput" placeholder="Add a new task...">
                    <button onclick="addTask()">Add</button>
                </div>
                <div class="todo-list" id="todoList">
                    <!-- Tasks will be added here -->
                </div>
            </div>
        `;
    }

    getTodoCSS() {
        return `
            .todo-container {
                background: white;
                padding: 20px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            .todo-header {
                text-align: center;
                margin-bottom: 20px;
            }
            .task-counter {
                color: #667eea;
                font-weight: 600;
            }
            .todo-input {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
            }
            .todo-input input {
                flex: 1;
                padding: 12px;
                border: 2px solid #e9ecef;
                border-radius: 8px;
                font-size: 1rem;
            }
            .todo-input button {
                padding: 12px 20px;
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
            }
            .task-item {
                display: flex;
                align-items: center;
                padding: 12px;
                background: #f8f9fa;
                border-radius: 8px;
                margin-bottom: 10px;
                transition: all 0.2s;
            }
            .task-item.completed {
                opacity: 0.6;
                text-decoration: line-through;
            }
            .task-item input[type="checkbox"] {
                margin-right: 12px;
                transform: scale(1.2);
            }
        `;
    }

    getTodoJS() {
        return `
            let tasks = [];
            let taskId = 0;

            function addTask() {
                const input = document.getElementById('taskInput');
                const taskText = input.value.trim();
                if (!taskText) return;

                const task = {
                    id: taskId++,
                    text: taskText,
                    completed: false
                };

                tasks.push(task);
                renderTasks();
                input.value = '';
                updateCounter();
            }

            function toggleTask(id) {
                const task = tasks.find(t => t.id === id);
                if (task) {
                    task.completed = !task.completed;
                    renderTasks();
                    updateCounter();
                }
            }

            function deleteTask(id) {
                tasks = tasks.filter(t => t.id !== id);
                renderTasks();
                updateCounter();
            }

            function renderTasks() {
                const todoList = document.getElementById('todoList');
                todoList.innerHTML = tasks.map(task => \`
                    <div class="task-item \${task.completed ? 'completed' : ''}">
                        <input type="checkbox" \${task.completed ? 'checked' : ''} 
                               onchange="toggleTask(\${task.id})">
                        <span>\${task.text}</span>
                        <button onclick="deleteTask(\${task.id})" style="margin-left: auto; background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Delete</button>
                    </div>
                \`).join('');
            }

            function updateCounter() {
                const completed = tasks.filter(t => t.completed).length;
                const total = tasks.length;
                document.getElementById('completed').textContent = completed;
                document.getElementById('total').textContent = total;
            }
        `;
    }

    getGalleryHTML() {
        return `
            <div class="gallery-container">
                <div class="gallery-header">
                    <h2>Photo Gallery</h2>
                    <button onclick="addPhoto()" class="add-photo-btn">Add Photo</button>
                </div>
                <div class="gallery-grid" id="galleryGrid">
                    <!-- Photos will be added here -->
                </div>
                <div class="photo-modal" id="photoModal" onclick="closeModal()">
                    <img id="modalImage" src="" alt="">
                </div>
            </div>
        `;
    }

    getGalleryCSS() {
        return `
            .gallery-container {
                background: white;
                padding: 20px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            .gallery-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            .add-photo-btn {
                padding: 10px 20px;
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
            }
            .gallery-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 15px;
            }
            .photo-item {
                aspect-ratio: 1;
                background: linear-gradient(45deg, #667eea, #764ba2);
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 2rem;
                cursor: pointer;
                transition: transform 0.2s;
            }
            .photo-item:hover {
                transform: scale(1.05);
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
                align-items: center;
                justify-content: center;
            }
            .photo-modal img {
                max-width: 90%;
                max-height: 90%;
                border-radius: 10px;
            }
        `;
    }

    getGalleryJS() {
        return `
            let photos = [];
            let photoId = 0;

            function addPhoto() {
                const photoEmojis = ['🌅', '🏔️', '🌊', '🌸', '🦋', '🌈', '🎨', '📸'];
                const randomEmoji = photoEmojis[Math.floor(Math.random() * photoEmojis.length)];
                
                const photo = {
                    id: photoId++,
                    emoji: randomEmoji,
                    title: \`Photo \${photoId}\`
                };

                photos.push(photo);
                renderGallery();
            }

            function renderGallery() {
                const galleryGrid = document.getElementById('galleryGrid');
                galleryGrid.innerHTML = photos.map(photo => \`
                    <div class="photo-item" onclick="openModal('\${photo.emoji}', '\${photo.title}')">
                        \${photo.emoji}
                    </div>
                \`).join('');
            }

            function openModal(emoji, title) {
                const modal = document.getElementById('photoModal');
                const modalImage = document.getElementById('modalImage');
                modalImage.src = \`data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="%23667eea"/><text x="150" y="150" text-anchor="middle" fill="white" font-size="100">\${emoji}</text></svg>\`;
                modalImage.alt = title;
                modal.style.display = 'flex';
            }

            function closeModal() {
                document.getElementById('photoModal').style.display = 'none';
            }
        `;
    }

    addAIEnhancements(code, userRequirements) {
        // Add AI-powered enhancements based on user requirements
        let enhancedCode = { ...code };

        // Add accessibility features
        enhancedCode.html = this.addAccessibilityFeatures(enhancedCode.html);
        
        // Add performance optimizations
        enhancedCode.js = this.addPerformanceOptimizations(enhancedCode.js);
        
        // Add responsive design
        enhancedCode.css += this.getResponsiveCSS();

        return enhancedCode;
    }

    addAccessibilityFeatures(html) {
        // Add ARIA labels and other accessibility features
        return html
            .replace(/<button/g, '<button role="button" tabindex="0"')
            .replace(/<input/g, '<input aria-label="Input field"');
    }

    addPerformanceOptimizations(js) {
        // Add performance optimizations
        return `
            // Performance optimizations
            const debounce = (func, wait) => {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        clearTimeout(timeout);
                        func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            };
            
            ${js}
        `;
    }
}

// Initialize AI Services
window.aiServices = new AIServices();