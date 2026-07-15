import { apiFetch } from './apiClient';

// Routes to AboutMe if incomplete, else MainTabs; defaults to MainTabs on failure so a backend hiccup doesn't lock anyone out.
export async function getPostAuthRoute(): Promise<'MainTabs' | 'AboutMe'> {
    try {
        const { ok, data } = await apiFetch<{ is_completed?: boolean } | null>('/api/profile/about-me', { force: true });
        if (ok && data && !data.is_completed) {
            return 'AboutMe';
        }
    } catch {
        // ignore — fall through to MainTabs
    }
    return 'MainTabs';
}
