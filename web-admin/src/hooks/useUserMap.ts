import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

/** Maps userId → username for display throughout the admin panel. */
export type UserMap = Map<string, string>;

export function useUserMap() {
    const [userMap, setUserMap] = useState<UserMap>(new Map());
    const [loading, setLoading] = useState(true);

    const loadUsers = async () => {
        try {
            const { data } = await supabase.from('profiles').select('id, username');
            const map = new Map<string, string>();
            (data || []).forEach((p) => map.set(p.id, p.username || p.id.slice(0, 8)));
            setUserMap(map);
        } catch (err) {
            console.error('Failed to load user map:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    /** Resolve a userId to its display username. Falls back to truncated UUID. */
    const resolveUser = (userId: any): string => {
        if (!userId || typeof userId !== 'string') return String(userId ?? '-');
        return userMap.get(userId) ?? (userId.length > 8 ? userId.slice(0, 8) + '…' : userId);
    };

    /** Find a userId by searching username (case-insensitive). */
    const findUserIdsByName = (query: string): string[] => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        const matches: string[] = [];
        userMap.forEach((name, id) => {
            if (name.toLowerCase().includes(q)) matches.push(id);
        });
        return matches;
    };

    return { userMap, resolveUser, findUserIdsByName, loading, refreshUserMap: loadUsers };
}
