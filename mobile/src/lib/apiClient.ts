import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

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
    for (const key of cache.keys()) {
        if (key.startsWith(urlPrefix)) cache.delete(key);
    }
}

export async function getAuthToken(): Promise<string | null> {
    return AsyncStorage.getItem('authToken');
}

export type ApiFetchOptions = RequestInit & {
    /** Skip cache (e.g. after mutations) */
    force?: boolean;
    ttlMs?: number;
};

/**
 * Cached fetch for GET requests. Mutations should call clearApiCache() after success.
 */
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

/** Clear all auth-related storage keys */
export async function clearAuthStorage(): Promise<void> {
    await AsyncStorage.multiRemove([
        'authToken',
        'user',
        'isLoggedIn',
        'userName',
    ]);
    clearApiCache();
}
