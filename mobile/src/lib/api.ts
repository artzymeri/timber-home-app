import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Multiple candidate URLs are supported via `EXPO_PUBLIC_API_URLS` (comma-
// separated) for the common dev case where the laptop sits on more than one
// LAN — switching between home and office Wi-Fi changes the Mac's IP without
// touching the bundle. The first candidate that responds to /api/health wins
// and gets sticky-cached.
const RAW_URLS = process.env.EXPO_PUBLIC_API_URLS ?? process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
export const API_CANDIDATES = RAW_URLS
  .split(',')
  .map((s) => s.trim().replace(/\/+$/, ''))
  .filter(Boolean);

export const TOKEN_KEY = 'tt_token';
const BASE_KEY = 'tt_api_base';
const PROBE_TIMEOUT_MS = 2000;

let cachedToken: string | null | undefined;
let resolvedBase: string | null = null;
// Hold one in-flight probe so concurrent first requests don't ping the
// candidates N times.
let resolvingPromise: Promise<string> | null = null;

export async function getToken(): Promise<string | null> {
  if (cachedToken !== undefined) return cachedToken;
  cachedToken = (await SecureStore.getItemAsync(TOKEN_KEY)) ?? null;
  return cachedToken;
}

export async function setToken(token: string | null): Promise<void> {
  cachedToken = token;
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function probe(url: string): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(`${url}/api/health`, { signal: ctrl.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function getApiBase(): Promise<string> {
  if (resolvedBase) return resolvedBase;
  if (resolvingPromise) return resolvingPromise;

  resolvingPromise = (async () => {
    // Prefer whichever URL worked last time, falling back to the candidate list
    // in env order.
    const cached = await AsyncStorage.getItem(BASE_KEY).catch(() => null);
    const ordered = cached
      ? [cached, ...API_CANDIDATES.filter((c) => c !== cached)]
      : API_CANDIDATES;

    for (const url of ordered) {
      if (await probe(url)) {
        resolvedBase = url;
        AsyncStorage.setItem(BASE_KEY, url).catch(() => {});
        return url;
      }
    }
    // None reachable — fall through to the first candidate so the actual
    // request fails with a real error message instead of a generic timeout.
    resolvedBase = ordered[0] ?? 'http://localhost:4000';
    return resolvedBase;
  })();

  try {
    return await resolvingPromise;
  } finally {
    resolvingPromise = null;
  }
}

/** Force the next request to re-probe (used after a network error). */
export function invalidateApiBase(): void {
  resolvedBase = null;
}

async function fetchWith(base: string, path: string, init: RequestInit, headers: Record<string, string>): Promise<Response> {
  return fetch(`${base}${path}`, { ...init, headers });
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...((init.headers as Record<string, string>) || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  // FormData uploads must let fetch set the boundary itself.
  if (!(init.body instanceof FormData) && init.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let base = await getApiBase();
  let res: Response;
  try {
    res = await fetchWith(base, path, init, headers);
  } catch (err) {
    // Network failure (Wi-Fi switched, server moved). Invalidate and try once
    // more with a freshly probed base.
    if (API_CANDIDATES.length > 1) {
      invalidateApiBase();
      base = await getApiBase();
      res = await fetchWith(base, path, init, headers);
    } else {
      throw err;
    }
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
    } catch {}
    if (res.status === 401) {
      await setToken(null);
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Backwards-compat: kept exported but defers to the resolved base. */
export const API_BASE = API_CANDIDATES[0] ?? 'http://localhost:4000';
