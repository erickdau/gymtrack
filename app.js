if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(console.error);
}

// ── App State ──────────────────────────────────────
const state = {
  activeDay: 'A',
  activeGymIndex: 0,
  workoutStartTime: null,
  lastResetDate: null,
  cardStates: {},
};

// ── Init ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderTabs();
  renderCards();
  bindGymToggle();
  checkSkippedDays();
  retrySyncQueue();
  document.getElementById('finish-early-btn').addEventListener('click', () => {
    triggerSync();
  });
});

// ── Tabs ───────────────────────────────────────────
function renderTabs() {
  const nav = document.getElementById('day-tabs');
  nav.innerHTML = '';
  Object.keys(CONFIG.days).forEach(day => {
    const btn = document.createElement('button');
    btn.className = 'day-tab';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', day === state.activeDay ? 'true' : 'false');
    btn.textContent = day;
    btn.addEventListener('click', () => {
      state.activeDay = day;
      renderTabs();
      renderCards();
    });
    nav.appendChild(btn);
  });
}

// ── Gym Toggle ─────────────────────────────────────
function bindGymToggle() {
  const btn = document.getElementById('gym-toggle');
  updateGymToggleUI(btn);
  btn.addEventListener('click', () => {
    state.activeGymIndex = (state.activeGymIndex + 1) % CONFIG.gyms.length;
    updateGymToggleUI(btn);
    renderCards();
  });
}

function updateGymToggleUI(btn) {
  btn.textContent = CONFIG.gyms[state.activeGymIndex].name.toUpperCase();
}

// ── Cards ──────────────────────────────────────────
function renderCards() {
  const container = document.getElementById('card-container');
  container.innerHTML = '';

  // Reset card states for this day if it's a new calendar day
  const todayStr = formatDate(new Date());
  if (state.lastResetDate !== todayStr) {
    state.cardStates = {};
    state.workoutStartTime = null;
    state.lastResetDate = todayStr;
  }

  const exercises = CONFIG.days[state.activeDay];
  exercises.forEach(exercise => {
    if (!state.cardStates[exercise.name]) {
      state.cardStates[exercise.name] = createStopwatchState(exercise.sets);
    }
    const card = buildCard(exercise, state.cardStates[exercise.name]);
    container.appendChild(card);
  });

  updateFinishEarlyButton();
}

function buildCard(exercise, swState) {
  const gymIndex = state.activeGymIndex;
  const weightData = getWeight(exercise.name, gymIndex);

  const card = document.createElement('div');
  card.className = 'exercise-card' + (swState.phase === 'done' ? ' done' : '');
  card.dataset.exercise = exercise.name;

  card.innerHTML = `
    <div class="card-title">${exercise.name}</div>
    <div class="card-meta">${exercise.sets} sets · ${exercise.reps} reps</div>

    <div class="weight-row">
      <input
        class="weight-input"
        type="number"
        inputmode="decimal"
        min="0"
        step="0.5"
        value="${weightData.value}"
        placeholder="—"
        aria-label="Weight for ${exercise.name}"
      >
      <button class="type-toggle ${weightData.type === 'kg' ? 'active' : ''}" data-type="kg">KG</button>
      <button class="type-toggle ${weightData.type === 'plates' ? 'active' : ''}" data-type="plates">PLATES</button>
    </div>

    <div class="plate-weight-row ${weightData.type === 'plates' ? '' : 'hidden'}">
      <span>kg / plate:</span>
      <input
        class="plate-weight-input"
        type="number"
        inputmode="decimal"
        min="0"
        step="0.5"
        value="${weightData.plateWeight || ''}"
        placeholder="—"
        aria-label="kg per plate for ${exercise.name}"
      >
    </div>

    <div class="stopwatch" role="button" aria-label="Stopwatch for ${exercise.name}">
      <div class="stopwatch-time ${swState.phase}">--:--</div>
      <div class="stopwatch-label">${swLabelText(swState)}</div>
    </div>
  `;

  // Weight value input
  const weightInput = card.querySelector('.weight-input');
  weightInput.addEventListener('change', () => {
    const current = getWeight(exercise.name, gymIndex);
    setWeight(exercise.name, gymIndex, { ...current, value: parseFloat(weightInput.value) || '' });
  });

  // Type toggles (KG / PLATES)
  card.querySelectorAll('.type-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const newType = btn.dataset.type;
      const current = getWeight(exercise.name, gymIndex);
      setWeight(exercise.name, gymIndex, { ...current, type: newType });
      card.querySelectorAll('.type-toggle').forEach(b => b.classList.toggle('active', b.dataset.type === newType));
      card.querySelector('.plate-weight-row').classList.toggle('hidden', newType !== 'plates');
    });
  });

  // Plate weight input
  const plateInput = card.querySelector('.plate-weight-input');
  plateInput.addEventListener('change', () => {
    const current = getWeight(exercise.name, gymIndex);
    setWeight(exercise.name, gymIndex, { ...current, plateWeight: parseFloat(plateInput.value) || '' });
  });

  // Stopwatch tap
  const sw = card.querySelector('.stopwatch');
  sw.addEventListener('click', () => onStopwatchTap(exercise, card));

  return card;
}

function swLabelText(swState) {
  if (swState.phase === 'idle') return 'TAP TO START';
  if (swState.phase === 'exercise') return `SET ${swState.currentSet} / ${swState.totalSets}`;
  if (swState.phase === 'rest') return 'REST';
  if (swState.phase === 'done') return 'DONE ✓';
  return '';
}

// ── Finish Early Button ────────────────────────────
function updateFinishEarlyButton() {
  const btn = document.getElementById('finish-early-btn');
  const exercises = CONFIG.days[state.activeDay];
  const anyStarted = exercises.some(ex => {
    const s = state.cardStates[ex.name];
    return s && s.phase !== 'idle';
  });
  const allDone = exercises.every(ex => {
    const s = state.cardStates[ex.name];
    return s && s.phase === 'done';
  });
  btn.classList.toggle('hidden', !anyStarted || allDone);
}

// ── Stopwatch Tick ─────────────────────────────────
let _tickInterval = null;

function startTickLoop() {
  if (_tickInterval) return;
  _tickInterval = setInterval(tickAllStopwatches, 100);
}

function tickAllStopwatches() {
  const now = Date.now();
  const cards = document.querySelectorAll('.exercise-card');
  let anyActive = false;

  cards.forEach(card => {
    const name = card.dataset.exercise;
    const swState = state.cardStates[name];
    if (!swState || swState.phase === 'idle' || swState.phase === 'done') return;

    anyActive = true;
    const elapsed = now - swState.startTime;
    const timeEl = card.querySelector('.stopwatch-time');
    timeEl.textContent = formatMs(elapsed);
  });

  if (!anyActive) {
    clearInterval(_tickInterval);
    _tickInterval = null;
  }
}

function formatMs(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ── Stopwatch Tap ──────────────────────────────────
function onStopwatchTap(exercise, card) {
  const prev = state.cardStates[exercise.name];
  if (prev.phase === 'done') return;

  const now = Date.now();

  if (!state.workoutStartTime) {
    state.workoutStartTime = now;
  }

  const next = tapStopwatch(prev, now);
  state.cardStates[exercise.name] = next;

  const timeEl = card.querySelector('.stopwatch-time');
  const labelEl = card.querySelector('.stopwatch-label');

  timeEl.className = `stopwatch-time ${next.phase}`;
  timeEl.textContent = next.phase === 'done'
    ? formatMs(next.phaseDurations.reduce((a, b) => a + b, 0))
    : '00:00';
  labelEl.textContent = swLabelText(next);

  if (next.phase === 'done') {
    card.classList.add('done');
  }

  if (next.phase === 'rest') {
    scheduleRestBeeps();
  }

  startTickLoop();
  updateFinishEarlyButton();
  checkWorkoutComplete();
}

// ── Audio ──────────────────────────────────────────
let _audioCtx = null;

function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

function scheduleRestBeeps() {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const base = ctx.currentTime;
    [45, 46, 47, 48, 49, 50].forEach(sec => {
      const t = base + sec;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = sec === 50 ? 1100 : 880;
      gain.gain.setValueAtTime(0.0, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  } catch (e) {
    console.warn('Audio not available:', e);
  }
}

// ── Workout Completion ─────────────────────────────
function checkWorkoutComplete() {
  const exercises = CONFIG.days[state.activeDay];
  const allDone = exercises.every(ex => {
    const s = state.cardStates[ex.name];
    return s && s.phase === 'done';
  });
  if (allDone) triggerSync();
}

async function triggerSync() {
  if (!state.workoutStartTime) return;
  const exercises = CONFIG.days[state.activeDay];
  const gymName = CONFIG.gyms[state.activeGymIndex].name;
  const now = new Date();

  const completedExercises = exercises.filter(ex => {
    const s = state.cardStates[ex.name];
    return s && s.phase === 'done';
  });

  const exerciseRows = completedExercises.map(ex => {
    const swState = state.cardStates[ex.name];
    const weightData = getWeight(ex.name, state.activeGymIndex);
    const restMs = getRestDurations(swState);
    return buildExerciseRow({ ...ex, day: state.activeDay }, gymName, weightData, restMs, now);
  });

  const sessionRow = buildSessionSummary(
    state.activeDay,
    gymName,
    state.workoutStartTime,
    completedExercises.map(ex => ex.name),
    now
  );

  setLastSession({ date: sessionRow.date, day: state.activeDay });

  const payload = { exerciseRows, sessionRow };

  try {
    await syncExercises(CONFIG.sheetsWebAppUrl, exerciseRows);
    await syncSession(CONFIG.sheetsWebAppUrl, sessionRow);
    showSyncStatus('Synced to Sheets ✓');
  } catch (e) {
    addToSyncQueue(payload);
    showSyncStatus('Offline — will sync later');
  }
}

function showSyncStatus(msg) {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--surface);color:var(--green);padding:8px 16px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:1px;z-index:100;border:1px solid var(--border);';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ── Offline Retry ──────────────────────────────────
async function retrySyncQueue() {
  const queue = getSyncQueue();
  if (!queue.length) return;
  if (!navigator.onLine) return;

  try {
    for (const payload of queue) {
      await syncExercises(CONFIG.sheetsWebAppUrl, payload.exerciseRows);
      await syncSession(CONFIG.sheetsWebAppUrl, payload.sessionRow);
    }
    clearSyncQueue();
    showSyncStatus('Queued workouts synced ✓');
  } catch (e) {
    // Still offline or error — leave queue intact
  }
}

// ── Skipped Day Detection ──────────────────────────
async function checkSkippedDays() {
  const last = getLastSession();
  if (!last) return;

  const lastDate = new Date(last.date + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today - lastDate) / 86400000);
  if (diffDays <= 1) return;

  for (let i = 1; i < diffDays; i++) {
    const skippedDate = new Date(lastDate);
    skippedDate.setDate(skippedDate.getDate() + i);
    const row = buildSkippedRow(skippedDate);
    try {
      await syncSkipped(CONFIG.sheetsWebAppUrl, row);
    } catch (e) {
      // Best-effort — don't queue skipped days
    }
  }
}
