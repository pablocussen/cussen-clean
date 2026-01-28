# ============================================
#     🎮 AHORCADO FUTURISTA - SHINY APP 🎮
#       Estilo Cyberpunk / Neon + Sonidos
# ============================================

library(shiny)
library(shinyjs)

# --- UI ---
ui <- fluidPage(
  useShinyjs(),

  # CSS Futurista + Mobile Optimized
tags$head(
    tags$meta(name = "viewport", content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"),
    tags$link(href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;500;700&display=swap", rel = "stylesheet"),

    # JavaScript para Audio
    tags$script(HTML("
      // === SISTEMA DE AUDIO ===
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      let audioCtx = null;
      let musicPlaying = false;
      let musicOscillators = [];

      function initAudio() {
        if (!audioCtx) {
          audioCtx = new AudioCtx();
        }
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
      }

      // Sonido de letra correcta (alegre)
      function playCorrect() {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialDecayTo && gain.gain.exponentialDecayTo(0.01, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.type = 'sine';
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.4);
      }

      // Sonido de letra incorrecta (error)
      function playWrong() {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.type = 'sawtooth';
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.3);
      }

      // Sonido de victoria (fanfarria)
      function playVictory() {
        initAudio();
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
          gain.gain.setValueAtTime(0, audioCtx.currentTime + i * 0.15);
          gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + i * 0.15 + 0.05);
          gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + i * 0.15 + 0.4);
          gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + i * 0.15 + 0.6);
          osc.type = 'sine';
          osc.start(audioCtx.currentTime + i * 0.15);
          osc.stop(audioCtx.currentTime + i * 0.15 + 0.6);
        });
      }

      // Sonido de derrota (triste)
      function playGameOver() {
        initAudio();
        const notes = [392, 349.23, 329.63, 261.63]; // G4, F4, E4, C4
        notes.forEach((freq, i) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
          gain.gain.setValueAtTime(0, audioCtx.currentTime + i * 0.25);
          gain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + i * 0.25 + 0.05);
          gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + i * 0.25 + 0.5);
          osc.type = 'triangle';
          osc.start(audioCtx.currentTime + i * 0.25);
          osc.stop(audioCtx.currentTime + i * 0.25 + 0.5);
        });
      }

      // Sonido de click en tecla
      function playClick() {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.05);
        osc.type = 'square';
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.05);
      }

      // Música de fondo cyberpunk (loop)
      function startMusic() {
        if (musicPlaying) return;
        initAudio();
        musicPlaying = true;

        function playBeat() {
          if (!musicPlaying) return;

          // Bass
          const bass = audioCtx.createOscillator();
          const bassGain = audioCtx.createGain();
          bass.connect(bassGain);
          bassGain.connect(audioCtx.destination);
          bass.frequency.setValueAtTime(55, audioCtx.currentTime);
          bassGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          bassGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
          bass.type = 'sine';
          bass.start(audioCtx.currentTime);
          bass.stop(audioCtx.currentTime + 0.3);

          // Synth arpeggio
          const notes = [130.81, 164.81, 196, 261.63]; // C3, E3, G3, C4
          const noteIndex = Math.floor(Math.random() * notes.length);
          const synth = audioCtx.createOscillator();
          const synthGain = audioCtx.createGain();
          const filter = audioCtx.createBiquadFilter();
          synth.connect(filter);
          filter.connect(synthGain);
          synthGain.connect(audioCtx.destination);
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, audioCtx.currentTime);
          synth.frequency.setValueAtTime(notes[noteIndex], audioCtx.currentTime);
          synthGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
          synthGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
          synth.type = 'sawtooth';
          synth.start(audioCtx.currentTime);
          synth.stop(audioCtx.currentTime + 0.4);

          setTimeout(playBeat, 500);
        }

        playBeat();
      }

      function stopMusic() {
        musicPlaying = false;
      }

      function toggleMusic() {
        if (musicPlaying) {
          stopMusic();
          document.getElementById('music-btn').innerHTML = '🔇 MÚSICA';
          document.getElementById('music-btn').classList.remove('active');
        } else {
          startMusic();
          document.getElementById('music-btn').innerHTML = '🎵 MÚSICA';
          document.getElementById('music-btn').classList.add('active');
        }
      }

      // Shiny handlers
      Shiny.addCustomMessageHandler('playSound', function(type) {
        switch(type) {
          case 'correct': playCorrect(); break;
          case 'wrong': playWrong(); break;
          case 'victory': playVictory(); break;
          case 'gameover': playGameOver(); break;
          case 'click': playClick(); break;
        }
      });
    ")),

    tags$style(HTML("
      /* === RESET Y CUERPO === */
      * {
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
      }

      html, body {
        margin: 0;
        padding: 0;
        overflow-x: hidden;
      }

      body {
        background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f23 100%);
        min-height: 100vh;
        min-height: -webkit-fill-available;
        font-family: 'Rajdhani', sans-serif;
        color: #e0e0e0;
      }

      /* Partículas de fondo */
      body::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image:
          radial-gradient(2px 2px at 20px 30px, #00fff2, transparent),
          radial-gradient(2px 2px at 40px 70px, #ff00ff, transparent),
          radial-gradient(1px 1px at 90px 40px, #00fff2, transparent),
          radial-gradient(2px 2px at 130px 80px, #ff00ff, transparent),
          radial-gradient(1px 1px at 160px 120px, #00fff2, transparent);
        background-size: 200px 200px;
        animation: sparkle 4s linear infinite;
        opacity: 0.3;
        pointer-events: none;
        z-index: -1;
      }

      @keyframes sparkle {
        from { transform: translateY(0); }
        to { transform: translateY(-200px); }
      }

      /* === CONTENEDOR PRINCIPAL === */
      .container-fluid {
        max-width: 500px;
        margin: 0 auto;
        padding: 10px;
        padding-bottom: 20px;
      }

      /* === TÍTULO === */
      .game-title {
        text-align: center;
        font-family: 'Orbitron', monospace;
        font-size: clamp(1.8rem, 8vw, 3rem);
        font-weight: 900;
        background: linear-gradient(90deg, #00fff2, #ff00ff, #00fff2);
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: gradient-shift 3s ease infinite;
        margin-bottom: 5px;
        letter-spacing: 2px;
      }

      .game-subtitle {
        text-align: center;
        font-family: 'Orbitron', monospace;
        font-size: clamp(0.6rem, 2.5vw, 0.9rem);
        color: #888;
        letter-spacing: 5px;
        margin-bottom: 15px;
      }

      @keyframes gradient-shift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      /* === BOTÓN MÚSICA === */
      .music-toggle {
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 1001;
        padding: 8px 12px;
        background: rgba(20, 20, 35, 0.9);
        border: 1px solid rgba(255, 0, 255, 0.4);
        border-radius: 20px;
        font-family: 'Orbitron', monospace;
        font-size: 0.7rem;
        color: #ff00ff;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .music-toggle:hover, .music-toggle.active {
        background: rgba(255, 0, 255, 0.2);
        box-shadow: 0 0 15px rgba(255, 0, 255, 0.4);
      }

      /* === PANEL PRINCIPAL === */
      .main-panel {
        background: rgba(20, 20, 35, 0.85);
        border: 1px solid rgba(0, 255, 242, 0.3);
        border-radius: 15px;
        padding: 15px;
        box-shadow:
          0 0 30px rgba(0, 255, 242, 0.1),
          inset 0 0 40px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }

      /* === ESTADÍSTICAS === */
      .stats-bar {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin-bottom: 12px;
        padding: 10px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 10px;
      }

      .stat-item {
        text-align: center;
      }

      .stat-value {
        font-family: 'Orbitron', monospace;
        font-size: clamp(1.2rem, 5vw, 1.8rem);
        font-weight: 900;
        color: #00fff2;
        text-shadow: 0 0 10px rgba(0, 255, 242, 0.5);
      }

      .stat-label {
        font-size: clamp(0.5rem, 2vw, 0.65rem);
        color: #666;
        letter-spacing: 1px;
      }

      /* === INFO PANEL === */
      .info-panel {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-bottom: 10px;
        flex-wrap: wrap;
      }

      .info-box {
        background: rgba(255, 0, 255, 0.1);
        border: 1px solid rgba(255, 0, 255, 0.3);
        border-radius: 8px;
        padding: 6px 14px;
        font-family: 'Orbitron', monospace;
        font-size: 0.75rem;
      }

      .info-box .label {
        color: #888;
        font-size: 0.55rem;
        letter-spacing: 1px;
      }

      .info-box .value {
        color: #ff00ff;
        font-weight: 700;
        text-shadow: 0 0 8px rgba(255, 0, 255, 0.5);
      }

      /* === AHORCADO SVG === */
      .hangman-container {
        text-align: center;
        margin: 10px 0;
      }

      .hangman-svg {
        width: clamp(120px, 35vw, 180px);
        height: auto;
        filter: drop-shadow(0 0 8px #00fff2);
      }

      .hangman-part {
        stroke: #00fff2;
        stroke-width: 3;
        fill: none;
        opacity: 0;
        transition: opacity 0.5s ease;
      }

      .hangman-part.visible {
        opacity: 1;
        animation: flicker 0.3s ease;
      }

      .hangman-base {
        stroke: #444;
        stroke-width: 2;
        fill: none;
      }

      @keyframes flicker {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      /* === VIDAS === */
      .lives-container {
        text-align: center;
        margin: 8px 0;
      }

      .lives-label {
        font-family: 'Orbitron', monospace;
        font-size: 0.6rem;
        color: #888;
        letter-spacing: 2px;
        margin-bottom: 5px;
      }

      .life-heart {
        display: inline-block;
        font-size: clamp(1.2rem, 5vw, 1.6rem);
        margin: 0 3px;
        transition: all 0.3s ease;
        filter: drop-shadow(0 0 8px #ff0066);
      }

      .life-heart.lost {
        filter: grayscale(100%) brightness(0.3);
        transform: scale(0.7);
      }

      /* === PALABRA === */
      .word-display {
        text-align: center;
        margin: 15px 0;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 6px;
      }

      .letter-box {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: clamp(32px, 9vw, 48px);
        height: clamp(40px, 11vw, 58px);
        background: rgba(0, 255, 242, 0.1);
        border: 2px solid #00fff2;
        border-radius: 8px;
        font-family: 'Orbitron', monospace;
        font-size: clamp(1.2rem, 5vw, 1.8rem);
        font-weight: 700;
        color: #00fff2;
        text-shadow: 0 0 15px #00fff2;
        box-shadow: 0 0 12px rgba(0, 255, 242, 0.3);
        transition: all 0.3s ease;
      }

      .letter-box.revealed {
        background: rgba(0, 255, 242, 0.2);
        animation: reveal-letter 0.5s ease;
      }

      @keyframes reveal-letter {
        0% { transform: rotateX(90deg) scale(0.5); opacity: 0; }
        50% { transform: rotateX(-10deg) scale(1.1); }
        100% { transform: rotateX(0) scale(1); opacity: 1; }
      }

      /* === LETRAS INCORRECTAS === */
      .wrong-letters {
        text-align: center;
        margin: 10px 0;
        min-height: 30px;
      }

      .wrong-letters-label {
        font-family: 'Orbitron', monospace;
        font-size: 0.6rem;
        color: #555;
        letter-spacing: 1px;
        margin-bottom: 5px;
      }

      .wrong-letter {
        display: inline-block;
        padding: 4px 10px;
        margin: 2px;
        background: rgba(255, 50, 50, 0.15);
        border: 1px solid rgba(255, 50, 50, 0.4);
        border-radius: 5px;
        font-family: 'Orbitron', monospace;
        color: #ff5555;
        font-size: 0.85rem;
      }

      /* === TECLADO === */
      .keyboard {
        text-align: center;
        margin-top: 15px;
        padding: 0 5px;
      }

      .keyboard-row {
        display: flex;
        justify-content: center;
        gap: 4px;
        margin: 5px 0;
      }

      .key-btn {
        flex: 0 1 auto;
        min-width: clamp(28px, 8.5vw, 42px);
        height: clamp(38px, 11vw, 50px);
        padding: 0;
        background: linear-gradient(180deg, rgba(40, 40, 60, 0.95) 0%, rgba(20, 20, 35, 0.95) 100%);
        border: 1px solid rgba(0, 255, 242, 0.5);
        border-radius: 6px;
        font-family: 'Orbitron', monospace;
        font-size: clamp(0.85rem, 3.5vw, 1.1rem);
        font-weight: 700;
        color: #00fff2;
        cursor: pointer;
        transition: all 0.15s ease;
        text-shadow: 0 0 8px rgba(0, 255, 242, 0.6);
        -webkit-user-select: none;
        user-select: none;
        touch-action: manipulation;
      }

      .key-btn:active:not(.used):not(.correct):not(.wrong) {
        transform: scale(0.95);
        background: rgba(0, 255, 242, 0.3);
      }

      @media (hover: hover) {
        .key-btn:hover:not(.used):not(.correct):not(.wrong) {
          background: rgba(0, 255, 242, 0.2);
          border-color: #00fff2;
          box-shadow: 0 0 18px rgba(0, 255, 242, 0.5);
          transform: translateY(-2px);
        }
      }

      .key-btn.correct {
        background: linear-gradient(180deg, rgba(0, 255, 100, 0.35) 0%, rgba(0, 150, 50, 0.35) 100%);
        border-color: #00ff66;
        color: #00ff66;
        cursor: default;
        box-shadow: 0 0 12px rgba(0, 255, 100, 0.4);
        animation: key-correct 0.4s ease;
      }

      @keyframes key-correct {
        0% { transform: scale(1); }
        50% { transform: scale(1.15); }
        100% { transform: scale(1); }
      }

      .key-btn.wrong {
        background: linear-gradient(180deg, rgba(255, 50, 50, 0.25) 0%, rgba(100, 20, 20, 0.25) 100%);
        border-color: #ff4444;
        color: #ff4444;
        cursor: default;
        opacity: 0.5;
        animation: key-wrong 0.4s ease;
      }

      @keyframes key-wrong {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-4px); }
        40%, 80% { transform: translateX(4px); }
      }

      /* === BOTÓN NUEVO JUEGO === */
      .new-game-btn {
        display: block;
        width: 100%;
        max-width: 250px;
        margin: 20px auto 5px;
        padding: 14px 25px;
        background: linear-gradient(90deg, #ff00ff, #00fff2);
        border: none;
        border-radius: 25px;
        font-family: 'Orbitron', monospace;
        font-size: clamp(0.8rem, 3vw, 0.95rem);
        font-weight: 700;
        color: #0a0a0f;
        letter-spacing: 2px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 0 25px rgba(255, 0, 255, 0.4);
        touch-action: manipulation;
      }

      .new-game-btn:active {
        transform: scale(0.98);
      }

      @media (hover: hover) {
        .new-game-btn:hover {
          transform: scale(1.03);
          box-shadow: 0 0 40px rgba(255, 0, 255, 0.6);
        }
      }

      /* === MODAL RESULTADO === */
      .result-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
        padding: 20px;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .result-box {
        background: rgba(20, 20, 35, 0.98);
        border: 2px solid;
        border-radius: 20px;
        padding: 30px 40px;
        text-align: center;
        animation: scaleIn 0.4s ease;
        max-width: 90%;
      }

      .result-box.win {
        border-color: #00ff66;
        box-shadow: 0 0 50px rgba(0, 255, 100, 0.5);
      }

      .result-box.lose {
        border-color: #ff3333;
        box-shadow: 0 0 50px rgba(255, 50, 50, 0.5);
      }

      @keyframes scaleIn {
        from { transform: scale(0.5) rotate(-5deg); opacity: 0; }
        to { transform: scale(1) rotate(0); opacity: 1; }
      }

      .result-icon {
        font-size: clamp(3rem, 15vw, 5rem);
        margin-bottom: 15px;
        animation: bounce 0.6s ease infinite alternate;
      }

      @keyframes bounce {
        from { transform: translateY(0); }
        to { transform: translateY(-10px); }
      }

      .result-title {
        font-family: 'Orbitron', monospace;
        font-size: clamp(1.5rem, 7vw, 2.5rem);
        font-weight: 900;
        margin-bottom: 10px;
      }

      .result-box.win .result-title {
        color: #00ff66;
        text-shadow: 0 0 25px rgba(0, 255, 100, 0.6);
      }

      .result-box.lose .result-title {
        color: #ff3333;
        text-shadow: 0 0 25px rgba(255, 50, 50, 0.6);
      }

      .result-word {
        font-family: 'Orbitron', monospace;
        font-size: clamp(0.9rem, 4vw, 1.2rem);
        color: #888;
        margin-bottom: 25px;
      }

      .result-word span {
        color: #fff;
        font-weight: 700;
      }

      /* === RESPONSIVE EXTRA === */
      @media (max-width: 380px) {
        .container-fluid {
          padding: 8px;
        }

        .main-panel {
          padding: 12px;
        }

        .stats-bar {
          gap: 12px;
          padding: 8px;
        }

        .keyboard-row {
          gap: 3px;
        }

        .key-btn {
          min-width: 26px;
          height: 36px;
          font-size: 0.8rem;
        }
      }

      /* Landscape mobile */
      @media (max-height: 500px) and (orientation: landscape) {
        .hangman-svg {
          width: 100px;
        }

        .stats-bar {
          margin-bottom: 8px;
          padding: 6px;
        }

        .word-display {
          margin: 10px 0;
        }
      }
    "))
  ),

  # Botón de música
  tags$button(
    id = "music-btn",
    class = "music-toggle",
    onclick = "toggleMusic()",
    HTML("🔇 MÚSICA")
  ),

  # Título
  div(class = "game-title", "AHORCADO"),
  div(class = "game-subtitle", "CYBER EDITION"),

  # Panel principal
  div(class = "main-panel",

    # Estadísticas
    div(class = "stats-bar",
      div(class = "stat-item",
        div(class = "stat-value", textOutput("wins_count", inline = TRUE)),
        div(class = "stat-label", "VICTORIAS")
      ),
      div(class = "stat-item",
        div(class = "stat-value", textOutput("streak_count", inline = TRUE)),
        div(class = "stat-label", "RACHA")
      ),
      div(class = "stat-item",
        div(class = "stat-value", textOutput("games_count", inline = TRUE)),
        div(class = "stat-label", "PARTIDAS")
      )
    ),

    # Info del juego
    div(class = "info-panel",
      div(class = "info-box",
        div(class = "label", "CATEGORÍA"),
        div(class = "value", textOutput("categoria", inline = TRUE))
      ),
      div(class = "info-box",
        div(class = "label", "LETRAS"),
        div(class = "value", textOutput("num_letras", inline = TRUE))
      )
    ),

    # Ahorcado SVG
    div(class = "hangman-container",
      uiOutput("hangman_svg")
    ),

    # Vidas
    div(class = "lives-container",
      div(class = "lives-label", "VIDAS"),
      uiOutput("lives_display")
    ),

    # Palabra
    div(class = "word-display",
      uiOutput("word_display")
    ),

    # Letras incorrectas
    div(class = "wrong-letters",
      div(class = "wrong-letters-label", "FALLIDAS"),
      uiOutput("wrong_letters_display")
    ),

    # Teclado
    div(class = "keyboard",
      uiOutput("keyboard_ui")
    ),

    # Botón nuevo juego
    actionButton("new_game", "NUEVO JUEGO", class = "new-game-btn")
  ),

  # Modal de resultado
  uiOutput("result_modal")
)

# --- SERVER ---
server <- function(input, output, session) {

  # Palabras por categoría
  categorias <- list(
    "ANIMALES" = c("elefante", "jirafa", "cocodrilo", "mariposa", "delfin", "tortuga", "canguro", "pinguino", "leopardo", "aguila"),
    "PAISES" = c("argentina", "colombia", "alemania", "australia", "japon", "brasil", "mexico", "espana", "francia", "italia"),
    "TECNOLOGIA" = c("algoritmo", "software", "hardware", "servidor", "internet", "frontend", "backend", "terminal", "codigo", "pixel"),
    "ESPACIO" = c("galaxia", "asteroide", "saturno", "neptuno", "cometa", "supernova", "pluton", "estrella", "planeta", "meteorito"),
    "CIENCIA" = c("molecula", "atomo", "electron", "neutron", "quimica", "biologia", "fisica", "genetica", "celula", "energia")
  )

  # Estado del juego
  game_state <- reactiveValues(
    palabra = "",
    categoria = "",
    letras_correctas = character(0),
    letras_incorrectas = character(0),
    errores = 0,
    max_errores = 6,
    game_over = FALSE,
    win = FALSE,
    total_wins = 0,
    total_games = 0,
    streak = 0
  )

  # Iniciar nuevo juego
  new_game <- function() {
    cat_name <- sample(names(categorias), 1)
    game_state$categoria <- cat_name
    game_state$palabra <- toupper(sample(categorias[[cat_name]], 1))
    game_state$letras_correctas <- character(0)
    game_state$letras_incorrectas <- character(0)
    game_state$errores <- 0
    game_state$game_over <- FALSE
    game_state$win <- FALSE
  }

  # Iniciar al cargar
  observe({
    new_game()
  }, priority = 100)

  # Botón nuevo juego
  observeEvent(input$new_game, {
    new_game()
  })

  # Procesar letra clickeada
  observeEvent(input$letter_click, {
    req(!game_state$game_over)
    letra <- input$letter_click

    # Sonido de click
    session$sendCustomMessage("playSound", "click")

    if (!(letra %in% game_state$letras_correctas) && !(letra %in% game_state$letras_incorrectas)) {
      if (grepl(letra, game_state$palabra)) {
        game_state$letras_correctas <- c(game_state$letras_correctas, letra)
        session$sendCustomMessage("playSound", "correct")

        # Verificar victoria
        palabra_letras <- unique(strsplit(game_state$palabra, "")[[1]])
        if (all(palabra_letras %in% game_state$letras_correctas)) {
          game_state$game_over <- TRUE
          game_state$win <- TRUE
          game_state$total_wins <- game_state$total_wins + 1
          game_state$total_games <- game_state$total_games + 1
          game_state$streak <- game_state$streak + 1
          session$sendCustomMessage("playSound", "victory")
        }
      } else {
        game_state$letras_incorrectas <- c(game_state$letras_incorrectas, letra)
        game_state$errores <- game_state$errores + 1
        session$sendCustomMessage("playSound", "wrong")

        # Verificar derrota
        if (game_state$errores >= game_state$max_errores) {
          game_state$game_over <- TRUE
          game_state$win <- FALSE
          game_state$total_games <- game_state$total_games + 1
          game_state$streak <- 0
          session$sendCustomMessage("playSound", "gameover")
        }
      }
    }
  })

  # Outputs de estadísticas
  output$wins_count <- renderText({ game_state$total_wins })
  output$streak_count <- renderText({ game_state$streak })
  output$games_count <- renderText({ game_state$total_games })

  # Info del juego
  output$categoria <- renderText({ game_state$categoria })
  output$num_letras <- renderText({ nchar(game_state$palabra) })

  # SVG del ahorcado
  output$hangman_svg <- renderUI({
    errores <- game_state$errores

    parts <- list(
      head = if(errores >= 1) "visible" else "",
      body = if(errores >= 2) "visible" else "",
      left_arm = if(errores >= 3) "visible" else "",
      right_arm = if(errores >= 4) "visible" else "",
      left_leg = if(errores >= 5) "visible" else "",
      right_leg = if(errores >= 6) "visible" else ""
    )

    HTML(sprintf('
      <svg viewBox="0 0 200 220" class="hangman-svg">
        <!-- Base -->
        <line x1="20" y1="210" x2="180" y2="210" class="hangman-base"/>
        <line x1="50" y1="210" x2="50" y2="20" class="hangman-base"/>
        <line x1="50" y1="20" x2="120" y2="20" class="hangman-base"/>
        <line x1="120" y1="20" x2="120" y2="45" class="hangman-base"/>

        <!-- Cuerpo -->
        <circle cx="120" cy="60" r="18" class="hangman-part %s"/>
        <line x1="120" y1="78" x2="120" y2="130" class="hangman-part %s"/>
        <line x1="120" y1="90" x2="85" y2="115" class="hangman-part %s"/>
        <line x1="120" y1="90" x2="155" y2="115" class="hangman-part %s"/>
        <line x1="120" y1="130" x2="90" y2="175" class="hangman-part %s"/>
        <line x1="120" y1="130" x2="150" y2="175" class="hangman-part %s"/>

        <!-- Ojos si perdió -->
        %s
      </svg>
    ', parts$head, parts$body, parts$left_arm, parts$right_arm, parts$left_leg, parts$right_leg,
    if(errores >= 6) '<text x="108" y="65" fill="#ff3333" font-size="16" font-weight="bold" font-family="monospace">X X</text>' else ''
    ))
  })

  # Display de vidas
  output$lives_display <- renderUI({
    remaining <- game_state$max_errores - game_state$errores
    hearts <- lapply(1:game_state$max_errores, function(i) {
      if (i <= remaining) {
        span(class = "life-heart", HTML("❤️"))
      } else {
        span(class = "life-heart lost", HTML("🖤"))
      }
    })
    tagList(hearts)
  })

  # Display de la palabra
  output$word_display <- renderUI({
    if (nchar(game_state$palabra) == 0) return(NULL)

    letras <- strsplit(game_state$palabra, "")[[1]]
    boxes <- lapply(seq_along(letras), function(i) {
      l <- letras[i]
      if (l %in% game_state$letras_correctas || game_state$game_over) {
        div(class = "letter-box revealed", style = sprintf("animation-delay: %sms;", (i-1) * 50), l)
      } else {
        div(class = "letter-box", "")
      }
    })
    tagList(boxes)
  })

  # Letras incorrectas
  output$wrong_letters_display <- renderUI({
    if (length(game_state$letras_incorrectas) == 0) {
      return(span(style = "color: #333;", "—"))
    }

    wrong <- lapply(game_state$letras_incorrectas, function(l) {
      span(class = "wrong-letter", l)
    })
    tagList(wrong)
  })

  # Teclado virtual
  output$keyboard_ui <- renderUI({
    rows <- list(
      c("Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"),
      c("A", "S", "D", "F", "G", "H", "J", "K", "L"),
      c("Z", "X", "C", "V", "B", "N", "M", "Ñ")
    )

    keyboard_rows <- lapply(rows, function(row) {
      div(class = "keyboard-row",
        lapply(row, function(letra) {
          btn_class <- "key-btn"
          if (letra %in% game_state$letras_correctas) {
            btn_class <- paste(btn_class, "correct")
          } else if (letra %in% game_state$letras_incorrectas) {
            btn_class <- paste(btn_class, "wrong")
          }

          tags$button(
            class = btn_class,
            onclick = sprintf("Shiny.setInputValue('letter_click', '%s', {priority: 'event'})", letra),
            letra
          )
        })
      )
    })

    tagList(keyboard_rows)
  })

  # Modal de resultado
  output$result_modal <- renderUI({
    if (!game_state$game_over) return(NULL)

    if (game_state$win) {
      div(class = "result-overlay",
        div(class = "result-box win",
          div(class = "result-icon", "🎉"),
          div(class = "result-title", "¡VICTORIA!"),
          div(class = "result-word", "La palabra era: ", span(game_state$palabra)),
          actionButton("play_again", "JUGAR DE NUEVO", class = "new-game-btn")
        )
      )
    } else {
      div(class = "result-overlay",
        div(class = "result-box lose",
          div(class = "result-icon", "💀"),
          div(class = "result-title", "GAME OVER"),
          div(class = "result-word", "La palabra era: ", span(game_state$palabra)),
          actionButton("play_again", "INTENTAR DE NUEVO", class = "new-game-btn")
        )
      )
    }
  })

  # Jugar de nuevo desde modal
  observeEvent(input$play_again, {
    new_game()
  })
}

# Ejecutar la app
shinyApp(ui = ui, server = server)
