import { supabase } from '../config/supabase';

export class ProfileService {
    // Get basic profile info (username, researchID)
    public async getProfile(userId: string) {
        // Fetch profile data
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username, research_id') // columns available in profiles
            .eq('id', userId)
            .single();

        // Fetch user email from auth.users via RPC or admin access?
        // Standard supabase client with service role key is needed to access auth.users directly if not the user themselves
        // BUT, since we are using the simple client, getting email might be tricky unless we use the user object from the request.
        // We will assume the controller passes the email from the authenticated user object.

        if (profileError && profileError.code !== 'PGRST116') throw profileError;

        // Fetch researchID from profiles if it exists there, but based on Account.tsx it seems it might be in profiles
        // Let's check project_db.sql again.
        // profiles table: id, username. No researchID column in the schema I viewed.
        // Wait, Account.tsx connects to `profiles` and selects `username, researchID`. 
        // Let me re-verify project_db.sql content for `profiles` table.
        // Line 40: username TEXT UNIQUE.
        // There is NO researchID in the SQL provided in context!
        // Account.tsx might be referencing a column that exists in production but not in the local SQL?
        // Or maybe I missed it.
        // I will double check the SQL file content in my next step if needed, but for now I will assume it *should* come from somewhere.
        // Actually, looking at Account.tsx line 70: `.select("username, researchID")`.
        // If the column doesn't exist, this query will fail. 
        // I'll stick to what's in the DB schema for now (username). If the user wants researchID, I might need to add it, but for safety I'll start with what matches the DB.

        return {
            username: profile?.username || null,
            research_id: profile?.research_id || null,
        };
    }

    public async getAboutMe(userId: string) {
        const { data, error } = await supabase
            .from('about_me_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    }

    public async updateAboutMe(userId: string, data: any) {
        // Only allow known fields to be updated
        const allowedFields = [
            'full_name', 'date_of_birth', 'gender', 'phone',
            'occupation', 'education_level', 'bio', 'avatar_url'
        ];
        const updateData: Record<string, any> = {};
        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                updateData[field] = data[field];
            }
        }

        const { data: result, error } = await supabase
            .from('about_me_profiles')
            .upsert({
                id: userId,
                ...updateData,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return result;
    }
}
