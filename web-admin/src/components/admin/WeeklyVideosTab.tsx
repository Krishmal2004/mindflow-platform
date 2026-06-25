import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Trash2, Edit, Youtube, Search, Loader2, ExternalLink, Play, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface WeeklyRecording {
    id: string;
    week_no: number;
    title: string;
    youtube_id: string;
    description: string | null;
    created_at: string;
}

interface FormState {
    week_no: string;
    title: string;
    youtube_id: string;
    description: string;
}

const YT_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

function extractYouTubeId(input: string): string {
    const m = input.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : input.trim();
}

const EMPTY_FORM: FormState = { week_no: '', title: '', youtube_id: '', description: '' };

export function WeeklyVideosTab() {
    const [recordings, setRecordings] = useState<WeeklyRecording[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<WeeklyRecording | null>(null);
    const [previewId, setPreviewId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);

    const load = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('weekly_recordings')
                .select('*')
                .order('week_no', { ascending: true });
            if (error) throw error;
            setRecordings(data || []);
        } catch (err: unknown) {
            toast.error(`Failed to load videos: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditingRecord(null);
        setForm(EMPTY_FORM);
        setIsFormOpen(true);
    };

    const openEdit = (rec: WeeklyRecording) => {
        setEditingRecord(rec);
        setForm({ week_no: String(rec.week_no), title: rec.title, youtube_id: rec.youtube_id, description: rec.description || '' });
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const ytId = extractYouTubeId(form.youtube_id);
        if (!YT_ID_RE.test(ytId)) {
            toast.error('Invalid YouTube ID. Paste the full URL or the 11-character video ID.');
            return;
        }
        const weekNo = parseInt(form.week_no, 10);
        if (isNaN(weekNo) || weekNo < 1) {
            toast.error('Week number must be a positive integer.');
            return;
        }
        setSubmitting(true);
        try {
            const payload = { week_no: weekNo, title: form.title.trim(), youtube_id: ytId, description: form.description.trim() || null };
            if (editingRecord) {
                const { error } = await supabase.from('weekly_recordings').update(payload).eq('id', editingRecord.id);
                if (error) throw error;
                toast.success('Video updated');
            } else {
                const { error } = await supabase.from('weekly_recordings').insert(payload);
                if (error) throw error;
                toast.success('Video added');
            }
            setIsFormOpen(false);
            load();
        } catch (err: unknown) {
            toast.error(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            const { error } = await supabase.from('weekly_recordings').delete().eq('id', deleteTarget);
            if (error) throw error;
            toast.success('Video deleted');
            setDeleteTarget(null);
            load();
        } catch (err: unknown) {
            toast.error(`Delete failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const liveYtId = extractYouTubeId(form.youtube_id);
    const livePreviewValid = YT_ID_RE.test(liveYtId);

    const filtered = recordings.filter(r => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return r.title.toLowerCase().includes(q) || String(r.week_no).includes(q) || r.youtube_id.toLowerCase().includes(q);
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Weekly Videos</h1>
                    <p className="text-neutral-500 text-xs mt-0.5">Manage YouTube content published weekly to study participants via Weekly Whispers.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={load} className="h-9 w-9 bg-white border-neutral-300 hover:bg-neutral-50 rounded-lg">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button onClick={openCreate} className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs h-9 px-3.5 rounded-lg shadow-sm">
                        <Plus className="mr-1.5 h-4 w-4" />
                        Add Weekly Video
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center space-x-2.5 bg-white px-3 py-2 border border-neutral-200 rounded-lg shadow-xs max-w-sm">
                <Search className="h-4 w-4 text-neutral-400 shrink-0" />
                <Input
                    type="text"
                    placeholder="Search by title or week number…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs px-0 h-7"
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-[10px] text-neutral-400 hover:text-neutral-900 font-bold">Clear</button>
                )}
            </div>

            {/* Stats row */}
            {!loading && recordings.length > 0 && (
                <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <span><span className="font-bold text-neutral-900">{recordings.length}</span> total videos</span>
                    <span><span className="font-bold text-neutral-900">{Math.max(...recordings.map(r => r.week_no), 0)}</span> weeks covered</span>
                </div>
            )}

            {/* Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-neutral-200 rounded-xl">
                    <Youtube className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-neutral-500">
                        {searchQuery ? 'No videos match your search.' : 'No weekly videos added yet.'}
                    </p>
                    {!searchQuery && (
                        <p className="text-xs text-neutral-400 mt-1">Click "Add Weekly Video" to get started.</p>
                    )}
                </div>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filtered.map(rec => (
                        <Card key={rec.id} className="border border-neutral-200 bg-white overflow-hidden hover:shadow-md transition-all duration-200 group">
                            <div className="relative aspect-video bg-neutral-100 overflow-hidden">
                                <img
                                    src={`https://img.youtube.com/vi/${rec.youtube_id}/mqdefault.jpg`}
                                    alt={rec.title}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
                                    <button
                                        onClick={() => setPreviewId(rec.youtube_id)}
                                        className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110 transform"
                                        aria-label={`Preview ${rec.title}`}
                                    >
                                        <Play className="h-5 w-5 text-neutral-900 ml-0.5" fill="currentColor" />
                                    </button>
                                </div>
                                <Badge className="absolute top-2 left-2 bg-neutral-950 text-white text-[10px] px-1.5 py-0.5 rounded font-bold shadow">
                                    Week {rec.week_no}
                                </Badge>
                            </div>
                            <CardContent className="p-3.5 space-y-2.5">
                                <div>
                                    <p className="text-xs font-semibold text-neutral-900 leading-snug line-clamp-2">{rec.title}</p>
                                    {rec.description && (
                                        <p className="text-[10px] text-neutral-500 mt-1 line-clamp-2">{rec.description}</p>
                                    )}
                                </div>
                                <div className="flex items-center justify-between pt-1.5 border-t border-neutral-100">
                                    <span className="text-[10px] text-neutral-400 font-mono truncate max-w-[80px]">{rec.youtube_id}</span>
                                    <div className="flex items-center gap-0.5">
                                        <a
                                            href={`https://www.youtube.com/watch?v=${rec.youtube_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition-colors"
                                            title="Open on YouTube"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </a>
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(rec)} className="h-7 w-7 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 rounded-md">
                                            <Edit className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(rec.id)} className="h-7 w-7 hover:bg-red-50 text-neutral-400 hover:text-red-600 rounded-md">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add / Edit Dialog */}
            <Dialog open={isFormOpen} onOpenChange={open => !open && setIsFormOpen(false)}>
                <DialogContent className="max-w-lg bg-white border border-neutral-200 rounded-xl shadow-lg">
                    <DialogHeader>
                        <DialogTitle className="text-neutral-950 font-bold text-base">
                            {editingRecord ? 'Edit Weekly Video' : 'Add Weekly Video'}
                        </DialogTitle>
                        <DialogDescription className="text-neutral-500 text-xs">
                            Paste a YouTube URL or the 11-character video ID. Participants will see this in Weekly Whispers.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-neutral-700">Week Number *</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={form.week_no}
                                    onChange={e => setForm(p => ({ ...p, week_no: e.target.value }))}
                                    required
                                    className="text-xs h-9 bg-neutral-50 border-neutral-200 rounded-lg"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-neutral-700">YouTube ID or URL *</Label>
                                <Input
                                    type="text"
                                    placeholder="dQw4w9WgXcQ or full URL"
                                    value={form.youtube_id}
                                    onChange={e => setForm(p => ({ ...p, youtube_id: e.target.value }))}
                                    required
                                    className="text-xs h-9 bg-neutral-50 border-neutral-200 rounded-lg font-mono"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-neutral-700">Title *</Label>
                            <Input
                                type="text"
                                value={form.title}
                                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                required
                                className="text-xs h-9 bg-neutral-50 border-neutral-200 rounded-lg"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-neutral-700">Description</Label>
                            <Textarea
                                value={form.description}
                                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                className="text-xs border-neutral-200 bg-neutral-50 rounded-lg resize-none min-h-[64px]"
                                placeholder="Optional — shown to participants alongside the video."
                            />
                        </div>
                        {/* Live thumbnail preview */}
                        {livePreviewValid && (
                            <div className="rounded-lg overflow-hidden border border-neutral-200">
                                <img
                                    src={`https://img.youtube.com/vi/${liveYtId}/mqdefault.jpg`}
                                    alt="Thumbnail preview"
                                    className="w-full aspect-video object-cover"
                                />
                                <p className="text-[10px] text-center text-neutral-400 py-1.5 bg-neutral-50 border-t border-neutral-100">
                                    Thumbnail preview · ID: <span className="font-mono">{liveYtId}</span>
                                </p>
                            </div>
                        )}
                        <DialogFooter className="pt-2 border-t border-neutral-100 gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)} className="text-xs border-neutral-200 text-neutral-600 hover:bg-neutral-50 rounded-lg">
                                Cancel
                            </Button>
                            <Button type="submit" size="sm" disabled={submitting} className="text-xs bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg shadow-sm">
                                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : editingRecord ? 'Save Changes' : 'Add Video'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Preview Modal */}
            <Dialog open={!!previewId} onOpenChange={() => setPreviewId(null)}>
                <DialogContent className="max-w-3xl bg-black border-0 p-0 overflow-hidden rounded-xl shadow-2xl">
                    <div className="aspect-video w-full">
                        {previewId && (
                            <iframe
                                src={`https://www.youtube.com/embed/${previewId}?autoplay=1`}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title="YouTube video preview"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <DialogContent className="max-w-sm bg-white border border-neutral-200 rounded-xl shadow-lg">
                    <DialogHeader>
                        <DialogTitle className="text-neutral-950 font-bold text-base">Delete Video</DialogTitle>
                        <DialogDescription className="text-neutral-500 text-xs">
                            This will permanently remove this weekly recording. Participants who have not watched it will lose access.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="text-xs border-neutral-200 text-neutral-600 rounded-lg">
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleDelete} className="text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg">
                            Delete Video
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
