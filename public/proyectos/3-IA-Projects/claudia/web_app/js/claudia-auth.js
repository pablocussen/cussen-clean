/**
 * CLAUDIA AUTH - Sistema de Autenticación y Monetización
 * Planes: GRATIS (3 proyectos) y PRO ($9.990/mes, proyectos ilimitados)
 */

class ClaudiaAuth {
    constructor() {
        this.currentUser = null;
        this.userPlan = 'free'; // 'free' o 'pro'
        this.projectLimit = 3; // Límite para plan gratis

        this.init();
    }

    async init() {
        console.log('🔐 Initializing CLAUDIA Auth...');

        // Verificar si Firebase está cargado
        if (!window.firebaseAuth) {
            console.warn('⚠️ Firebase Auth not configured - Auth system disabled');
            console.log('ℹ️ App will work normally without user authentication');
            console.log('ℹ️ To enable auth: Follow instructions in CLAUDIA_AUTH_SETUP.md');
            return;
        }

        // Escuchar cambios en autenticación
        window.firebaseModules.onAuthStateChanged(window.firebaseAuth, async (user) => {
            if (user) {
                await this.onUserSignedIn(user);
            } else {
                this.onUserSignedOut();
            }
        });
    }

    async onUserSignedIn(user) {
        console.log('👤 User signed in:', user.email);
        this.currentUser = user;

        // Cargar o crear perfil del usuario en Firestore
        await this.loadUserProfile(user.uid);

        // Ocultar login modal
        this.hideLoginModal();

        // Mostrar info del usuario en el header
        this.updateUserDisplay();

        // Cargar proyectos desde Firestore
        await this.syncProjectsWithCloud();
    }

    onUserSignedOut() {
        console.log('👋 User signed out');
        this.currentUser = null;
        this.userPlan = 'free';

        // Mostrar login modal
        this.showLoginModal();

        // Limpiar display
        this.updateUserDisplay();
    }

    async loadUserProfile(userId) {
        const { doc, getDoc, setDoc, serverTimestamp } = window.firebaseModules;
        const userRef = doc(window.firebaseDb, 'users', userId);

        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            // Usuario existente
            const data = userDoc.data();
            this.userPlan = data.plan || 'free';
            console.log(`💼 Plan: ${this.userPlan.toUpperCase()}`);
        } else {
            // Nuevo usuario - crear perfil
            const newUser = {
                email: this.currentUser.email,
                plan: 'free',
                projectCount: 0,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
            };

            await setDoc(userRef, newUser);
            this.userPlan = 'free';
            console.log('✅ New user profile created');

            // Enviar email de bienvenida
            if (window.emailTriggers) {
                emailTriggers.welcome({
                    email: this.currentUser.email,
                    name: this.currentUser.displayName || 'Maestro'
                });
            }
        }
    }

    showLoginModal() {
        let modal = document.getElementById('auth-modal');

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'auth-modal';
            modal.innerHTML = this.getLoginModalHTML();
            document.body.appendChild(modal);

            // Event listeners
            this.attachLoginListeners();
        }

        modal.classList.add('active');
    }

    hideLoginModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    getLoginModalHTML() {
        return `
            <div class="auth-modal-overlay" onclick="event.stopPropagation()">
                <div class="auth-modal-content">
                    <div class="auth-header">
                        <h2>💼 CLAUDIA PRO</h2>
                        <p>Presupuestos Profesionales que Generan Utilidades</p>
                    </div>

                    <div class="auth-tabs">
                        <button class="auth-tab active" data-tab="login">Ingresar</button>
                        <button class="auth-tab" data-tab="register">Crear Cuenta</button>
                    </div>

                    <!-- LOGIN FORM -->
                    <div id="login-form" class="auth-form active">
                        <div class="input-group">
                            <label>Email</label>
                            <input type="email" id="login-email" placeholder="tu@email.com" required>
                        </div>
                        <div class="input-group">
                            <label>Contraseña</label>
                            <input type="password" id="login-password" placeholder="••••••••" required>
                        </div>
                        <button class="btn-primary" id="login-btn">
                            <span>🔓</span>
                            <span>Ingresar</span>
                        </button>

                        <div class="auth-divider">o continúa con</div>

                        <button class="btn-google" id="google-login-btn">
                            <span>🔍</span>
                            <span>Ingresar con Google</span>
                        </button>
                    </div>

                    <!-- REGISTER FORM -->
                    <div id="register-form" class="auth-form">
                        <div class="input-group">
                            <label>Email</label>
                            <input type="email" id="register-email" placeholder="tu@email.com" required>
                        </div>
                        <div class="input-group">
                            <label>Contraseña</label>
                            <input type="password" id="register-password" placeholder="Mínimo 6 caracteres" required>
                        </div>
                        <div class="input-group">
                            <label>Nombre (opcional)</label>
                            <input type="text" id="register-name" placeholder="Tu nombre">
                        </div>

                        <div class="plan-selector">
                            <div class="plan-option" data-plan="free">
                                <div class="plan-header">
                                    <span class="plan-name">🆓 GRATIS</span>
                                    <span class="plan-price">$0/mes</span>
                                </div>
                                <ul class="plan-features">
                                    <li>✅ Hasta 3 proyectos</li>
                                    <li>✅ Calculadora de materiales</li>
                                    <li>✅ Comparador de precios</li>
                                    <li>✅ Export Excel básico</li>
                                </ul>
                            </div>
                            <div class="plan-option plan-pro" data-plan="pro">
                                <div class="plan-badge">⭐ RECOMENDADO</div>
                                <div class="plan-header">
                                    <span class="plan-name">💼 PRO</span>
                                    <span class="plan-price">$9.990/mes</span>
                                </div>
                                <ul class="plan-features">
                                    <li>✅ Proyectos ILIMITADOS</li>
                                    <li>✅ Optimizador de costos</li>
                                    <li>✅ Descuentos mayoristas</li>
                                    <li>✅ Excel PRO + PDF</li>
                                    <li>✅ Comparador en tiempo real</li>
                                    <li>✅ Sin publicidad</li>
                                    <li>✅ Soporte prioritario</li>
                                </ul>
                            </div>
                        </div>

                        <button class="btn-primary" id="register-btn">
                            <span>🚀</span>
                            <span>Crear Cuenta GRATIS</span>
                        </button>

                        <div class="auth-divider">o continúa con</div>

                        <button class="btn-google" id="google-register-btn">
                            <span>🔍</span>
                            <span>Registrarse con Google</span>
                        </button>
                    </div>

                    <div class="auth-footer">
                        <small>Al registrarte aceptas los <a href="#">Términos</a> y <a href="#">Privacidad</a></small>
                    </div>
                </div>
            </div>

            <style>
                .auth-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    backdrop-filter: blur(8px);
                }

                #auth-modal.active .auth-modal-overlay {
                    display: flex;
                }

                .auth-modal-content {
                    background: white;
                    padding: 40px;
                    border-radius: 24px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                }

                .auth-header {
                    text-align: center;
                    margin-bottom: 30px;
                }

                .auth-header h2 {
                    font-size: 32px;
                    margin-bottom: 8px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .auth-header p {
                    color: #666;
                    font-size: 14px;
                }

                .auth-tabs {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #eee;
                }

                .auth-tab {
                    flex: 1;
                    padding: 12px;
                    background: none;
                    border: none;
                    border-bottom: 3px solid transparent;
                    cursor: pointer;
                    font-weight: 600;
                    color: #999;
                    transition: all 0.3s;
                }

                .auth-tab.active {
                    color: #667eea;
                    border-bottom-color: #667eea;
                }

                .auth-form {
                    display: none;
                }

                .auth-form.active {
                    display: block;
                }

                .input-group {
                    margin-bottom: 20px;
                }

                .input-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    font-size: 14px;
                    color: #333;
                }

                .input-group input {
                    width: 100%;
                    padding: 14px;
                    border: 2px solid #e0e0e0;
                    border-radius: 12px;
                    font-size: 15px;
                    transition: border-color 0.3s;
                }

                .input-group input:focus {
                    outline: none;
                    border-color: #667eea;
                }

                .btn-primary {
                    width: 100%;
                    padding: 16px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    margin-bottom: 20px;
                    transition: transform 0.2s;
                }

                .btn-primary:hover {
                    transform: translateY(-2px);
                }

                .btn-google {
                    width: 100%;
                    padding: 14px;
                    background: white;
                    color: #333;
                    border: 2px solid #e0e0e0;
                    border-radius: 12px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: all 0.3s;
                }

                .btn-google:hover {
                    border-color: #4285f4;
                    background: #f8f9ff;
                }

                .auth-divider {
                    text-align: center;
                    margin: 20px 0;
                    color: #999;
                    font-size: 13px;
                    position: relative;
                }

                .auth-divider::before,
                .auth-divider::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    width: 40%;
                    height: 1px;
                    background: #e0e0e0;
                }

                .auth-divider::before {
                    left: 0;
                }

                .auth-divider::after {
                    right: 0;
                }

                .plan-selector {
                    display: grid;
                    gap: 15px;
                    margin: 20px 0;
                }

                .plan-option {
                    padding: 20px;
                    border: 2px solid #e0e0e0;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s;
                    position: relative;
                }

                .plan-option:hover {
                    border-color: #667eea;
                    transform: translateY(-2px);
                }

                .plan-pro {
                    border-color: #667eea;
                    background: linear-gradient(135deg, #f6f9fc 0%, #eef2f7 100%);
                }

                .plan-badge {
                    position: absolute;
                    top: -10px;
                    right: 20px;
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: white;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 700;
                }

                .plan-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .plan-name {
                    font-size: 18px;
                    font-weight: 700;
                }

                .plan-price {
                    font-size: 16px;
                    font-weight: 700;
                    color: #667eea;
                }

                .plan-features {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .plan-features li {
                    padding: 6px 0;
                    font-size: 13px;
                    color: #666;
                }

                .auth-footer {
                    text-align: center;
                    margin-top: 20px;
                    color: #999;
                    font-size: 12px;
                }

                .auth-footer a {
                    color: #667eea;
                    text-decoration: none;
                }
            </style>
        `;
    }

    attachLoginListeners() {
        // Tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;

                // Update tabs
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Update forms
                document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
                document.getElementById(`${tabName}-form`).classList.add('active');
            });
        });

        // Login button
        document.getElementById('login-btn').addEventListener('click', () => this.handleLogin());

        // Register button
        document.getElementById('register-btn').addEventListener('click', () => this.handleRegister());

        // Google login/register
        document.getElementById('google-login-btn').addEventListener('click', () => this.handleGoogleAuth());
        document.getElementById('google-register-btn').addEventListener('click', () => this.handleGoogleAuth());

        // Enter key on inputs
        document.getElementById('login-email').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
        document.getElementById('login-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
    }

    async handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            alert('⚠️ Completa todos los campos');
            return;
        }

        try {
            const { signInWithEmailAndPassword } = window.firebaseModules;
            await signInWithEmailAndPassword(window.firebaseAuth, email, password);
            // onAuthStateChanged se encargará del resto
        } catch (error) {
            console.error('Login error:', error);
            alert(`❌ Error: ${this.getErrorMessage(error.code)}`);
        }
    }

    async handleRegister() {
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        if (!email || !password) {
            alert('⚠️ Completa email y contraseña');
            return;
        }

        if (password.length < 6) {
            alert('⚠️ La contraseña debe tener al menos 6 caracteres');
            return;
        }

        try {
            const { createUserWithEmailAndPassword } = window.firebaseModules;
            await createUserWithEmailAndPassword(window.firebaseAuth, email, password);
            // onAuthStateChanged se encargará del resto
        } catch (error) {
            console.error('Register error:', error);
            alert(`❌ Error: ${this.getErrorMessage(error.code)}`);
        }
    }

    async handleGoogleAuth() {
        try {
            const { GoogleAuthProvider, signInWithPopup } = window.firebaseModules;
            const provider = new GoogleAuthProvider();
            await signInWithPopup(window.firebaseAuth, provider);
            // onAuthStateChanged se encargará del resto
        } catch (error) {
            console.error('Google auth error:', error);
            if (error.code !== 'auth/popup-closed-by-user') {
                alert(`❌ Error: ${this.getErrorMessage(error.code)}`);
            }
        }
    }

    async logout() {
        const { signOut } = window.firebaseModules;
        await signOut(window.firebaseAuth);
    }

    updateUserDisplay() {
        // Agregar info del usuario en el header
        let userDisplay = document.getElementById('user-display');

        if (!userDisplay) {
            userDisplay = document.createElement('div');
            userDisplay.id = 'user-display';
            userDisplay.style.cssText = 'position: relative; z-index: 1;';

            const header = document.querySelector('.header > div:last-child');
            if (header) {
                header.appendChild(userDisplay);
            }
        }

        if (this.currentUser) {
            const planBadge = this.userPlan === 'pro'
                ? '<span style="background: linear-gradient(90deg, #10b981 0%, #047857 100%); padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 700; color: white; margin-left: 8px;">PRO</span>'
                : '<span style="background: #e0e0e0; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; color: #666; margin-left: 8px;">Gratis</span>';

            userDisplay.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; color: white;">
                    <div style="text-align: right;">
                        <div style="font-size: 14px; font-weight: 600;">${this.currentUser.email}</div>
                        <div style="font-size: 12px; opacity: 0.9;">${planBadge}</div>
                    </div>
                    <button onclick="window.claudiaAuth.logout()" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600;">
                        Salir
                    </button>
                </div>
            `;
        } else {
            userDisplay.innerHTML = '';
        }
    }

    async syncProjectsWithCloud() {
        // TODO: Implementar sync de proyectos con Firestore
        console.log('🔄 Syncing projects with cloud...');
    }

    canCreateProject() {
        if (this.userPlan === 'pro') {
            return { allowed: true };
        }

        const projectCount = allProjects ? allProjects.length : 0;

        if (projectCount >= this.projectLimit) {
            return {
                allowed: false,
                message: `Has alcanzado el límite de ${this.projectLimit} proyectos del plan GRATIS. Actualiza a PRO para proyectos ilimitados.`
            };
        }

        return { allowed: true };
    }

    getErrorMessage(code) {
        const messages = {
            'auth/email-already-in-use': 'Este email ya está registrado',
            'auth/invalid-email': 'Email inválido',
            'auth/weak-password': 'Contraseña muy débil',
            'auth/user-not-found': 'Usuario no encontrado',
            'auth/wrong-password': 'Contraseña incorrecta',
            'auth/too-many-requests': 'Demasiados intentos, espera un momento'
        };

        return messages[code] || 'Error desconocido';
    }
}

// Initialize on load
window.claudiaAuth = new ClaudiaAuth();
console.log('✅ CLAUDIA Auth module loaded');
