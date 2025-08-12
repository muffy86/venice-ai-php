/**
 * UI Components Module
 * Manages interactive UI components and user interface elements
 */

class UIComponents {
  constructor() {
    this.components = new Map();
    this.notifications = [];
    this.modals = new Map();
    this.tooltips = new Map();
    this.maxNotifications = 5;
    this.notificationTimeout = 5000;
    
    // Component types
    this.componentTypes = {
      NOTIFICATION: 'notification',
      MODAL: 'modal',
      TOOLTIP: 'tooltip',
      DROPDOWN: 'dropdown',
      SIDEBAR: 'sidebar',
      CHAT_BUBBLE: 'chat_bubble',
      LOADING: 'loading',
      PROGRESS: 'progress'
    };

    // Animation settings
    this.animations = {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      slideDistance: '20px'
    };

    this.eventListeners = new Map();
  }

  async init() {
    console.log('🎨 Initializing UI Components...');
    
    try {
      // Initialize component systems
      this.initializeEventSystem();
      this.initializeNotificationSystem();
      this.initializeModalSystem();
      this.initializeTooltipSystem();
      this.initializeKeyboardHandlers();
      
      // Setup accessibility features
      this.setupAccessibility();
      
      console.log('✅ UI Components initialized');
    } catch (error) {
      console.error('❌ Failed to initialize UI Components:', error);
      throw error;
    }
  }

  // Notification System

  initializeNotificationSystem() {
    // Create notification container if it doesn't exist
    if (!document.getElementById('notification-container')) {
      const container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'notification-container';
      document.body.appendChild(container);
    }
  }

  showNotification(message, type = 'info', options = {}) {
    const notification = {
      id: this.generateId(),
      message,
      type,
      timestamp: Date.now(),
      duration: options.duration || this.notificationTimeout,
      persistent: options.persistent || false,
      actions: options.actions || [],
      icon: options.icon || this.getDefaultIcon(type)
    };

    this.notifications.push(notification);
    
    // Limit notifications
    if (this.notifications.length > this.maxNotifications) {
      const oldest = this.notifications.shift();
      this.removeNotificationElement(oldest.id);
    }

    this.renderNotification(notification);
    
    // Auto-remove if not persistent
    if (!notification.persistent) {
      setTimeout(() => {
        this.hideNotification(notification.id);
      }, notification.duration);
    }

    this.emit('notificationShown', { notification });
    return notification.id;
  }

  hideNotification(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index > -1) {
      const notification = this.notifications[index];
      this.notifications.splice(index, 1);
      this.removeNotificationElement(notificationId);
      this.emit('notificationHidden', { notification });
    }
  }

  renderNotification(notification) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const element = document.createElement('div');
    element.id = `notification-${notification.id}`;
    element.className = `notification notification--${notification.type}`;
    element.setAttribute('role', 'alert');
    element.setAttribute('aria-live', 'polite');

    element.innerHTML = `
      <div class="notification__header">
        <div class="notification__icon">
          ${notification.icon}
        </div>
        <button class="notification__close" aria-label="Close notification">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 7.293l2.146-2.147a.5.5 0 01.708.708L8.707 8l2.147 2.146a.5.5 0 01-.708.708L8 8.707l-2.146 2.147a.5.5 0 01-.708-.708L7.293 8 5.146 5.854a.5.5 0 01.708-.708L8 7.293z"/>
          </svg>
        </button>
      </div>
      <div class="notification__message">${this.escapeHtml(notification.message)}</div>
      ${notification.actions.length > 0 ? this.renderNotificationActions(notification.actions) : ''}
      ${!notification.persistent ? '<div class="notification__progress"></div>' : ''}
    `;

    // Add event listeners
    const closeBtn = element.querySelector('.notification__close');
    closeBtn.addEventListener('click', () => this.hideNotification(notification.id));

    // Add action listeners
    notification.actions.forEach((action, index) => {
      const actionBtn = element.querySelector(`[data-action="${index}"]`);
      if (actionBtn) {
        actionBtn.addEventListener('click', () => {
          action.handler();
          if (action.closeOnClick !== false) {
            this.hideNotification(notification.id);
          }
        });
      }
    });

    // Animate in
    element.style.transform = `translateX(${this.animations.slideDistance})`;
    element.style.opacity = '0';
    container.appendChild(element);

    // Trigger animation
    requestAnimationFrame(() => {
      element.style.transition = `all ${this.animations.duration}ms ${this.animations.easing}`;
      element.style.transform = 'translateX(0)';
      element.style.opacity = '1';
    });

    // Progress bar animation
    if (!notification.persistent) {
      const progressBar = element.querySelector('.notification__progress');
      if (progressBar) {
        progressBar.style.animation = `notification-progress ${notification.duration}ms linear`;
      }
    }
  }

  removeNotificationElement(notificationId) {
    const element = document.getElementById(`notification-${notificationId}`);
    if (element) {
      element.style.transition = `all ${this.animations.duration}ms ${this.animations.easing}`;
      element.style.transform = `translateX(${this.animations.slideDistance})`;
      element.style.opacity = '0';
      
      setTimeout(() => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      }, this.animations.duration);
    }
  }

  renderNotificationActions(actions) {
    return `
      <div class="notification__actions">
        ${actions.map((action, index) => `
          <button class="notification__action" data-action="${index}">
            ${this.escapeHtml(action.label)}
          </button>
        `).join('')}
      </div>
    `;
  }

  getDefaultIcon(type) {
    const icons = {
      success: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/></svg>',
      error: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 15A7 7 0 118 1a7 7 0 010 14zM8 4a.905.905 0 00-.9.995l.35 3.507a.552.552 0 001.1 0l.35-3.507A.905.905 0 008 4zm.002 6a1 1 0 100 2 1 1 0 000-2z"/></svg>',
      warning: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8.982 1.566a1.13 1.13 0 00-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 01-1.1 0L7.1 5.995A.905.905 0 018 5zm.002 6a1 1 0 100 2 1 1 0 000-2z"/></svg>',
      info: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 15A7 7 0 118 1a7 7 0 010 14zm0-11a1 1 0 00-1 1v3a1 1 0 002 0V5a1 1 0 00-1-1zM6.5 9.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z"/></svg>'
    };
    return icons[type] || icons.info;
  }

  // Modal System

  initializeModalSystem() {
    // Create modal overlay if it doesn't exist
    if (!document.getElementById('modal-overlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'modal-overlay';
      overlay.className = 'modal-overlay';
      overlay.style.display = 'none';
      document.body.appendChild(overlay);

      // Close modal on overlay click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeTopModal();
        }
      });
    }
  }

  showModal(id, content, options = {}) {
    const modal = {
      id,
      content,
      title: options.title || '',
      size: options.size || 'medium',
      closable: options.closable !== false,
      persistent: options.persistent || false,
      onClose: options.onClose || null,
      className: options.className || ''
    };

    this.modals.set(id, modal);
    this.renderModal(modal);
    this.emit('modalShown', { modal });
    
    return id;
  }

  hideModal(id) {
    const modal = this.modals.get(id);
    if (!modal) return;

    // Call onClose callback
    if (modal.onClose) {
      modal.onClose();
    }

    this.modals.delete(id);
    this.removeModalElement(id);
    
    // Hide overlay if no modals are open
    if (this.modals.size === 0) {
      const overlay = document.getElementById('modal-overlay');
      if (overlay) {
        overlay.style.display = 'none';
      }
    }

    this.emit('modalHidden', { modal });
  }

  closeTopModal() {
    const modalIds = Array.from(this.modals.keys());
    if (modalIds.length > 0) {
      const topModalId = modalIds[modalIds.length - 1];
      const modal = this.modals.get(topModalId);
      
      if (modal && modal.closable) {
        this.hideModal(topModalId);
      }
    }
  }

  renderModal(modal) {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

    const element = document.createElement('div');
    element.id = `modal-${modal.id}`;
    element.className = `modal modal--${modal.size} ${modal.className}`;
    element.setAttribute('role', 'dialog');
    element.setAttribute('aria-modal', 'true');
    element.setAttribute('aria-labelledby', `modal-title-${modal.id}`);

    element.innerHTML = `
      <div class="modal__content">
        ${modal.title ? `
          <div class="modal__header">
            <h2 class="modal__title" id="modal-title-${modal.id}">${this.escapeHtml(modal.title)}</h2>
            ${modal.closable ? `
              <button class="modal__close" aria-label="Close modal">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 8.586L2.929 1.515 1.515 2.929 8.586 10l-7.071 7.071 1.414 1.414L10 11.414l7.071 7.071 1.414-1.414L11.414 10l7.071-7.071-1.414-1.414L10 8.586z"/>
                </svg>
              </button>
            ` : ''}
          </div>
        ` : ''}
        <div class="modal__body">
          ${modal.content}
        </div>
      </div>
    `;

    // Add close event listener
    if (modal.closable) {
      const closeBtn = element.querySelector('.modal__close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.hideModal(modal.id));
      }
    }

    // Show overlay and add modal
    overlay.style.display = 'flex';
    overlay.appendChild(element);

    // Animate in
    element.style.transform = 'scale(0.9)';
    element.style.opacity = '0';
    
    requestAnimationFrame(() => {
      element.style.transition = `all ${this.animations.duration}ms ${this.animations.easing}`;
      element.style.transform = 'scale(1)';
      element.style.opacity = '1';
    });

    // Focus management
    const firstFocusable = element.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }

  removeModalElement(id) {
    const element = document.getElementById(`modal-${id}`);
    if (element) {
      element.style.transition = `all ${this.animations.duration}ms ${this.animations.easing}`;
      element.style.transform = 'scale(0.9)';
      element.style.opacity = '0';
      
      setTimeout(() => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      }, this.animations.duration);
    }
  }

  // Tooltip System

  initializeTooltipSystem() {
    // Create tooltip container
    if (!document.getElementById('tooltip-container')) {
      const container = document.createElement('div');
      container.id = 'tooltip-container';
      container.className = 'tooltip-container';
      document.body.appendChild(container);
    }

    // Add global tooltip listeners
    document.addEventListener('mouseenter', this.handleTooltipMouseEnter.bind(this), true);
    document.addEventListener('mouseleave', this.handleTooltipMouseLeave.bind(this), true);
    document.addEventListener('focus', this.handleTooltipFocus.bind(this), true);
    document.addEventListener('blur', this.handleTooltipBlur.bind(this), true);
  }

  handleTooltipMouseEnter(e) {
    const element = e.target.closest('[data-tooltip]');
    if (element) {
      this.showTooltip(element);
    }
  }

  handleTooltipMouseLeave(e) {
    const element = e.target.closest('[data-tooltip]');
    if (element) {
      this.hideTooltip(element);
    }
  }

  handleTooltipFocus(e) {
    const element = e.target.closest('[data-tooltip]');
    if (element) {
      this.showTooltip(element);
    }
  }

  handleTooltipBlur(e) {
    const element = e.target.closest('[data-tooltip]');
    if (element) {
      this.hideTooltip(element);
    }
  }

  showTooltip(element) {
    const text = element.getAttribute('data-tooltip');
    const position = element.getAttribute('data-tooltip-position') || 'top';
    const delay = parseInt(element.getAttribute('data-tooltip-delay')) || 500;

    if (!text) return;

    const tooltipId = this.generateId();
    element.setAttribute('data-tooltip-id', tooltipId);

    setTimeout(() => {
      // Check if element still has focus/hover
      if (element.getAttribute('data-tooltip-id') === tooltipId) {
        this.renderTooltip(tooltipId, text, position, element);
      }
    }, delay);
  }

  hideTooltip(element) {
    const tooltipId = element.getAttribute('data-tooltip-id');
    if (tooltipId) {
      element.removeAttribute('data-tooltip-id');
      this.removeTooltipElement(tooltipId);
    }
  }

  renderTooltip(id, text, position, targetElement) {
    const container = document.getElementById('tooltip-container');
    if (!container) return;

    const tooltip = document.createElement('div');
    tooltip.id = `tooltip-${id}`;
    tooltip.className = `tooltip tooltip--${position}`;
    tooltip.setAttribute('role', 'tooltip');
    tooltip.textContent = text;

    container.appendChild(tooltip);

    // Position tooltip
    this.positionTooltip(tooltip, targetElement, position);

    // Animate in
    tooltip.style.opacity = '0';
    tooltip.style.transform = 'scale(0.8)';
    
    requestAnimationFrame(() => {
      tooltip.style.transition = `all ${this.animations.duration}ms ${this.animations.easing}`;
      tooltip.style.opacity = '1';
      tooltip.style.transform = 'scale(1)';
    });
  }

  positionTooltip(tooltip, targetElement, position) {
    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    let top, left;

    switch (position) {
      case 'top':
        top = targetRect.top + scrollTop - tooltipRect.height - 8;
        left = targetRect.left + scrollLeft + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + scrollTop + 8;
        left = targetRect.left + scrollLeft + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = targetRect.top + scrollTop + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left + scrollLeft - tooltipRect.width - 8;
        break;
      case 'right':
        top = targetRect.top + scrollTop + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + scrollLeft + 8;
        break;
      default:
        top = targetRect.top + scrollTop - tooltipRect.height - 8;
        left = targetRect.left + scrollLeft + (targetRect.width - tooltipRect.width) / 2;
    }

    // Keep tooltip within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 0) left = 8;
    if (left + tooltipRect.width > viewportWidth) left = viewportWidth - tooltipRect.width - 8;
    if (top < scrollTop) top = scrollTop + 8;
    if (top + tooltipRect.height > scrollTop + viewportHeight) top = scrollTop + viewportHeight - tooltipRect.height - 8;

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }

  removeTooltipElement(id) {
    const tooltip = document.getElementById(`tooltip-${id}`);
    if (tooltip) {
      tooltip.style.transition = `all ${this.animations.duration}ms ${this.animations.easing}`;
      tooltip.style.opacity = '0';
      tooltip.style.transform = 'scale(0.8)';
      
      setTimeout(() => {
        if (tooltip.parentNode) {
          tooltip.parentNode.removeChild(tooltip);
        }
      }, this.animations.duration);
    }
  }

  // Loading Components

  showLoading(containerId, message = 'Loading...') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const loadingId = this.generateId();
    const loading = document.createElement('div');
    loading.id = `loading-${loadingId}`;
    loading.className = 'loading-overlay';
    loading.innerHTML = `
      <div class="loading-spinner">
        <div class="loading-spinner__circle"></div>
        <div class="loading-spinner__message">${this.escapeHtml(message)}</div>
      </div>
    `;

    container.appendChild(loading);
    return loadingId;
  }

  hideLoading(loadingId) {
    const loading = document.getElementById(`loading-${loadingId}`);
    if (loading && loading.parentNode) {
      loading.parentNode.removeChild(loading);
    }
  }

  // Progress Components

  createProgressBar(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const progressId = this.generateId();
    const progress = document.createElement('div');
    progress.id = `progress-${progressId}`;
    progress.className = 'progress-bar';
    progress.innerHTML = `
      <div class="progress-bar__track">
        <div class="progress-bar__fill" style="width: 0%"></div>
      </div>
      ${options.showLabel ? '<div class="progress-bar__label">0%</div>' : ''}
    `;

    container.appendChild(progress);
    return progressId;
  }

  updateProgress(progressId, percentage, label = null) {
    const progress = document.getElementById(`progress-${progressId}`);
    if (!progress) return;

    const fill = progress.querySelector('.progress-bar__fill');
    const labelElement = progress.querySelector('.progress-bar__label');

    if (fill) {
      fill.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
    }

    if (labelElement) {
      labelElement.textContent = label || `${Math.round(percentage)}%`;
    }
  }

  removeProgress(progressId) {
    const progress = document.getElementById(`progress-${progressId}`);
    if (progress && progress.parentNode) {
      progress.parentNode.removeChild(progress);
    }
  }

  // Chat Components

  addChatMessage(containerId, message, type = 'user', options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const messageId = this.generateId();
    const messageElement = document.createElement('div');
    messageElement.id = `message-${messageId}`;
    messageElement.className = `chat-message chat-message--${type}`;
    messageElement.innerHTML = `
      <div class="chat-message__content">
        ${options.avatar ? `<div class="chat-message__avatar">${options.avatar}</div>` : ''}
        <div class="chat-message__bubble">
          <div class="chat-message__text">${this.escapeHtml(message)}</div>
          ${options.timestamp ? `<div class="chat-message__timestamp">${options.timestamp}</div>` : ''}
        </div>
      </div>
    `;

    // Animate in
    messageElement.style.opacity = '0';
    messageElement.style.transform = `translateY(${this.animations.slideDistance})`;
    container.appendChild(messageElement);

    requestAnimationFrame(() => {
      messageElement.style.transition = `all ${this.animations.duration}ms ${this.animations.easing}`;
      messageElement.style.opacity = '1';
      messageElement.style.transform = 'translateY(0)';
    });

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;

    return messageId;
  }

  // Keyboard Handlers

  initializeKeyboardHandlers() {
    document.addEventListener('keydown', (e) => {
      // Escape key closes modals
      if (e.key === 'Escape') {
        this.closeTopModal();
      }

      // Ctrl/Cmd + Enter in textareas
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const textarea = e.target.closest('textarea');
        if (textarea && textarea.form) {
          const submitBtn = textarea.form.querySelector('[type="submit"]');
          if (submitBtn) {
            submitBtn.click();
          }
        }
      }
    });
  }

  // Accessibility

  setupAccessibility() {
    // Add skip links
    this.addSkipLinks();
    
    // Manage focus for modals
    this.setupFocusManagement();
    
    // Add ARIA live regions
    this.setupLiveRegions();
  }

  addSkipLinks() {
    if (!document.getElementById('skip-links')) {
      const skipLinks = document.createElement('div');
      skipLinks.id = 'skip-links';
      skipLinks.className = 'skip-links';
      skipLinks.innerHTML = `
        <a href="#main-content" class="skip-link">Skip to main content</a>
        <a href="#chat-input" class="skip-link">Skip to chat input</a>
      `;
      document.body.insertBefore(skipLinks, document.body.firstChild);
    }
  }

  setupFocusManagement() {
    // Store focus before modal opens
    this.on('modalShown', () => {
      this.lastFocusedElement = document.activeElement;
    });

    // Restore focus when modal closes
    this.on('modalHidden', () => {
      if (this.lastFocusedElement && this.modals.size === 0) {
        this.lastFocusedElement.focus();
        this.lastFocusedElement = null;
      }
    });
  }

  setupLiveRegions() {
    if (!document.getElementById('live-region')) {
      const liveRegion = document.createElement('div');
      liveRegion.id = 'live-region';
      liveRegion.className = 'sr-only';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      document.body.appendChild(liveRegion);
    }
  }

  announceToScreenReader(message) {
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }

  // Event System

  initializeEventSystem() {
    this.eventListeners = new Map();
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in UI event listener for ${event}:`, error);
        }
      });
    }
  }

  // Utility Methods

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Public API Methods

  getNotifications() {
    return [...this.notifications];
  }

  getModals() {
    return Array.from(this.modals.values());
  }

  clearAllNotifications() {
    this.notifications.forEach(notification => {
      this.hideNotification(notification.id);
    });
  }

  closeAllModals() {
    Array.from(this.modals.keys()).forEach(id => {
      this.hideModal(id);
    });
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.emit('themeChanged', { theme });
  }

  getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  // Convenience methods for common notifications
  showSuccess(message, options = {}) {
    return this.showNotification(message, 'success', options);
  }

  showError(message, options = {}) {
    return this.showNotification(message, 'error', options);
  }

  showWarning(message, options = {}) {
    return this.showNotification(message, 'warning', options);
  }

  showInfo(message, options = {}) {
    return this.showNotification(message, 'info', options);
  }

  // Confirmation dialog
  showConfirmation(message, options = {}) {
    return new Promise((resolve) => {
      const modalContent = `
        <div class="confirmation-dialog">
          <p class="confirmation-dialog__message">${this.escapeHtml(message)}</p>
          <div class="confirmation-dialog__actions">
            <button class="btn btn--secondary" data-action="cancel">
              ${options.cancelText || 'Cancel'}
            </button>
            <button class="btn btn--primary" data-action="confirm">
              ${options.confirmText || 'Confirm'}
            </button>
          </div>
        </div>
      `;

      const modalId = this.showModal('confirmation', modalContent, {
        title: options.title || 'Confirm Action',
        size: 'small',
        closable: false
      });

      // Add event listeners
      const modal = document.getElementById(`modal-${modalId}`);
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target.dataset.action === 'confirm') {
            this.hideModal(modalId);
            resolve(true);
          } else if (e.target.dataset.action === 'cancel') {
            this.hideModal(modalId);
            resolve(false);
          }
        });
      }
    });
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.UIComponents = UIComponents;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIComponents;
}