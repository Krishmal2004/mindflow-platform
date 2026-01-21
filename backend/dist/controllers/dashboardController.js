"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardSummary = void 0;
const dashboardService_1 = require("../services/dashboardService");
const dashboardService = new dashboardService_1.DashboardService();
const getDashboardSummary = async (req, res) => {
    try {
        const authReq = req;
        if (!authReq.user || !authReq.user.id) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const summary = await dashboardService.getUserSummary(authReq.user.id);
        res.json(summary);
    }
    catch (error) {
        console.error('Error in getDashboardSummary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getDashboardSummary = getDashboardSummary;
