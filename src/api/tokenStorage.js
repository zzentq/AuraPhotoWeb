/**
 * Хранилище токенов.
 * Документация рекомендует sessionStorage в Telegram iOS (localStorage
 * может очищаться), но вне Telegram sessionStorage обнулится на F5,
 * что неудобно в dev. Поэтому используем оба: sessionStorage как основное,
 * localStorage как резерв.
 */

const ACCESS_KEY = 'ap_access';
const REFRESH_KEY = 'ap_refresh';

function safeGet(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage, key, value) {
  try {
    if (value == null) storage.removeItem(key);
    else storage.setItem(key, value);
  } catch {
    /* quota / disabled */
  }
}

function readBoth(key) {
  return safeGet(sessionStorage, key) || safeGet(localStorage, key);
}

function writeBoth(key, value) {
  safeSet(sessionStorage, key, value);
  safeSet(localStorage, key, value);
}

export const tokenStorage = {
  getAccess: () => readBoth(ACCESS_KEY),
  getRefresh: () => readBoth(REFRESH_KEY),
  setTokens: (access, refresh) => {
    writeBoth(ACCESS_KEY, access);
    writeBoth(REFRESH_KEY, refresh);
  },
  clear: () => {
    writeBoth(ACCESS_KEY, null);
    writeBoth(REFRESH_KEY, null);
  },
};
