import { supabase } from '../config/supabase';

export class QuestionnaireService {
    public async getActiveQuestionnaire() {
        // Get the latest active question set
        const { data: questionSet, error: setError } = await supabase
            .from('main_question_sets')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (setError) throw setError;
        if (!questionSet) return null;

        // Get sections
        const { data: sections, error: secError } = await supabase
            .from('questionnaire_sections')
            .select('*')
            .eq('question_set_id', questionSet.id)
            .order('section_key');

        if (secError) throw secError;

        // Get questions
        const { data: questions, error: qError } = await supabase
            .from('main_questions')
            .select('*')
            .eq('question_set_id', questionSet.id)
            .order('sort_order');

        if (qError) throw qError;

        return {
            ...questionSet,
            sections,
            questions
        };
    }

    public async getQuestionnaireStatus(userId: string) {
        const questionSet = await this.getActiveQuestionnaire();
        if (!questionSet) return { status: 'unavailable' };

        // Check if submitted
        const { data: responses, error } = await supabase
            .from('main_questionnaire_responses')
            .select('id')
            .eq('user_id', userId)
            .eq('question_set_id', questionSet.id)
            .limit(1);

        if (error) throw error;

        return {
            status: responses && responses.length > 0 ? 'completed' : 'pending',
            questionSetId: questionSet.id
        };
    }

    public async submitQuestionnaire(userId: string, payload: { questionSetId: number, answers: any[], timeToComplete: number }) {
        // 1. Create Session
        const { data: session, error: sessionError } = await supabase
            .from('main_questionnaire_sessions')
            .insert({
                user_id: userId,
                question_set_id: payload.questionSetId,
                time_to_complete: payload.timeToComplete,
                started_at: new Date().toISOString() // accurately this should be passed from frontend
            })
            .select()
            .single();

        if (sessionError) throw sessionError;

        // 2. Insert Responses
        const responses = payload.answers.map(ans => ({
            session_id: session.id,
            user_id: userId,
            question_set_id: payload.questionSetId,
            question_id: ans.questionId,
            response_value: ans.value
        }));

        const { error: respError } = await supabase
            .from('main_questionnaire_responses')
            .insert(responses);

        if (respError) throw respError;

        return { success: true };
    }
}
