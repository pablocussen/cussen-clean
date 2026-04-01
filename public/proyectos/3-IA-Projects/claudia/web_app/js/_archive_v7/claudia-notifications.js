/**
 * CLAUDIA Notifications & Advanced PWA - v5.9
 *
 * Sistema de notificaciones y características PWA avanzadas
 * Características:
 * - Push Notifications API
 * - Milestone reminders
 * - Deadline alerts
 * - Notification preferences
 * - Offline queue with background sync
 * - Install prompt
 * - App shortcuts
 * - Share target
 */

class NotificationManager {
    constructor() {
        this.notificationPermission = 'default';
        this.preferences = this.loadPreferences();
        this.pendingQueue = [];
        this.init();
    }

    init() {
        console.log('🔔 Notification Manager inicializado');
        this.checkNotificationSupport();
        this.setupEventListeners();
        this.checkDeadlines();
        this.setupDailyReminders();
        this.createNotificationButton();
    }

    checkNotificationSupport() {
        this.notificationSupported = 'Notification' in window;
        this.serviceWorkerSupported = 'serviceWorker' in navigator;

        console.log('🔔 Notificaciones disponibles:', this.notificationSupported);
        console.log('⚙️ Service Worker disponible:', this.serviceWorkerSupported);

        if (this.notificationSupported) {
            this.notificationPermission = Notification.permission;
        }
    }

    createNotificationButton() {
        const navbar = document.querySelector('.navbar') || document.querySelector('header');
        if (!navbar) return;

        const notifBtn = document.createElement('button');
        notifBtn.className = 'notification-btn';
        notifBtn.innerHTML = '🔔';
        notifBtn.title = 'Notificaciones y Recordatorios';

        // Badge si hay notificaciones pendientes
        const pending = this.getPendingNotifications();
        if (pending.length > 0) {
            notifBtn.innerHTML = `🔔<span class="notif-badge">${pending.length}</span>`;
        }

        notifBtn.onclick = () => this.openNotificationCenter();

        navbar.appendChild(notifBtn);
    }

    async openNotificationCenter() {
        const modal = document.createElement('div');
        modal.id = 'notification-modal';
        modal.className = 'modal notification-modal';
        modal.innerHTML = `
            <div class="modal-content notification-modal-content">
                <div class="modal-header">
                    <h2>🔔 Centro de Notificaciones</h2>
                    <button class="close-btn" onclick="window.notificationManager.closeNotificationCenter()">&times;</button>
                </div>
                <div class="modal-body notification-body">
                    ${await this.renderNotificationContent()}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);

        if (window.mobileOptimizer) {
            window.mobileOptimizer.hapticFeedback('light');
        }
    }

    async renderNotificationContent() {
        const permission = this.notificationPermission;
        const pending = this.getPendingNotifications();

        return `
            <div class="notification-status">
                ${this.renderPermissionStatus()}
            </div>

            <div class="notification-tabs">
                <button class="notif-tab active" data-tab="pending" onclick="window.notificationManager.switchNotifTab('pending')">
                    📬 Pendientes (${pending.length})
                </button>
                <button class="notif-tab" data-tab="settings" onclick="window.notificationManager.switchNotifTab('settings')">
                    ⚙️ Configuración
                </button>
                <button class="notif-tab" data-tab="history" onclick="window.notificationManager.switchNotifTab('history')">
                    📜 Historial
                </button>
            </div>

            <div class="notif-tab-content" id="notif-tab-pending">
                ${this.renderPendingNotifications()}
            </div>

            <div class="notif-tab-content hidden" id="notif-tab-settings">
                ${this.renderNotificationSettings()}
            </div>

            <div class="notif-tab-content hidden" id="notif-tab-history">
                ${this.renderNotificationHistory()}
            </div>
        `;
    }

    renderPermissionStatus() {
        const permission = this.notificationPermission;

        if (permission === 'granted') {
            return `
                <div class="permission-status granted">
                    <span class="status-icon">✅</span>
                    <div class="status-text">
                        <strong>Notificaciones Activadas</strong>
                        <p>Recibirás recordatorios de fechas límite y milestones</p>
                    </div>
                </div>
            `;
        } else if (permission === 'denied') {
            return `
                <div class="permission-status denied">
                    <span class="status-icon">🔕</span>
                    <div class="status-text">
                        <strong>Notificaciones Bloqueadas</strong>
                        <p>Ve a configuración del navegador para habilitarlas</p>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="permission-status default">
                    <span class="status-icon">🔔</span>
                    <div class="status-text">
                        <strong>Activa las Notificaciones</strong>
                        <p>Recibe recordatorios automáticos de tus proyectos</p>
                    </div>
                    <button class="btn btn-primary" onclick="window.notificationManager.requestPermission()">
                        Activar Notificaciones
                    </button>
                </div>
            `;
        }
    }

    renderPendingNotifications() {
        const pending = this.getPendingNotifications();

        if (pending.length === 0) {
            return `
                <div class="no-notifications">
                    <div class="no-notif-icon">🎉</div>
                    <p>¡Todo al día!</p>
                    <p class="no-notif-hint">No hay recordatorios pendientes</p>
                </div>
            `;
        }

        return `
            <div class="notification-list">
                ${pending.map((notif, index) => this.renderNotificationCard(notif, index)).join('')}
            </div>
        `;
    }

    renderNotificationCard(notif, index) {
        const icons = {
            deadline: '⏰',
            milestone: '🎯',
            reminder: '📅',
            warning: '⚠️',
            success: '✅'
        };

        const icon = icons[notif.type] || '🔔';
        const date = new Date(notif.timestamp);
        const dateStr = date.toLocaleDateString('es-CL', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="notification-card ${notif.priority || 'normal'}">
                <div class="notif-icon">${icon}</div>
                <div class="notif-content">
                    <div class="notif-title">${this.escapeHtml(notif.title)}</div>
                    <div class="notif-message">${this.escapeHtml(notif.message)}</div>
                    <div class="notif-meta">
                        <span class="notif-date">${dateStr}</span>
                        ${notif.projectName ? `<span class="notif-project">📋 ${this.escapeHtml(notif.projectName)}</span>` : ''}
                    </div>
                </div>
                <div class="notif-actions">
                    <button class="notif-action-btn" onclick="window.notificationManager.dismissNotification(${index})" title="Descartar">
                        ✓
                    </button>
                    ${notif.action ? `
                        <button class="notif-action-btn primary" onclick="${notif.action}" title="Ver">
                            →
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderNotificationSettings() {
        const prefs = this.preferences;

        return `
            <div class="notification-settings">
                <h3>⚙️ Preferencias de Notificaciones</h3>

                <div class="setting-group">
                    <label class="setting-label">
                        <input type="checkbox" id="enable-deadlines" ${prefs.deadlines ? 'checked' : ''} onchange="window.notificationManager.updatePreference('deadlines', this.checked)">
                        <span class="setting-text">
                            <strong>Recordatorios de Fechas Límite</strong>
                            <p>Notificación 1 día antes de la fecha fin</p>
                        </span>
                    </label>
                </div>

                <div class="setting-group">
                    <label class="setting-label">
                        <input type="checkbox" id="enable-milestones" ${prefs.milestones ? 'checked' : ''} onchange="window.notificationManager.updatePreference('milestones', this.checked)">
                        <span class="setting-text">
                            <strong>Alertas de Milestones</strong>
                            <p>Cuando una actividad alcanza 50%, 75%, 100%</p>
                        </span>
                    </label>
                </div>

                <div class="setting-group">
                    <label class="setting-label">
                        <input type="checkbox" id="enable-daily" ${prefs.dailyReminder ? 'checked' : ''} onchange="window.notificationManager.updatePreference('dailyReminder', this.checked)">
                        <span class="setting-text">
                            <strong>Recordatorio Diario</strong>
                            <p>Resumen de actividades pendientes a las 08:00</p>
                        </span>
                    </label>
                </div>

                <div class="setting-group">
                    <label class="setting-label">
                        <input type="checkbox" id="enable-warnings" ${prefs.warnings ? 'checked' : ''} onchange="window.notificationManager.updatePreference('warnings', this.checked)">
                        <span class="setting-text">
                            <strong>Advertencias</strong>
                            <p>Alertas de retrasos o problemas potenciales</p>
                        </span>
                    </label>
                </div>

                <div class="setting-group">
                    <label class="setting-text">
                        <strong>Hora del Recordatorio Diario</strong>
                    </label>
                    <input type="time" id="daily-time" value="${prefs.dailyTime || '08:00'}" onchange="window.notificationManager.updatePreference('dailyTime', this.value)" class="time-input">
                </div>

                <div class="setting-actions">
                    <button class="btn btn-secondary" onclick="window.notificationManager.testNotification()">
                        🧪 Probar Notificación
                    </button>
                    <button class="btn btn-danger" onclick="window.notificationManager.clearAllNotifications()">
                        🗑️ Limpiar Historial
                    </button>
                </div>
            </div>
        `;
    }

    renderNotificationHistory() {
        const history = this.getNotificationHistory();

        if (history.length === 0) {
            return `
                <div class="no-notifications">
                    <p>Sin historial de notificaciones</p>
                </div>
            `;
        }

        return `
            <div class="notification-history">
                ${history.map(notif => `
                    <div class="history-item">
                        <span class="history-icon">${notif.type === 'deadline' ? '⏰' : notif.type === 'milestone' ? '🎯' : '🔔'}</span>
                        <div class="history-content">
                            <div class="history-title">${this.escapeHtml(notif.title)}</div>
                            <div class="history-date">${new Date(notif.timestamp).toLocaleString('es-CL')}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async requestPermission() {
        if (!this.notificationSupported) {
            this.showToast('❌ Tu navegador no soporta notificaciones', 'error');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            this.notificationPermission = permission;

            if (permission === 'granted') {
                this.showToast('✅ Notificaciones activadas', 'success');
                this.testNotification();

                if (window.mobileOptimizer) {
                    window.mobileOptimizer.hapticFeedback('success');
                }
            } else {
                this.showToast('⚠️ Notificaciones denegadas', 'warning');
            }

            // Refresh modal
            this.closeNotificationCenter();
            setTimeout(() => this.openNotificationCenter(), 300);

        } catch (error) {
            console.error('Error solicitando permisos:', error);
            this.showToast('❌ Error al solicitar permisos', 'error');
        }
    }

    async showNotification(title, options = {}) {
        if (!this.notificationSupported) {
            console.log('Notificaciones no disponibles');
            return;
        }

        if (this.notificationPermission !== 'granted') {
            console.log('Permiso de notificaciones no otorgado');
            return;
        }

        try {
            // Browser notification
            const notif = new Notification(title, {
                body: options.body || '',
                icon: options.icon || '/icon-192.png',
                badge: '/icon-96.png',
                tag: options.tag || 'claudia-notification',
                requireInteraction: options.requireInteraction || false,
                vibrate: options.vibrate || [200, 100, 200],
                data: options.data || {}
            });

            notif.onclick = () => {
                window.focus();
                if (options.onClick) {
                    options.onClick();
                }
                notif.close();
            };

            // Guardar en historial
            this.saveToHistory({
                title,
                message: options.body,
                type: options.type || 'info',
                timestamp: Date.now()
            });

        } catch (error) {
            console.error('Error mostrando notificación:', error);
        }
    }

    checkDeadlines() {
        // Verificar deadlines de proyectos
        const projects = this.getAllProjects();
        const schedules = this.getAllSchedules();
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        projects.forEach(project => {
            const schedule = schedules[project.name];
            if (!schedule || !schedule.endDate) return;

            const endDate = new Date(schedule.endDate);
            const daysUntilEnd = this.daysBetween(now, endDate);

            // Notificar 1 día antes
            if (daysUntilEnd === 1 && this.preferences.deadlines) {
                this.addPendingNotification({
                    type: 'deadline',
                    priority: 'high',
                    title: `⏰ Proyecto terminando mañana`,
                    message: `"${project.name}" tiene fecha límite mañana (${this.formatDate(endDate)})`,
                    projectName: project.name,
                    timestamp: Date.now(),
                    action: `window.calendarManager?.openCalendar()`
                });
            }

            // Advertir si ya pasó la fecha
            if (daysUntilEnd < 0 && this.preferences.warnings) {
                this.addPendingNotification({
                    type: 'warning',
                    priority: 'high',
                    title: `⚠️ Proyecto Atrasado`,
                    message: `"${project.name}" pasó su fecha límite hace ${Math.abs(daysUntilEnd)} días`,
                    projectName: project.name,
                    timestamp: Date.now(),
                    action: `window.calendarManager?.openCalendar()`
                });
            }
        });

        // Verificar nuevamente en 1 hora
        setTimeout(() => this.checkDeadlines(), 60 * 60 * 1000);
    }

    setupDailyReminders() {
        if (!this.preferences.dailyReminder) return;

        const checkTime = () => {
            const now = new Date();
            const [targetHour, targetMinute] = (this.preferences.dailyTime || '08:00').split(':').map(Number);

            if (now.getHours() === targetHour && now.getMinutes() === targetMinute) {
                this.sendDailyReminder();
            }
        };

        // Verificar cada minuto
        this.dailyReminderInterval = setInterval(checkTime, 60 * 1000);
    }

    sendDailyReminder() {
        const projects = this.getAllProjects();
        const activeProjects = projects.filter(p => (p.activities || []).length > 0);

        if (activeProjects.length === 0) return;

        const summary = `Tienes ${activeProjects.length} proyecto${activeProjects.length > 1 ? 's' : ''} activo${activeProjects.length > 1 ? 's' : ''}`;

        this.showNotification('📅 Recordatorio Diario - CLAUDIA', {
            body: summary,
            type: 'reminder',
            requireInteraction: false,
            onClick: () => {
                window.focus();
            }
        });
    }

    testNotification() {
        this.showNotification('🔔 Notificación de Prueba', {
            body: 'Las notificaciones están funcionando correctamente!',
            type: 'info',
            requireInteraction: false
        });

        this.showToast('🔔 Notificación enviada', 'info');
    }

    addPendingNotification(notif) {
        const pending = this.getPendingNotifications();

        // Evitar duplicados
        const exists = pending.find(p =>
            p.title === notif.title &&
            p.projectName === notif.projectName
        );

        if (exists) return;

        pending.push(notif);
        localStorage.setItem('claudia_pending_notifications', JSON.stringify(pending));

        // Actualizar badge
        this.updateNotificationBadge();

        // Mostrar notificación del navegador
        if (this.notificationPermission === 'granted') {
            this.showNotification(notif.title, {
                body: notif.message,
                type: notif.type,
                data: notif
            });
        }
    }

    dismissNotification(index) {
        const pending = this.getPendingNotifications();
        pending.splice(index, 1);
        localStorage.setItem('claudia_pending_notifications', JSON.stringify(pending));

        this.updateNotificationBadge();
        this.closeNotificationCenter();
        setTimeout(() => this.openNotificationCenter(), 100);

        if (window.mobileOptimizer) {
            window.mobileOptimizer.hapticFeedback('light');
        }
    }

    clearAllNotifications() {
        if (!confirm('¿Limpiar todo el historial de notificaciones?')) return;

        localStorage.removeItem('claudia_notification_history');
        localStorage.removeItem('claudia_pending_notifications');

        this.showToast('🗑️ Historial limpiado', 'info');
        this.updateNotificationBadge();

        this.closeNotificationCenter();
        setTimeout(() => this.openNotificationCenter(), 100);
    }

    updateNotificationBadge() {
        const btn = document.querySelector('.notification-btn');
        if (!btn) return;

        const pending = this.getPendingNotifications();

        if (pending.length > 0) {
            btn.innerHTML = `🔔<span class="notif-badge">${pending.length}</span>`;
        } else {
            btn.innerHTML = '🔔';
        }
    }

    switchNotifTab(tabName) {
        document.querySelectorAll('.notif-tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        document.querySelectorAll('.notif-tab').forEach(btn => {
            btn.classList.remove('active');
        });

        const targetContent = document.getElementById(`notif-tab-${tabName}`);
        if (targetContent) {
            targetContent.classList.remove('hidden');
        }

        const targetBtn = document.querySelector(`.notif-tab[data-tab="${tabName}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }
    }

    updatePreference(key, value) {
        this.preferences[key] = value;
        this.savePreferences();

        this.showToast('✅ Preferencia actualizada', 'success');

        // Reiniciar daily reminders si se cambió
        if (key === 'dailyReminder' || key === 'dailyTime') {
            this.setupDailyReminders();
        }
    }

    closeNotificationCenter() {
        const modal = document.getElementById('notification-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    }

    // Storage helpers
    getPendingNotifications() {
        const saved = localStorage.getItem('claudia_pending_notifications');
        return saved ? JSON.parse(saved) : [];
    }

    getNotificationHistory() {
        const saved = localStorage.getItem('claudia_notification_history');
        return saved ? JSON.parse(saved) : [];
    }

    saveToHistory(notif) {
        const history = this.getNotificationHistory();
        history.unshift(notif); // Add to beginning

        // Keep only last 50
        if (history.length > 50) {
            history.splice(50);
        }

        localStorage.setItem('claudia_notification_history', JSON.stringify(history));
    }

    loadPreferences() {
        const saved = localStorage.getItem('claudia_notification_preferences');
        return saved ? JSON.parse(saved) : {
            deadlines: true,
            milestones: true,
            dailyReminder: false,
            warnings: true,
            dailyTime: '08:00'
        };
    }

    savePreferences() {
        localStorage.setItem('claudia_notification_preferences', JSON.stringify(this.preferences));
    }

    getAllProjects() {
        const saved = localStorage.getItem('projects');
        return saved ? JSON.parse(saved) : [];
    }

    getAllSchedules() {
        const saved = localStorage.getItem('claudia_schedules');
        return saved ? JSON.parse(saved) : {};
    }

    // Utilities
    daysBetween(date1, date2) {
        const diffTime = Math.abs(date2 - date1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    formatDate(date) {
        return date.toLocaleDateString('es-CL', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    setupEventListeners() {
        // Keyboard shortcut: Ctrl+Shift+N para Notifications
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'N') {
                e.preventDefault();
                this.openNotificationCenter();
            }
        });

        // Detectar cuando la app vuelve a estar visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkDeadlines();
                this.updateNotificationBadge();
            }
        });
    }

    showToast(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, 3000);
        } else {
            console.log(message);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Install Prompt Manager
class InstallManager {
    constructor() {
        this.deferredPrompt = null;
        this.init();
    }

    init() {
        console.log('📲 Install Manager inicializado');
        this.setupInstallPrompt();
    }

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;

            console.log('📲 Install prompt disponible');

            // Mostrar botón de instalación
            this.showInstallButton();
        });

        // Detectar si ya está instalado
        window.addEventListener('appinstalled', () => {
            console.log('📲 App instalada exitosamente');
            this.deferredPrompt = null;
            this.hideInstallButton();

            if (window.notificationManager) {
                window.notificationManager.showNotification('🎉 CLAUDIA Instalada', {
                    body: 'La app está lista para usar offline',
                    type: 'success'
                });
            }
        });
    }

    showInstallButton() {
        // Verificar si ya existe
        if (document.getElementById('install-button')) return;

        const installBtn = document.createElement('button');
        installBtn.id = 'install-button';
        installBtn.className = 'install-prompt-btn';
        installBtn.innerHTML = '📲 Instalar App';
        installBtn.onclick = () => this.promptInstall();

        document.body.appendChild(installBtn);

        // Auto-hide después de 10 segundos
        setTimeout(() => {
            if (installBtn.parentNode) {
                installBtn.classList.add('hide');
            }
        }, 10000);
    }

    hideInstallButton() {
        const btn = document.getElementById('install-button');
        if (btn) btn.remove();
    }

    async promptInstall() {
        if (!this.deferredPrompt) {
            console.log('No hay prompt de instalación disponible');
            return;
        }

        this.deferredPrompt.prompt();

        const { outcome } = await this.deferredPrompt.userChoice;
        console.log(`Resultado de instalación: ${outcome}`);

        this.deferredPrompt = null;
        this.hideInstallButton();

        if (window.mobileOptimizer) {
            window.mobileOptimizer.hapticFeedback(outcome === 'accepted' ? 'success' : 'light');
        }
    }
}

// CSS Styles
const notificationStyles = `
<style>
.notification-btn {
    position: relative;
    background: var(--card-bg);
    border: 2px solid var(--border-color);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.notification-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--shadow);
}

.notif-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background: #ef4444;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: bold;
}

.notification-modal-content {
    max-width: 800px;
    width: 95%;
    max-height: 90vh;
}

.notification-body {
    padding: 20px;
}

.notification-status {
    margin-bottom: 20px;
}

.permission-status {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 20px;
    border-radius: 12px;
    background: var(--bg-secondary);
}

.permission-status.granted {
    background: rgba(16, 185, 129, 0.1);
    border: 2px solid #10b981;
}

.permission-status.denied {
    background: rgba(239, 68, 68, 0.1);
    border: 2px solid #ef4444;
}

.permission-status.default {
    background: rgba(59, 130, 246, 0.1);
    border: 2px solid #3b82f6;
}

.status-icon {
    font-size: 32px;
}

.status-text {
    flex: 1;
}

.status-text strong {
    display: block;
    margin-bottom: 4px;
    color: var(--text-primary);
}

.status-text p {
    margin: 0;
    font-size: 14px;
    color: var(--text-secondary);
}

.notification-tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    border-bottom: 2px solid var(--border-color);
}

.notif-tab {
    background: transparent;
    border: none;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-secondary);
    cursor: pointer;
    border-bottom: 3px solid transparent;
    transition: all 0.3s ease;
}

.notif-tab.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
}

.notif-tab-content.hidden {
    display: none;
}

.no-notifications {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-secondary);
}

.no-notif-icon {
    font-size: 64px;
    margin-bottom: 20px;
}

.notification-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.notification-card {
    display: flex;
    align-items: flex-start;
    gap: 15px;
    padding: 15px;
    background: var(--card-bg);
    border-radius: 12px;
    border-left: 4px solid var(--primary-color);
    box-shadow: 0 2px 8px var(--shadow);
    transition: transform 0.3s ease;
}

.notification-card:hover {
    transform: translateX(4px);
}

.notification-card.high {
    border-left-color: #ef4444;
    background: rgba(239, 68, 68, 0.05);
}

.notif-icon {
    font-size: 24px;
}

.notif-content {
    flex: 1;
}

.notif-title {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
}

.notif-message {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 8px;
}

.notif-meta {
    display: flex;
    gap: 15px;
    font-size: 12px;
    color: var(--text-secondary);
}

.notif-actions {
    display: flex;
    gap: 8px;
}

.notif-action-btn {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 6px 12px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.notif-action-btn:hover {
    background: var(--primary-color);
    color: white;
    transform: scale(1.1);
}

.notif-action-btn.primary {
    background: var(--primary-color);
    color: white;
}

.notification-settings {
    padding: 10px;
}

.notification-settings h3 {
    margin-bottom: 20px;
    color: var(--text-primary);
}

.setting-group {
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border-color);
}

.setting-label {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    cursor: pointer;
}

.setting-label input[type="checkbox"] {
    margin-top: 4px;
    width: 20px;
    height: 20px;
    cursor: pointer;
}

.setting-text strong {
    display: block;
    margin-bottom: 4px;
    color: var(--text-primary);
}

.setting-text p {
    margin: 0;
    font-size: 13px;
    color: var(--text-secondary);
}

.time-input {
    width: 100%;
    padding: 10px;
    border: 2px solid var(--border-color);
    border-radius: 8px;
    background: var(--card-bg);
    color: var(--text-primary);
    font-size: 16px;
    margin-top: 8px;
}

.setting-actions {
    display: flex;
    gap: 10px;
    margin-top: 30px;
    flex-wrap: wrap;
}

.notification-history {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.history-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--bg-secondary);
    border-radius: 8px;
}

.history-icon {
    font-size: 20px;
}

.history-content {
    flex: 1;
}

.history-title {
    font-size: 14px;
    color: var(--text-primary);
    margin-bottom: 2px;
}

.history-date {
    font-size: 12px;
    color: var(--text-secondary);
}

.install-prompt-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    border: none;
    padding: 15px 25px;
    border-radius: 50px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
    transition: all 0.3s ease;
    z-index: 1000;
    animation: slideInUp 0.5s ease;
}

.install-prompt-btn:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(59, 130, 246, 0.5);
}

.install-prompt-btn.hide {
    opacity: 0;
    transform: translateY(100px);
    pointer-events: none;
}

@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(100px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 768px) {
    .notification-modal-content {
        width: 100%;
        max-height: 100vh;
        border-radius: 0;
    }

    .notification-card {
        flex-direction: column;
    }

    .notif-actions {
        width: 100%;
        justify-content: flex-end;
    }

    .setting-actions {
        flex-direction: column;
    }

    .setting-actions .btn {
        width: 100%;
    }
}
</style>
`;

// Inyectar estilos
document.head.insertAdjacentHTML('beforeend', notificationStyles);

// Inicialización global
window.notificationManager = new NotificationManager();
window.installManager = new InstallManager();

console.log('🔔 Notification & Install System v5.9 cargado exitosamente');
