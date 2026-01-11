import { Response } from 'express';
import { CalendarService } from '../services/calendarService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const calendarService = new CalendarService();

export const getCalendarEvents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const { start, end } = req.query;
        if (!start || !end) {
            res.status(400).json({ error: 'Start and end dates are required' });
            return;
        }

        const events = await calendarService.getCalendarEvents(req.user.id, start as string, end as string);
        res.json(events);
    } catch (error: any) {
        console.error('Error in getCalendarEvents:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
