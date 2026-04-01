/**
 * CLAUDIA Push Notifications v6.7
 * Smart push notifications system
 */

(function() {
    'use strict';

    window.ClaudiaPush = {

        // Notification permission status
        permission: 'default',
        subscription: null,

        /**
         * Initialize push notifications
         */
        async init() {
            console.log('🔔 Push Notifications v6.7 initialized');

            // Check support
            if (!('Notification' in window)) {
                console.warn('⚠️ Push notifications not supported');
                return;
            }

            if (!('serviceWorker' in navigator)) {
                console.warn('⚠️ Service Worker not supported');
                return;
            }

            // Check current permission
            this.permission = Notification.permission;

            // If already granted, setup subscription
            if (this.permission === 'granted') {
                await this.setupSubscription();
            }

            // Show permission request after some usage
            setTimeout(() => this.maybeRequestPermission(), 60000); // After 1 minute
        },

        /**
         * Request notification permission
         */
        async requestPermission() {
            try {
                this.permission = await Notification.requestPermission();

                if (this.permission === 'granted') {
                    ClaudiaUtils.showNotification('Notificaciones activadas', 'success');
                    await this.setupSubscription();
                    return true;
                } else {
                    ClaudiaUtils.showNotification('Notificaciones desactivadas', 'info');
                    return false;
                }
            } catch (err) {
                console.error('Permission request failed:', err);
                return false;
            }
        },

        /**
         * Maybe request permission (smart timing)
         */
        async maybeRequestPermission() {
            // Don't ask if already asked
            if (localStorage.getItem('claudia_push_asked') === 'true') {
                return;
            }

            // Don't ask if permission already decided
            if (this.permission !== 'default') {
                return;
            }

            // Check if user has created a project (shows engagement)
            const projects = JSON.parse(localStorage.getItem('claudia_projects') || '[]');
            if (projects.length === 0) {
                return; // Wait until they create a project
            }

            // Show friendly prompt
            this.showPermissionPrompt();
            localStorage.setItem('claudia_push_asked', 'true');
        },

        /**
         * Show friendly permission prompt
         */
        showPermissionPrompt() {
            const html = `
                <div style="text-align: center;">
                    <div style="font-size: 64px; margin-bottom: 20px;">🔔</div>
                    <h3 style="margin: 0 0 15px 0; font-size: 20px;">Mantente actualizado</h3>
                    <p style="margin: 0 0 25px 0; color: #6b7280; line-height: 1.6;">
                        Recibe notificaciones importantes sobre tus proyectos:
                    </p>
                    <ul style="text-align: left; margin: 0 0 25px 0; color: #374151; line-height: 2;">
                        <li>✅ Recordatorios de tareas</li>
                        <li>📊 Cambios de precios importantes</li>
                        <li>📅 Próximos hitos del proyecto</li>
                        <li>💡 Sugerencias de optimización</li>
                    </ul>
                    <p style="font-size: 13px; color: #9ca3af; margin: 0;">
                        Puedes desactivar las notificaciones en cualquier momento
                    </p>
                </div>
            `;

            ClaudiaUtils.createModal({
                title: 'Activar Notificaciones',
                content: html,
                buttons: [
                    {
                        text: 'Activar',
                        primary: true,
                        onClick: () => this.requestPermission()
                    },
                    {
                        text: 'Ahora no',
                        primary: false
                    }
                ]
            });
        },

        /**
         * Setup push subscription
         */
        async setupSubscription() {
            try {
                const registration = await navigator.serviceWorker.ready;

                // Check if already subscribed
                let subscription = await registration.pushManager.getSubscription();

                if (!subscription) {
                    // Subscribe
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: this.getVapidKey()
                    });
                }

                this.subscription = subscription;
                console.log('✅ Push subscription active');

                // Save subscription to server (if backend available)
                await this.saveSubscription(subscription);

                // Schedule smart notifications
                this.scheduleSmartNotifications();
            } catch (err) {
                console.error('Subscription failed:', err);
            }
        },

        /**
         * Get VAPID public key
         */
        getVapidKey() {
            // Replace with actual VAPID key if backend supports push
            const base64 = 'BEL6rQ9RpEm7KNiHWkm5z8yjfUg-MBZOqH-dPvOHNZH8SZsVGqZqLdKzQ7kMZP7zLbKjZqLdKzQ7kMZP7zLbKj';
            return this.urlBase64ToUint8Array(base64);
        },

        /**
         * Convert base64 to Uint8Array
         */
        urlBase64ToUint8Array(base64String) {
            const padding = '='.repeat((4 - base64String.length % 4) % 4);
            const base64 = (base64String + padding)
                .replace(/\-/g, '+')
                .replace(/_/g, '/');

            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);

            for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }

            return outputArray;
        },

        /**
         * Save subscription to server
         */
        async saveSubscription(subscription) {
            try {
                // Store locally for now
                localStorage.setItem('claudia_push_subscription', JSON.stringify(subscription));

                // TODO: Send to backend when available
                // await fetch('/api/push/subscribe', {
                //     method: 'POST',
                //     body: JSON.stringify(subscription),
                //     headers: { 'Content-Type': 'application/json' }
                // });
            } catch (err) {
                console.error('Failed to save subscription:', err);
            }
        },

        /**
         * Schedule smart notifications
         */
        scheduleSmartNotifications() {
            // Daily reminder if project has pending tasks
            setInterval(() => this.checkDailyReminder(), 3600000); // Every hour

            // Price alert check
            setInterval(() => this.checkPriceAlerts(), 7200000); // Every 2 hours

            // Project milestone reminders
            setInterval(() => this.checkMilestones(), 86400000); // Daily
        },

        /**
         * Check daily reminder
         */
        async checkDailyReminder() {
            const project = window.getCurrentProject?.();
            if (!project || !project.tasks) return;

            const pendingTasks = project.tasks.filter(t => t.status !== 'completed');
            if (pendingTasks.length === 0) return;

            // Only notify once per day at 9 AM
            const hour = new Date().getHours();
            if (hour !== 9) return;

            const lastNotif = localStorage.getItem('claudia_last_daily_notif');
            const today = new Date().toDateString();
            if (lastNotif === today) return;

            await this.sendNotification({
                title: '📋 Tareas Pendientes',
                body: `Tienes ${pendingTasks.length} tareas pendientes en "${project.name}"`,
                data: { type: 'daily_reminder', projectId: project.id }
            });

            localStorage.setItem('claudia_last_daily_notif', today);
        },

        /**
         * Check price alerts
         */
        async checkPriceAlerts() {
            // Check if any saved price alerts triggered
            const alerts = JSON.parse(localStorage.getItem('claudia_price_alerts') || '[]');
            if (alerts.length === 0) return;

            // TODO: Check actual prices and compare
            // For now, simulate alert
            for (const alert of alerts) {
                if (Math.random() > 0.95) { // 5% chance (simulate price drop)
                    await this.sendNotification({
                        title: '💰 Alerta de Precio',
                        body: `${alert.product} bajó a $${alert.targetPrice}`,
                        data: { type: 'price_alert', alert }
                    });
                }
            }
        },

        /**
         * Check project milestones
         */
        async checkMilestones() {
            const project = window.getCurrentProject?.();
            if (!project) return;

            // Check calendar events
            const events = project.calendar?.events || [];
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            for (const event of events) {
                const eventDate = new Date(event.date);
                if (eventDate.toDateString() === tomorrow.toDateString()) {
                    await this.sendNotification({
                        title: '📅 Recordatorio',
                        body: `Mañana: ${event.title}`,
                        data: { type: 'milestone', event }
                    });
                }
            }
        },

        /**
         * Send notification
         */
        async sendNotification({ title, body, data = {}, icon = '/icon-192.png' }) {
            if (this.permission !== 'granted') return;

            try {
                const registration = await navigator.serviceWorker.ready;
                await registration.showNotification(title, {
                    body,
                    icon,
                    badge: '/icon-192.png',
                    vibrate: [200, 100, 200],
                    data,
                    actions: [
                        { action: 'view', title: 'Ver' },
                        { action: 'dismiss', title: 'Cerrar' }
                    ],
                    requireInteraction: false,
                    silent: false
                });

                console.log('🔔 Notification sent:', title);
            } catch (err) {
                console.error('Failed to send notification:', err);
            }
        },

        /**
         * Test notification (for development)
         */
        async testNotification() {
            await this.sendNotification({
                title: '🦄 CLAUDIA Test',
                body: 'Las notificaciones están funcionando correctamente',
                data: { type: 'test' }
            });
        },

        /**
         * Toggle notifications on/off
         */
        async toggleNotifications(enabled) {
            if (enabled) {
                await this.requestPermission();
            } else {
                // Unsubscribe
                if (this.subscription) {
                    await this.subscription.unsubscribe();
                    this.subscription = null;
                }
                ClaudiaUtils.showNotification('Notificaciones desactivadas', 'info');
            }
        }
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => ClaudiaPush.init(), 2000);
        });
    } else {
        setTimeout(() => ClaudiaPush.init(), 2000);
    }

})();
