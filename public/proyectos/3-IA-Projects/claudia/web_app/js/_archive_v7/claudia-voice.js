/**
 * CLAUDIA VOICE - Push-to-Talk Sistema de Voz
 * Comunicación bidireccional tipo walkie-talkie
 */

'use strict';

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let voiceStream = null;

// Inicializar Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
    recognition.lang = 'es-CL';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
}

// Speech Synthesis para respuesta de voz
const synth = window.speechSynthesis;
let currentUtterance = null;

/**
 * Inicia grabación de voz (Push-to-Talk)
 */
async function startVoiceRecording(event) {
    event.preventDefault();

    if (isRecording) return;

    try {
        // UI feedback
        const voiceBtn = document.getElementById('voice-btn');
        const voiceHint = document.getElementById('voice-hint');
        const voiceStatus = document.getElementById('voice-status');

        voiceBtn.classList.add('recording');
        voiceHint.textContent = '🔴 Grabando...';
        voiceHint.classList.add('recording');
        voiceStatus.classList.add('active');
        document.getElementById('voice-status-text').textContent = 'Escuchando...';

        isRecording = true;
        audioChunks = [];

        // Usar Web Speech API (más rápido y preciso para español chileno)
        if (recognition) {
            recognition.start();
            console.log('🎙️ Reconocimiento de voz iniciado');
        } else {
            // Fallback: MediaRecorder
            voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(voiceStream);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.start();
            console.log('🎙️ MediaRecorder iniciado');
        }

    } catch (error) {
        console.error('❌ Error iniciando grabación:', error);
        alert('No se pudo acceder al micrófono. Por favor, permite el acceso.');
        resetVoiceUI();
    }
}

/**
 * Detiene grabación y procesa audio
 */
function stopVoiceRecording() {
    if (!isRecording) return;

    isRecording = false;

    const voiceStatus = document.getElementById('voice-status');
    document.getElementById('voice-status-text').textContent = 'Procesando...';
    voiceStatus.classList.remove('active');
    voiceStatus.classList.add('processing');

    if (recognition) {
        recognition.stop();
    } else if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();

        if (voiceStream) {
            voiceStream.getTracks().forEach(track => track.stop());
        }
    }
}

// Event listeners para Speech Recognition
if (recognition) {
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;

        console.log('✅ Transcripción:', transcript, 'Confianza:', confidence);

        processVoiceCommand(transcript);
    };

    recognition.onerror = (event) => {
        console.error('❌ Error de reconocimiento:', event.error);

        if (event.error === 'no-speech') {
            showVoiceMessage('No se detectó voz. Intenta de nuevo.');
        } else if (event.error === 'audio-capture') {
            showVoiceMessage('No se pudo acceder al micrófono.');
        } else {
            showVoiceMessage('Error de reconocimiento. Intenta nuevamente.');
        }

        resetVoiceUI();
    };

    recognition.onend = () => {
        console.log('🎙️ Reconocimiento finalizado');
    };
}

// Event listener para MediaRecorder
if (mediaRecorder) {
    mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        console.log('🎙️ Audio grabado:', audioBlob.size, 'bytes');

        // Aquí podrías enviar el audio a un servicio de transcripción
        // Por ahora mostramos mensaje
        showVoiceMessage('Audio grabado. Funcionalidad de transcripción en desarrollo.');
        resetVoiceUI();
    };
}

/**
 * Procesa comando de voz transcrito
 */
async function processVoiceCommand(text) {
    // Mostrar en UI que se recibió el comando
    const voiceStatus = document.getElementById('voice-status');
    document.getElementById('voice-status-text').textContent = `"${text}"`;

    // Agregar mensaje del usuario al chat
    addVoiceMessage('user', text);

    // Obtener respuesta de Claudia
    const response = await getClaudiaVoiceResponse(text);

    // Agregar respuesta al chat
    addVoiceMessage('claudia', response);

    // Reproducir respuesta con voz
    speakResponse(response);

    // Reset UI
    setTimeout(() => {
        resetVoiceUI();
    }, 1000);
}

/**
 * Obtiene respuesta de Claudia para comando de voz
 */
async function getClaudiaVoiceResponse(text) {
    // Detectar tipo de comando
    const textLower = text.toLowerCase();

    // Recordatorios
    if (textLower.includes('recordar') || textLower.includes('recuérdame')) {
        return handleReminder(text);
    }

    // Bitácora
    if (textLower.includes('anota') || textLower.includes('registra') || textLower.includes('bitácora')) {
        return handleBitacoraEntry(text);
    }

    // Búsqueda de materiales
    if (textLower.includes('buscar') || textLower.includes('necesito') || textLower.includes('cuánto')) {
        return handleMaterialSearch(text);
    }

    // Consulta general
    return handleGeneralQuery(text);
}

/**
 * Maneja recordatorios
 */
function handleReminder(text) {
    // Extraer material y fecha
    const reminderText = text.replace(/claudia|recuérdame|recordar/gi, '').trim();

    // Guardar en localStorage
    const reminders = JSON.parse(localStorage.getItem('claudia_reminders') || '[]');
    reminders.push({
        text: reminderText,
        created: new Date().toISOString(),
        completed: false
    });
    localStorage.setItem('claudia_reminders', JSON.stringify(reminders));

    // Agregar a tareas
    const tasks = JSON.parse(localStorage.getItem('claudia_tasks') || '[]');
    tasks.push({
        text: reminderText,
        created: new Date().toISOString(),
        completed: false,
        type: 'reminder'
    });
    localStorage.setItem('claudia_tasks', JSON.stringify(tasks));

    updateAlertsUI();

    return `Listo, te voy a recordar: ${reminderText}. Lo agregué a tus tareas.`;
}

/**
 * Maneja entradas de bitácora
 */
function handleBitacoraEntry(text) {
    // Extraer contenido
    const entry = text.replace(/claudia|anota|registra|bitácora/gi, '').trim();

    // Guardar en bitácora
    const bitacora = JSON.parse(localStorage.getItem('claudia_bitacora') || '[]');
    bitacora.push({
        text: entry,
        date: new Date().toISOString(),
        type: 'voice'
    });
    localStorage.setItem('claudia_bitacora', JSON.stringify(bitacora));

    updateBitacoraUI();

    const location = entry.toLowerCase().includes('maitencillo') ? 'en Maitencillo' : '';
    return `Perfecto, anoté en la bitácora: ${entry}${location ? ' ' + location : ''}. Quedó registrado.`;
}

/**
 * Maneja búsqueda de materiales
 */
function handleMaterialSearch(text) {
    const responses = [
        `Déjame buscar eso en el catálogo. Te recomiendo revisar la sección de materiales en Sodimac.`,
        `Claro, puedo ayudarte con eso. Revisa las actividades disponibles en el buscador.`,
        `Buena pregunta. Te sugiero usar el buscador de APUs para encontrar lo que necesitas.`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Maneja consultas generales
 */
function handleGeneralQuery(text) {
    const responses = [
        `Entendido. ¿Necesitas ayuda con algo más del proyecto?`,
        `Sí, claro. Estoy aquí para ayudarte con tu obra.`,
        `Perfecto. Cuéntame más sobre lo que necesitas.`,
        `Dale, sigo atento. ¿Qué más necesitas para la pega?`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Agrega mensaje de voz al chat
 */
function addVoiceMessage(sender, text) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = sender === 'user' ? '👤' : '🏗️';

    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = text;

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Guardar en historial
    const history = JSON.parse(localStorage.getItem('claudia_chat_history') || '[]');
    history.push({ sender, text, timestamp: new Date().toISOString(), type: 'voice' });
    localStorage.setItem('claudia_chat_history', JSON.stringify(history));
}

/**
 * Reproduce respuesta con voz
 */
function speakResponse(text) {
    // Cancelar cualquier síntesis en progreso
    if (synth.speaking) {
        synth.cancel();
    }

    currentUtterance = new SpeechSynthesisUtterance(text);

    // Configurar voz en español chileno
    const voices = synth.getVoices();
    const spanishVoice = voices.find(v =>
        v.lang.includes('es') || v.lang.includes('ES')
    );

    if (spanishVoice) {
        currentUtterance.voice = spanishVoice;
    }

    currentUtterance.lang = 'es-CL';
    currentUtterance.rate = 1.0;  // Velocidad normal
    currentUtterance.pitch = 1.0; // Tono normal
    currentUtterance.volume = 1.0; // Volumen máximo

    // Event listeners
    currentUtterance.onstart = () => {
        console.log('🔊 Claudia hablando...');
        const voiceStatus = document.getElementById('voice-status');
        voiceStatus.classList.remove('processing');
        voiceStatus.classList.add('active');
        document.getElementById('voice-status-text').textContent = '🔊 Claudia respondiendo...';
    };

    currentUtterance.onend = () => {
        console.log('✅ Síntesis de voz completada');
        setTimeout(() => {
            resetVoiceUI();
        }, 500);
    };

    currentUtterance.onerror = (event) => {
        console.error('❌ Error en síntesis de voz:', event.error);
        resetVoiceUI();
    };

    synth.speak(currentUtterance);
}

/**
 * Muestra mensaje de voz temporal
 */
function showVoiceMessage(message) {
    const voiceStatus = document.getElementById('voice-status');
    document.getElementById('voice-status-text').textContent = message;
    voiceStatus.classList.add('processing');

    setTimeout(() => {
        voiceStatus.classList.remove('processing');
    }, 2000);
}

/**
 * Resetea UI de voz
 */
function resetVoiceUI() {
    const voiceBtn = document.getElementById('voice-btn');
    const voiceHint = document.getElementById('voice-hint');
    const voiceStatus = document.getElementById('voice-status');

    voiceBtn.classList.remove('recording');
    voiceHint.textContent = 'Mantén presionado';
    voiceHint.classList.remove('recording');
    voiceStatus.classList.remove('active', 'processing');

    isRecording = false;
}

// Cargar voces cuando estén disponibles
if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = () => {
        const voices = synth.getVoices();
        console.log('🔊 Voces disponibles:', voices.length);
        voices.filter(v => v.lang.includes('es')).forEach(v => {
            console.log('  -', v.name, v.lang);
        });
    };
}

// Prevenir comportamiento por defecto en touch devices
document.addEventListener('DOMContentLoaded', function() {
    const voiceBtn = document.getElementById('voice-btn');
    if (voiceBtn) {
        voiceBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });

        voiceBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    console.log('🎙️ Sistema de voz CLAUDIA iniciado');
    console.log('🔊 Speech Recognition:', recognition ? 'Disponible' : 'No disponible');
    console.log('🔊 Speech Synthesis:', synth ? 'Disponible' : 'No disponible');
});
