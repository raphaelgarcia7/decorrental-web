const TOKEN_KEY = "decorental.token";

export const getToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = (): void => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(TOKEN_KEY);
};

export const parseJwt = <T = Record<string, unknown>>(token: string): T | null => {
  try {
    const payload = token.split(".")[1];
    const decoded = window.atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
};
