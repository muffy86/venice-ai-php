/**
 * Settings Manager Module
 * Handles application configuration, user preferences, and settings persistence
 */

class SettingsManager {
  constructor() {
    this.settings = new Map();
    this.defaultSettings = new Map();
    this.settingsSchema = new Map();
    this.changeListeners = new Map();
    this.storageKey = 'talktoapp_settings';
    this.version = '1.0.0';
    
    // Initialize default settings
    this.initializeDefaultSettings();
    this.initializeSettingsSchema();
  }

  async init() {
    console.log('⚙️ Initializing Settings Manager...');
    
    try {
      // Load settings from storage
      await this.loadSettings();
      
      // Validate and migrate if necessary
      await this.validateAndMigrate();
      
      // Setup auto-save
      this.setupAutoSave();
      
      console.log('✅ Settings Manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Settings Manager:', error);
      throw error;
    }
  }

  initializeDefaultSettings() {
    // General Settings
    this.defaultSettings.set('general.theme', 'auto');
    this.defaultSettings.set('general.language', 'en');
    this.defaultSettings.set('general.autoSave', true);
    this.defaultSettings.set('general.autoSaveInterval', 30000);
    this.defaultSettings.set('general.confirmBeforeExit', true);
    this.defaultSettings.set('general.showWelcomeMessage', true);
    this.defaultSettings.set('general.enableAnimations', true);
    this.defaultSettings.set('general.enableSounds', false);
    
    // Chat Settings
    this.defaultSettings.set('chat.defaultProvider', 'openai');
    this.defaultSettings.set('chat.defaultModel', 'gpt-3.5-turbo');
    this.defaultSettings.set('chat.maxTokens', 1000);
    this.defaultSettings.set('chat.temperature', 0.7);
    this.defaultSettings.set('chat.enableStreaming', true);
    this.defaultSettings.set('chat.showTypingIndicator', true);
    this.defaultSettings.set('chat.enableMarkdown', true);
    this.defaultSettings.set('chat.enableCodeHighlighting', true);
    this.defaultSettings.set('chat.autoScroll', true);
    this.defaultSettings.set('chat.saveHistory', true);
    this.defaultSettings.set('chat.maxHistorySize', 1000);
    this.defaultSettings.set('chat.enableContextLearning', true);
    
    // Privacy Settings
    this.defaultSettings.set('privacy.enableWebTracking', true);
    this.defaultSettings.set('privacy.enableBehavioralLearning', true);
    this.defaultSettings.set('privacy.shareAnonymousUsage', false);
    this.defaultSettings.set('privacy.enableCookies', true);
    this.defaultSettings.set('privacy.dataRetentionDays', 30);
    this.defaultSettings.set('privacy.enableEncryption', true);
    
    // Performance Settings
    this.defaultSettings.set('performance.enableCaching', true);
    this.defaultSettings.set('performance.cacheTimeout', 300000);
    this.defaultSettings.set('performance.maxCacheSize', 100);
    this.defaultSettings.set('performance.enableCompression', true);
    this.defaultSettings.set('performance.enableLazyLoading', true);
    this.defaultSettings.set('performance.enablePreloading', true);
    this.defaultSettings.set('performance.maxConcurrentRequests', 5);
    
    // Accessibility Settings
    this.defaultSettings.set('accessibility.enableScreenReader', false);
    this.defaultSettings.set('accessibility.enableHighContrast', false);
    this.defaultSettings.set('accessibility.enableLargeText', false);
    this.defaultSettings.set('accessibility.enableKeyboardNavigation', true);
    this.defaultSettings.set('accessibility.enableFocusIndicators', true);
    this.defaultSettings.set('accessibility.enableReducedMotion', false);
    
    // Notification Settings
    this.defaultSettings.set('notifications.enableDesktop', false);
    this.defaultSettings.set('notifications.enableSound', false);
    this.defaultSettings.set('notifications.enableInApp', true);
    this.defaultSettings.set('notifications.autoHideDelay', 5000);
    this.defaultSettings.set('notifications.maxVisible', 5);
    this.defaultSettings.set('notifications.position', 'top-right');
    
    // API Settings
    this.defaultSettings.set('api.timeout', 30000);
    this.defaultSettings.set('api.retryAttempts', 3);
    this.defaultSettings.set('api.retryDelay', 1000);
    this.defaultSettings.set('api.enableRateLimiting', true);
    this.defaultSettings.set('api.enableRequestLogging', true);
    
    // Debug Settings
    this.defaultSettings.set('debug.enableLogging', false);
    this.defaultSettings.set('debug.logLevel', 'info');
    this.defaultSettings.set('debug.enableConsoleOutput', true);
    this.defaultSettings.set('debug.enablePerformanceMonitoring', false);
    this.defaultSettings.set('debug.enableErrorReporting', true);
  }

  initializeSettingsSchema() {
    // Define validation schemas for settings
    this.settingsSchema.set('general.theme', {
      type: 'string',
      enum: ['light', 'dark', 'auto'],
      description: 'Application theme'
    });
    
    this.settingsSchema.set('general.language', {
      type: 'string',
      enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'],
      description: 'Application language'
    });
    
    this.settingsSchema.set('general.autoSave', {
      type: 'boolean',
      description: 'Enable automatic saving'
    });
    
    this.settingsSchema.set('general.autoSaveInterval', {
      type: 'number',
      min: 5000,
      max: 300000,
      description: 'Auto-save interval in milliseconds'
    });
    
    this.settingsSchema.set('chat.defaultProvider', {
      type: 'string',
      enum: ['openai', 'anthropic', 'google'],
      description: 'Default AI provider'
    });
    
    this.settingsSchema.set('chat.maxTokens', {
      type: 'number',
      min: 100,
      max: 4000,
      description: 'Maximum tokens per response'
    });
    
    this.settingsSchema.set('chat.temperature', {
      type: 'number',
      min: 0,
      max: 2,
      description: 'Response creativity (0-2)'
    });
    
    this.settingsSchema.set('privacy.dataRetentionDays', {
      type: 'number',
      min: 1,
      max: 365,
      description: 'Data retention period in days'
    });
    
    this.settingsSchema.set('performance.cacheTimeout', {
      type: 'number',
      min: 60000,
      max: 3600000,
      description: 'Cache timeout in milliseconds'
    });
    
    this.settingsSchema.set('notifications.autoHideDelay', {
      type: 'number',
      min: 1000,
      max: 30000,
      description: 'Auto-hide delay for notifications'
    });
    
    this.settingsSchema.set('notifications.position', {
      type: 'string',
      enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      description: 'Notification position'
    });
  }

  // Settings Management

  async loadSettings() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        
        // Check version compatibility
        if (data.version && this.isCompatibleVersion(data.version)) {
          Object.entries(data.settings || {}).forEach(([key, value]) => {
            this.settings.set(key, value);
          });
        } else {
          console.log('Settings version mismatch, using defaults');
        }
      }
      
      // Fill in missing defaults
      this.defaultSettings.forEach((value, key) => {
        if (!this.settings.has(key)) {
          this.settings.set(key, value);
        }
      });
      
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.resetToDefaults();
    }
  }

  async saveSettings() {
    try {
      const data = {
        version: this.version,
        timestamp: Date.now(),
        settings: Object.fromEntries(this.settings)
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      console.log('⚙️ Settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  setupAutoSave() {
    if (this.get('general.autoSave')) {
      const interval = this.get('general.autoSaveInterval');
      this.autoSaveTimer = setInterval(() => {
        this.saveSettings();
      }, interval);
    }
  }

  // Setting Access Methods

  get(key, defaultValue = null) {
    if (this.settings.has(key)) {
      return this.settings.get(key);
    }
    
    if (this.defaultSettings.has(key)) {
      return this.defaultSettings.get(key);
    }
    
    return defaultValue;
  }

  set(key, value) {
    // Validate the setting
    if (!this.validateSetting(key, value)) {
      throw new Error(`Invalid value for setting ${key}: ${value}`);
    }
    
    const oldValue = this.settings.get(key);
    this.settings.set(key, value);
    
    // Trigger change listeners
    this.notifyChange(key, value, oldValue);
    
    // Auto-save if enabled
    if (this.get('general.autoSave')) {
      this.saveSettings();
    }
    
    return this;
  }

  has(key) {
    return this.settings.has(key) || this.defaultSettings.has(key);
  }

  delete(key) {
    const oldValue = this.settings.get(key);
    const deleted = this.settings.delete(key);
    
    if (deleted) {
      this.notifyChange(key, undefined, oldValue);
      
      if (this.get('general.autoSave')) {
        this.saveSettings();
      }
    }
    
    return deleted;
  }

  reset(key) {
    if (this.defaultSettings.has(key)) {
      this.set(key, this.defaultSettings.get(key));
    } else {
      this.delete(key);
    }
    
    return this;
  }

  resetToDefaults() {
    this.settings.clear();
    this.defaultSettings.forEach((value, key) => {
      this.settings.set(key, value);
    });
    
    this.saveSettings();
    this.notifyChange('*', null, null); // Global reset notification
    
    return this;
  }

  // Bulk Operations

  getAll() {
    const result = {};
    
    // Start with defaults
    this.defaultSettings.forEach((value, key) => {
      result[key] = value;
    });
    
    // Override with user settings
    this.settings.forEach((value, key) => {
      result[key] = value;
    });
    
    return result;
  }

  setMultiple(settings) {
    const changes = [];
    
    Object.entries(settings).forEach(([key, value]) => {
      if (this.validateSetting(key, value)) {
        const oldValue = this.settings.get(key);
        this.settings.set(key, value);
        changes.push({ key, value, oldValue });
      }
    });
    
    // Notify all changes
    changes.forEach(({ key, value, oldValue }) => {
      this.notifyChange(key, value, oldValue);
    });
    
    if (this.get('general.autoSave')) {
      this.saveSettings();
    }
    
    return this;
  }

  // Category-based access

  getCategory(category) {
    const result = {};
    const prefix = `${category}.`;
    
    this.settings.forEach((value, key) => {
      if (key.startsWith(prefix)) {
        const subKey = key.substring(prefix.length);
        result[subKey] = value;
      }
    });
    
    // Fill in defaults
    this.defaultSettings.forEach((value, key) => {
      if (key.startsWith(prefix)) {
        const subKey = key.substring(prefix.length);
        if (!(subKey in result)) {
          result[subKey] = value;
        }
      }
    });
    
    return result;
  }

  setCategory(category, settings) {
    const updates = {};
    Object.entries(settings).forEach(([key, value]) => {
      updates[`${category}.${key}`] = value;
    });
    
    return this.setMultiple(updates);
  }

  // Validation

  validateSetting(key, value) {
    const schema = this.settingsSchema.get(key);
    if (!schema) {
      // No schema defined, allow any value
      return true;
    }
    
    // Type validation
    if (schema.type && typeof value !== schema.type) {
      console.error(`Setting ${key} must be of type ${schema.type}, got ${typeof value}`);
      return false;
    }
    
    // Enum validation
    if (schema.enum && !schema.enum.includes(value)) {
      console.error(`Setting ${key} must be one of: ${schema.enum.join(', ')}`);
      return false;
    }
    
    // Range validation for numbers
    if (schema.type === 'number') {
      if (schema.min !== undefined && value < schema.min) {
        console.error(`Setting ${key} must be at least ${schema.min}`);
        return false;
      }
      
      if (schema.max !== undefined && value > schema.max) {
        console.error(`Setting ${key} must be at most ${schema.max}`);
        return false;
      }
    }
    
    // String length validation
    if (schema.type === 'string') {
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        console.error(`Setting ${key} must be at least ${schema.minLength} characters`);
        return false;
      }
      
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        console.error(`Setting ${key} must be at most ${schema.maxLength} characters`);
        return false;
      }
    }
    
    return true;
  }

  // Change Listeners

  onChange(key, callback) {
    if (!this.changeListeners.has(key)) {
      this.changeListeners.set(key, []);
    }
    
    this.changeListeners.get(key).push(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.changeListeners.get(key);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  offChange(key, callback) {
    const listeners = this.changeListeners.get(key);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  notifyChange(key, newValue, oldValue) {
    // Notify specific key listeners
    const listeners = this.changeListeners.get(key);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(newValue, oldValue, key);
        } catch (error) {
          console.error(`Error in settings change listener for ${key}:`, error);
        }
      });
    }
    
    // Notify wildcard listeners
    const wildcardListeners = this.changeListeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach(callback => {
        try {
          callback(newValue, oldValue, key);
        } catch (error) {
          console.error('Error in wildcard settings change listener:', error);
        }
      });
    }
  }

  // Import/Export

  exportSettings() {
    return {
      version: this.version,
      timestamp: Date.now(),
      settings: Object.fromEntries(this.settings),
      defaults: Object.fromEntries(this.defaultSettings)
    };
  }

  importSettings(data, options = {}) {
    const { merge = false, validate = true } = options;
    
    if (!merge) {
      this.settings.clear();
    }
    
    if (data.settings) {
      Object.entries(data.settings).forEach(([key, value]) => {
        if (!validate || this.validateSetting(key, value)) {
          this.settings.set(key, value);
        }
      });
    }
    
    if (this.get('general.autoSave')) {
      this.saveSettings();
    }
    
    this.notifyChange('*', null, null); // Global change notification
    
    return this;
  }

  // Migration

  async validateAndMigrate() {
    // Check for settings that need migration
    const migrations = this.getMigrations();
    
    for (const migration of migrations) {
      try {
        await migration();
      } catch (error) {
        console.error('Settings migration failed:', error);
      }
    }
  }

  getMigrations() {
    return [
      // Example migration: rename old setting keys
      () => {
        if (this.settings.has('theme')) {
          this.settings.set('general.theme', this.settings.get('theme'));
          this.settings.delete('theme');
        }
      },
      
      // Example migration: convert old boolean to new enum
      () => {
        if (this.settings.has('enableDarkMode')) {
          const darkMode = this.settings.get('enableDarkMode');
          this.settings.set('general.theme', darkMode ? 'dark' : 'light');
          this.settings.delete('enableDarkMode');
        }
      }
    ];
  }

  isCompatibleVersion(version) {
    // Simple version compatibility check
    const [major] = version.split('.');
    const [currentMajor] = this.version.split('.');
    
    return major === currentMajor;
  }

  // Utility Methods

  getSettingsSchema() {
    return Object.fromEntries(this.settingsSchema);
  }

  getDefaultSettings() {
    return Object.fromEntries(this.defaultSettings);
  }

  getModifiedSettings() {
    const modified = {};
    
    this.settings.forEach((value, key) => {
      const defaultValue = this.defaultSettings.get(key);
      if (defaultValue !== value) {
        modified[key] = { current: value, default: defaultValue };
      }
    });
    
    return modified;
  }

  hasModifications() {
    return Object.keys(this.getModifiedSettings()).length > 0;
  }

  // Theme-specific helpers

  getTheme() {
    const theme = this.get('general.theme');
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }

  applyTheme() {
    const theme = this.getTheme();
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.content = theme === 'dark' ? '#1a1a1a' : '#ffffff';
    }
  }

  // Accessibility helpers

  applyAccessibilitySettings() {
    const accessibility = this.getCategory('accessibility');
    
    if (accessibility.enableHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    if (accessibility.enableLargeText) {
      document.documentElement.classList.add('large-text');
    } else {
      document.documentElement.classList.remove('large-text');
    }
    
    if (accessibility.enableReducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
  }

  // Performance helpers

  getPerformanceSettings() {
    return this.getCategory('performance');
  }

  // Debug helpers

  enableDebugMode() {
    this.set('debug.enableLogging', true);
    this.set('debug.enableConsoleOutput', true);
    this.set('debug.enablePerformanceMonitoring', true);
    console.log('🐛 Debug mode enabled');
  }

  disableDebugMode() {
    this.set('debug.enableLogging', false);
    this.set('debug.enableConsoleOutput', false);
    this.set('debug.enablePerformanceMonitoring', false);
    console.log('🐛 Debug mode disabled');
  }

  // Cleanup

  destroy() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    
    this.changeListeners.clear();
    this.settings.clear();
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.SettingsManager = SettingsManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SettingsManager;
}