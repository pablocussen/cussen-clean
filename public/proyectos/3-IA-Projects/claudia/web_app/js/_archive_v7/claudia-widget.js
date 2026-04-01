(function() {
    'use strict';
    
    console.log('🚀 Claudia Widget v2.2 - Conversational Fix');
    
    class ClaudiaWidget {
        constructor(config) {
            this.config = {
                apiKey: config.apiKey || 'demo-arqattack-remodelaciones',
                // --- CORRECCIÓN 1: URL de la API actualizada ---
                apiUrl: 'https://claudia-api-unificada-2ubn4lwhma-uc.a.run.app',
                theme: config.theme || 'default',
                companyName: config.companyName || 'Mi Empresa',
                primaryColor: config.primaryColor || '#2563eb',
                secondaryColor: config.secondaryColor || '#7c3aed',
                position: config.position || 'bottom-right',
                welcomeMessage: config.welcomeMessage || '¡Hola! Soy Claudia AI. ¿En qué proyecto puedo ayudarte?',
                ...config
            };
            
            this.isOpen = false;
            this.isLoading = false;
            this.sessionId = this.generateSessionId();
            this.messages = [];
            
            this.init();
        }
        
        generateSessionId() {
            return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        
        init() {
            this.createStyles();
            this.createWidget();
            this.addEventListeners();
            this.addMessage(this.config.welcomeMessage, 'claudia');
            console.log('✅ Claudia Widget inicializado correctamente');
        }
        
        createStyles() {
            const styles = `
                .claudia-widget-container {
                    position: fixed;
                    ${this.config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
                    ${this.config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
                    z-index: 10000;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .claudia-button { width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, ${this.config.primaryColor}, ${this.config.secondaryColor}); border: none; cursor: pointer; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15); display: flex; align-items: center; justify-content: center; transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94); position: relative; overflow: hidden; }
                .claudia-button:hover { transform: scale(1.1); box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2); }
                .claudia-icon { width: 28px; height: 28px; fill: white; transition: transform 0.3s ease; }
                .claudia-button.loading .claudia-icon { animation: claudia-spin 1s linear infinite; }
                @keyframes claudia-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .claudia-chat { position: absolute; bottom: 80px; right: 0; width: 350px; height: 500px; background: white; border-radius: 20px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15); display: none; flex-direction: column; overflow: hidden; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); }
                .claudia-chat.open { display: flex; animation: claudia-fadeIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
                @keyframes claudia-fadeIn { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
                .claudia-header { background: linear-gradient(135deg, ${this.config.primaryColor}, ${this.config.secondaryColor}); color: white; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
                .claudia-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
                .claudia-close { background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background-color 0.2s ease; }
                .claudia-close:hover { background-color: rgba(255, 255, 255, 0.2); }
                .claudia-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
                .claudia-message { max-width: 80%; padding: 12px 16px; border-radius: 18px; font-size: 14px; line-height: 1.4; animation: claudia-messageSlide 0.3s ease-out; }
                @keyframes claudia-messageSlide { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .claudia-message.user { background: ${this.config.primaryColor}; color: white; align-self: flex-end; margin-left: auto; }
                .claudia-message.claudia { background: #f1f5f9; color: #1e293b; align-self: flex-start; border: 1px solid #e2e8f0; }
                .claudia-typing { display: none; align-items: center; gap: 8px; padding: 12px 16px; background: #f1f5f9; border-radius: 18px; max-width: 80%; align-self: flex-start; border: 1px solid #e2e8f0; }
                .claudia-typing.show { display: flex; animation: claudia-messageSlide 0.3s ease-out; }
                .claudia-typing-dots { display: flex; gap: 4px; }
                .claudia-typing-dot { width: 6px; height: 6px; background: #64748b; border-radius: 50%; animation: claudia-typing-animation 1.4s infinite; }
                .claudia-typing-dot:nth-child(2) { animation-delay: 0.2s; }
                .claudia-typing-dot:nth-child(3) { animation-delay: 0.4s; }
                @keyframes claudia-typing-animation { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-8px); opacity: 1; } }
                .claudia-input-container { padding: 16px 20px; border-top: 1px solid #e2e8f0; background: white; }
                .claudia-input-wrapper { display: flex; gap: 12px; align-items: flex-end; }
                .claudia-input { flex: 1; border: 1px solid #d1d5db; border-radius: 20px; padding: 10px 16px; font-size: 14px; outline: none; transition: border-color 0.2s ease; resize: none; max-height: 100px; min-height: 20px; }
                .claudia-input:focus { border-color: ${this.config.primaryColor}; }
                .claudia-send { background: ${this.config.primaryColor}; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; flex-shrink: 0; }
                .claudia-send:hover:not(:disabled) { background: ${this.config.secondaryColor}; transform: scale(1.05); }
                .claudia-send:disabled { opacity: 0.5; cursor: not-allowed; }
                .claudia-send-icon { width: 16px; height: 16px; fill: currentColor; }
                @media (max-width: 480px) { .claudia-chat { width: calc(100vw - 40px); height: calc(100vh - 100px); bottom: 80px; right: 20px; } .claudia-widget-container { right: 20px; bottom: 20px; } }
            `;
            const styleSheet = document.createElement('style');
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }
        
        createWidget() {
            const container = document.createElement('div');
            container.className = 'claudia-widget-container';
            container.innerHTML = `
                <button class="claudia-button" id="claudia-toggle">
                    <svg class="claudia-icon" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3.04 1.05 4.35L1 23l6.65-2.05C9.96 21.64 11.46 22 13 22h-1c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.4 0-2.73-.35-3.89-.98L3 20l.98-5.11C3.35 13.73 3 12.4 3 11c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 9z"/>
                        <circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="12" cy="15" r="1"/>
                    </svg>
                </button>
                <div class="claudia-chat" id="claudia-chat">
                    <div class="claudia-header"><h3>Claudia AI - ${this.config.companyName}</h3><button class="claudia-close" id="claudia-close">&times;</button></div>
                    <div class="claudia-messages" id="claudia-messages">
                        <div class="claudia-typing" id="claudia-typing">
                            <span style="font-size: 12px; color: #64748b;">Claudia está escribiendo</span>
                            <div class="claudia-typing-dots"><div class="claudia-typing-dot"></div><div class="claudia-typing-dot"></div><div class="claudia-typing-dot"></div></div>
                        </div>
                    </div>
                    <div class="claudia-input-container">
                        <div class="claudia-input-wrapper">
                            <textarea class="claudia-input" id="claudia-input" placeholder="Describe tu proyecto de construcción..." rows="1"></textarea>
                            <button class="claudia-send" id="claudia-send">
                                <svg class="claudia-send-icon" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(container);
            this.elements = { button: container.querySelector('#claudia-toggle'), chat: container.querySelector('#claudia-chat'), messages: container.querySelector('#claudia-messages'), input: container.querySelector('#claudia-input'), send: container.querySelector('#claudia-send'), close: container.querySelector('#claudia-close'), typing: container.querySelector('#claudia-typing') };
        }
        
        addEventListeners() {
            this.elements.button.addEventListener('click', () => this.toggleChat());
            this.elements.close.addEventListener('click', () => this.closeChat());
            this.elements.send.addEventListener('click', () => this.sendMessage());
            this.elements.input.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); } });
            this.elements.input.addEventListener('input', () => { this.elements.input.style.height = 'auto'; this.elements.input.style.height = Math.min(this.elements.input.scrollHeight, 100) + 'px'; });
        }
        
        toggleChat() { this.isOpen ? this.closeChat() : this.openChat(); }
        openChat() { this.isOpen = true; this.elements.chat.classList.add('open'); this.elements.input.focus(); this.scrollToBottom(); }
        closeChat() { this.isOpen = false; this.elements.chat.classList.remove('open'); }
        
        addMessage(text, sender = 'claudia') {
            const messageDiv = document.createElement('div');
            messageDiv.className = `claudia-message ${sender}`;
            messageDiv.textContent = text;
            this.elements.messages.insertBefore(messageDiv, this.elements.typing);
            this.messages.push({ text, sender, timestamp: new Date() });
            this.scrollToBottom();
            console.log(`💬 Message added (${sender}):`, text.substring(0, 50) + '...');
        }
        
        showTyping() { this.elements.typing.classList.add('show'); this.scrollToBottom(); }
        hideTyping() { this.elements.typing.classList.remove('show'); }
        
        extractUserMessage(apiResponse) {
            console.log('🔍 Processing API response:', apiResponse);
            // --- CORRECCIÓN 2: Buscar 'friendly_response' en lugar de 'mensaje_claudia' ---
            if (apiResponse.friendly_response) {
                return apiResponse.friendly_response;
            }
            console.warn('⚠️ No recognized message field found in API response');
            return 'Lo siento, hubo un problema procesando tu solicitud. ¿Podrías intentar de nuevo?';
        }
        
        async sendMessage() {
            const message = this.elements.input.value.trim();
            if (!message || this.isLoading) return;
            
            this.addMessage(message, 'user');
            this.elements.input.value = '';
            this.elements.input.style.height = 'auto';
            this.setLoading(true);
            
            try {
                this.showTyping();
                const response = await fetch(this.config.apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.config.apiKey}`
                    },
                    body: JSON.stringify({
                        message: message,
                        sessionId: this.sessionId
                    })
                });
                
                if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                
                const data = await response.json();
                this.hideTyping();
                const userMessage = this.extractUserMessage(data);
                this.addMessage(userMessage, 'claudia');
                
            } catch (error) {
                console.error('❌ Error sending message:', error);
                this.hideTyping();
                this.addMessage('Lo siento, parece que hay un problema de conexión. ¿Podrías intentar de nuevo en unos momentos?', 'claudia');
            } finally {
                this.setLoading(false);
            }
        }
        
        setLoading(loading) {
            this.isLoading = loading;
            this.elements.send.disabled = loading;
            this.elements.input.disabled = loading;
            if (loading) { this.elements.button.classList.add('loading'); } else { this.elements.button.classList.remove('loading'); this.elements.input.focus(); }
        }
        
        scrollToBottom() {
            setTimeout(() => { this.elements.messages.scrollTop = this.elements.messages.scrollHeight; }, 100);
        }
    }
    
    function initializeClaudia() {
        if (typeof window.ClaudiaConfig === 'undefined') {
            console.error('❌ ClaudiaConfig not found. Please configure the widget first.');
            return;
        }
        if (window.claudiaWidget) {
            console.warn('⚠️ Claudia Widget already initialized');
            return;
        }
        try {
            window.claudiaWidget = new ClaudiaWidget(window.ClaudiaConfig);
        } catch (error) {
            console.error('❌ Error initializing Claudia Widget:', error);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeClaudia);
    } else {
        initializeClaudia();
    }
    
})();
