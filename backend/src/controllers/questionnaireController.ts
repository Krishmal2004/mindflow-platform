import { Response } from 'express';
import { z } from 'zod';
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

const submissionSchema = z.object({
    questionSetId: z.number().int().positive(),
    timeToComplete: z.number().nonnegative(),
    answers: z.array(z.object({
        questionId: z.number().int().positive(),
        value: z.union([z.string(), z.number()])
    })).nonempty()
});

export const submitQuestionnaire = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.id) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        // Validate Input
        const validation = submissionSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Invalid submission data', details: validation.error.issues });
            return;
        }

        const result = await questionnaireService.submitQuestionnaire(req.user.id, validation.data);
        res.json(result);
    } catch (error: any) {
        console.error('Error in submitQuestionnaire:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
