import { Request, Response, NextFunction } from 'express';
import { supabase } from '../app';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email?: string;
    };
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({ error: 'Missing authorization header' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }

        (req as AuthenticatedRequest).user = {
            id: user.id,
            email: user.email
        };

        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // 1. Ensure user is authenticated first
    if (!(req as AuthenticatedRequest).user) {
        res.status(401).json({ error: 'Authentication required before admin check' });
        return;
    }

    const userId = (req as AuthenticatedRequest).user!.id;

    try {
        // 2. Check strict 'admins' table
        const { data: admin, error } = await supabase
            .from('admins')
            .select('id')
            .eq('id', userId)
            .single();

        if (error || !admin) {
            console.warn(`Unauthorized Admin Access Attempt by: ${userId}`);
            // Use 403 Forbidden for authorized users who lack permission
            res.status(403).json({ error: 'Forbidden: Admin Access Only' });
            return;
        }

        // 3. Allowed
        next();
    } catch (error) {
        console.error('Admin Check Error:', error);
        res.status(500).json({ error: 'Internal server error during admin check' });
    }
};
