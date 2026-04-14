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

// ── Placeholder stubs (implemented in later tasks) ─
function renderCards() {}
function checkSkippedDays() {}
function retrySyncQueue() {}
