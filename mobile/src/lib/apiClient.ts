import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config/api';

const AUTH_TOKEN_KEY = 'authToken';

const DEFAULT_TTL_MS = 30_000;

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

export async function removeAuthToken(): Promise<void> {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}

export type ApiFetchOptions = RequestInit & {
    // Skip cache (e.g. after mutations)
    force?: boolean;
    ttlMs?: number;
};

// Cached fetch for GET requests; mutations should call clearApiCache() after success.
export async function apiFetch<T = unknown>(
    path: string,
    options: ApiFetchOptions = {}
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
