import { Response } from 'express';
import { z } from 'zod';
import { CalendarService } from '../services/calendarService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { CALENDAR_MAX_RANGE_DAYS } from '../constants/limits';

const calendarService = new CalendarService();

const dateQuerySchema = z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start must be YYYY-MM-DD'),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End must be YYYY-MM-DD'),
}).refine((data) => {
    const start = new Date(data.start);
    const end = new Date(data.end);
    if (end < start) return false;
    const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return days <= CALENDAR_MAX_RANGE_DAYS;
}, { message: `Date range must not exceed ${CALENDAR_MAX_RANGE_DAYS} days` });

export const getCalendarEvents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const validation = dateQuerySchema.safeParse(req.query);
        if (!validation.success) {
            res.status(400).json({ error: 'Start and end dates are required' });
            return;
        }

        const events = await calendarService.getCalendarEvents(req.user.id, validation.data.start, validation.data.end);
        res.json(events);
    } catch (error: any) {
        console.error('getCalendarEvents:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
