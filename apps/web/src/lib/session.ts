const SESSION_STORAGE_KEY = 'gitlaw.session.address';
const SESSION_TOKEN_STORAGE_KEY = 'gitlaw.session.token';

function getStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

export function getStoredSessionAddress() {
  return getStorage()?.getItem(SESSION_STORAGE_KEY) ?? null;
}

export function setStoredSessionAddress(address: string | null) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  if (!address) {
    storage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  storage.setItem(SESSION_STORAGE_KEY, address);
}

export function getStoredSessionToken() {
  return getStorage()?.getItem(SESSION_TOKEN_STORAGE_KEY) ?? null;
}

export function setStoredSessionToken(token: string | null) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  if (!token) {
    storage.removeItem(SESSION_TOKEN_STORAGE_KEY);
    return;
  }

  storage.setItem(SESSION_TOKEN_STORAGE_KEY, token);
}

export function clearStoredSession() {
  setStoredSessionAddress(null);
  setStoredSessionToken(null);
}
