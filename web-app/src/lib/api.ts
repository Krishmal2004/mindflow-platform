import { getAuthToken } from './auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class ApiClient {
  private async getHeaders(): Promise<HeadersInit> {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = await this.getHeaders();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: { ...(headers as Record<string, string>), ...(options.headers as Record<string, string> | undefined) },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' })) as { error?: string };
      throw new Error(err.error || `Request failed ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  get<T = unknown>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  post<T = unknown>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) });
  }

  // Dashboard
  getDashboardSummary() { return this.get('/api/dashboard/summary'); }

  // Journey status
  getJourneyStatus() { return this.get('/api/journey/status'); }

  // Profile
  getProfile() { return this.get('/api/profile'); }
  getAboutMe() { return this.get('/api/profile/about-me'); }
  submitAboutMe(data: Record<string, unknown>) { return this.post('/api/profile/about-me', data); }

  // Daily Sliders
  getDailyStatus() { return this.get('/api/roadmap/daily/status'); }
  submitDaily(data: Record<string, unknown>) { return this.post('/api/roadmap/daily', data); }
  updateVideoProgress(seconds: number) { return this.post('/api/roadmap/daily/video-progress', { seconds }); }

  // Weekly Whispers
  getWeeklyStatus() { return this.get('/api/roadmap/weekly/status'); }
  getWeeklyVideo() { return this.get('/api/roadmap/weekly/video'); }
  submitWeekly(data: Record<string, unknown>) { return this.post('/api/roadmap/weekly', data); }

  async uploadWeeklyAudio(formData: FormData): Promise<{ fileKey: string; fileUrl: string }> {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/api/roadmap/weekly/upload`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(e.error || 'Upload failed');
    }
    return res.json() as Promise<{ fileKey: string; fileUrl: string }>;
  }

  // Thrive Tracker (WEMWBS-14)
  getThriveStatus() { return this.get('/api/roadmap/thrive/status'); }
  submitThrive(data: Record<string, unknown>) { return this.post('/api/roadmap/thrive', data); }

  // Stress Snapshot (PSS-10)
  getStressStatus() { return this.get('/api/roadmap/stress/status'); }
  submitStress(data: Record<string, unknown>) { return this.post('/api/roadmap/stress', data); }

  // Mindful Mirror (FFMQ-15)
  getMindfulStatus() { return this.get('/api/roadmap/mindful/status'); }
  submitMindful(data: Record<string, unknown>) { return this.post('/api/roadmap/mindful', data); }

  // Calendar
  getCalendarEvents(start: string, end: string) {
    return this.get(`/api/calendar/events?start=${start}&end=${end}`);
  }

  // Journey history
  getJourneyHistory(limit = 90) {
    return this.get(`/api/journey?limit=${limit}`);
  }
}

export const api = new ApiClient();
