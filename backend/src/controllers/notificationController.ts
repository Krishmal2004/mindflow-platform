import { Response } from 'express';
import { z } from 'zod';
import { NotificationService } from '../services/notificationService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const notificationService = new NotificationService();

const registerTokenSchema = z.object({
    token: z.string().min(1),
    platform: z.enum(['ios', 'android', 'web']).optional(),
});

const unregisterTokenSchema = z.object({
    token: z.string().min(1),
});

export const registerPushToken = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const validation = registerTokenSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'A valid Expo push token is required' });
            return;
        }

        const result = await notificationService.registerToken(req.user.id, validation.data.token, validation.data.platform);
        res.json(result);
    } catch (error: any) {
        console.error('registerPushToken:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const unregisterPushToken = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const validation = unregisterTokenSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'token is required' });
            return;
        }

        const result = await notificationService.removeToken(validation.data.token);
        res.json(result);
    } catch (error: any) {
        console.error('unregisterPushToken:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
