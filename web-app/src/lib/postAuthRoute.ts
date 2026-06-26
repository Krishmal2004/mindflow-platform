import { getAuthToken } from './auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export async function getPostAuthRoute(): Promise<string> {
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/api/profile/about-me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return '/dashboard';
    const data = await res.json() as { is_completed?: boolean };
    return data.is_completed === false ? '/about-me' : '/dashboard';
  } catch {
    return '/dashboard';
  }
}
