const DEFAULT_API_BASE_URL = 'http://localhost:8080';

export function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');
}

export function getTokenFromCookie() {
  if (typeof document === 'undefined') {
    return null;
  }

  const match = document.cookie.match(/(?:^|; )token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function apiFetch(path, options = {}) {
  const { auth = true, headers, ...init } = options;
  const requestHeaders = new Headers(headers || {});

  if (auth) {
    const token = getTokenFromCookie();
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  if (!requestHeaders.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  return fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: requestHeaders,
  });
}