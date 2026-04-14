function createStopwatchState(totalSets) {
  return {
    phase: 'idle',
    currentSet: 0,
    totalSets,
    startTime: null,
    phaseDurations: [],
  };
}

function tapStopwatch(state, now) {
  if (state.phase === 'done') return state;

  if (state.phase === 'idle') {
    return { ...state, phase: 'exercise', currentSet: 1, startTime: now };
  }

  const elapsed = now - state.startTime;
  const durations = [...state.phaseDurations, elapsed];

  if (state.phase === 'exercise') {
    if (state.currentSet === state.totalSets) {
      // After final exercise, transition to done with implicit 0-duration rest
      return { ...state, phase: 'done', phaseDurations: [...durations, 0], startTime: null };
    }
    return { ...state, phase: 'rest', startTime: now, phaseDurations: durations };
  }

  if (state.phase === 'rest') {
    return {
      ...state,
      phase: 'exercise',
      currentSet: state.currentSet + 1,
      startTime: now,
      phaseDurations: durations,
    };
  }

  return state;
}

function getRestDurations(state) {
  // Filter odd-indexed durations (rest phases), excluding the final 0-duration padding
  let durations = state.phaseDurations;
  if (durations.length > 0 && durations[durations.length - 1] === 0) {
    durations = durations.slice(0, -1);
  }
  return durations.filter((_, i) => i % 2 === 1);
}

function getExerciseDurations(state) {
  // Return all durations except the final 0-duration padding (if present)
  if (state.phaseDurations.length > 0 && state.phaseDurations[state.phaseDurations.length - 1] === 0) {
    return state.phaseDurations.slice(0, -1);
  }
  return state.phaseDurations;
}

if (typeof module !== 'undefined') {
  module.exports = { createStopwatchState, tapStopwatch, getRestDurations, getExerciseDurations };
}
