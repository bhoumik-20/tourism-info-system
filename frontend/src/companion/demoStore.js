import { createInitialState, DEMO_VERSION, STORAGE_KEY } from "./demoData.js";

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadDemoState() {
  const storage = getStorage();
  if (!storage) return createInitialState();
  try {
    const saved = JSON.parse(storage.getItem(STORAGE_KEY) || "null");
    if (
      saved?.version === DEMO_VERSION &&
      Array.isArray(saved.users) &&
      Array.isArray(saved.cities) &&
      Array.isArray(saved.pois) &&
      Array.isArray(saved.reviews) &&
      Array.isArray(saved.trips) &&
      Array.isArray(saved.itineraries)
    ) {
      return saved;
    }
  } catch {
    // Invalid or unavailable browser data falls back to the sample records.
  }
  return createInitialState();
}

export function persistDemoState(state) {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function resetDemoState() {
  const storage = getStorage();
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    // The current in-memory session can still continue.
  }
  return createInitialState();
}

export function nextPartialNumber(records, userId, field) {
  return (
    records
      .filter((record) => Number(record.userId) === Number(userId))
      .reduce((max, record) => Math.max(max, Number(record[field]) || 0), 0) + 1
  );
}
