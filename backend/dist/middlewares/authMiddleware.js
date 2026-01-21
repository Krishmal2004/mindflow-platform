"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireAuth = void 0;
const supabase_1 = require("../config/supabase");
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ error: 'Missing authorization header' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const { data: { user }, error } = await supabase_1.supabase.auth.getUser(token);
        if (error || !user) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        req.user = {
            id: user.id,
            email: user.email
        };
        next();
    }
    catch (error) {
        console.error('Auth Middleware Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.requireAuth = requireAuth;
const requireAdmin = async (req, res, next) => {
    // 1. Ensure user is authenticated first
    if (!req.user) {
        res.status(401).json({ error: 'Authentication required before admin check' });
        return;
    }
    const userId = req.user.id;
    try {
        // 2. Check strict 'admins' table
        const { data: admin, error } = await supabase_1.supabase
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
    }
    catch (error) {
        console.error('Admin Check Error:', error);
        res.status(500).json({ error: 'Internal server error during admin check' });
    }
};
exports.requireAdmin = requireAdmin;
