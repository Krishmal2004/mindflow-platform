import { apiFetch } from '../apiClient';
import { getPostAuthRoute } from '../postAuthRoute';

jest.mock('../apiClient', () => ({ apiFetch: jest.fn() }));

const mockedApiFetch = apiFetch as jest.Mock;

describe('getPostAuthRoute', () => {
    it('routes to AboutMe when the questionnaire is not completed', async () => {
        mockedApiFetch.mockResolvedValue({ ok: true, status: 200, data: { is_completed: false } });

        await expect(getPostAuthRoute()).resolves.toBe('AboutMe');
    });

    it('routes to MainTabs when the questionnaire is completed', async () => {
        mockedApiFetch.mockResolvedValue({ ok: true, status: 200, data: { is_completed: true } });

        await expect(getPostAuthRoute()).resolves.toBe('MainTabs');
    });

    it('routes to MainTabs when the request fails (fail-open)', async () => {
        mockedApiFetch.mockResolvedValue({ ok: false, status: 500, data: null });

        await expect(getPostAuthRoute()).resolves.toBe('MainTabs');
    });

    it('routes to MainTabs when the request throws', async () => {
        mockedApiFetch.mockRejectedValue(new Error('network error'));

        await expect(getPostAuthRoute()).resolves.toBe('MainTabs');
    });
});
