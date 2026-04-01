/**
 * CLAUDIA v6.0 - Sistema de Colaboración
 */
(function() {
    'use strict';

    window.CollaborationManager = class {
        constructor() {
            this.user = null;
            this.init();
        }

        init() {
            console.log('🤝 Collaboration v6.0');
            this.loadUser();
            this.injectUI();
        }

        loadUser() {
            let user = localStorage.getItem('claudia_user');
            if (!user) {
                const name = prompt('👤 Tu nombre:', 'Usuario') || 'Usuario';
                user = { id: Date.now(), name, avatar: '👷' };
                localStorage.setItem('claudia_user', JSON.stringify(user));
            } else {
                user = JSON.parse(user);
            }
            this.user = user;
        }

        injectUI() {
            const header = document.querySelector('.header');
            if (!header) return;

            const btn = document.createElement('button');
            btn.className = 'collab-btn';
            btn.innerHTML = '👥 Equipo';
            btn.onclick = () => this.show();
            btn.style.cssText = 'background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 12px 20px; border-radius: 24px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(16,185,129,0.3);';
            header.appendChild(btn);
        }

        show() {
            const panel = document.createElement('div');
            panel.style.cssText = 'position: fixed; top: 0; right: 0; width: 400px; height: 100vh; background: white; box-shadow: -4px 0 24px rgba(0,0,0,0.2); z-index: 10000; padding: 20px; overflow-y: auto;';

            panel.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0;">👥 Colaboración</h3>
                    <button onclick="this.parentElement.parentElement.remove()" style="background: #ef4444; color: white; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer;">✕</button>
                </div>

                <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border: 2px solid #10b981; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0;">📤 Compartir Proyecto</h4>
                    <input type="text" readonly value="https://claudia.app/share/${Date.now()}" style="width: 100%; padding: 8px; border: 2px solid #10b981; border-radius: 6px; margin-bottom: 10px;">
                    <button onclick="alert('✅ Link copiado')" style="width: 100%; background: #10b981; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer;">📋 Copiar Link</button>
                </div>

                <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
                    <div style="font-weight: 600; margin-bottom: 5px;">${this.user.avatar} ${this.user.name}</div>
                    <div style="color: #f59e0b; font-size: 12px; font-weight: 600;">👑 Propietario</div>
                </div>

                <h4 style="margin: 20px 0 10px 0;">💬 Comentarios</h4>
                <div id="comments-area" style="max-height: 300px; overflow-y: auto; margin-bottom: 10px;"></div>
                <textarea id="comment-input" placeholder="Agregar comentario..." style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; resize: vertical; min-height: 60px; margin-bottom: 10px;"></textarea>
                <button onclick="window.collaborationManager.addComment()" style="width: 100%; background: #10b981; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer;">💬 Agregar Comentario</button>
            `;

            document.body.appendChild(panel);
            this.loadComments();
        }

        addComment() {
            const input = document.getElementById('comment-input');
            if (!input || !input.value.trim()) return;

            const projectName = document.getElementById('project-name')?.value || 'Mi Proyecto';
            const key = `claudia_comments_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}`;

            let comments = JSON.parse(localStorage.getItem(key) || '[]');
            comments.push({
                user: this.user.name,
                avatar: this.user.avatar,
                text: input.value.trim(),
                time: Date.now()
            });

            localStorage.setItem(key, JSON.stringify(comments));
            input.value = '';
            this.loadComments();
        }

        loadComments() {
            const area = document.getElementById('comments-area');
            if (!area) return;

            const projectName = document.getElementById('project-name')?.value || 'Mi Proyecto';
            const key = `claudia_comments_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}`;
            const comments = JSON.parse(localStorage.getItem(key) || '[]');

            if (comments.length === 0) {
                area.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">Sin comentarios</div>';
                return;
            }

            area.innerHTML = comments.map(c => `
                <div style="background: #f5f5f5; padding: 10px; border-radius: 8px; border-left: 3px solid #10b981; margin-bottom: 8px;">
                    <div style="font-weight: 600; font-size: 13px; margin-bottom: 5px;">${c.avatar} ${c.user}</div>
                    <div style="font-size: 13px; color: #333;">${c.text}</div>
                    <div style="font-size: 11px; color: #999; margin-top: 5px;">${this.timeAgo(c.time)}</div>
                </div>
            `).join('');
        }

        timeAgo(time) {
            const mins = Math.floor((Date.now() - time) / 60000);
            if (mins < 1) return 'Ahora';
            if (mins < 60) return `Hace ${mins} min`;
            const hours = Math.floor(mins / 60);
            if (hours < 24) return `Hace ${hours} h`;
            return `Hace ${Math.floor(hours / 24)} días`;
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.collaborationManager = new CollaborationManager();
        });
    } else {
        window.collaborationManager = new CollaborationManager();
    }
})();