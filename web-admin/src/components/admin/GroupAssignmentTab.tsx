import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Search, RefreshCw, Users, UserCheck, FlaskConical, Loader2, X, Edit, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Participant {
    id: string;
    username: string | null;
    research_id: string | null;
}

type Group = 'ex' | 'cg';
type ListFilter = 'all' | 'ex' | 'cg' | 'unassigned';

function deriveGroup(research_id: string | null): Group | null {
    if (!research_id) return null;
    const rid = research_id.toLowerCase();
    if (rid.endsWith('.ex')) return 'ex';
    if (rid.endsWith('.cg')) return 'cg';
    return null;
}

const GROUP_LABELS: Record<Group, string> = { ex: 'Experimental', cg: 'Control' };
const GROUP_COLORS: Record<Group, string> = {
    ex: 'bg-violet-100 text-violet-700 border-violet-200',
    cg: 'bg-sky-100 text-sky-700 border-sky-200',
};

/** Generates next available sequential Research ID for the given group and year.
 *  Format: MFEX-2026-001  (baseId, without suffix)
 */
async function generateNextId(group: Group, allParticipants: Participant[]): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = group === 'ex' ? 'MFEX' : 'MFCG';
    const pattern = new RegExp(`^${prefix}-${year}-(\\d+)\\.${group}$`, 'i');
    let maxNum = 0;
    allParticipants.forEach(p => {
        const m = p.research_id?.match(pattern);
        if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
    });
    return `${prefix}-${year}-${String(maxNum + 1).padStart(3, '0')}`;
}

export function GroupAssignmentTab() {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [listFilter, setListFilter] = useState<ListFilter>('all');

    // Assign dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogTarget, setDialogTarget] = useState<Participant | null>(null);
    const [baseId, setBaseId] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<Group>('ex');
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, research_id')
                .order('username', { ascending: true });
            if (error) throw error;
            setParticipants(data || []);
        } catch (err: unknown) {
            toast.error(`Failed to load participants: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openAssign = (p: Participant) => {
        setDialogTarget(p);
        const existing = p.research_id ?? '';
        const base = existing.endsWith('.ex') || existing.endsWith('.cg')
            ? existing.slice(0, -3)
            : (existing || '');
        setBaseId(base);
        const currentGroup = deriveGroup(p.research_id);
        setSelectedGroup(currentGroup ?? 'ex');
        setDialogOpen(true);
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const id = await generateNextId(selectedGroup, participants);
            setBaseId(id);
            toast.success(`Generated: ${id}.${selectedGroup}`);
        } catch (err: unknown) {
            toast.error(`Generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!dialogTarget) return;
        const trimmed = baseId.trim();
        if (!trimmed) { toast.error('Research ID base cannot be empty'); return; }
        if (trimmed.includes('.')) {
            toast.error('Base ID must not contain a dot — the suffix (.ex / .cg) is added automatically');
            return;
        }
        // Validate format: allow alphanumeric, dashes, underscores
        if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) {
            toast.error('Research ID may only contain letters, numbers, dashes and underscores');
            return;
        }
        const newResearchId = `${trimmed}.${selectedGroup}`;

        // Duplicate check
        const exists = participants.find(
            p => p.research_id?.toLowerCase() === newResearchId.toLowerCase() && p.id !== dialogTarget.id
        );
        if (exists) {
            toast.error(`${newResearchId} is already assigned to ${exists.username ?? exists.id.slice(0, 8)}`);
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ research_id: newResearchId })
                .eq('id', dialogTarget.id);
            if (error) throw error;
            toast.success(`${dialogTarget.username ?? dialogTarget.id.slice(0, 8)} → ${newResearchId}`);
            setDialogOpen(false);
            load();
        } catch (err: unknown) {
            toast.error(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleClear = async (p: Participant) => {
        try {
            const { error } = await supabase.from('profiles').update({ research_id: null }).eq('id', p.id);
            if (error) throw error;
            toast.success(`Research ID cleared for ${p.username ?? p.id.slice(0, 8)}`);
            load();
        } catch (err: unknown) {
            toast.error(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    // Filtering
    const textFiltered = participants.filter(p => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (p.username ?? '').toLowerCase().includes(q) ||
            (p.research_id ?? '').toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q)
        );
    });

    const listFiltered = textFiltered.filter(p => {
        if (listFilter === 'all') return true;
        if (listFilter === 'unassigned') return !deriveGroup(p.research_id);
        return deriveGroup(p.research_id) === listFilter;
    });

    const unassigned = listFiltered.filter(p => !deriveGroup(p.research_id));
    const assigned = listFiltered.filter(p => deriveGroup(p.research_id) !== null);

    const exCount = participants.filter(p => deriveGroup(p.research_id) === 'ex').length;
    const cgCount = participants.filter(p => deriveGroup(p.research_id) === 'cg').length;
    const pendingCount = participants.filter(p => !deriveGroup(p.research_id)).length;

    const previewId = baseId.trim() ? `${baseId.trim()}.${selectedGroup}` : '';

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Group Assignment</h1>
                    <p className="text-neutral-500 text-xs mt-0.5">
                        Assign participants to Experimental or Control groups. IDs are auto-generated in{' '}
                        <span className="font-mono font-semibold text-neutral-700">MFEX-2026-001.ex</span> /{' '}
                        <span className="font-mono font-semibold text-neutral-700">MFCG-2026-001.cg</span> format.
                    </p>
                </div>
                <Button variant="outline" size="icon" onClick={load} className="h-9 w-9 bg-white border-neutral-300 hover:bg-neutral-50 rounded-lg" title="Refresh">
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            {/* Summary stats */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                {[
                    { label: 'Total Participants', value: participants.length, Icon: Users, color: 'text-neutral-700', bg: 'bg-neutral-100', filter: 'all' as ListFilter },
                    { label: 'Unassigned', value: pendingCount, Icon: Users, color: 'text-amber-700', bg: 'bg-amber-50', filter: 'unassigned' as ListFilter },
                    { label: 'Experimental (.ex)', value: exCount, Icon: FlaskConical, color: 'text-violet-700', bg: 'bg-violet-50', filter: 'ex' as ListFilter },
                    { label: 'Control (.cg)', value: cgCount, Icon: UserCheck, color: 'text-sky-700', bg: 'bg-sky-50', filter: 'cg' as ListFilter },
                ].map(({ label, value, Icon, color, bg, filter }) => (
                    <Card
                        key={label}
                        onClick={() => setListFilter(f => f === filter ? 'all' : filter)}
                        className={`border shadow-none bg-white cursor-pointer transition-all ${listFilter === filter ? 'border-neutral-900 ring-1 ring-neutral-900' : 'border-neutral-200 hover:border-neutral-300'}`}
                    >
                        <CardContent className="pt-5 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{label}</p>
                                    <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
                                </div>
                                <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center`}>
                                    <Icon className={`h-5 w-5 ${color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Search + list filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center space-x-2.5 bg-white px-3 py-2 border border-neutral-200 rounded-lg shadow-sm flex-1 max-w-sm">
                    <Search className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="Search name, Research ID, or user ID…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent text-xs outline-none placeholder:text-neutral-400"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="text-neutral-400 hover:text-neutral-900">
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>

                {/* Group filter pills */}
                <div className="flex rounded-lg border border-neutral-200 overflow-hidden bg-white text-xs">
                    {([
                        { id: 'all', label: 'All' },
                        { id: 'unassigned', label: 'Unassigned' },
                        { id: 'ex', label: 'Experimental' },
                        { id: 'cg', label: 'Control' },
                    ] as { id: ListFilter; label: string }[]).map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => setListFilter(id)}
                            className={`px-3 py-1.5 font-semibold border-r border-neutral-200 last:border-0 transition-colors ${listFilter === id ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-50'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Unassigned section */}
                    {unassigned.length > 0 && listFilter !== 'ex' && listFilter !== 'cg' && (
                        <Card className="border border-amber-200 bg-amber-50/40 shadow-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                                    Pending Assignment ({unassigned.length})
                                </CardTitle>
                                <CardDescription className="text-[11px] text-amber-600">
                                    These participants have no Research ID. They cannot enter data until assigned.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <div className="divide-y divide-amber-100">
                                    {unassigned.map(p => (
                                        <ParticipantRow key={p.id} p={p} onAssign={openAssign} onClear={handleClear} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Assigned section */}
                    {assigned.length > 0 && (
                        <Card className="border border-neutral-200 bg-white shadow-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <UserCheck className="h-4 w-4 text-neutral-500" />
                                    {listFilter === 'ex' ? 'Experimental Group' : listFilter === 'cg' ? 'Control Group' : `Assigned Participants`}
                                    <span className="text-neutral-400 font-normal">({assigned.length})</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <div className="divide-y divide-neutral-100">
                                    {assigned.map(p => (
                                        <ParticipantRow key={p.id} p={p} onAssign={openAssign} onClear={handleClear} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {listFiltered.length === 0 && (
                        <div className="text-center py-16 text-neutral-400 text-sm">
                            {searchQuery ? 'No participants match your search.' : 'No participants found.'}
                        </div>
                    )}
                </div>
            )}

            {/* Assign / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={open => !open && setDialogOpen(false)}>
                <DialogContent className="max-w-md bg-white border border-neutral-200 rounded-xl shadow-lg">
                    <DialogHeader>
                        <DialogTitle className="text-neutral-950 font-bold text-base">
                            {deriveGroup(dialogTarget?.research_id ?? null) ? 'Edit Group Assignment' : 'Assign to Group'}
                        </DialogTitle>
                        <DialogDescription className="text-neutral-500 text-xs">
                            Participant: <span className="font-semibold text-neutral-700">{dialogTarget?.username ?? dialogTarget?.id.slice(0, 8)}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-2">
                        {/* Group selector */}
                        <div className="space-y-2">
                            <p className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider">Study Group</p>
                            <div className="grid grid-cols-2 gap-3">
                                {(['ex', 'cg'] as Group[]).map(g => (
                                    <button
                                        key={g}
                                        onClick={() => { setSelectedGroup(g); setBaseId(''); }}
                                        className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all ${
                                            selectedGroup === g
                                                ? g === 'ex' ? 'border-violet-500 bg-violet-50' : 'border-sky-500 bg-sky-50'
                                                : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300'
                                        }`}
                                    >
                                        {g === 'ex'
                                            ? <FlaskConical className={`h-5 w-5 ${selectedGroup === g ? 'text-violet-600' : 'text-neutral-400'}`} />
                                            : <UserCheck className={`h-5 w-5 ${selectedGroup === g ? 'text-sky-600' : 'text-neutral-400'}`} />
                                        }
                                        <span className={`text-sm font-bold ${selectedGroup === g ? (g === 'ex' ? 'text-violet-700' : 'text-sky-700') : 'text-neutral-500'}`}>
                                            {GROUP_LABELS[g]}
                                        </span>
                                        <span className={`text-[10px] font-mono ${selectedGroup === g ? (g === 'ex' ? 'text-violet-500' : 'text-sky-500') : 'text-neutral-400'}`}>
                                            .{g}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Base ID + generator */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider">
                                Research ID *
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    placeholder={selectedGroup === 'ex' ? 'MFEX-2026-001' : 'MFCG-2026-001'}
                                    value={baseId}
                                    onChange={e => setBaseId(e.target.value)}
                                    className="text-xs h-9 bg-neutral-50 border-neutral-200 rounded-lg font-mono flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    className="h-9 px-3 border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-lg text-xs font-semibold shrink-0 gap-1.5"
                                    title="Auto-generate next available ID"
                                >
                                    {generating
                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        : <Sparkles className="h-3.5 w-3.5" />
                                    }
                                    Generate
                                </Button>
                            </div>
                            <p className="text-[10px] text-neutral-400">
                                No dots allowed — the suffix (.ex / .cg) is appended automatically. Click <strong>Generate</strong> to auto-assign the next sequential ID.
                            </p>
                        </div>

                        {/* Preview */}
                        {previewId && (
                            <div className="flex items-center gap-2 px-3 py-2.5 bg-neutral-900 rounded-lg">
                                <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider shrink-0">Research ID</span>
                                <span className="flex-1 text-sm font-mono font-bold text-white text-center">{previewId}</span>
                                <Badge className={`text-[9px] font-bold shrink-0 ${selectedGroup === 'ex' ? 'bg-violet-600' : 'bg-sky-600'} text-white border-0`}>
                                    {GROUP_LABELS[selectedGroup]}
                                </Badge>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="pt-4 border-t border-neutral-100 gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="text-xs border-neutral-200 text-neutral-600 hover:bg-neutral-50 rounded-lg">
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={saving || !baseId.trim()}
                            className="text-xs bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg shadow-sm"
                        >
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                            Save Assignment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ── Row component ────────────────────────────────────────────────────────────
function ParticipantRow({
    p,
    onAssign,
    onClear,
}: {
    p: Participant;
    onAssign: (p: Participant) => void;
    onClear: (p: Participant) => void;
}) {
    const group = deriveGroup(p.research_id);

    return (
        <div className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
            <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-neutral-600">
                    {(p.username ?? p.id).charAt(0).toUpperCase()}
                </span>
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-neutral-900 truncate">
                    {p.username ?? <span className="text-neutral-400 font-normal italic">No username</span>}
                </p>
                <p className="text-[10px] text-neutral-400 font-mono truncate">{p.id}</p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
                {group ? (
                    <Badge variant="outline" className={`text-[10px] font-bold border font-mono ${GROUP_COLORS[group]}`}>
                        {p.research_id}
                    </Badge>
                ) : (
                    <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Unassigned
                    </span>
                )}

                <Button
                    variant="ghost" size="sm"
                    onClick={() => onAssign(p)}
                    className="h-7 px-2.5 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-100 rounded-md gap-1"
                >
                    <Edit className="h-3 w-3" />
                    {group ? 'Edit' : 'Assign'}
                </Button>

                {group && (
                    <Button
                        variant="ghost" size="sm"
                        onClick={() => onClear(p)}
                        className="h-7 px-2.5 text-[11px] font-semibold text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                    >
                        Clear
                    </Button>
                )}
            </div>
        </div>
    );
}
