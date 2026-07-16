import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config/api';

const AUTH_TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

const DEFAULT_TTL_MS = 30_000;

// Fired when the refresh token itself is invalid/revoked (not just an expired access
// token, which apiFetch recovers from silently) — the only case that should ever force
// a participant back to the login screen mid-session. AppNavigator subscribes to reset
// the stack; kept as a plain pub/sub (not a React import) so this module has no
// dependency on the navigation tree.
type SessionExpiredListener = () => void;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

export function onSessionExpired(listener: SessionExpiredListener): () => void {
    sessionExpiredListeners.add(listener);
    return () => sessionExpiredListeners.delete(listener);
}

function notifySessionExpired(): void {
    sessionExpiredListeners.forEach((listener) => listener());
}

type CacheEntry = { data: unknown; expiresAt: number };

const cache = new Map<string, CacheEntry>();

function cacheKey(url: string, token: string | null): string {
    return `${url}::${token ?? ''}`;
}

export function clearApiCache(urlPrefix?: string): void {
    if (!urlPrefix) {
        cache.clear();
        return;
    }
    // Cache keys are built from the full URL (API_URL + path), so a path-style prefix like
    // '/api/journey' must be resolved the same way before matching, or it never hits.
    const fullPrefix = urlPrefix.startsWith('http') ? urlPrefix : `${API_URL}${urlPrefix}`;
    for (const key of cache.keys()) {
        if (key.startsWith(fullPrefix)) cache.delete(key);
    }
}

// Session tokens live in SecureStore (Keychain/Keystore-backed), not AsyncStorage, which is plain unencrypted disk storage.
export async function getAuthToken(): Promise<string | null> {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    if (token) return token;

    // One-time migration for sessions established before this switch to SecureStore.
    const legacyToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (legacyToken) {
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, legacyToken);
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        return legacyToken;
    }
    return null;
}

export async function setAuthToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

async function getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

// Persists both halves of a Supabase session. The refresh_token is what lets the app
// stay signed in across days without re-prompting for a password — only losing it
// (explicit sign-out, or the device/app data being wiped) should require a fresh login.
export async function setSession(session: { access_token: string; refresh_token?: string }): Promise<void> {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, session.access_token);
    if (session.refresh_token) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refresh_token);
    }
}

export async function removeAuthToken(): Promise<void> {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}

// Exchanges the stored refresh_token for a new access_token via the backend. Concurrent
// callers (several requests 401'ing around the same moment) share one in-flight refresh
// instead of each racing Supabase's token-rotation endpoint.
let refreshInFlight: Promise<string | null> | null = null;

async function performTokenRefresh(): Promise<string | null> {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    try {
        const response = await fetch(`${API_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!response.ok) return null;

        const body = await response.json();
        if (!body?.session?.access_token) return null;

        await setSession(body.session);
        return body.session.access_token as string;
    } catch {
        return null;
    }
}

function refreshAccessTokenOnce(): Promise<string | null> {
    if (!refreshInFlight) {
        refreshInFlight = performTokenRefresh().finally(() => {
            refreshInFlight = null;
        });
    }
    return refreshInFlight;
}

export type ApiFetchOptions = RequestInit & {
    // Skip cache (e.g. after mutations)
    force?: boolean;
    ttlMs?: number;
};

// Cached fetch for GET requests; mutations should call clearApiCache() after success.
export async function apiFetch<T = unknown>(
    path: string,
    options: ApiFetchOptions = {},
    _isRetry = false
): Promise<{ ok: boolean; status: number; data: T | null }> {
    const { force = false, ttlMs = DEFAULT_TTL_MS, ...init } = options;
    const url = path.startsWith('http') ? path : `${API_URL}${path}`;
    const token = await getAuthToken();
    const method = (init.method ?? 'GET').toUpperCase();
    const key = cacheKey(url, token);

    if (method === 'GET' && !force) {
        const hit = cache.get(key);
        if (hit && Date.now() < hit.expiresAt) {
            return { ok: true, status: 200, data: hit.data as T };
        }
    }

    const headers: Record<string, string> = {
        ...(init.headers as Record<string, string>),
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (init.body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, { ...init, headers });

    // A 401 on a request that carried a token means the access token expired (it's
    // short-lived by design), not that the user is logged out — try one silent refresh
    // before giving up. Only a failed refresh (invalid/revoked refresh_token) is a real
    // session end.
    if (response.status === 401 && token && !_isRetry) {
        const newToken = await refreshAccessTokenOnce();
        if (newToken) {
            return apiFetch<T>(path, options, true);
        }
        await clearAuthStorage();
        notifySessionExpired();
    }

    let data: T | null = null;
    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (method === 'GET' && response.ok && data !== null) {
        cache.set(key, { data, expiresAt: Date.now() + ttlMs });
    }

    return { ok: response.ok, status: response.status, data };
}

// Clear all auth-related storage keys
export async function clearAuthStorage(): Promise<void> {
    await removeAuthToken();
    await AsyncStorage.multiRemove(['user', 'isLoggedIn', 'userName']);
    clearApiCache();
}
