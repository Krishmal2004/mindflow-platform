import { Response } from 'express';
import { z } from 'zod';
import { CalendarService } from '../services/calendarService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const calendarService = new CalendarService();

/** ISO date string format validation. */
const dateQuerySchema = z.object({
    start: z.string().min(1, 'Start date is required'),
    end: z.string().min(1, 'End date is required'),
});

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
