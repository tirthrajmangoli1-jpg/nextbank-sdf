export const STORAGE_KEY = 'nextbank_store_v1';
export const CURRENT_SCHEMA_VERSION = 1;

// In-memory fallback if localStorage is disabled or throws
let memoryStorage: string | null = null;

export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__nb_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function readRawStorage(): string | null {
  if (isLocalStorageAvailable()) {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      console.warn('NextBank DB: Failed to read from localStorage, using memory storage', e);
      return memoryStorage;
    }
  }
  return memoryStorage;
}

export function writeRawStorage(data: string): void {
  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, data);
      // Dispatch a custom storage event for same-tab reactive listeners
      window.dispatchEvent(
        new CustomEvent('nextbank-storage-change', { detail: { timestamp: Date.now() } })
      );
      return;
    } catch (e) {
      console.warn('NextBank DB: Failed to write to localStorage (quota or error), falling back to memory', e);
    }
  }
  memoryStorage = data;
}

export function clearStorage(): void {
  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(
        new CustomEvent('nextbank-storage-change', { detail: { timestamp: Date.now() } })
      );
    } catch (e) {
      console.warn('NextBank DB: Failed to clear localStorage', e);
    }
  }
  memoryStorage = null;
}

export function subscribeStorageChanges(callback: () => void): () => void {
  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      callback();
    }
  };

  const handleCustomEvent = () => {
    callback();
  };

  window.addEventListener('storage', handleStorageEvent);
  window.addEventListener('nextbank-storage-change', handleCustomEvent);

  return () => {
    window.removeEventListener('storage', handleStorageEvent);
    window.removeEventListener('nextbank-storage-change', handleCustomEvent);
  };
}
