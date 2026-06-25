import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type UserMap = Map<string, string>;
export type GroupMap = Map<string, 'cg' | 'ex' | null>;

export interface ProfileEntry {
    id: string;
    username: string;
    research_id: string;
}

export function useUserMap() {
    const [userMap, setUserMap] = useState<UserMap>(new Map());
    const [groupMap, setGroupMap] = useState<GroupMap>(new Map());
    const [profilesList, setProfilesList] = useState<ProfileEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const loadUsers = async () => {
        try {
            const { data } = await supabase.from('profiles').select('id, username, research_id');
            const umap = new Map<string, string>();
            const gmap = new Map<string, 'cg' | 'ex' | null>();
            const list: ProfileEntry[] = [];
            (data || []).forEach((p) => {
                umap.set(p.id, p.username || p.id.slice(0, 8));
                const rid = (p.research_id || '').toLowerCase();
                gmap.set(p.id, rid.endsWith('.ex') ? 'ex' : rid.endsWith('.cg') ? 'cg' : null);
                list.push({ id: p.id, username: p.username || '', research_id: p.research_id || '' });
            });
            setUserMap(umap);
            setGroupMap(gmap);
            setProfilesList(list);
        } catch (err) {
            console.error('Failed to load user map:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadUsers(); }, []);

    const resolveUser = (userId: unknown): string => {
        if (!userId || typeof userId !== 'string') return String(userId ?? '-');
        return userMap.get(userId) ?? (userId.length > 8 ? userId.slice(0, 8) + '…' : userId);
    };

    const userInitial = (userId: unknown): string => {
        const name = resolveUser(userId);
        return name.charAt(0).toUpperCase() || 'U';
    };

    const findUserIdsByName = (query: string): string[] => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        const matches: string[] = [];
        userMap.forEach((name, id) => {
            if (name.toLowerCase().includes(q)) matches.push(id);
        });
        return matches;
    };

    return { userMap, groupMap, profilesList, resolveUser, userInitial, findUserIdsByName, loading, refreshUserMap: loadUsers };
}
