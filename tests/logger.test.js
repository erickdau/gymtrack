const { buildExerciseRow, buildSessionSummary, buildSkippedRow, formatDate } = require('../logger');

describe('formatDate', () => {
  test('formats Date to YYYY-MM-DD using local timezone', () => {
    expect(formatDate(new Date(2026, 3, 14))).toBe('2026-04-14'); // month is 0-indexed
  });
});

describe('buildExerciseRow', () => {
  const exercise = { name: 'Bench Press', sets: 4, reps: 12, day: 'A' };
  const weightData = { type: 'plates', value: 3, plateWeight: 10 };
  const restDurationsMs = [52000, 48000, 61000];
  const date = new Date(2026, 3, 14, 10, 0, 0); // local time

  test('produces correct shape', () => {
    const row = buildExerciseRow(exercise, 'Gym 1', weightData, restDurationsMs, date);
    expect(row).toEqual({
      date: '2026-04-14',
      day: 'A',
      exercise: 'Bench Press',
      sets: 4,
      reps: 12,
      gym: 'Gym 1',
      weight_raw: 3,
      weight_type: 'plates',
      rest_durations: [52, 48, 61],
      avg_rest_s: 54,
      max_rest_s: 61,
    });
  });

  test('avg_rest_s is 0 when no rest intervals (single set)', () => {
    const row = buildExerciseRow(
      { name: 'Pull-ups', sets: 1, reps: 8, day: 'C' },
      'Gym 2',
      { type: 'kg', value: 0, plateWeight: '' },
      [],
      date
    );
    expect(row.avg_rest_s).toBe(0);
    expect(row.max_rest_s).toBe(0);
  });
});

describe('buildSessionSummary', () => {
  test('produces correct shape', () => {
    const workoutStart = Date.now() - 3240000; // 54 min ago
    const summary = buildSessionSummary('A', 'Gym 1', workoutStart, ['Bench Press', 'Squat'], new Date());
    expect(summary.day).toBe('A');
    expect(summary.gym).toBe('Gym 1');
    expect(summary.exercises_completed).toBe(2);
    expect(typeof summary.total_workout_time_s).toBe('number');
    expect(summary.total_workout_time_s).toBeGreaterThan(3230);
  });
});

describe('buildSkippedRow', () => {
  test('produces date string', () => {
    const row = buildSkippedRow(new Date(2026, 3, 13, 10, 0, 0)); // local time
    expect(row).toEqual({ date: '2026-04-13' });
  });
});
