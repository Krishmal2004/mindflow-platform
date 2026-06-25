import { mockResponse } from './helpers/supabaseMock';

const limitCalls: number[] = [];

function chainTrackingLimit() {
    const chain: any = {};
    for (const method of ['select', 'eq', 'order']) {
        chain[method] = jest.fn(() => chain);
    }
    chain.limit = jest.fn((n: number) => {
        limitCalls.push(n);
        return Promise.resolve({ data: [], error: null });
    });
    return chain;
}

const fromMock = jest.fn((_table: string) => chainTrackingLimit());
jest.mock('../src/config/supabase', () => ({ supabase: { from: (table: string) => fromMock(table) } }));

import { getJourneyData } from '../src/controllers/journeyController';
import { JOURNEY_DEFAULT_LIMIT, JOURNEY_MAX_LIMIT } from '../src/constants/limits';

describe('getJourneyData limit clamping', () => {
    beforeEach(() => {
        limitCalls.length = 0;
    });

    it('uses the default limit when none is provided', async () => {
        const req: any = { user: { id: 'user-1' }, query: {} };
        await getJourneyData(req, mockResponse());

        expect(limitCalls.length).toBeGreaterThan(0);
        expect(limitCalls.every((n) => n === JOURNEY_DEFAULT_LIMIT)).toBe(true);
    });

    it('clamps a limit above the maximum', async () => {
        const req: any = { user: { id: 'user-1' }, query: { limit: '99999' } };
        await getJourneyData(req, mockResponse());

        expect(limitCalls.every((n) => n === JOURNEY_MAX_LIMIT)).toBe(true);
    });

    it('clamps a limit below the minimum', async () => {
        const req: any = { user: { id: 'user-1' }, query: { limit: '-5' } };
        await getJourneyData(req, mockResponse());

        expect(limitCalls.every((n) => n === 1)).toBe(true);
    });

    it('falls back to the default for a non-numeric limit', async () => {
        const req: any = { user: { id: 'user-1' }, query: { limit: 'abc' } };
        await getJourneyData(req, mockResponse());

        expect(limitCalls.every((n) => n === JOURNEY_DEFAULT_LIMIT)).toBe(true);
    });

    it('returns 401 when there is no authenticated user', async () => {
        const req: any = { query: {} };
        const res = mockResponse();
        await getJourneyData(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });
});
