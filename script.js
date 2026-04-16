// =============================================
//  ARIA — Car Voice Assistant Simulator
//  script.js
// =============================================

'use strict';

// ---- STATE ----
const state = {
  window:    'closed',   // 'open' | 'closed'
  trunk:     'closed',   // 'open' | 'closed'
  lights:    'off',      // 'on'  | 'off'
  ac:        'off',      // 'on'  | 'off'
  doors:     'locked',   // 'locked' | 'unlocked'
  listening: false
};

// ---- DOM REFS ----
const listenBtn      = document.getElementById('listenBtn');
const btnLabel       = document.getElementById('btnLabel');
const statusDot      = document.getElementById('statusDot');
const statusLabel    = document.getElementById('statusLabel');
const recognizedText = document.getElementById('recognizedText');
const responseText   = document.getElementById('responseText');
const waveContainer  = document.getElementById('waveContainer');
const windowGlass    = document.getElementById('windowGlass');
const trunkGroup     = document.getElementById('trunkGroup');
const windowStateEl  = document.getElementById('windowState');
const trunkStateEl   = document.getElementById('trunkState');
const windowLabel    = document.getElementById('windowLabel');
const trunkLabel     = document.getElementById('trunkLabel');
// New elements
const carSvg         = document.getElementById('carSvg');
const acVent         = document.getElementById('acVent');
const hornRipple     = document.getElementById('hornRipple');
const lockFlash      = document.getElementById('lockFlash');
const lightsStateEl  = document.getElementById('lightsState');
const acStateEl      = document.getElementById('acState');
const doorsStateEl   = document.getElementById('doorsState');
const lightsLabel    = document.getElementById('lightsLabel');
const acLabel        = document.getElementById('acLabel');
const doorsLabel     = document.getElementById('doorsLabel');

// ---- SPEECH RECOGNITION SETUP ----
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    state.listening = true;
    setStatus('LISTENING', 'active');
    listenBtn.classList.add('active');
    btnLabel.textContent = 'LISTENING…';
    waveContainer.classList.add('active');
  };

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript.toLowerCase().trim();
    flashText(recognizedText, `"${transcript}"`);
    processCommand(transcript);
  };

  recognition.onerror = (e) => {
    let msg = 'Microphone error. Please check permissions.';
    if (e.error === 'no-speech') msg = 'No speech detected. Try again.';
    if (e.error === 'not-allowed') msg = 'Microphone access denied.';
    flashText(responseText, msg);
    speak(msg);
    stopListening();
  };

  recognition.onend = () => {
    stopListening();
  };
} else {
  listenBtn.disabled = true;
  btnLabel.textContent = 'NOT SUPPORTED';
  responseText.textContent = 'Web Speech API not supported. Please use Chrome.';
}

// ---- MAIN ENTRY ----
function startListening() {
  if (!recognition) return;
  if (state.listening) {
    recognition.stop();
    return;
  }
  try {
    recognition.start();
  } catch (err) {
    console.error('Recognition start error:', err);
  }
}

function stopListening() {
  state.listening = false;
  listenBtn.classList.remove('active');
  btnLabel.textContent = 'START LISTENING';
  waveContainer.classList.remove('active');
  setStatus('STANDBY', '');
}

// ---- COMMAND PARSER ----
const COMMANDS = [
  {
    match: (t) => t.includes('open') && t.includes('window'),
    action: () => handleWindow('open')
  },
  {
    match: (t) => t.includes('close') && t.includes('window'),
    action: () => handleWindow('close')
  },
  {
    match: (t) => t.includes('open') && t.includes('trunk'),
    action: () => handleTrunk('open')
  },
  {
    match: (t) => t.includes('close') && t.includes('trunk'),
    action: () => handleTrunk('close')
  },
  // ── NEW COMMANDS ──
  {
    match: (t) => t.includes('light') && (t.includes('on') || t.includes('turn on')),
    action: () => handleLights('on')
  },
  {
    match: (t) => t.includes('light') && (t.includes('off') || t.includes('turn off')),
    action: () => handleLights('off')
  },
  {
    match: (t) => t.includes('honk') || t.includes('horn') || t.includes('beep'),
    action: () => handleHorn()
  },
  {
    match: (t) => (t.includes('ac') || t.includes('air')) && (t.includes('on') || t.includes('turn on')),
    action: () => handleAC('on')
  },
  {
    match: (t) => (t.includes('ac') || t.includes('air')) && (t.includes('off') || t.includes('turn off')),
    action: () => handleAC('off')
  },
  {
    match: (t) => t.includes('lock') && !t.includes('unlock'),
    action: () => handleDoors('locked')
  },
  {
    match: (t) => t.includes('unlock'),
    action: () => handleDoors('unlocked')
  }
];

function processCommand(transcript) {
  setStatus('PROCESSING', 'responding');

  const matched = COMMANDS.find(cmd => cmd.match(transcript));

  if (matched) {
    matched.action();
  } else {
    const msg = 'Command not recognized. Please try again.';
    flashText(responseText, msg);
    speak(msg);
    setStatus('STANDBY', '');
  }
}

// ---- ACTIONS ----
function handleWindow(action) {
  if (action === 'open') {
    if (state.window === 'open') {
      respond('Window is already open.');
      return;
    }
    state.window = 'open';
    windowGlass.classList.add('open');
    windowStateEl.textContent = 'OPEN';
    windowStateEl.classList.add('open');
    windowLabel.classList.add('active');
    windowLabel.innerHTML = '<span class="label-dot"></span> WINDOW: OPEN';
    respond('Opening window.');
  } else {
    if (state.window === 'closed') {
      respond('Window is already closed.');
      return;
    }
    state.window = 'closed';
    windowGlass.classList.remove('open');
    windowStateEl.textContent = 'CLOSED';
    windowStateEl.classList.remove('open');
    windowLabel.classList.remove('active');
    windowLabel.innerHTML = '<span class="label-dot"></span> WINDOW: CLOSED';
    respond('Closing window.');
  }
}

function handleTrunk(action) {
  if (action === 'open') {
    if (state.trunk === 'open') {
      respond('Trunk is already open.');
      return;
    }
    state.trunk = 'open';
    trunkGroup.classList.add('open');
    trunkStateEl.textContent = 'OPEN';
    trunkStateEl.classList.add('open');
    trunkLabel.classList.add('active');
    trunkLabel.innerHTML = '<span class="label-dot"></span> TRUNK: OPEN';
    respond('Opening trunk.');
  } else {
    if (state.trunk === 'closed') {
      respond('Trunk is already closed.');
      return;
    }
    state.trunk = 'closed';
    trunkGroup.classList.remove('open');
    trunkStateEl.textContent = 'CLOSED';
    trunkStateEl.classList.remove('open');
    trunkLabel.classList.remove('active');
    trunkLabel.innerHTML = '<span class="label-dot"></span> TRUNK: CLOSED';
    respond('Closing trunk.');
  }
}

// ---- RESPOND ----
function respond(message) {
  flashText(responseText, message);
  speak(message);
  setTimeout(() => setStatus('STANDBY', ''), 1200);
}

// ── NEW HANDLERS ──

function handleLights(action) {
  if (action === 'on') {
    if (state.lights === 'on') { respond('Lights are already on.'); return; }
    state.lights = 'on';
    carSvg.classList.add('lights-on');
    lightsStateEl.textContent = 'ON';
    lightsStateEl.classList.add('open');
    lightsLabel.classList.add('active');
    lightsLabel.innerHTML = '<span class="label-dot"></span> LIGHTS: ON';
    respond('Turning on lights.');
  } else {
    if (state.lights === 'off') { respond('Lights are already off.'); return; }
    state.lights = 'off';
    carSvg.classList.remove('lights-on');
    lightsStateEl.textContent = 'OFF';
    lightsStateEl.classList.remove('open');
    lightsLabel.classList.remove('active');
    lightsLabel.innerHTML = '<span class="label-dot"></span> LIGHTS: OFF';
    respond('Turning off lights.');
  }
}

function handleHorn() {
  // Horn is stateless — always fires
  hornRipple.classList.remove('honking');
  void hornRipple.offsetWidth;
  hornRipple.classList.add('honking');
  playHornBeep();
  setTimeout(() => hornRipple.classList.remove('honking'), 750);
  respond('Beep beep!');
}

function handleAC(action) {
  if (action === 'on') {
    if (state.ac === 'on') { respond('AC is already on.'); return; }
    state.ac = 'on';
    acVent.classList.add('ac-on');
    acStateEl.textContent = 'ON';
    acStateEl.classList.add('open');
    acLabel.classList.add('active');
    acLabel.innerHTML = '<span class="label-dot"></span> AC: ON';
    respond('Turning on AC.');
  } else {
    if (state.ac === 'off') { respond('AC is already off.'); return; }
    state.ac = 'off';
    acVent.classList.remove('ac-on');
    acStateEl.textContent = 'OFF';
    acStateEl.classList.remove('open');
    acLabel.classList.remove('active');
    acLabel.innerHTML = '<span class="label-dot"></span> AC: OFF';
    respond('Turning off AC.');
  }
}

function handleDoors(action) {
  if (action === 'locked') {
    if (state.doors === 'locked') { respond('Doors are already locked.'); return; }
    state.doors = 'locked';
  } else {
    if (state.doors === 'unlocked') { respond('Doors are already unlocked.'); return; }
    state.doors = 'unlocked';
  }
  // Flash the lock border regardless of direction
  lockFlash.classList.remove('flashing');
  void lockFlash.offsetWidth;
  lockFlash.classList.add('flashing');
  setTimeout(() => lockFlash.classList.remove('flashing'), 600);
  const isLocked = action === 'locked';
  doorsStateEl.textContent = isLocked ? 'LOCKED' : 'UNLOCKED';
  doorsStateEl.classList.toggle('open', !isLocked);
  doorsLabel.classList.toggle('active', !isLocked);
  doorsLabel.innerHTML = `<span class="label-dot"></span> DOORS: ${isLocked ? 'LOCKED' : 'UNLOCKED'}`;
  respond(isLocked ? 'Doors locked.' : 'Doors unlocked.');
}

// Horn beep via Web Audio API
function playHornBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(290, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.45);
  } catch (e) { /* AudioContext unavailable */ }
}

// ---- UI HELPERS ----
function flashText(el, text) {
  el.classList.remove('flash');
  void el.offsetWidth; // reflow
  el.textContent = text;
  el.classList.add('flash');
}

function setStatus(label, dotClass) {
  statusLabel.textContent = label;
  statusDot.className = 'status-dot ' + dotClass;
}

// ---- SPEECH SYNTHESIS ----
let femaleVoice = null;

function loadVoices() {
  const voices = speechSynthesis.getVoices();
  // Prefer female English voices
  const preferred = ['Samantha', 'Google UK English Female', 'Victoria',
                     'Karen', 'Moira', 'Fiona', 'Tessa'];

  for (const name of preferred) {
    const v = voices.find(v => v.name === name);
    if (v) { femaleVoice = v; return; }
  }

  // Fallback: any female-sounding English voice
  femaleVoice = voices.find(v => v.lang.startsWith('en') && /female/i.test(v.name))
              || voices.find(v => v.lang.startsWith('en'))
              || null;
}

speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

function speak(text) {
  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.95;
  utter.pitch = 1.1;
  if (femaleVoice) utter.voice = femaleVoice;
  speechSynthesis.speak(utter);
}