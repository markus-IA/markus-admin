const BASE_URL = 'https://api.markus.business';

const ls = {
  get: (k: string): string | null => { try { return window.localStorage.getItem(k) } catch { return null } },
  set: (k: string, v: string): void => { try { window.localStorage.setItem(k, v) } catch {} },
  del: (k: string): void => { try { window.localStorage.removeItem(k) } catch {} },
};

// Single in-flight refresh promise — prevents race condition with multiple tabs/requests
let refreshPromise: Promise<void> | null = null;

function getTokenExpiry(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000;
  } catch {
    return 0;
  }
}

async function doRefresh(): Promise<void> {
  const rt = ls.get('markus_rt');
  if (!rt) {
    clearTokens();
    throw new Error('no_refresh_token');
  }

  const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: rt }),
  });

  if (!res.ok) {
    clearTokens();
    throw new Error('refresh_failed');
  }

  const tokens = await res.json();
  ls.set('markus_at', tokens.access_token);
  ls.set('markus_rt', tokens.refresh_token);
}

function clearTokens() {
  ls.del('markus_at');
  ls.del('markus_rt');
  ls.del('markus_user');
}

function scheduleRedirectToLogin() {
  // Delay redirect so all in-flight promises can settle
  setTimeout(() => { window.location.href = '/login'; }, 100);
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  let at = ls.get('markus_at');

  // Proactive refresh: if token expires within 5 minutes, refresh before the request
  if (at) {
    const expiry = getTokenExpiry(at);
    if (expiry > 0 && Date.now() > expiry - 5 * 60 * 1000) {
      if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
      }
      try {
        await refreshPromise;
        at = ls.get('markus_at');
      } catch {
        // If proactive refresh fails due to network error, still try the request with old token
        // Only hard-fail if it's an auth error (no RT / refresh rejected)
        const noRt = !ls.get('markus_rt');
        if (noRt) {
          scheduleRedirectToLogin();
          throw new Error('Session expired');
        }
      }
    }
  }

  const headers = new Headers(options.headers || {});
  if (at) headers.set('Authorization', `Bearer ${at}`);

  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  let response = await fetch(url, { ...options, headers });

  // Token expired mid-request — refresh and retry once
  if (response.status === 401) {
    if (!refreshPromise) {
      refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
    }
    try {
      await refreshPromise;
    } catch {
      scheduleRedirectToLogin();
      throw new Error('Session expired');
    }

    const newAt = ls.get('markus_at');
    headers.set('Authorization', `Bearer ${newAt}`);
    response = await fetch(url, { ...options, headers });
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'API request failed');
  }

  return response.json();
}
