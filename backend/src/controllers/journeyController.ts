import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
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

export const getJourneyStatus = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const [daily, weekly, thrive, stress, mindful] = await Promise.all([
            dailyService.getDailyStatus(userId),
            weeklyService.getWeeklyStatus(userId),
            thriveService.getThriveStatus(userId),
            stressService.getStressStatus(userId),
            mindfulService.getMindfulStatus(userId)
        ]);

        res.json({
            daily,
            weekly,
            thrive,
            stress,
            mindful
        });

    } catch (error) {
        console.error('Error in getJourneyStatus:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getJourneyData = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Parallel fetching for performance
        const [
            dailyRes,
            weeklyRes,
            pss10Res,
            ffmq15Res,
            wemwbs14Res
        ] = await Promise.all([
            supabase.from('daily_sliders').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('voice_recordings').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('questionnaire_pss10_responses').select('id, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('questionnaire_ffmq15_responses').select('id, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('questionnaire_wemwbs14_responses').select('id, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
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
                wemwbs14: wemwbs14Res.data || []
            }
        });

    } catch (error) {
        console.error('Error in getJourneyData:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
