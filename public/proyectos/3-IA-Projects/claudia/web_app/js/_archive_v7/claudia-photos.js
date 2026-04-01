/**
 * CLAUDIA Photo System - v5.8
 *
 * Sistema de fotos para registro de progreso de obra
 * Características:
 * - Captura con cámara (Camera API)
 * - Upload desde galería
 * - Compresión automática
 * - Galería por proyecto
 * - Galería por actividad
 * - Comparación antes/después
 * - Timestamps automáticos
 * - Geolocalización (opcional)
 * - LocalStorage con IndexedDB fallback
 * - Swipe gallery mobile
 */

class PhotoManager {
    constructor() {
        this.currentProject = null;
        this.photos = {};
        this.maxPhotoSize = 1024 * 1024; // 1MB por foto comprimida
        this.compressionQuality = 0.8;
        this.init();
    }

    init() {
        console.log('📸 Photo Manager inicializado');
        this.loadPhotos();
        this.createPhotoButton();
        this.setupEventListeners();
        this.checkCameraSupport();
    }

    checkCameraSupport() {
        this.cameraSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        console.log('📷 Cámara disponible:', this.cameraSupported);
    }

    createPhotoButton() {
        const navbar = document.querySelector('.navbar') || document.querySelector('header');
        if (!navbar) return;

        const photoBtn = document.createElement('button');
        photoBtn.className = 'photo-btn';
        photoBtn.innerHTML = '📸';
        photoBtn.title = 'Fotos del Proyecto';
        photoBtn.onclick = () => this.openPhotoGallery();

        navbar.appendChild(photoBtn);
    }

    openPhotoGallery() {
        const project = this.getCurrentProject();
        if (!project) {
            this.showToast('⚠️ Primero crea o selecciona un proyecto', 'warning');
            return;
        }

        this.currentProject = project;
        this.showPhotoModal();

        if (window.mobileOptimizer) {
            window.mobileOptimizer.hapticFeedback('light');
        }
    }

    showPhotoModal() {
        const existingModal = document.getElementById('photo-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'photo-modal';
        modal.className = 'modal photo-modal';
        modal.innerHTML = `
            <div class="modal-content photo-modal-content">
                <div class="modal-header">
                    <h2>📸 Fotos: ${this.escapeHtml(this.currentProject.name)}</h2>
                    <button class="close-btn" onclick="window.photoManager.closePhotoModal()">&times;</button>
                </div>
                <div class="modal-body photo-body">
                    ${this.renderPhotoContent()}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
    }

    renderPhotoContent() {
        return `
            <div class="photo-actions">
                <button class="btn btn-primary" onclick="window.photoManager.capturePhoto()">
                    📷 Tomar Foto
                </button>
                <button class="btn btn-secondary" onclick="window.photoManager.uploadPhoto()">
                    🖼️ Subir Imagen
                </button>
                <button class="btn btn-success" onclick="window.photoManager.showComparison()">
                    ↔️ Antes/Después
                </button>
            </div>

            <div class="photo-tabs">
                <button class="photo-tab active" data-tab="all" onclick="window.photoManager.switchTab('all')">
                    🗂️ Todas (${this.getProjectPhotos().length})
                </button>
                <button class="photo-tab" data-tab="by-activity" onclick="window.photoManager.switchTab('by-activity')">
                    📋 Por Actividad
                </button>
                <button class="photo-tab" data-tab="timeline" onclick="window.photoManager.switchTab('timeline')">
                    📅 Línea de Tiempo
                </button>
            </div>

            <div class="photo-tab-content" id="photo-tab-all">
                ${this.renderAllPhotos()}
            </div>

            <div class="photo-tab-content hidden" id="photo-tab-by-activity">
                ${this.renderPhotosByActivity()}
            </div>

            <div class="photo-tab-content hidden" id="photo-tab-timeline">
                ${this.renderPhotoTimeline()}
            </div>

            <input type="file" id="photo-upload-input" accept="image/*" style="display: none;" onchange="window.photoManager.handlePhotoUpload(event)">
        `;
    }

    renderAllPhotos() {
        const photos = this.getProjectPhotos();

        if (photos.length === 0) {
            return `
                <div class="no-photos">
                    <div class="no-photos-icon">📷</div>
                    <p>No hay fotos todavía</p>
                    <p class="no-photos-hint">Toma tu primera foto para documentar el progreso</p>
                </div>
            `;
        }

        return `
            <div class="photo-grid">
                ${photos.map((photo, index) => this.renderPhotoCard(photo, index)).join('')}
            </div>
        `;
    }

    renderPhotoCard(photo, index) {
        const date = new Date(photo.timestamp);
        const dateStr = date.toLocaleDateString('es-CL', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="photo-card" onclick="window.photoManager.viewPhoto(${index})">
                <div class="photo-card-image" style="background-image: url('${photo.dataUrl}')">
                    ${photo.activityName ? `<div class="photo-badge">${this.escapeHtml(photo.activityName)}</div>` : ''}
                </div>
                <div class="photo-card-info">
                    <div class="photo-card-date">${dateStr}</div>
                    ${photo.description ? `<div class="photo-card-desc">${this.escapeHtml(photo.description)}</div>` : ''}
                    ${photo.location ? `<div class="photo-card-location">📍 ${photo.location.lat.toFixed(4)}, ${photo.location.lng.toFixed(4)}</div>` : ''}
                </div>
                <div class="photo-card-actions">
                    <button class="photo-action-btn" onclick="event.stopPropagation(); window.photoManager.editPhoto(${index})" title="Editar">
                        ✏️
                    </button>
                    <button class="photo-action-btn" onclick="event.stopPropagation(); window.photoManager.deletePhoto(${index})" title="Eliminar">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }

    renderPhotosByActivity() {
        const activities = this.currentProject.activities || [];
        const photos = this.getProjectPhotos();

        if (activities.length === 0) {
            return '<p class="no-data">No hay actividades en este proyecto</p>';
        }

        return `
            <div class="activities-photos">
                ${activities.map((activity, actIndex) => {
                    const actPhotos = photos.filter(p => p.activityIndex === actIndex);
                    return `
                        <div class="activity-photos-section">
                            <div class="activity-photos-header">
                                <h3>${this.escapeHtml(activity.nombre)}</h3>
                                <span class="photo-count">${actPhotos.length} fotos</span>
                                <button class="btn-sm btn-primary" onclick="window.photoManager.addPhotoToActivity(${actIndex})">
                                    ➕ Agregar Foto
                                </button>
                            </div>
                            ${actPhotos.length > 0 ? `
                                <div class="activity-photo-grid">
                                    ${actPhotos.map((photo, idx) => {
                                        const photoIndex = photos.indexOf(photo);
                                        return this.renderPhotoCard(photo, photoIndex);
                                    }).join('')}
                                </div>
                            ` : '<p class="no-data-sm">Sin fotos</p>'}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    renderPhotoTimeline() {
        const photos = this.getProjectPhotos().sort((a, b) => a.timestamp - b.timestamp);

        if (photos.length === 0) {
            return '<p class="no-data">No hay fotos todavía</p>';
        }

        return `
            <div class="photo-timeline">
                ${photos.map((photo, index) => {
                    const date = new Date(photo.timestamp);
                    const dateStr = date.toLocaleDateString('es-CL', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    });
                    const timeStr = date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

                    return `
                        <div class="timeline-item">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <div class="timeline-date">${dateStr}</div>
                                <div class="timeline-time">${timeStr}</div>
                                <div class="timeline-photo" onclick="window.photoManager.viewPhoto(${index})">
                                    <img src="${photo.dataUrl}" alt="Foto" loading="lazy">
                                </div>
                                ${photo.activityName ? `<div class="timeline-activity">📋 ${this.escapeHtml(photo.activityName)}</div>` : ''}
                                ${photo.description ? `<div class="timeline-description">${this.escapeHtml(photo.description)}</div>` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    async capturePhoto() {
        if (!this.cameraSupported) {
            this.showToast('❌ Tu navegador no soporta captura de cámara', 'error');
            this.uploadPhoto(); // Fallback a upload
            return;
        }

        try {
            // Mobile: usar input file con capture
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.capture = 'environment'; // Cámara trasera preferida

            input.onchange = (e) => this.handlePhotoUpload(e);
            input.click();

        } catch (error) {
            console.error('Error capturando foto:', error);
            this.showToast('❌ Error al acceder a la cámara', 'error');
        }
    }

    uploadPhoto() {
        const input = document.getElementById('photo-upload-input');
        if (input) input.click();
    }

    async handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validar tipo
        if (!file.type.startsWith('image/')) {
            this.showToast('❌ Selecciona una imagen válida', 'error');
            return;
        }

        // Validar tamaño (max 10MB original)
        if (file.size > 10 * 1024 * 1024) {
            this.showToast('❌ Imagen muy grande (máx 10MB)', 'error');
            return;
        }

        this.showToast('📸 Procesando imagen...', 'info');

        try {
            // Comprimir imagen
            const compressedDataUrl = await this.compressImage(file);

            // Obtener geolocalización (opcional)
            const location = await this.getLocation().catch(() => null);

            // Crear objeto foto
            const photo = {
                dataUrl: compressedDataUrl,
                timestamp: Date.now(),
                projectName: this.currentProject.name,
                activityIndex: null,
                activityName: null,
                description: '',
                location: location
            };

            // Preguntar si asociar a actividad
            this.promptActivityAssignment(photo);

        } catch (error) {
            console.error('Error procesando imagen:', error);
            this.showToast('❌ Error al procesar la imagen', 'error');
        }
    }

    async compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Resize si es muy grande (max 1920px)
                    const maxDimension = 1920;
                    if (width > maxDimension || height > maxDimension) {
                        if (width > height) {
                            height = (height / width) * maxDimension;
                            width = maxDimension;
                        } else {
                            width = (width / height) * maxDimension;
                            height = maxDimension;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Comprimir a JPEG
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', this.compressionQuality);

                    // Verificar tamaño
                    const sizeInBytes = this.getDataUrlSize(compressedDataUrl);
                    console.log(`📸 Imagen comprimida: ${(sizeInBytes / 1024).toFixed(2)} KB`);

                    if (sizeInBytes > this.maxPhotoSize) {
                        // Re-comprimir con menor calidad
                        const lowerQuality = 0.6;
                        const recompressed = canvas.toDataURL('image/jpeg', lowerQuality);
                        console.log('📸 Re-comprimiendo con calidad reducida...');
                        resolve(recompressed);
                    } else {
                        resolve(compressedDataUrl);
                    }
                };

                img.onerror = () => reject(new Error('Error cargando imagen'));
                img.src = e.target.result;
            };

            reader.onerror = () => reject(new Error('Error leyendo archivo'));
            reader.readAsDataURL(file);
        });
    }

    getDataUrlSize(dataUrl) {
        // data:image/jpeg;base64,xxxx
        const base64 = dataUrl.split(',')[1];
        return (base64.length * 3) / 4; // Tamaño aproximado en bytes
    }

    async getLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocalización no disponible'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    console.log('Geolocalización rechazada:', error.message);
                    reject(error);
                },
                { timeout: 5000, enableHighAccuracy: false }
            );
        });
    }

    promptActivityAssignment(photo) {
        const activities = this.currentProject.activities || [];

        if (activities.length === 0) {
            // Sin actividades, guardar directamente
            this.savePhoto(photo);
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal photo-assignment-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>📋 ¿Asociar a una actividad?</h3>
                <div class="activity-list">
                    <button class="activity-option" onclick="window.photoManager.finishPhotoUpload(${JSON.stringify(photo).replace(/"/g, '&quot;')}, null)">
                        ➡️ Sin actividad (foto general)
                    </button>
                    ${activities.map((act, idx) => `
                        <button class="activity-option" onclick="window.photoManager.finishPhotoUpload(${JSON.stringify(photo).replace(/"/g, '&quot;')}, ${idx})">
                            ${this.escapeHtml(act.nombre)}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
    }

    finishPhotoUpload(photoData, activityIndex) {
        // Cerrar modal de asignación
        const modal = document.querySelector('.photo-assignment-modal');
        if (modal) modal.remove();

        // Asignar actividad si corresponde
        if (activityIndex !== null) {
            const activity = this.currentProject.activities[activityIndex];
            photoData.activityIndex = activityIndex;
            photoData.activityName = activity.nombre;
        }

        this.savePhoto(photoData);
    }

    savePhoto(photo) {
        const projectName = this.currentProject.name;
        if (!this.photos[projectName]) {
            this.photos[projectName] = [];
        }

        this.photos[projectName].push(photo);
        this.persistPhotos();

        this.showToast('✅ Foto guardada exitosamente', 'success');

        if (window.mobileOptimizer) {
            window.mobileOptimizer.hapticFeedback('success');
        }

        // Refrescar vista
        this.showPhotoModal();
    }

    viewPhoto(index) {
        const photos = this.getProjectPhotos();
        const photo = photos[index];

        if (!photo) return;

        const modal = document.createElement('div');
        modal.className = 'modal photo-viewer-modal';
        modal.innerHTML = `
            <div class="modal-content photo-viewer-content">
                <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                <div class="photo-viewer-nav">
                    <button class="nav-btn" onclick="window.photoManager.viewPhoto(${index - 1})" ${index === 0 ? 'disabled' : ''}>
                        ◀
                    </button>
                    <span class="photo-counter">${index + 1} / ${photos.length}</span>
                    <button class="nav-btn" onclick="window.photoManager.viewPhoto(${index + 1})" ${index === photos.length - 1 ? 'disabled' : ''}>
                        ▶
                    </button>
                </div>
                <div class="photo-viewer-image">
                    <img src="${photo.dataUrl}" alt="Foto">
                </div>
                <div class="photo-viewer-info">
                    <div class="photo-viewer-date">
                        📅 ${new Date(photo.timestamp).toLocaleString('es-CL')}
                    </div>
                    ${photo.activityName ? `<div class="photo-viewer-activity">📋 ${this.escapeHtml(photo.activityName)}</div>` : ''}
                    ${photo.description ? `<div class="photo-viewer-description">${this.escapeHtml(photo.description)}</div>` : ''}
                    ${photo.location ? `<div class="photo-viewer-location">📍 Lat: ${photo.location.lat.toFixed(6)}, Lng: ${photo.location.lng.toFixed(6)}</div>` : ''}
                </div>
            </div>
        `;

        // Cerrar viewer anterior si existe
        const existing = document.querySelector('.photo-viewer-modal');
        if (existing) existing.remove();

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);

        // Swipe gestures para navegación
        this.setupPhotoViewerGestures(modal, index, photos.length);
    }

    setupPhotoViewerGestures(modal, currentIndex, totalPhotos) {
        let startX = 0;
        let endX = 0;

        modal.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        modal.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            const diff = startX - endX;

            if (Math.abs(diff) > 100) {
                if (diff > 0 && currentIndex < totalPhotos - 1) {
                    // Swipe left → siguiente
                    this.viewPhoto(currentIndex + 1);
                } else if (diff < 0 && currentIndex > 0) {
                    // Swipe right → anterior
                    this.viewPhoto(currentIndex - 1);
                }
            }
        });
    }

    addPhotoToActivity(activityIndex) {
        this.uploadPhotoWithActivity = activityIndex;
        this.capturePhoto();
    }

    deletePhoto(index) {
        if (!confirm('¿Eliminar esta foto?')) return;

        const projectName = this.currentProject.name;
        this.photos[projectName].splice(index, 1);
        this.persistPhotos();

        this.showToast('🗑️ Foto eliminada', 'info');
        this.showPhotoModal(); // Refresh
    }

    showComparison() {
        const photos = this.getProjectPhotos();

        if (photos.length < 2) {
            this.showToast('⚠️ Necesitas al menos 2 fotos para comparar', 'warning');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal comparison-modal';
        modal.innerHTML = `
            <div class="modal-content comparison-content">
                <div class="modal-header">
                    <h2>↔️ Comparación Antes/Después</h2>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="comparison-selectors">
                        <div class="comparison-selector">
                            <label>📸 Foto "Antes":</label>
                            <select id="before-photo-select" onchange="window.photoManager.updateComparison()">
                                ${photos.map((p, i) => `
                                    <option value="${i}">
                                        ${new Date(p.timestamp).toLocaleDateString('es-CL')} ${p.activityName ? '- ' + p.activityName : ''}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="comparison-selector">
                            <label>📸 Foto "Después":</label>
                            <select id="after-photo-select" onchange="window.photoManager.updateComparison()">
                                ${photos.map((p, i) => `
                                    <option value="${i}" ${i === photos.length - 1 ? 'selected' : ''}>
                                        ${new Date(p.timestamp).toLocaleDateString('es-CL')} ${p.activityName ? '- ' + p.activityName : ''}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="comparison-view" id="comparison-view">
                        ${this.renderComparisonView(0, photos.length - 1)}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
    }

    updateComparison() {
        const beforeIndex = parseInt(document.getElementById('before-photo-select').value);
        const afterIndex = parseInt(document.getElementById('after-photo-select').value);
        const container = document.getElementById('comparison-view');

        if (container) {
            container.innerHTML = this.renderComparisonView(beforeIndex, afterIndex);
        }
    }

    renderComparisonView(beforeIndex, afterIndex) {
        const photos = this.getProjectPhotos();
        const before = photos[beforeIndex];
        const after = photos[afterIndex];

        return `
            <div class="comparison-grid">
                <div class="comparison-image">
                    <div class="comparison-label">Antes</div>
                    <img src="${before.dataUrl}" alt="Antes">
                    <div class="comparison-date">${new Date(before.timestamp).toLocaleDateString('es-CL')}</div>
                </div>
                <div class="comparison-arrow">→</div>
                <div class="comparison-image">
                    <div class="comparison-label">Después</div>
                    <img src="${after.dataUrl}" alt="Después">
                    <div class="comparison-date">${new Date(after.timestamp).toLocaleDateString('es-CL')}</div>
                </div>
            </div>
        `;
    }

    switchTab(tabName) {
        // Ocultar todos los tabs
        document.querySelectorAll('.photo-tab-content').forEach(tab => {
            tab.classList.add('hidden');
        });

        // Remover active de todos los botones
        document.querySelectorAll('.photo-tab').forEach(btn => {
            btn.classList.remove('active');
        });

        // Mostrar tab seleccionado
        const targetTab = document.getElementById(`photo-tab-${tabName}`);
        if (targetTab) {
            targetTab.classList.remove('hidden');
        }

        // Activar botón
        const targetBtn = document.querySelector(`.photo-tab[data-tab="${tabName}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }
    }

    closePhotoModal() {
        const modal = document.getElementById('photo-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    }

    // Storage
    getCurrentProject() {
        const projectsData = localStorage.getItem('projects');
        if (!projectsData) return null;

        const projects = JSON.parse(projectsData);
        const currentName = localStorage.getItem('current_project');

        return projects.find(p => p.name === currentName);
    }

    getProjectPhotos() {
        const projectName = this.currentProject?.name;
        if (!projectName) return [];

        return this.photos[projectName] || [];
    }

    loadPhotos() {
        const saved = localStorage.getItem('claudia_photos');
        this.photos = saved ? JSON.parse(saved) : {};
    }

    persistPhotos() {
        try {
            localStorage.setItem('claudia_photos', JSON.stringify(this.photos));
        } catch (error) {
            console.error('Error guardando fotos:', error);
            this.showToast('⚠️ Límite de almacenamiento alcanzado', 'warning');
        }
    }

    setupEventListeners() {
        // Keyboard shortcut: Ctrl+Shift+P para Photos
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                this.openPhotoGallery();
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

// CSS Styles
const photoStyles = `
<style>
.photo-btn {
    background: var(--card-bg);
    border: 2px solid var(--border-color);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.photo-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--shadow);
}

.photo-modal-content {
    max-width: 1200px;
    width: 95%;
    max-height: 90vh;
    overflow-y: auto;
}

.photo-body {
    padding: 20px;
}

.photo-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.photo-tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    border-bottom: 2px solid var(--border-color);
}

.photo-tab {
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

.photo-tab.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
}

.photo-tab-content.hidden {
    display: none;
}

.no-photos {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-secondary);
}

.no-photos-icon {
    font-size: 64px;
    margin-bottom: 20px;
}

.no-photos-hint {
    font-size: 14px;
    color: var(--text-secondary);
    margin-top: 10px;
}

.photo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
}

.photo-card {
    background: var(--card-bg);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px var(--shadow);
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.photo-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px var(--shadow);
}

.photo-card-image {
    width: 100%;
    height: 200px;
    background-size: cover;
    background-position: center;
    position: relative;
}

.photo-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
}

.photo-card-info {
    padding: 12px;
}

.photo-card-date {
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 4px;
}

.photo-card-desc {
    font-size: 14px;
    color: var(--text-primary);
    margin-bottom: 4px;
}

.photo-card-location {
    font-size: 11px;
    color: var(--text-secondary);
}

.photo-card-actions {
    display: flex;
    gap: 8px;
    padding: 8px 12px;
    border-top: 1px solid var(--border-color);
}

.photo-action-btn {
    background: transparent;
    border: none;
    font-size: 16px;
    cursor: pointer;
    padding: 4px 8px;
    transition: transform 0.2s ease;
}

.photo-action-btn:hover {
    transform: scale(1.2);
}

.activities-photos {
    display: flex;
    flex-direction: column;
    gap: 30px;
}

.activity-photos-section {
    background: var(--bg-secondary);
    padding: 20px;
    border-radius: 12px;
}

.activity-photos-header {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 15px;
    flex-wrap: wrap;
}

.activity-photos-header h3 {
    flex: 1;
    margin: 0;
}

.photo-count {
    background: var(--primary-color);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
}

.activity-photo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
}

.photo-timeline {
    position: relative;
    padding-left: 40px;
}

.photo-timeline::before {
    content: '';
    position: absolute;
    left: 15px;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--primary-color);
}

.timeline-item {
    position: relative;
    margin-bottom: 30px;
}

.timeline-marker {
    position: absolute;
    left: -32px;
    top: 10px;
    width: 16px;
    height: 16px;
    background: var(--primary-color);
    border: 3px solid var(--card-bg);
    border-radius: 50%;
}

.timeline-content {
    background: var(--card-bg);
    padding: 15px;
    border-radius: 12px;
    box-shadow: 0 2px 8px var(--shadow);
}

.timeline-date {
    font-weight: 600;
    color: var(--text-primary);
    text-transform: capitalize;
}

.timeline-time {
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 10px;
}

.timeline-photo {
    margin: 10px 0;
    cursor: pointer;
}

.timeline-photo img {
    width: 100%;
    border-radius: 8px;
}

.timeline-activity {
    margin-top: 8px;
    font-size: 14px;
    color: var(--text-secondary);
}

.timeline-description {
    margin-top: 8px;
    font-size: 14px;
    color: var(--text-primary);
}

.photo-viewer-content {
    max-width: 90vw;
    max-height: 90vh;
    background: var(--bg-primary);
}

.photo-viewer-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    border-bottom: 1px solid var(--border-color);
}

.nav-btn {
    background: var(--primary-color);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 18px;
    cursor: pointer;
    transition: opacity 0.3s ease;
}

.nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.photo-counter {
    font-weight: 600;
    color: var(--text-primary);
}

.photo-viewer-image {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: var(--bg-secondary);
}

.photo-viewer-image img {
    max-width: 100%;
    max-height: 60vh;
    border-radius: 8px;
    box-shadow: 0 4px 16px var(--shadow);
}

.photo-viewer-info {
    padding: 15px;
    background: var(--card-bg);
}

.photo-viewer-date,
.photo-viewer-activity,
.photo-viewer-location,
.photo-viewer-description {
    padding: 8px 0;
    color: var(--text-secondary);
    font-size: 14px;
}

.comparison-content {
    max-width: 1200px;
    width: 95%;
}

.comparison-selectors {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.comparison-selector label {
    display: block;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--text-primary);
}

.comparison-selector select {
    width: 100%;
    padding: 12px;
    border: 2px solid var(--border-color);
    border-radius: 8px;
    background: var(--card-bg);
    color: var(--text-primary);
    font-size: 14px;
}

.comparison-grid {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 20px;
    align-items: center;
}

.comparison-image {
    text-align: center;
}

.comparison-label {
    font-weight: 600;
    font-size: 18px;
    margin-bottom: 10px;
    color: var(--primary-color);
}

.comparison-image img {
    width: 100%;
    max-height: 400px;
    object-fit: contain;
    border-radius: 12px;
    box-shadow: 0 4px 12px var(--shadow);
}

.comparison-date {
    margin-top: 10px;
    font-size: 14px;
    color: var(--text-secondary);
}

.comparison-arrow {
    font-size: 32px;
    color: var(--primary-color);
    font-weight: bold;
}

@media (max-width: 768px) {
    .photo-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 10px;
    }

    .photo-card-image {
        height: 150px;
    }

    .activity-photo-grid {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    }

    .comparison-grid {
        grid-template-columns: 1fr;
        gap: 15px;
    }

    .comparison-arrow {
        transform: rotate(90deg);
    }

    .photo-viewer-image img {
        max-height: 50vh;
    }
}
</style>
`;

// Inyectar estilos
document.head.insertAdjacentHTML('beforeend', photoStyles);

// Inicialización global
window.photoManager = new PhotoManager();

console.log('📸 Photo System v5.8 cargado exitosamente');
