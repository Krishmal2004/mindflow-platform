import { mockResponse } from './helpers/supabaseMock';

const getDailyStatus = jest.fn();
const getWeeklyStatus = jest.fn();
const getThriveStatus = jest.fn();
const getStressStatus = jest.fn();
const getMindfulStatus = jest.fn();

jest.mock('../src/services/dailyService', () => ({ DailyService: jest.fn(() => ({ getDailyStatus })) }));
jest.mock('../src/services/weeklyService', () => ({ WeeklyService: jest.fn(() => ({ getWeeklyStatus })) }));
jest.mock('../src/services/thriveService', () => ({ ThriveService: jest.fn(() => ({ getThriveStatus })) }));
jest.mock('../src/services/stressService', () => ({ StressService: jest.fn(() => ({ getStressStatus })) }));
jest.mock('../src/services/mindfulService', () => ({ MindfulService: jest.fn(() => ({ getMindfulStatus })) }));

import { getJourneyStatus } from '../src/controllers/journeyController';

describe('getJourneyStatus fault tolerance', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('still returns 200 with the other four statuses when one roadmap service throws', async () => {
        getDailyStatus.mockResolvedValue({ completed: true, nextReset: null });
        getWeeklyStatus.mockResolvedValue({ completed: false, nextReset: null });
        getThriveStatus.mockRejectedValue(new Error('transient Supabase error'));
        getStressStatus.mockResolvedValue({ completed: false, nextReset: null });
        getMindfulStatus.mockResolvedValue({ completed: false, nextReset: null });

        const req: any = { user: { id: 'user-1' } };
        const res = mockResponse();

        await getJourneyStatus(req, res);

        expect(res.status).not.toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            daily: { completed: true, nextReset: null },
            weekly: { completed: false, nextReset: null },
            thrive: { completed: false, nextReset: null, error: true },
            stress: { completed: false, nextReset: null },
            mindful: { completed: false, nextReset: null },
        });
    });

    it('returns all five statuses when every service resolves', async () => {
        getDailyStatus.mockResolvedValue({ completed: true, nextReset: null });
        getWeeklyStatus.mockResolvedValue({ completed: true, nextReset: null });
        getThriveStatus.mockResolvedValue({ completed: true, nextReset: null });
        getStressStatus.mockResolvedValue({ completed: true, nextReset: null });
        getMindfulStatus.mockResolvedValue({ completed: true, nextReset: null });

        const req: any = { user: { id: 'user-1' } };
        const res = mockResponse();

        await getJourneyStatus(req, res);

        expect(res.json).toHaveBeenCalledWith({
            daily: { completed: true, nextReset: null },
            weekly: { completed: true, nextReset: null },
            thrive: { completed: true, nextReset: null },
            stress: { completed: true, nextReset: null },
            mindful: { completed: true, nextReset: null },
        });
    });

    it('returns 401 when there is no authenticated user', async () => {
        const req: any = {};
        const res = mockResponse();

        await getJourneyStatus(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });
});
