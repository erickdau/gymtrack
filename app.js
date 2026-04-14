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

// ── Stubs for later tasks ──────────────────────────
function updateFinishEarlyButton() {}
function onStopwatchTap(exercise, card) {}

// ── Placeholder stubs (implemented in later tasks) ─
function checkSkippedDays() {}
function retrySyncQueue() {}
