import '@testing-library/jest-dom';

// In-memory mock localStorage for Vitest
const storageMap = new Map<string, string>();

const localStorageMock = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, value: string) => storageMap.set(key, value),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
  get length() {
    return storageMap.size;
  },
  key: (index: number) => Array.from(storageMap.keys())[index] || null,
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});
