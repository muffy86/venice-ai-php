/**
 * Advanced Template Library
 * Sophisticated app templates with enhanced functionality
 */

class TemplateLibrary {
    constructor() {
        this.templates = new Map();
        this.categories = new Map();
        this.userFavorites = new Set();
        this.recentlyUsed = [];
        
        this.init();
    }

    init() {
        this.loadUserData();
        this.registerAdvancedTemplates();
        this.setupTemplateUI();
    }

    loadUserData() {
        // Load favorites
        const favorites = localStorage.getItem('talktoapp_favorites');
        if (favorites) {
            this.userFavorites = new Set(JSON.parse(favorites));
        }

        // Load recently used
        const recent = localStorage.getItem('talktoapp_recent_templates');
        if (recent) {
            this.recentlyUsed = JSON.parse(recent);
        }
    }

    saveUserData() {
        localStorage.setItem('talktoapp_favorites', JSON.stringify([...this.userFavorites]));
        localStorage.setItem('talktoapp_recent_templates', JSON.stringify(this.recentlyUsed));
    }

    registerAdvancedTemplates() {
        // Productivity Apps
        this.registerTemplate('advanced-todo', {
            name: 'Advanced To-Do Manager',
            category: 'productivity',
            description: 'Feature-rich task management with priorities, deadlines, and categories',
            icon: '📋',
            difficulty: 'intermediate',
            features: ['Priority levels', 'Due dates', 'Categories', 'Progress tracking', 'Search & filter'],
            code: this.getAdvancedTodoTemplate(),
            preview: 'A comprehensive task manager with drag-and-drop, priority colors, and deadline notifications.'
        });

        this.registerTemplate('note-taking', {
            name: 'Smart Notes App',
            category: 'productivity',
            description: 'Rich text editor with markdown support and organization',
            icon: '📝',
            difficulty: 'intermediate',
            features: ['Markdown support', 'Auto-save', 'Search', 'Tags', 'Export options'],
            code: this.getNoteTakingTemplate(),
            preview: 'A powerful note-taking app with markdown rendering and smart organization.'
        });

        this.registerTemplate('habit-tracker', {
            name: 'Habit Tracker',
            category: 'productivity',
            description: 'Track daily habits with streaks and analytics',
            icon: '🎯',
            difficulty: 'advanced',
            features: ['Streak tracking', 'Visual calendar', 'Statistics', 'Reminders', 'Goal setting'],
            code: this.getHabitTrackerTemplate(),
            preview: 'Build consistent habits with visual tracking and motivational streaks.'
        });

        // Entertainment Apps
        this.registerTemplate('music-player', {
            name: 'Music Player',
            category: 'entertainment',
            description: 'Audio player with playlist management',
            icon: '🎵',
            difficulty: 'advanced',
            features: ['Playlist creation', 'Audio controls', 'Visualizer', 'Shuffle/repeat', 'Volume control'],
            code: this.getMusicPlayerTemplate(),
            preview: 'A sleek music player with modern controls and playlist management.'
        });

        this.registerTemplate('memory-game', {
            name: 'Memory Challenge',
            category: 'entertainment',
            description: 'Brain training memory game with levels',
            icon: '🧠',
            difficulty: 'intermediate',
            features: ['Multiple levels', 'Score tracking', 'Timer', 'Sound effects', 'Leaderboard'],
            code: this.getMemoryGameTemplate(),
            preview: 'Test your memory with this engaging card-matching game.'
        });

        this.registerTemplate('drawing-app', {
            name: 'Digital Canvas',
            category: 'entertainment',
            description: 'Drawing app with tools and colors',
            icon: '🎨',
            difficulty: 'advanced',
            features: ['Multiple brushes', 'Color picker', 'Layers', 'Save/load', 'Undo/redo'],
            code: this.getDrawingAppTemplate(),
            preview: 'Create digital art with professional drawing tools.'
        });

        // Utility Apps
        this.registerTemplate('weather-dashboard', {
            name: 'Weather Dashboard',
            category: 'utility',
            description: 'Comprehensive weather information and forecasts',
            icon: '🌤️',
            difficulty: 'advanced',
            features: ['Current weather', '7-day forecast', 'Multiple locations', 'Weather maps', 'Alerts'],
            code: this.getWeatherDashboardTemplate(),
            preview: 'Stay informed with detailed weather data and beautiful visualizations.'
        });

        this.registerTemplate('unit-converter', {
            name: 'Universal Converter',
            category: 'utility',
            description: 'Convert between various units and currencies',
            icon: '🔄',
            difficulty: 'intermediate',
            features: ['Multiple unit types', 'Currency conversion', 'History', 'Favorites', 'Offline mode'],
            code: this.getUnitConverterTemplate(),
            preview: 'Convert measurements, currencies, and more with ease.'
        });

        this.registerTemplate('qr-generator', {
            name: 'QR Code Studio',
            category: 'utility',
            description: 'Generate and customize QR codes',
            icon: '📱',
            difficulty: 'intermediate',
            features: ['Custom QR codes', 'Color customization', 'Logo embedding', 'Batch generation', 'Download options'],
            code: this.getQRGeneratorTemplate(),
            preview: 'Create professional QR codes with custom styling and branding.'
        });

        // Business Apps
        this.registerTemplate('expense-tracker', {
            name: 'Expense Tracker',
            category: 'business',
            description: 'Personal finance management with analytics',
            icon: '💰',
            difficulty: 'advanced',
            features: ['Expense categories', 'Budget tracking', 'Charts & reports', 'Receipt scanning', 'Export data'],
            code: this.getExpenseTrackerTemplate(),
            preview: 'Manage your finances with detailed tracking and insightful analytics.'
        });

        this.registerTemplate('invoice-generator', {
            name: 'Invoice Generator',
            category: 'business',
            description: 'Professional invoice creation and management',
            icon: '📄',
            difficulty: 'advanced',
            features: ['Custom templates', 'Client management', 'Tax calculations', 'PDF export', 'Payment tracking'],
            code: this.getInvoiceGeneratorTemplate(),
            preview: 'Create professional invoices with automated calculations and tracking.'
        });

        // Health & Fitness
        this.registerTemplate('workout-planner', {
            name: 'Workout Planner',
            category: 'health',
            description: 'Plan and track your fitness routines',
            icon: '💪',
            difficulty: 'intermediate',
            features: ['Exercise database', 'Workout plans', 'Progress tracking', 'Timer', 'Rest day planning'],
            code: this.getWorkoutPlannerTemplate(),
            preview: 'Design effective workout routines and track your fitness progress.'
        });

        this.registerTemplate('calorie-counter', {
            name: 'Nutrition Tracker',
            category: 'health',
            description: 'Track calories and nutritional information',
            icon: '🥗',
            difficulty: 'advanced',
            features: ['Food database', 'Calorie tracking', 'Nutrition facts', 'Meal planning', 'Progress charts'],
            code: this.getCalorieCounterTemplate(),
            preview: 'Monitor your nutrition with comprehensive food tracking and analysis.'
        });

        // Setup categories
        this.setupCategories();
    }

    registerTemplate(id, template) {
        template.id = id;
        template.createdAt = new Date().toISOString();
        template.usageCount = 0;
        this.templates.set(id, template);
    }

    setupCategories() {
        this.categories.set('productivity', {
            name: 'Productivity',
            icon: '⚡',
            color: '#00ff88',
            description: 'Apps to boost your productivity and organization'
        });

        this.categories.set('entertainment', {
            name: 'Entertainment',
            icon: '🎮',
            color: '#ff6b6b',
            description: 'Fun games and entertainment applications'
        });

        this.categories.set('utility', {
            name: 'Utilities',
            icon: '🛠️',
            color: '#4ecdc4',
            description: 'Helpful tools and utilities for daily use'
        });

        this.categories.set('business', {
            name: 'Business',
            icon: '💼',
            color: '#45b7d1',
            description: 'Professional tools for business and finance'
        });

        this.categories.set('health', {
            name: 'Health & Fitness',
            icon: '🏃',
            color: '#96ceb4',
            description: 'Apps for health, fitness, and wellness'
        });
    }

    setupTemplateUI() {
        this.createAdvancedTemplateGrid();
        this.createCategoryFilter();
        this.createSearchInterface();
        this.createTemplateModal();
    }

    createAdvancedTemplateGrid() {
        const existingGrid = document.querySelector('.templates-grid');
        if (!existingGrid) return;

        // Enhanced grid styles
        const style = document.createElement('style');
        style.textContent = `
            .templates-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                gap: 20px;
                padding: 20px;
                max-height: 600px;
                overflow-y: auto;
            }

            .template-card {
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 16px;
                padding: 20px;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            .template-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 30px rgba(0, 255, 136, 0.3);
                border-color: #00ff88;
            }

            .template-header {
                display: flex;
                align-items: center;
                margin-bottom: 12px;
            }

            .template-icon {
                font-size: 24px;
                margin-right: 12px;
                filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
            }

            .template-title {
                font-size: 16px;
                font-weight: bold;
                color: white;
                margin: 0;
            }

            .template-category {
                position: absolute;
                top: 15px;
                right: 15px;
                background: rgba(0, 255, 136, 0.2);
                color: #00ff88;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 10px;
                text-transform: uppercase;
                font-weight: bold;
            }

            .template-description {
                color: #ccc;
                font-size: 14px;
                margin-bottom: 15px;
                line-height: 1.4;
            }

            .template-features {
                margin-bottom: 15px;
            }

            .feature-tag {
                display: inline-block;
                background: rgba(100, 149, 237, 0.2);
                color: #6495ed;
                padding: 2px 6px;
                border-radius: 8px;
                font-size: 10px;
                margin: 2px;
                border: 1px solid rgba(100, 149, 237, 0.3);
            }

            .template-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .difficulty-badge {
                padding: 4px 8px;
                border-radius: 8px;
                font-size: 10px;
                font-weight: bold;
                text-transform: uppercase;
            }

            .difficulty-beginner {
                background: rgba(76, 175, 80, 0.2);
                color: #4caf50;
                border: 1px solid rgba(76, 175, 80, 0.3);
            }

            .difficulty-intermediate {
                background: rgba(255, 193, 7, 0.2);
                color: #ffc107;
                border: 1px solid rgba(255, 193, 7, 0.3);
            }

            .difficulty-advanced {
                background: rgba(244, 67, 54, 0.2);
                color: #f44336;
                border: 1px solid rgba(244, 67, 54, 0.3);
            }

            .template-actions {
                display: flex;
                gap: 8px;
            }

            .action-btn {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: white;
                padding: 6px 10px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 10px;
                transition: all 0.2s ease;
            }

            .action-btn:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: scale(1.05);
            }

            .favorite-btn.active {
                color: #ff6b6b;
                background: rgba(255, 107, 107, 0.2);
                border-color: #ff6b6b;
            }

            .template-preview {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
                padding: 20px 20px 10px;
                transform: translateY(100%);
                transition: transform 0.3s ease;
                color: #ccc;
                font-size: 12px;
            }

            .template-card:hover .template-preview {
                transform: translateY(0);
            }
        `;

        document.head.appendChild(style);
        this.updateTemplateGrid();
    }

    createCategoryFilter() {
        const filterContainer = document.createElement('div');
        filterContainer.id = 'category-filter';
        filterContainer.innerHTML = `
            <div class="filter-header">
                <h3>📂 Categories</h3>
                <button id="show-all-categories" class="filter-btn active">All</button>
            </div>
            <div class="category-buttons" id="category-buttons">
                <!-- Category buttons will be populated here -->
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            #category-filter {
                margin-bottom: 20px;
                padding: 15px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .filter-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .filter-header h3 {
                margin: 0;
                color: #00ff88;
                font-size: 16px;
            }

            .category-buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }

            .filter-btn {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .filter-btn:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: translateY(-2px);
            }

            .filter-btn.active {
                background: linear-gradient(135deg, #00ff88, #00cc6a);
                border-color: #00ff88;
                color: black;
                font-weight: bold;
            }
        `;

        document.head.appendChild(style);

        // Insert before templates grid
        const templatesSection = document.querySelector('.templates-grid')?.parentNode;
        if (templatesSection) {
            templatesSection.insertBefore(filterContainer, templatesSection.firstChild);
        }

        this.populateCategoryFilter();
    }

    populateCategoryFilter() {
        const container = document.getElementById('category-buttons');
        if (!container) return;

        // Add "All" button functionality
        document.getElementById('show-all-categories').addEventListener('click', () => {
            this.filterByCategory(null);
            this.updateActiveFilter('show-all-categories');
        });

        // Add category buttons
        this.categories.forEach((category, id) => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.id = `filter-${id}`;
            button.innerHTML = `${category.icon} ${category.name}`;
            button.style.borderColor = category.color;
            
            button.addEventListener('click', () => {
                this.filterByCategory(id);
                this.updateActiveFilter(button.id);
            });
            
            container.appendChild(button);
        });
    }

    createSearchInterface() {
        const searchContainer = document.createElement('div');
        searchContainer.id = 'template-search';
        searchContainer.innerHTML = `
            <div class="search-box">
                <input type="text" id="template-search-input" placeholder="🔍 Search templates..." />
                <div class="search-filters">
                    <select id="difficulty-filter">
                        <option value="">All Difficulties</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                    <select id="sort-filter">
                        <option value="name">Sort by Name</option>
                        <option value="category">Sort by Category</option>
                        <option value="difficulty">Sort by Difficulty</option>
                        <option value="usage">Sort by Popularity</option>
                        <option value="recent">Recently Used</option>
                    </select>
                </div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            #template-search {
                margin-bottom: 20px;
            }

            .search-box {
                display: flex;
                gap: 15px;
                align-items: center;
                flex-wrap: wrap;
            }

            #template-search-input {
                flex: 1;
                min-width: 250px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 25px;
                padding: 12px 20px;
                color: white;
                font-size: 14px;
                outline: none;
                transition: all 0.3s ease;
            }

            #template-search-input:focus {
                border-color: #00ff88;
                box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
            }

            #template-search-input::placeholder {
                color: rgba(255, 255, 255, 0.5);
            }

            .search-filters {
                display: flex;
                gap: 10px;
            }

            .search-filters select {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                padding: 8px 12px;
                color: white;
                font-size: 12px;
                outline: none;
                cursor: pointer;
            }

            .search-filters select:focus {
                border-color: #00ff88;
            }

            .search-filters option {
                background: #1a1a1a;
                color: white;
            }
        `;

        document.head.appendChild(style);

        // Insert before category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.parentNode.insertBefore(searchContainer, categoryFilter);
        }

        this.setupSearchFunctionality();
    }

    setupSearchFunctionality() {
        const searchInput = document.getElementById('template-search-input');
        const difficultyFilter = document.getElementById('difficulty-filter');
        const sortFilter = document.getElementById('sort-filter');

        if (searchInput) {
            searchInput.addEventListener('input', () => this.performSearch());
        }

        if (difficultyFilter) {
            difficultyFilter.addEventListener('change', () => this.performSearch());
        }

        if (sortFilter) {
            sortFilter.addEventListener('change', () => this.performSearch());
        }
    }

    performSearch() {
        const searchTerm = document.getElementById('template-search-input')?.value.toLowerCase() || '';
        const difficultyFilter = document.getElementById('difficulty-filter')?.value || '';
        const sortBy = document.getElementById('sort-filter')?.value || 'name';

        let filteredTemplates = Array.from(this.templates.values());

        // Apply search filter
        if (searchTerm) {
            filteredTemplates = filteredTemplates.filter(template =>
                template.name.toLowerCase().includes(searchTerm) ||
                template.description.toLowerCase().includes(searchTerm) ||
                template.features.some(feature => feature.toLowerCase().includes(searchTerm))
            );
        }

        // Apply difficulty filter
        if (difficultyFilter) {
            filteredTemplates = filteredTemplates.filter(template =>
                template.difficulty === difficultyFilter
            );
        }

        // Apply sorting
        filteredTemplates.sort((a, b) => {
            switch (sortBy) {
                case 'category':
                    return a.category.localeCompare(b.category);
                case 'difficulty':
                    const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
                    return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
                case 'usage':
                    return b.usageCount - a.usageCount;
                case 'recent':
                    const aIndex = this.recentlyUsed.indexOf(a.id);
                    const bIndex = this.recentlyUsed.indexOf(b.id);
                    if (aIndex === -1 && bIndex === -1) return 0;
                    if (aIndex === -1) return 1;
                    if (bIndex === -1) return -1;
                    return aIndex - bIndex;
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        this.updateTemplateGrid(filteredTemplates);
    }

    updateTemplateGrid(templates = null) {
        const grid = document.querySelector('.templates-grid');
        if (!grid) return;

        const templatesToShow = templates || Array.from(this.templates.values());
        
        grid.innerHTML = '';

        templatesToShow.forEach(template => {
            const card = this.createTemplateCard(template);
            grid.appendChild(card);
        });
    }

    createTemplateCard(template) {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.dataset.templateId = template.id;

        const isFavorite = this.userFavorites.has(template.id);
        const category = this.categories.get(template.category);

        card.innerHTML = `
            <div class="template-category" style="background-color: ${category?.color}20; color: ${category?.color}">
                ${template.category}
            </div>
            
            <div class="template-header">
                <span class="template-icon">${template.icon}</span>
                <h4 class="template-title">${template.name}</h4>
            </div>
            
            <p class="template-description">${template.description}</p>
            
            <div class="template-features">
                ${template.features.map(feature => 
                    `<span class="feature-tag">${feature}</span>`
                ).join('')}
            </div>
            
            <div class="template-footer">
                <span class="difficulty-badge difficulty-${template.difficulty}">
                    ${template.difficulty}
                </span>
                
                <div class="template-actions">
                    <button class="action-btn favorite-btn ${isFavorite ? 'active' : ''}" 
                            onclick="templateLibrary.toggleFavorite('${template.id}')">
                        ${isFavorite ? '❤️' : '🤍'}
                    </button>
                    <button class="action-btn preview-btn" 
                            onclick="templateLibrary.showPreview('${template.id}')">
                        👁️
                    </button>
                    <button class="action-btn use-btn" 
                            onclick="templateLibrary.useTemplate('${template.id}')">
                        ✨ Use
                    </button>
                </div>
            </div>
            
            <div class="template-preview">
                ${template.preview}
            </div>
        `;

        return card;
    }

    filterByCategory(categoryId) {
        if (!categoryId) {
            this.updateTemplateGrid();
            return;
        }

        const filtered = Array.from(this.templates.values())
            .filter(template => template.category === categoryId);
        
        this.updateTemplateGrid(filtered);
    }

    updateActiveFilter(activeId) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.getElementById(activeId)?.classList.add('active');
    }

    toggleFavorite(templateId) {
        if (this.userFavorites.has(templateId)) {
            this.userFavorites.delete(templateId);
        } else {
            this.userFavorites.add(templateId);
        }
        
        this.saveUserData();
        this.updateTemplateGrid();
    }

    useTemplate(templateId) {
        const template = this.templates.get(templateId);
        if (!template) return;

        // Track usage
        template.usageCount++;
        this.addToRecentlyUsed(templateId);
        
        // Record performance
        if (window.performanceMonitor) {
            window.performanceMonitor.recordAppCreation(template.name, 0);
        }

        // Create the app
        this.createAppFromTemplate(template);
    }

    addToRecentlyUsed(templateId) {
        // Remove if already exists
        const index = this.recentlyUsed.indexOf(templateId);
        if (index > -1) {
            this.recentlyUsed.splice(index, 1);
        }
        
        // Add to front
        this.recentlyUsed.unshift(templateId);
        
        // Keep only last 10
        this.recentlyUsed = this.recentlyUsed.slice(0, 10);
        
        this.saveUserData();
    }

    createAppFromTemplate(template) {
        // Create new window/tab with the template code
        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(template.code);
            newWindow.document.close();
            newWindow.document.title = template.name;
        }

        // Show success message
        this.showSuccessMessage(`${template.name} created successfully!`);
    }

    showSuccessMessage(message) {
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.textContent = message;
        
        const style = document.createElement('style');
        style.textContent = `
            .success-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #00ff88, #00cc6a);
                color: black;
                padding: 15px 20px;
                border-radius: 8px;
                font-weight: bold;
                z-index: 10001;
                animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s;
                box-shadow: 0 5px 15px rgba(0, 255, 136, 0.3);
            }

            @keyframes slideInRight {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }

            @keyframes fadeOut {
                to { opacity: 0; transform: translateX(100%); }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 3000);
    }

    showPreview(templateId) {
        const template = this.templates.get(templateId);
        if (!template) return;

        // Create preview modal (implementation would go here)
        console.log('Showing preview for:', template.name);
    }

    createTemplateModal() {
        // Implementation for detailed template modal
        // This would show full template details, code preview, etc.
    }

    // Template code generators (simplified versions)
    getAdvancedTodoTemplate() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Advanced To-Do Manager</title>
    <style>
        body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 10px; padding: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .header { text-align: center; margin-bottom: 30px; }
        .add-task { display: flex; gap: 10px; margin-bottom: 20px; }
        .add-task input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .add-task select { padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .add-task button { padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; }
        .task-list { list-style: none; padding: 0; }
        .task-item { display: flex; align-items: center; padding: 15px; margin: 10px 0; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea; }
        .task-item.high { border-left-color: #e74c3c; }
        .task-item.medium { border-left-color: #f39c12; }
        .task-item.low { border-left-color: #27ae60; }
        .task-content { flex: 1; margin-left: 10px; }
        .task-title { font-weight: bold; margin-bottom: 5px; }
        .task-meta { font-size: 12px; color: #666; }
        .task-actions { display: flex; gap: 5px; }
        .btn { padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; }
        .btn-complete { background: #27ae60; color: white; }
        .btn-delete { background: #e74c3c; color: white; }
        .completed { opacity: 0.6; text-decoration: line-through; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Advanced To-Do Manager</h1>
            <p>Organize your tasks with priorities and deadlines</p>
        </div>
        
        <div class="add-task">
            <input type="text" id="taskInput" placeholder="Enter a new task...">
            <select id="prioritySelect">
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
            </select>
            <input type="date" id="dueDateInput">
            <button onclick="addTask()">Add Task</button>
        </div>
        
        <ul class="task-list" id="taskList"></ul>
    </div>

    <script>
        let tasks = JSON.parse(localStorage.getItem('advancedTodos') || '[]');
        
        function addTask() {
            const input = document.getElementById('taskInput');
            const priority = document.getElementById('prioritySelect').value;
            const dueDate = document.getElementById('dueDateInput').value;
            
            if (input.value.trim()) {
                const task = {
                    id: Date.now(),
                    text: input.value.trim(),
                    priority: priority,
                    dueDate: dueDate,
                    completed: false,
                    createdAt: new Date().toISOString()
                };
                
                tasks.push(task);
                saveTasks();
                renderTasks();
                input.value = '';
                document.getElementById('dueDateInput').value = '';
            }
        }
        
        function toggleTask(id) {
            tasks = tasks.map(task => 
                task.id === id ? { ...task, completed: !task.completed } : task
            );
            saveTasks();
            renderTasks();
        }
        
        function deleteTask(id) {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            renderTasks();
        }
        
        function saveTasks() {
            localStorage.setItem('advancedTodos', JSON.stringify(tasks));
        }
        
        function renderTasks() {
            const taskList = document.getElementById('taskList');
            taskList.innerHTML = '';
            
            tasks.sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }).forEach(task => {
                const li = document.createElement('li');
                li.className = \`task-item \${task.priority} \${task.completed ? 'completed' : ''}\`;
                
                const dueText = task.dueDate ? \`Due: \${new Date(task.dueDate).toLocaleDateString()}\` : 'No due date';
                
                li.innerHTML = \`
                    <input type="checkbox" \${task.completed ? 'checked' : ''} onchange="toggleTask(\${task.id})">
                    <div class="task-content">
                        <div class="task-title">\${task.text}</div>
                        <div class="task-meta">Priority: \${task.priority.toUpperCase()} | \${dueText}</div>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-delete" onclick="deleteTask(\${task.id})">Delete</button>
                    </div>
                \`;
                
                taskList.appendChild(li);
            });
        }
        
        document.getElementById('taskInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTask();
        });
        
        renderTasks();
    </script>
</body>
</html>`;
    }

    // Additional template methods would be implemented here...
    getNoteTakingTemplate() { return "<!-- Note Taking App Template -->"; }
    getHabitTrackerTemplate() { return "<!-- Habit Tracker Template -->"; }
    getMusicPlayerTemplate() { return "<!-- Music Player Template -->"; }
    getMemoryGameTemplate() { return "<!-- Memory Game Template -->"; }
    getDrawingAppTemplate() { return "<!-- Drawing App Template -->"; }
    getWeatherDashboardTemplate() { return "<!-- Weather Dashboard Template -->"; }
    getUnitConverterTemplate() { return "<!-- Unit Converter Template -->"; }
    getQRGeneratorTemplate() { return "<!-- QR Generator Template -->"; }
    getExpenseTrackerTemplate() { return "<!-- Expense Tracker Template -->"; }
    getInvoiceGeneratorTemplate() { return "<!-- Invoice Generator Template -->"; }
    getWorkoutPlannerTemplate() { return "<!-- Workout Planner Template -->"; }
    getCalorieCounterTemplate() { return "<!-- Calorie Counter Template -->"; }
}

// Global instance
window.templateLibrary = new TemplateLibrary();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TemplateLibrary;
}