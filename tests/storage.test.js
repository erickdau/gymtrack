/**
 * @jest-environment jsdom
 */
const { getWeight, setWeight, getSyncQueue, addToSyncQueue, clearSyncQueue, getLastSession, setLastSession } = require('../storage');

beforeEach(() => localStorage.clear());

describe('weight storage', () => {
  test('getWeight returns default when no data stored', () => {
    const w = getWeight('Bench Press', 0);
    expect(w).toEqual({ type: 'kg', value: '', plateWeight: '' });
  });

  test('setWeight and getWeight round-trip', () => {
    setWeight('Bench Press', 0, { type: 'plates', value: 3, plateWeight: 10 });
    expect(getWeight('Bench Press', 0)).toEqual({ type: 'plates', value: 3, plateWeight: 10 });
  });

  test('different gyms stored independently', () => {
    setWeight('Squat', 0, { type: 'plates', value: 4, plateWeight: '' });
    setWeight('Squat', 1, { type: 'kg', value: 40, plateWeight: '' });
    expect(getWeight('Squat', 0).value).toBe(4);
    expect(getWeight('Squat', 1).value).toBe(40);
  });

  test('different exercises stored independently', () => {
    setWeight('Bench Press', 0, { type: 'kg', value: 60, plateWeight: '' });
    setWeight('Squat', 0, { type: 'kg', value: 80, plateWeight: '' });
    expect(getWeight('Bench Press', 0).value).toBe(60);
    expect(getWeight('Squat', 0).value).toBe(80);
  });

  test('getWeight returns default when stored value is corrupted JSON', () => {
    localStorage.setItem('weight__Bench Press__0', 'NOT_VALID_JSON{{{');
    expect(getWeight('Bench Press', 0)).toEqual({ type: 'kg', value: '', plateWeight: '' });
  });
});

describe('sync queue', () => {
  test('getSyncQueue returns empty array when nothing queued', () => {
    expect(getSyncQueue()).toEqual([]);
  });

  test('addToSyncQueue appends items', () => {
    addToSyncQueue({ type: 'session', date: '2026-04-14' });
    addToSyncQueue({ type: 'exercise', exercise: 'Squat' });
    expect(getSyncQueue().length).toBe(2);
  });

  test('clearSyncQueue empties the queue', () => {
    addToSyncQueue({ type: 'session' });
    clearSyncQueue();
    expect(getSyncQueue()).toEqual([]);
  });
});

describe('last session', () => {
  test('getLastSession returns null when nothing stored', () => {
    expect(getLastSession()).toBeNull();
  });

  test('setLastSession and getLastSession round-trip', () => {
    setLastSession({ date: '2026-04-14', day: 'A' });
    expect(getLastSession()).toEqual({ date: '2026-04-14', day: 'A' });
  });
});
