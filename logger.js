function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildExerciseRow(exercise, gymName, weightData, restDurationsMs, date) {
  // Round each duration first so rest_durations, avg_rest_s, and max_rest_s
  // are all derived from the same integer-second values (internally consistent).
  const restS = restDurationsMs.map(ms => Math.round(ms / 1000));
  const avgRest = restS.length
    ? Math.round(restS.reduce((a, b) => a + b, 0) / restS.length)
    : 0;
  const maxRest = restS.length ? Math.max(...restS) : 0;

  return {
    date: formatDate(date),
    day: exercise.day,
    exercise: exercise.name,
    sets: exercise.sets,
    reps: exercise.reps,
    gym: gymName,
    weight_raw: weightData.value,
    weight_type: weightData.type,
    rest_durations: restS,
    avg_rest_s: avgRest,
    max_rest_s: maxRest,
  };
}

function buildSessionSummary(day, gymName, workoutStartTime, exerciseNames, now) {
  return {
    date: formatDate(now),
    day,
    gym: gymName,
    total_workout_time_s: Math.round((now.getTime() - workoutStartTime) / 1000),
    exercises_completed: exerciseNames.length,
  };
}

function buildSkippedRow(date) {
  return { date: formatDate(date) };
}

if (typeof module !== 'undefined') {
  module.exports = { buildExerciseRow, buildSessionSummary, buildSkippedRow, formatDate };
}
