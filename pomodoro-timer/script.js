const TIPS = [
  "Turn off notifications during focus time.",
  "Drink water before your session starts.",
  "After 4 sessions, take a long break.",
  "One task at a time — focus beats multitasking.",
  "Stand up and stretch during your break.",
  "Your brain needs rest to retain information.",
  "Consistency beats intensity — show up daily.",
  "Close unused tabs to reduce distractions.",
  "Sleep is when memories are consolidated.",
  "Set a clear goal before each session."
];

let MODES = {
  focus: { label: 'Deep work session', duration: 25 * 60 },
  short: { label: 'Short break — breathe', duration: 5 * 60 },
  long:  { label: 'Long break — recharge', duration: 15 * 60 }
};

let currentMode = 'focus';
let timeLeft = MODES.focus.duration;
let totalTime = MODES.focus.duration;
let timerInterval = null;
let isRunning = false;
let sessionCount = 0;
let totalFocusMinutes = 0;

let streak = parseInt(localStorage.getItem('pomStreak') || '0');
let lastDate = localStorage.getItem('pomLastDate') || '';

function init() {
  document.getElementById('streakCount').textContent = streak;
  showTip();
  updateDisplay();
  updateProgressBar();
  setTodayDate();

  const ti = document.getElementById('taskInput');
  ti.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') saveTask();
    if (e.key === 'Escape') cancelTask();
  });
  ti.addEventListener('blur', saveTask);
}

function setTodayDate() {
  const d = new Date();
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('todayDate').textContent = d.toLocaleDateString('en-US', opts);
}

function applySettings() {
  if (isRunning) return;
  const f = parseInt(document.getElementById('setFocus').value) || 25;
  const s = parseInt(document.getElementById('setShort').value) || 5;
  const l = parseInt(document.getElementById('setLong').value) || 15;
  MODES.focus.duration = Math.max(1, f) * 60;
  MODES.short.duration = Math.max(1, s) * 60;
  MODES.long.duration  = Math.max(1, l) * 60;
  timeLeft = MODES[currentMode].duration;
  totalTime = MODES[currentMode].duration;
  updateDisplay();
  updateProgressBar();
}

function switchMode(mode) {
  if (isRunning) return;
  currentMode = mode;
  timeLeft = MODES[mode].duration;
  totalTime = MODES[mode].duration;

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + mode).classList.add('active');
  document.getElementById('modeLabel').textContent = MODES[mode].label;

  updateDisplay();
  updateProgressBar();
}

function toggleTimer() {
  isRunning ? pauseTimer() : startTimer();
}

function startTimer() {
  isRunning = true;
  const btn = document.getElementById('startBtn');
  btn.textContent = 'Pause';
  btn.classList.add('running');

  timerInterval = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateDisplay();
      updateProgressBar();
    }
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      isRunning = false;
      onSessionEnd();
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
  const btn = document.getElementById('startBtn');
  btn.textContent = 'Resume';
  btn.classList.remove('running');
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
  timeLeft = MODES[currentMode].duration;
  totalTime = MODES[currentMode].duration;
  const btn = document.getElementById('startBtn');
  btn.textContent = 'Start';
  btn.classList.remove('running');
  updateDisplay();
  updateProgressBar();
}

function skipSession() {
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
  onSessionEnd();
}

function onSessionEnd() {
  const btn = document.getElementById('startBtn');
  btn.textContent = 'Start';
  btn.classList.remove('running');

  addLog(currentMode);
  playSound();

  if (currentMode === 'focus') {
    sessionCount++;
    totalFocusMinutes += Math.round(MODES.focus.duration / 60);
    document.getElementById('sessionCount').textContent = sessionCount;
    document.getElementById('totalFocus').textContent = totalFocusMinutes + 'm';
    updateStreak();
    switchMode(sessionCount % 4 === 0 ? 'long' : 'short');
  } else {
    switchMode('focus');
  }
  showTip();
}

function updateDisplay() {
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  document.getElementById('timeDisplay').textContent = mins + ':' + secs;
  document.title = mins + ':' + secs + ' — The Pomodoro';
}

function updateProgressBar() {
  const pct = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  document.getElementById('progressBar').style.width = pct + '%';
}

function updateStreak() {
  const today = new Date().toDateString();
  if (lastDate !== today) {
    streak++;
    lastDate = today;
    localStorage.setItem('pomStreak', streak);
    localStorage.setItem('pomLastDate', today);
    document.getElementById('streakCount').textContent = streak;
  }
}

function addLog(mode) {
  const list = document.getElementById('logList');
  const empty = list.querySelector('.log-empty');
  if (empty) empty.remove();

  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const li = document.createElement('li');
  const label = mode === 'focus' ? 'Focus' : mode === 'short' ? 'Short' : 'Long';
  const tagClass = mode === 'focus' ? '' : 'break';
  li.innerHTML = '<span>' + time + '</span><span class="log-tag ' + tagClass + '">' + label + '</span>';
  list.insertBefore(li, list.firstChild);
  if (list.children.length > 7) list.removeChild(list.lastChild);
}

function editTask() {
  const input = document.getElementById('taskInput');
  const text = document.getElementById('taskText');
  const def = 'Click to set your task';
  input.value = text.textContent === def ? '' : text.textContent;
  input.classList.remove('hidden');
  text.classList.add('hidden');
  input.focus();
}

function saveTask() {
  const input = document.getElementById('taskInput');
  const text = document.getElementById('taskText');
  const val = input.value.trim();
  text.textContent = val || 'Click to set your task';
  input.classList.add('hidden');
  text.classList.remove('hidden');
}

function cancelTask() {
  document.getElementById('taskInput').classList.add('hidden');
  document.getElementById('taskText').classList.remove('hidden');
}

function showTip() {
  document.getElementById('tipBox').textContent = '"' + TIPS[Math.floor(Math.random() * TIPS.length)] + '"';
}

function playSound() {
  if (!document.getElementById('soundToggle').checked) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(770, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch(e) {}
}

init();