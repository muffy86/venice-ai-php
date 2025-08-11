/**
 * Theme Management System
 * Provides theme switching and customization functionality
 */

class ThemeManager {
    constructor() {
        this.themes = new Map();
        this.currentTheme = 'dark';
        this.customProperties = new Map();
        this.loadDefaultThemes();
        this.loadSavedTheme();
    }

    loadDefaultThemes() {
        // Dark theme (default)
        this.addTheme('dark', {
            name: 'Dark',
            properties: {
                '--bg-primary': '#1a1a1a',
                '--bg-secondary': '#2d2d2d',
                '--bg-tertiary': '#3d3d3d',
                '--text-primary': '#ffffff',
                '--text-secondary': '#cccccc',
                '--text-muted': '#888888',
                '--accent-primary': '#007acc',
                '--accent-secondary': '#005a9e',
                '--border-color': '#444444',
                '--success-color': '#28a745',
                '--warning-color': '#ffc107',
                '--error-color': '#dc3545',
                '--info-color': '#17a2b8'
            }
        });

        // Light theme
        this.addTheme('light', {
            name: 'Light',
            properties: {
                '--bg-primary': '#ffffff',
                '--bg-secondary': '#f8f9fa',
                '--bg-tertiary': '#e9ecef',
                '--text-primary': '#212529',
                '--text-secondary': '#495057',
                '--text-muted': '#6c757d',
                '--accent-primary': '#007bff',
                '--accent-secondary': '#0056b3',
                '--border-color': '#dee2e6',
                '--success-color': '#28a745',
                '--warning-color': '#ffc107',
                '--error-color': '#dc3545',
                '--info-color': '#17a2b8'
            }
        });

        // High contrast theme
        this.addTheme('high-contrast', {
            name: 'High Contrast',
            properties: {
                '--bg-primary': '#000000',
                '--bg-secondary': '#1a1a1a',
                '--bg-tertiary': '#333333',
                '--text-primary': '#ffffff',
                '--text-secondary': '#ffffff',
                '--text-muted': '#cccccc',
                '--accent-primary': '#ffff00',
                '--accent-secondary': '#ffcc00',
                '--border-color': '#ffffff',
                '--success-color': '#00ff00',
                '--warning-color': '#ffff00',
                '--error-color': '#ff0000',
                '--info-color': '#00ffff'
            }
        });

        // Blue theme
        this.addTheme('blue', {
            name: 'Ocean Blue',
            properties: {
                '--bg-primary': '#0f1419',
                '--bg-secondary': '#1e2328',
                '--bg-tertiary': '#2d3748',
                '--text-primary': '#e2e8f0',
                '--text-secondary': '#cbd5e0',
                '--text-muted': '#a0aec0',
                '--accent-primary': '#3182ce',
                '--accent-secondary': '#2c5282',
                '--border-color': '#4a5568',
                '--success-color': '#38a169',
                '--warning-color': '#d69e2e',
                '--error-color': '#e53e3e',
                '--info-color': '#3182ce'
            }
        });
    }

    addTheme(id, theme) {
        this.themes.set(id, theme);
    }

    applyTheme(themeId) {
        const theme = this.themes.get(themeId);
        if (!theme) {
            console.error(`Theme ${themeId} not found`);
            return false;
        }

        const root = document.documentElement;
        
        // Apply theme properties
        Object.entries(theme.properties).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        // Apply custom properties
        this.customProperties.forEach((value, property) => {
            root.style.setProperty(property, value);
        });

        this.currentTheme = themeId;
        this.saveTheme();
        
        // Trigger theme change event
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: themeId, themeData: theme } 
        }));

        return true;
    }

    setCustomProperty(property, value) {
        this.customProperties.set(property, value);
        document.documentElement.style.setProperty(property, value);
        this.saveTheme();
    }

    getThemes() {
        return Array.from(this.themes.entries()).map(([id, theme]) => ({
            id,
            name: theme.name,
            current: id === this.currentTheme
        }));
    }

    saveTheme() {
        try {
            const themeData = {
                current: this.currentTheme,
                customProperties: Object.fromEntries(this.customProperties)
            };
            localStorage.setItem('ai_agent_theme', JSON.stringify(themeData));
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    }

    loadSavedTheme() {
        try {
            const saved = JSON.parse(localStorage.getItem('ai_agent_theme') || '{}');
            
            if (saved.customProperties) {
                Object.entries(saved.customProperties).forEach(([property, value]) => {
                    this.customProperties.set(property, value);
                });
            }
            
            if (saved.current && this.themes.has(saved.current)) {
                this.applyTheme(saved.current);
            } else {
                this.applyTheme('dark'); // Default theme
            }
        } catch (error) {
            console.error('Failed to load saved theme:', error);
            this.applyTheme('dark');
        }
    }
}

// Export for global use
window.ThemeManager = ThemeManager;