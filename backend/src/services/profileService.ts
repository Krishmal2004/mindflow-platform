import { supabase } from '../config/supabase';

/** Allowed fields for about_me_profiles upsert (matches DB schema). */
const ABOUT_ME_FIELDS = [
    'university_id', 'education_level', 'faculty', 'major_field_of_study', 'age',
    'living_situation', 'family_background', 'cultural_background',
    'hobbies_interests', 'personal_goals', 'why_mindflow',
    'is_completed',
] as const;

export class ProfileService {
    /** Fetch user profile (username + research ID). */
    public async getProfile(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('username, research_id')
            .eq('id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        return {
            username: data?.username || null,
            research_id: data?.research_id || null,
        };
    }

    /** Fetch extended profile from about_me_profiles. */
    public async getAboutMe(userId: string) {
        const { data, error } = await supabase
            .from('about_me_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        // The row is normally auto-created by the handle_new_user_about_me trigger on
        // signup, but if it hasn't landed yet (or predates the trigger), returning bare
        // `null` here is dangerous: postAuthRoute on the client does `data && !data.is_completed`,
        // and a null body fails that check and is treated as "onboarding complete", letting a
        // brand-new user straight into the main app. Return the same default shape instead.
        if (!data) {
            return {
                id: userId,
                university_id: null,
                education_level: null,
                faculty: null,
                major_field_of_study: null,
                age: null,
                living_situation: null,
                family_background: null,
                cultural_background: null,
                hobbies_interests: null,
                personal_goals: null,
                why_mindflow: null,
                is_completed: false,
            };
        }
        return data;
    }

    /** Upsert about_me_profiles with allowlisted fields only. */
    public async updateAboutMe(userId: string, body: Record<string, any>) {
        const updateData: Record<string, any> = {};
        for (const field of ABOUT_ME_FIELDS) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        const { data, error } = await supabase
            .from('about_me_profiles')
            .upsert({
                id: userId,
                ...updateData,
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}
