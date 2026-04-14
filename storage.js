function _weightKey(exerciseName, gymIndex) {
  return `weight__${exerciseName}__${gymIndex}`;
}

function getWeight(exerciseName, gymIndex) {
  const raw = localStorage.getItem(_weightKey(exerciseName, gymIndex));
  if (!raw) return { type: 'kg', value: '', plateWeight: '' };
  return JSON.parse(raw);
}

function setWeight(exerciseName, gymIndex, data) {
  localStorage.setItem(_weightKey(exerciseName, gymIndex), JSON.stringify(data));
}

function getSyncQueue() {
  const raw = localStorage.getItem('sync_queue');
  return raw ? JSON.parse(raw) : [];
}

function addToSyncQueue(payload) {
  const queue = getSyncQueue();
  queue.push(payload);
  localStorage.setItem('sync_queue', JSON.stringify(queue));
}

function clearSyncQueue() {
  localStorage.removeItem('sync_queue');
}

function getLastSession() {
  const raw = localStorage.getItem('last_session');
  return raw ? JSON.parse(raw) : null;
}

function setLastSession(data) {
  localStorage.setItem('last_session', JSON.stringify(data));
}

if (typeof module !== 'undefined') {
  module.exports = { getWeight, setWeight, getSyncQueue, addToSyncQueue, clearSyncQueue, getLastSession, setLastSession };
}
