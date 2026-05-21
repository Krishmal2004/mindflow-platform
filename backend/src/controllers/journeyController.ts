import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { JOURNEY_DEFAULT_LIMIT, JOURNEY_MAX_LIMIT } from '../constants/limits';
import { DailyService } from '../services/dailyService';
import { WeeklyService } from '../services/weeklyService';
import { ThriveService } from '../services/thriveService';
import { StressService } from '../services/stressService';
import { MindfulService } from '../services/mindfulService';

const dailyService = new DailyService();
const weeklyService = new WeeklyService();
const thriveService = new ThriveService();
const stressService = new StressService();
const mindfulService = new MindfulService();

/** Aggregated status for all 5 journey steps. */
export const getJourneyStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const [daily, weekly, thrive, stress, mindful] = await Promise.all([
            dailyService.getDailyStatus(req.user.id),
            weeklyService.getWeeklyStatus(req.user.id),
            thriveService.getThriveStatus(req.user.id),
            stressService.getStressStatus(req.user.id),
            mindfulService.getMindfulStatus(req.user.id),
        ]);

        res.json({ daily, weekly, thrive, stress, mindful });
    } catch (error) {
        console.error('getJourneyStatus:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/** Full journey data for admin/web dashboard consumption. */
export const getJourneyData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const userId = req.user.id;
        const requested = parseInt(String(req.query.limit ?? JOURNEY_DEFAULT_LIMIT), 10);
        const limit = Number.isFinite(requested)
            ? Math.min(Math.max(requested, 1), JOURNEY_MAX_LIMIT)
            : JOURNEY_DEFAULT_LIMIT;

        const [dailyRes, weeklyRes, pss10Res, ffmq15Res, wemwbs14Res] = await Promise.all([
            supabase.from('daily_sliders').select('id, user_id, mood, stress_level, sleep_quality, relaxation_level, mindfulness_practice, feelings, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit),
            supabase.from('voice_recordings').select('id, user_id, week_number, year, file_url, duration, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit),
            supabase.from('questionnaire_pss10_responses').select('id, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit),
            supabase.from('questionnaire_ffmq15_responses').select('id, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit),
            supabase.from('questionnaire_wemwbs14_responses').select('id, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit),
        ]);

        if (dailyRes.error) throw dailyRes.error;
        if (weeklyRes.error) throw weeklyRes.error;
        if (pss10Res.error) throw pss10Res.error;
        if (ffmq15Res.error) throw ffmq15Res.error;
        if (wemwbs14Res.error) throw wemwbs14Res.error;

        res.json({
            daily: dailyRes.data || [],
            weekly: weeklyRes.data || [],
            research: {
                pss10: pss10Res.data || [],
                ffmq15: ffmq15Res.data || [],
                wemwbs14: wemwbs14Res.data || [],
            },
        });
    } catch (error) {
        console.error('getJourneyData:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
