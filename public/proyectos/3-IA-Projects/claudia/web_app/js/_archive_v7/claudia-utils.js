/**
 * CLAUDIA Utils v6.7.1
 * Shared utility functions to reduce code duplication
 * All modules can access these via window.ClaudiaUtils
 */

(function() {
    'use strict';

    window.ClaudiaUtils = {

        /**
         * Format number as Chilean currency
         * @param {number} num - Amount to format
         * @returns {string} Formatted currency string
         */
        formatMoney(num) {
            if (num === undefined || num === null) return '$0';
            return '$' + Math.round(num).toLocaleString('es-CL');
        },

        /**
         * Format date in Chilean format
         * @param {Date|string} date - Date to format
         * @returns {string} Formatted date (DD/MM/YYYY)
         */
        formatDate(date) {
            if (!date) return '';
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';

            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();

            return `${day}/${month}/${year}`;
        },

        /**
         * Format datetime in Chilean format
         * @param {Date|string} date - Date to format
         * @returns {string} Formatted datetime (DD/MM/YYYY HH:MM)
         */
        formatDateTime(date) {
            if (!date) return '';
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';

            const dateStr = this.formatDate(d);
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');

            return `${dateStr} ${hours}:${minutes}`;
        },

        /**
         * Copy text to clipboard
         * @param {string} text - Text to copy
         * @returns {Promise<boolean>} Success status
         */
        async copyToClipboard(text) {
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                    return true;
                } else {
                    // Fallback for older browsers
                    const textarea = document.createElement('textarea');
                    textarea.value = text;
                    textarea.style.position = 'fixed';
                    textarea.style.opacity = '0';
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    return true;
                }
            } catch (err) {
                console.error('Copy to clipboard failed:', err);
                return false;
            }
        },

        /**
         * Create a modal dialog
         * @param {Object} options - Modal configuration
         * @param {string} options.title - Modal title
         * @param {string} options.content - Modal content (HTML)
         * @param {Array} options.buttons - Button configurations
         * @param {Function} options.onClose - Callback when modal closes
         * @returns {HTMLElement} Modal element
         */
        createModal({ title, content, buttons = [], onClose }) {
            // Remove existing modal if any
            const existing = document.getElementById('claudia-modal');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'claudia-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.2s ease-out;
            `;

            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: white;
                border-radius: 12px;
                max-width: 90%;
                max-height: 90%;
                overflow: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease-out;
            `;

            // Header
            const header = document.createElement('div');
            header.style.cssText = `
                padding: 20px;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;

            const titleEl = document.createElement('h3');
            titleEl.textContent = title;
            titleEl.style.cssText = 'margin: 0; font-size: 20px; font-weight: 700;';

            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '✕';
            closeBtn.style.cssText = `
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            `;
            closeBtn.onmouseover = () => closeBtn.style.background = '#f3f4f6';
            closeBtn.onmouseout = () => closeBtn.style.background = 'none';
            closeBtn.onclick = () => {
                modal.remove();
                if (onClose) onClose();
            };

            header.appendChild(titleEl);
            header.appendChild(closeBtn);

            // Content
            const contentEl = document.createElement('div');
            contentEl.style.cssText = 'padding: 20px;';
            contentEl.innerHTML = content;

            // Footer with buttons
            if (buttons.length > 0) {
                const footer = document.createElement('div');
                footer.style.cssText = `
                    padding: 20px;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                `;

                buttons.forEach(btn => {
                    const button = document.createElement('button');
                    button.textContent = btn.text;
                    button.style.cssText = `
                        padding: 10px 20px;
                        border: none;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: transform 0.2s, box-shadow 0.2s;
                        ${btn.primary ?
                            'background: linear-gradient(135deg, #3b82f6, #2563eb); color: white;' :
                            'background: #f3f4f6; color: #374151;'
                        }
                    `;
                    button.onmouseover = () => {
                        button.style.transform = 'translateY(-2px)';
                        button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    };
                    button.onmouseout = () => {
                        button.style.transform = 'translateY(0)';
                        button.style.boxShadow = 'none';
                    };
                    button.onclick = () => {
                        if (btn.onClick) btn.onClick();
                        if (btn.closeOnClick !== false) modal.remove();
                    };

                    footer.appendChild(button);
                });

                dialog.appendChild(header);
                dialog.appendChild(contentEl);
                dialog.appendChild(footer);
            } else {
                dialog.appendChild(header);
                dialog.appendChild(contentEl);
            }

            modal.appendChild(dialog);

            // Close on backdrop click
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.remove();
                    if (onClose) onClose();
                }
            };

            // Add animations
            const style = document.createElement('style');
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);

            document.body.appendChild(modal);
            return modal;
        },

        /**
         * Show a toast notification
         * @param {string} message - Message to display
         * @param {string} type - Type: 'success', 'error', 'warning', 'info'
         * @param {number} duration - Duration in ms (default 3000)
         */
        showNotification(message, type = 'info', duration = 3000) {
            const toast = document.createElement('div');

            const colors = {
                success: { bg: '#10b981', icon: '✓' },
                error: { bg: '#ef4444', icon: '✕' },
                warning: { bg: '#f59e0b', icon: '⚠' },
                info: { bg: '#3b82f6', icon: 'ℹ' }
            };

            const config = colors[type] || colors.info;

            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${config.bg};
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                z-index: 10001;
                display: flex;
                align-items: center;
                gap: 12px;
                font-weight: 600;
                animation: slideInRight 0.3s ease-out;
                max-width: 400px;
            `;

            toast.innerHTML = `
                <span style="font-size: 20px;">${config.icon}</span>
                <span>${message}</span>
            `;

            // Add animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(400px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);

            document.body.appendChild(toast);

            // Auto remove
            setTimeout(() => {
                toast.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => toast.remove(), 300);
            }, duration);

            return toast;
        },

        /**
         * Debounce function execution
         * @param {Function} func - Function to debounce
         * @param {number} wait - Wait time in ms
         * @returns {Function} Debounced function
         */
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        /**
         * Generate unique ID
         * @returns {string} Unique ID
         */
        generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        },

        /**
         * Check if element is visible in viewport
         * @param {HTMLElement} element - Element to check
         * @returns {boolean} Visibility status
         */
        isInViewport(element) {
            const rect = element.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        },

        /**
         * Smooth scroll to element
         * @param {HTMLElement|string} target - Element or selector
         * @param {number} offset - Offset from top (default 0)
         */
        scrollTo(target, offset = 0) {
            const element = typeof target === 'string'
                ? document.querySelector(target)
                : target;

            if (!element) return;

            const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        },

        /**
         * Format file size
         * @param {number} bytes - Size in bytes
         * @returns {string} Formatted size
         */
        formatFileSize(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        }
    };

    console.log('✅ ClaudiaUtils v6.7.1 loaded');

})();
