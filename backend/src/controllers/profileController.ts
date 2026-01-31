import { Response } from 'express';
import { ProfileService } from '../services/profileService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const profileService = new ProfileService();

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        // req.user might contain email if populate by middleware, otherwise we might need to fetch it
        // basic auth middleware usually sets the user object.
        // If we need email, we can try to pass it from req.user if available.
        const profile = await profileService.getProfile(req.user.id);

        // Merge email from req.user if available (depends on auth middleware implementation)
        const email = req.user.email || null;

        res.json({ ...profile, email });
    } catch (error: any) {
        console.error('Error in getProfile:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const getAboutMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const data = await profileService.getAboutMe(req.user.id);
        res.json(data);
    } catch (error: any) {
        console.error('Error in getAboutMe:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const updateAboutMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const result = await profileService.updateAboutMe(req.user.id, req.body);
        res.json(result);
    } catch (error: any) {
        console.error('Error in updateAboutMe:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
