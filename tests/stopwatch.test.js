const { createStopwatchState, tapStopwatch, getRestDurations, getExerciseDurations } = require('../stopwatch');

describe('createStopwatchState', () => {
  test('starts in idle phase with correct set count', () => {
    const s = createStopwatchState(4);
    expect(s.phase).toBe('idle');
    expect(s.currentSet).toBe(0);
    expect(s.totalSets).toBe(4);
    expect(s.phaseDurations).toEqual([]);
  });
});

describe('tapStopwatch', () => {
  test('idle → exercise (set 1) on first tap', () => {
    const s = createStopwatchState(3);
    const next = tapStopwatch(s, 1000);
    expect(next.phase).toBe('exercise');
    expect(next.currentSet).toBe(1);
    expect(next.startTime).toBe(1000);
  });

  test('exercise → rest on second tap, records exercise duration', () => {
    const s = createStopwatchState(3);
    const s1 = tapStopwatch(s, 1000);
    const s2 = tapStopwatch(s1, 36000); // 35s exercise
    expect(s2.phase).toBe('rest');
    expect(s2.phaseDurations).toEqual([35000]);
    expect(s2.startTime).toBe(36000);
  });

  test('rest → exercise (set 2) on third tap, records rest duration', () => {
    const s = createStopwatchState(3);
    const s1 = tapStopwatch(s, 0);
    const s2 = tapStopwatch(s1, 30000);
    const s3 = tapStopwatch(s2, 80000); // 50s rest
    expect(s3.phase).toBe('exercise');
    expect(s3.currentSet).toBe(2);
    expect(s3.phaseDurations).toEqual([30000, 50000]);
  });

  test('last set exercise tap → done (no rest after final set)', () => {
    let s = createStopwatchState(2);
    s = tapStopwatch(s, 0);      // tap 1: exercise set 1
    s = tapStopwatch(s, 30000);  // tap 2: rest
    s = tapStopwatch(s, 80000);  // tap 3: exercise set 2
    s = tapStopwatch(s, 110000); // tap 4: done
    expect(s.phase).toBe('done');
    expect(s.phaseDurations.length).toBe(4); // ex1, rest1, ex2, ex2-final
  });

  test('done state is a no-op on further taps', () => {
    let s = createStopwatchState(1);
    s = tapStopwatch(s, 0);
    s = tapStopwatch(s, 30000); // done after 1 set
    const afterDone = tapStopwatch(s, 99999);
    expect(afterDone.phase).toBe('done');
    expect(afterDone.phaseDurations).toEqual(s.phaseDurations);
  });
});

describe('getRestDurations', () => {
  test('returns only rest phase durations (odd-indexed)', () => {
    let s = createStopwatchState(3);
    s = tapStopwatch(s, 0);       // ex1 start
    s = tapStopwatch(s, 25000);   // rest start (ex1 = 25s)
    s = tapStopwatch(s, 75000);   // ex2 start (rest1 = 50s)
    s = tapStopwatch(s, 100000);  // rest start (ex2 = 25s)
    s = tapStopwatch(s, 155000);  // ex3 start (rest2 = 55s)
    s = tapStopwatch(s, 180000);  // done (ex3 = 25s)
    expect(getRestDurations(s)).toEqual([50000, 55000]);
  });
});

describe('getExerciseDurations', () => {
  test('returns only exercise phase durations (even-indexed)', () => {
    let s = createStopwatchState(2);
    s = tapStopwatch(s, 0);
    s = tapStopwatch(s, 20000);  // ex1 = 20s
    s = tapStopwatch(s, 70000);  // rest1 = 50s
    s = tapStopwatch(s, 90000);  // ex2 = 20s
    s = tapStopwatch(s, 110000); // done
    expect(getExerciseDurations(s)).toEqual([20000, 50000, 20000]);
    // Note: last "exercise" duration is included
  });
});
