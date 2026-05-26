import { supabase } from './supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

class ApiClient {
    private async getHeaders() {
        const { data: { session } } = await supabase.auth.getSession();
        return {
            'Content-Type': 'application/json',
            'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
        };
    }

    private async request(endpoint: string, options: RequestInit = {}) {
        const headers = await this.getHeaders();
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                ...headers,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `Request failed with status ${response.status}`);
        }

        return response.json();
    }

    async get(endpoint: string) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint: string, body: any) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    // Dashboard
    async getDashboardSummary() {
        return this.get('/dashboard/summary');
    }

    // Roadmap - Daily
    async getDailyStatus() {
        return this.get('/roadmap/daily/status');
    }

    async submitDailyEntry(data: {
        mindfulness_practice?: 'yes' | 'no' | null;
        practice_duration?: number | null;
        practice_log?: string | null;
        stress_level: number;
        mood: number;
        sleep_quality: number;
        relaxation_level: number;
        sleep_start_time: string;
        wake_up_time: string;
        feelings: string;
    }) {
        return this.post('/roadmap/daily', data);
    }

    async updateVideoProgress(seconds: number) {
        return this.post('/roadmap/daily/video-progress', { seconds });
    }

    // Roadmap - Weekly
    async getWeeklyStatus() {
        return this.get('/roadmap/weekly/status');
    }

    async getWeeklyVideo() {
        return this.get('/roadmap/weekly/video');
    }

    async submitWeeklyEntry(data: any) {
        return this.post('/roadmap/weekly', data);
    }

    async uploadWeeklyAudio(formData: FormData) {
        const response = await fetch(`${API_BASE_URL}/roadmap/weekly/upload`, {
            method: 'POST',
            headers: {
                // Don't set Content-Type for FormData, browser sets it with boundary
                'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || `Upload failed with status ${response.status}`);
        }

        return response.json();
    }

    // Roadmap - Questionnaire
    async getActiveQuestionnaire() {
        return this.get('/roadmap/questionnaire/active');
    }

    async getQuestionnaireStatus() {
        return this.get('/roadmap/questionnaire/status');
    }

    async submitQuestionnaire(data: any) {
        return this.post('/roadmap/questionnaire/submit', data);
    }

    // Calendar
    async getCalendarEvents(start: string, end: string) {
        return this.get(`/roadmap/calendar/events?start=${start}&end=${end}`);
    }
}

export const api = new ApiClient();
