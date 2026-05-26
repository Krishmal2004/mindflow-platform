import { Response } from 'express';
import { ProfileService } from '../services/profileService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const profileService = new ProfileService();

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const profile = await profileService.getProfile(req.user.id);
        res.json({ ...profile, email: req.user.email || null });
    } catch (error: any) {
        console.error('getProfile:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const getAboutMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const data = await profileService.getAboutMe(req.user.id);
        res.json(data);
    } catch (error: any) {
        console.error('getAboutMe:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const updateAboutMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const result = await profileService.updateAboutMe(req.user.id, req.body);
        res.json(result);
    } catch (error: any) {
        console.error('updateAboutMe:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
