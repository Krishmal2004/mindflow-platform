import { apiFetch } from './apiClient';

/**
 * Where to send a user right after authenticating. Members must complete the
 * About Me questionnaire before reaching the main app; defaults to MainTabs
 * if the check fails so a backend hiccup doesn't lock anyone out.
 */
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
