import { Response } from 'express';
import { QuestionnaireService } from '../services/questionnaireService';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const questionnaireService = new QuestionnaireService();

export const getActiveQuestionnaire = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const questionnaire = await questionnaireService.getActiveQuestionnaire();
        res.json(questionnaire);
    } catch (error: any) {
        console.error('Error in getActiveQuestionnaire:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const getQuestionnaireStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const status = await questionnaireService.getQuestionnaireStatus(req.user.id);
        res.json(status);
    } catch (error: any) {
        console.error('Error in getQuestionnaireStatus:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const submitQuestionnaire = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const result = await questionnaireService.submitQuestionnaire(req.user.id, req.body);
        res.json(result);
    } catch (error: any) {
        console.error('Error in submitQuestionnaire:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
