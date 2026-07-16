import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type UserMap = Map<string, string>;
export type GroupMap = Map<string, 'cg' | 'ex' | null>;

export function useUserMap() {
    const [userMap, setUserMap] = useState<UserMap>(new Map());
    const [groupMap, setGroupMap] = useState<GroupMap>(new Map());

    const loadUsers = async () => {
        try {
            // Page through the full profiles table instead of one unbounded select (which
            // PostgREST silently caps at its configured max-rows) — otherwise username
            // resolution and group lookups silently drop participants once the study grows
            // past that limit.
            const PAGE_SIZE = 1000;
            const rows: { id: string; username: string | null; research_id: string | null }[] = [];
            for (let from = 0; ; from += PAGE_SIZE) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, username, research_id')
                    .range(from, from + PAGE_SIZE - 1);
                if (error) throw error;
                rows.push(...(data || []));
                if (!data || data.length < PAGE_SIZE) break;
            }

            const umap = new Map<string, string>();
            const gmap = new Map<string, 'cg' | 'ex' | null>();
            rows.forEach((p) => {
                umap.set(p.id, p.username || p.id.slice(0, 8));
                // null = unassigned, matching deriveResearchGroup on the backend (which
                // returns '' rather than defaulting to 'ex') and DashboardScreen's separate
                // isUnassigned "pending assignment" state on mobile — a missing/malformed
                // suffix is its own state, not silently treated as experimental.
                const rid = (p.research_id || '').toLowerCase();
                gmap.set(p.id, rid.endsWith('.ex') ? 'ex' : rid.endsWith('.cg') ? 'cg' : null);
            });
            setUserMap(umap);
            setGroupMap(gmap);
        } catch (err) {
            console.error('Failed to load user map:', err);
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

    return { userMap, groupMap, resolveUser, userInitial, findUserIdsByName, refreshUserMap: loadUsers };
}
