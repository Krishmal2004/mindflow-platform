import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from "@/components/ui/button";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Loader2, Download, Users, Activity, Mic, Plus, Edit, Trash2,
    RefreshCw, ChevronRight, Search, LayoutDashboard, Database,
    LogOut, ChevronLeft, TrendingUp, Clock, ClipboardList, Calendar,
    Youtube, Filter, X, FlaskConical,
} from "lucide-react";
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import { TABLES_CONFIG } from '@/lib/tableConfig';
import { fetchOverviewMetrics, fetchTablePage } from '@/lib/adminData';
import { useUserMap } from '@/hooks/useUserMap';
import { CrudModal } from '@/components/admin/CrudModal';
import { WeeklyVideosTab } from '@/components/admin/WeeklyVideosTab';
import { CalendarTab } from '@/components/admin/CalendarTab';
import { GroupAssignmentTab } from '@/components/admin/GroupAssignmentTab';

type ActiveTab = 'overview' | 'tables' | 'analytics' | 'weekly-videos' | 'calendar' | 'groups';
type Timeframe = 'today' | 'week' | 'month' | 'custom';
type GroupFilter = 'all' | 'cg' | 'ex';

interface AnalyticsSnapshot {
    dailySliders: Array<{
        user_id: string; mood: number; stress_level: number;
        sleep_quality: number; relaxation_level: number;
        practice_duration: number; mindfulness_practice: string; created_at: string;
    }>;
    voiceRecordings: Array<{ user_id: string; created_at: string }>;
    calendarEvents: Array<{ is_completed: boolean }>;
    pss10: Array<{ user_id: string; q1: number; q2: number; q3: number; q4: number; q5: number; q6: number; q7: number; q8: number; q9: number; q10: number }>;
    wemwbs14: Array<{ user_id: string; q1: number; q2: number; q3: number; q4: number; q5: number; q6: number; q7: number; q8: number; q9: number; q10: number; q11: number; q12: number; q13: number; q14: number }>;
    ffmq15: Array<{ user_id: string; observing_score: number; describing_score: number; awareness_score: number; non_judging_score: number; non_reactivity_score: number }>;
}

const EMPTY_ANALYTICS: AnalyticsSnapshot = {
    dailySliders: [], voiceRecordings: [], calendarEvents: [],
    pss10: [], wemwbs14: [], ffmq15: [],
};

function avg(arr: number[]): string {
    return arr.length ? (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(2) : '-';
}

export default function AdminDashboard() {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
    const [selectedTable, setSelectedTable] = useState(TABLES_CONFIG[0]);
    const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterGroup, setFilterGroup] = useState<GroupFilter>('all');
    const [showAdvFilters, setShowAdvFilters] = useState(false);
    const [overviewLoading, setOverviewLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);
    const [totalTableCount, setTotalTableCount] = useState(0);

    const [analyticsTimeframe, setAnalyticsTimeframe] = useState<Timeframe>('week');
    const [analyticsCustomStart, setAnalyticsCustomStart] = useState('');
    const [analyticsCustomEnd, setAnalyticsCustomEnd] = useState('');
    const [analyticsData, setAnalyticsData] = useState<AnalyticsSnapshot>(EMPTY_ANALYTICS);
    const analyticsCache = useRef<Record<string, AnalyticsSnapshot>>({});
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [analyticsGroupFilter, setAnalyticsGroupFilter] = useState<GroupFilter>('all');

    const { userMap, groupMap, resolveUser, userInitial, findUserIdsByName, refreshUserMap } = useUserMap();

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;

    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [exportStartDate, setExportStartDate] = useState('');
    const [exportEndDate, setExportEndDate] = useState('');
    const [exportLoading, setExportLoading] = useState(false);

    const [profilesCount, setProfilesCount] = useState(0);
    const [dailyCount, setDailyCount] = useState(0);
    const [voiceCount, setVoiceCount] = useState(0);
    const [calendarCount, setCalendarCount] = useState(0);
    const [recentSubmissions, setRecentSubmissions] = useState<Array<{ id: number; user_id: string; mood: number; stress_level: number; created_at: string }>>([]);
    const [chartData, setChartData] = useState<Array<{ date: string; checkins: number }>>([]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);
    const [formValues, setFormValues] = useState<Record<string, unknown>>({});

    const [deleteTargetId, setDeleteTargetId] = useState<unknown>(null);

    // ── Data loading ─────────────────────────────────────────────────────────

    const loadOverviewData = useCallback(async () => {
        setOverviewLoading(true);
        try {
            const m = await fetchOverviewMetrics();
            setProfilesCount(m.profilesCount);
            setDailyCount(m.dailyCount);
            setVoiceCount(m.voiceCount);
            setCalendarCount(m.calendarCount);
            setRecentSubmissions(m.recentSubmissions);
            setChartData(m.chartData);
        } catch (err: unknown) {
            toast.error(`Error loading dashboard: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setOverviewLoading(false);
        }
    }, []);

    const loadTableData = useCallback(async (page = currentPage) => {
        setTableLoading(true);
        try {
            const { rows, total } = await fetchTablePage(selectedTable.name, selectedTable.primaryKey, page, pageSize);
            setTableData(rows);
            setTotalTableCount(total);
        } catch (err: unknown) {
            toast.error(`Error fetching table data: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setTableLoading(false);
        }
    }, [selectedTable.name, selectedTable.primaryKey, currentPage]);

    const loadAnalyticsData = useCallback(async (
        tf: Timeframe,
        customStart?: string,
        customEnd?: string,
    ) => {
        const cacheKey = tf === 'custom' ? `custom-${customStart}-${customEnd}` : tf;
        if (analyticsCache.current[cacheKey]) {
            setAnalyticsData(analyticsCache.current[cacheKey]);
            return;
        }
        setAnalyticsLoading(true);
        try {
            const now = new Date();
            let startDate = new Date();
            if (tf === 'today') {
                startDate.setHours(0, 0, 0, 0);
            } else if (tf === 'week') {
                startDate.setDate(now.getDate() - 7);
            } else if (tf === 'month') {
                startDate.setDate(now.getDate() - 30);
            } else if (tf === 'custom' && customStart) {
                startDate = new Date(customStart);
            } else {
                startDate.setDate(now.getDate() - 30);
            }
            const startStr = startDate.toISOString();
            const endStr = tf === 'custom' && customEnd ? customEnd + 'T23:59:59.999Z' : undefined;

            const buildQ = (table: string) => {
                const q = supabase.from(table).select('*').gte('created_at', startStr).order('created_at', { ascending: true });
                return endStr ? q.lte('created_at', endStr) : q;
            };

            const [daily, voice, calendar, pss, wemwbs, ffmq] = await Promise.all([
                buildQ('daily_sliders'),
                buildQ('voice_recordings'),
                buildQ('calendar_events'),
                buildQ('questionnaire_pss10_responses'),
                buildQ('questionnaire_wemwbs14_responses'),
                buildQ('questionnaire_ffmq15_responses'),
            ]);

            const snapshot: AnalyticsSnapshot = {
                dailySliders: (daily.data || []) as AnalyticsSnapshot['dailySliders'],
                voiceRecordings: (voice.data || []) as AnalyticsSnapshot['voiceRecordings'],
                calendarEvents: (calendar.data || []) as AnalyticsSnapshot['calendarEvents'],
                pss10: (pss.data || []) as AnalyticsSnapshot['pss10'],
                wemwbs14: (wemwbs.data || []) as AnalyticsSnapshot['wemwbs14'],
                ffmq15: (ffmq.data || []) as AnalyticsSnapshot['ffmq15'],
            };
            setAnalyticsData(snapshot);
            analyticsCache.current[cacheKey] = snapshot;
        } catch (err: unknown) {
            toast.error(`Error loading analytics: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setAnalyticsLoading(false);
        }
    }, []);

    const invalidateAnalyticsCache = () => { analyticsCache.current = {}; };

    useEffect(() => { loadOverviewData(); }, [loadOverviewData]);

    useEffect(() => {
        if (activeTab === 'tables') {
            setCurrentPage(1);
            setSearchQuery('');
            setFilterStartDate('');
            setFilterEndDate('');
            setFilterGroup('all');
        } else if (activeTab === 'analytics' && analyticsTimeframe !== 'custom') {
            loadAnalyticsData(analyticsTimeframe);
        }
    }, [selectedTable, activeTab, analyticsTimeframe, loadAnalyticsData]);

    useEffect(() => {
        if (activeTab === 'tables') loadTableData(currentPage);
    }, [currentPage, selectedTable.name, activeTab, loadTableData]);

    // ── CRUD operations ───────────────────────────────────────────────────────

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedTable.readOnly) return;
        const payload: Record<string, unknown> = {};
        selectedTable.fields.forEach(field => {
            const val = formValues[field.name];
            if (val === undefined || val === '') {
                payload[field.name] = field.type === 'boolean' ? false : null;
            } else if (field.type === 'number') {
                payload[field.name] = Number(val);
            } else if (field.type === 'boolean') {
                payload[field.name] = val === 'true' || val === true;
            } else {
                payload[field.name] = val;
            }
        });
        try {
            const { error } = await supabase.from(selectedTable.name).insert(payload);
            if (error) throw error;
            toast.success('Record created successfully');
            setIsCreateOpen(false);
            setFormValues({});
            loadTableData(currentPage);
            loadOverviewData();
            invalidateAnalyticsCache();
            if (selectedTable.name === 'profiles') refreshUserMap();
        } catch (err: unknown) {
            toast.error(`Create failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRow || selectedTable.readOnly) return;
        const payload: Record<string, unknown> = {};
        selectedTable.fields.forEach(field => {
            if (field.readOnly) return;
            const val = formValues[field.name];
            if (val === undefined || val === '') {
                payload[field.name] = field.type === 'boolean' ? false : null;
            } else if (field.type === 'number') {
                payload[field.name] = Number(val);
            } else if (field.type === 'boolean') {
                payload[field.name] = val === 'true' || val === true;
            } else {
                payload[field.name] = val;
            }
        });
        try {
            const { error } = await supabase
                .from(selectedTable.name)
                .update(payload)
                .eq(selectedTable.primaryKey, selectedRow[selectedTable.primaryKey]);
            if (error) throw error;
            toast.success('Record updated successfully');
            setIsEditOpen(false);
            setSelectedRow(null);
            setFormValues({});
            loadTableData(currentPage);
            invalidateAnalyticsCache();
            if (selectedTable.name === 'profiles') refreshUserMap();
        } catch (err: unknown) {
            toast.error(`Update failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleDeleteConfirm = async () => {
        if (deleteTargetId === null || selectedTable.readOnly) return;
        try {
            const { error } = await supabase
                .from(selectedTable.name)
                .delete()
                .eq(selectedTable.primaryKey, deleteTargetId);
            if (error) throw error;
            toast.success('Record deleted');
            setDeleteTargetId(null);
            loadTableData(currentPage);
            loadOverviewData();
            invalidateAnalyticsCache();
            if (selectedTable.name === 'profiles') refreshUserMap();
        } catch (err: unknown) {
            toast.error(`Delete failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    // ── Export (fetches ALL data, not just current page) ─────────────────────

    const triggerExportCSV = async () => {
        setExportLoading(true);
        try {
            let query = supabase.from(selectedTable.name).select('*').order(selectedTable.primaryKey, { ascending: false });
            if (exportStartDate) query = query.gte('created_at', exportStartDate);
            if (exportEndDate) query = query.lte('created_at', exportEndDate + 'T23:59:59.999Z');

            const { data, error } = await query;
            if (error) throw error;
            const rows = data || [];

            if (rows.length === 0) {
                toast.error('No data matching the selected timeframe');
                return;
            }
            const headers = Object.keys(rows[0]);
            const csvContent = [
                headers.join(','),
                ...rows.map(row => headers.map(k => {
                    const val = (row as Record<string, unknown>)[k];
                    if (val === null || val === undefined) return '';
                    const s = String(val).replace(/"/g, '""');
                    return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s;
                }).join(','))
            ].join('\r\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedTable.name}_${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success(`Exported ${rows.length} rows`);
            setIsExportDialogOpen(false);
        } catch (err: unknown) {
            toast.error(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setExportLoading(false);
        }
    };

    // ── Helpers ───────────────────────────────────────────────────────────────

    const openCreateDialog = () => {
        const defaults: Record<string, unknown> = {};
        selectedTable.fields.forEach(f => { if (f.defaultValue !== undefined) defaults[f.name] = f.defaultValue; });
        setFormValues(defaults);
        setIsCreateOpen(true);
    };

    const openEditDialog = (row: Record<string, unknown>) => {
        setSelectedRow(row);
        const vals: Record<string, unknown> = {};
        selectedTable.fields.forEach(f => { vals[f.name] = row[f.name] ?? ''; });
        setFormValues(vals);
        setIsEditOpen(true);
    };

    const handleFormChange = (field: string, value: unknown) => {
        setFormValues(prev => ({ ...prev, [field]: value }));
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            toast.success('Signed out');
            navigate('/login');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to sign out');
        }
    };

    // ── Filtering & pagination ────────────────────────────────────────────────

    const filteredTableData = tableData.filter(row => {
        // Text search
        if (searchQuery) {
            if (selectedTable.hasUserId) {
                const matchIds = findUserIdsByName(searchQuery);
                const uid = String(row.user_id ?? '');
                if (!matchIds.includes(uid) && !uid.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            } else if (selectedTable.name === 'profiles') {
                const name = String(row.username ?? '').toLowerCase();
                const rid = String(row.research_id ?? '').toLowerCase();
                if (!name.includes(searchQuery.toLowerCase()) && !rid.includes(searchQuery.toLowerCase())) return false;
            } else {
                const val = String(row[selectedTable.searchColumn] ?? '');
                if (!val.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            }
        }
        // Date range filter
        if (filterStartDate || filterEndDate) {
            const dateVal = (row.created_at || row.event_date) as string | undefined;
            if (dateVal) {
                const d = new Date(dateVal);
                if (filterStartDate && d < new Date(filterStartDate)) return false;
                if (filterEndDate) {
                    const limit = new Date(filterEndDate);
                    limit.setHours(23, 59, 59, 999);
                    if (d > limit) return false;
                }
            }
        }
        // Group filter
        if (filterGroup !== 'all' && selectedTable.hasUserId) {
            const uid = String(row.user_id ?? '');
            const g = groupMap.get(uid);
            if (g !== filterGroup) return false;
        }
        return true;
    });

    const totalPages = Math.ceil(
        (searchQuery || filterStartDate || filterEndDate || filterGroup !== 'all'
            ? filteredTableData.length
            : totalTableCount) / pageSize
    ) || 1;

    const paginatedData = filteredTableData;
    const displayTotal = (searchQuery || filterStartDate || filterEndDate || filterGroup !== 'all')
        ? filteredTableData.length
        : totalTableCount;

    const hasActiveFilters = filterStartDate || filterEndDate || filterGroup !== 'all';
    const canGroupFilter = selectedTable.hasUserId;
    const canDateFilter = selectedTable.hasCreatedAt;

    const mappedConfigForModal = {
        ...selectedTable,
        fields: selectedTable.fields.map(field => {
            if (field.name === 'user_id') {
                return {
                    ...field,
                    type: 'select' as const,
                    options: Array.from(userMap.entries()).map(([id, name]) => ({
                        label: `${name} (${id.slice(0, 6)})`,
                        value: id,
                    })),
                };
            }
            return field;
        }),
    };

    // ── Analytics computed values ─────────────────────────────────────────────

    const cgIds = new Set(Array.from(groupMap.entries()).filter(([, g]) => g === 'cg').map(([id]) => id));
    const exIds = new Set(Array.from(groupMap.entries()).filter(([, g]) => g === 'ex').map(([id]) => id));

    // Group-filtered views (used when analyticsGroupFilter !== 'all')
    const analyticsFilterSet: Set<string> | null =
        analyticsGroupFilter === 'cg' ? cgIds :
        analyticsGroupFilter === 'ex' ? exIds :
        null;

    const fSliders = analyticsFilterSet
        ? analyticsData.dailySliders.filter(d => analyticsFilterSet.has(d.user_id))
        : analyticsData.dailySliders;
    const fVoice = analyticsFilterSet
        ? analyticsData.voiceRecordings.filter(d => analyticsFilterSet.has(d.user_id))
        : analyticsData.voiceRecordings;
    const fPss10 = analyticsFilterSet
        ? analyticsData.pss10.filter(d => analyticsFilterSet.has(d.user_id))
        : analyticsData.pss10;
    const fWemwbs = analyticsFilterSet
        ? analyticsData.wemwbs14.filter(d => analyticsFilterSet.has(d.user_id))
        : analyticsData.wemwbs14;
    const fFfmq = analyticsFilterSet
        ? analyticsData.ffmq15.filter(d => analyticsFilterSet.has(d.user_id))
        : analyticsData.ffmq15;
    const fCalendar = analyticsData.calendarEvents;

    const cgSliders = analyticsData.dailySliders.filter(d => cgIds.has(d.user_id));
    const exSliders = analyticsData.dailySliders.filter(d => exIds.has(d.user_id));

    const pss10Totals = fPss10.map(r => r.q1 + r.q2 + r.q3 + r.q4 + r.q5 + r.q6 + r.q7 + r.q8 + r.q9 + r.q10);
    const wemwbsTotals = fWemwbs.map(r => r.q1 + r.q2 + r.q3 + r.q4 + r.q5 + r.q6 + r.q7 + r.q8 + r.q9 + r.q10 + r.q11 + r.q12 + r.q13 + r.q14);
    const ffmqObs = fFfmq.map(r => r.observing_score).filter(Boolean);
    const ffmqDesc = fFfmq.map(r => r.describing_score).filter(Boolean);
    const ffmqAware = fFfmq.map(r => r.awareness_score).filter(Boolean);
    const ffmqNJ = fFfmq.map(r => r.non_judging_score).filter(Boolean);
    const ffmqNR = fFfmq.map(r => r.non_reactivity_score).filter(Boolean);

    const activeUids = new Set([
        ...fSliders.map(d => d.user_id),
        ...fVoice.map(d => d.user_id),
        ...fPss10.map(d => d.user_id),
        ...fWemwbs.map(d => d.user_id),
        ...fFfmq.map(d => d.user_id),
    ].filter(Boolean));

    const engagementRate = profilesCount > 0
        ? ((activeUids.size / profilesCount) * 100).toFixed(0) + '%'
        : '-';

    // Day-of-week engagement bar chart
    const dowCounts: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const dowOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    fSliders.forEach(d => {
        const day = dayNames[new Date(d.created_at).getDay()];
        if (day in dowCounts) dowCounts[day]++;
    });
    const dowChartData = dowOrder.map(d => ({ day: d, checkins: dowCounts[d] }));

    const questBreakdownData = [
        { name: 'PSS-10', count: fPss10.length },
        { name: 'WEMWBS-14', count: fWemwbs.length },
        { name: 'FFMQ-15', count: fFfmq.length },
    ];

    // Engagement leaderboard
    const eMap = new Map<string, { checkins: number; voice: number; pss: number; wemwbs: number; ffmq: number; last: string }>();
    fSliders.forEach(s => {
        const r = eMap.get(s.user_id) || { checkins: 0, voice: 0, pss: 0, wemwbs: 0, ffmq: 0, last: '' };
        r.checkins++;
        if (!r.last || s.created_at > r.last) r.last = s.created_at;
        eMap.set(s.user_id, r);
    });
    fVoice.forEach(v => {
        const r = eMap.get(v.user_id) || { checkins: 0, voice: 0, pss: 0, wemwbs: 0, ffmq: 0, last: '' };
        r.voice++;
        if (!r.last || v.created_at > r.last) r.last = v.created_at;
        eMap.set(v.user_id, r);
    });
    fPss10.forEach(v => { const r = eMap.get(v.user_id); if (r) r.pss++; });
    fWemwbs.forEach(v => { const r = eMap.get(v.user_id); if (r) r.wemwbs++; });
    fFfmq.forEach(v => { const r = eMap.get(v.user_id); if (r) r.ffmq++; });

    const leaderboard = Array.from(eMap.entries())
        .map(([userId, stats]) => ({ userId, ...stats, total: stats.checkins + stats.voice + stats.pss + stats.wemwbs + stats.ffmq }))
        .sort((a, b) => b.total - a.total);

    // Mood/stress trend chart
    const trendGrouped = new Map<string, { moodSum: number; stressSum: number; sleepSum: number; count: number }>();
    fSliders.forEach(d => {
        const key = analyticsTimeframe === 'today'
            ? new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : new Date(d.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
        const ext = trendGrouped.get(key) || { moodSum: 0, stressSum: 0, sleepSum: 0, count: 0 };
        ext.moodSum += d.mood;
        ext.stressSum += d.stress_level;
        ext.sleepSum += d.sleep_quality;
        ext.count++;
        trendGrouped.set(key, ext);
    });
    const trendChartData = Array.from(trendGrouped.entries()).map(([label, s]) => ({
        label,
        Mood: +(s.moodSum / s.count).toFixed(2),
        Stress: +(s.stressSum / s.count).toFixed(2),
        Sleep: +(s.sleepSum / s.count).toFixed(2),
    }));

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col font-sans antialiased text-neutral-900">
            {/* Header */}
            <header className="border-b border-neutral-200 bg-white sticky top-0 z-30">
                <div className="flex h-14 items-center px-6 justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="h-7 w-7 bg-neutral-900 flex items-center justify-center rounded">
                            <Database className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="font-bold tracking-tight text-neutral-950 text-sm">MindFlow Admin</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600 border border-neutral-200 font-medium">Research Portal</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                            <span className="text-xs font-medium text-neutral-600">Administrator</span>
                        </div>
                        <Button
                            variant="ghost" size="sm"
                            onClick={handleLogout}
                            className="text-neutral-500 hover:text-neutral-900 flex items-center gap-1.5 text-xs"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside className="w-60 border-r border-neutral-200 bg-white p-3 space-y-5 flex-shrink-0 hidden md:flex md:flex-col">
                    <nav className="space-y-0.5" aria-label="Main navigation">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2 mb-1.5 mt-1">Overview</p>
                        {([
                            { id: 'overview', label: 'Dashboard', Icon: LayoutDashboard },
                            { id: 'analytics', label: 'Analytics', Icon: TrendingUp },
                        ] as const).map(({ id, label, Icon }) => (
                            <Button
                                key={id}
                                variant={activeTab === id ? 'secondary' : 'ghost'}
                                className={`w-full justify-start gap-2 text-xs font-medium h-8 ${activeTab === id ? 'bg-neutral-100 text-neutral-950' : 'text-neutral-600'}`}
                                onClick={() => setActiveTab(id)}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {label}
                            </Button>
                        ))}

                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2 mb-1.5 mt-4">Participants</p>
                        <Button
                            variant={activeTab === 'groups' ? 'secondary' : 'ghost'}
                            className={`w-full justify-start gap-2 text-xs font-medium h-8 ${activeTab === 'groups' ? 'bg-neutral-100 text-neutral-950' : 'text-neutral-600'}`}
                            onClick={() => setActiveTab('groups')}
                        >
                            <FlaskConical className="h-3.5 w-3.5" />
                            Group Assignment
                        </Button>

                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2 mb-1.5 mt-4">Content</p>
                        {([
                            { id: 'weekly-videos', label: 'Weekly Videos', Icon: Youtube },
                            { id: 'calendar', label: 'Calendar Events', Icon: Calendar },
                        ] as const).map(({ id, label, Icon }) => (
                            <Button
                                key={id}
                                variant={activeTab === id ? 'secondary' : 'ghost'}
                                className={`w-full justify-start gap-2 text-xs font-medium h-8 ${activeTab === id ? 'bg-neutral-100 text-neutral-950' : 'text-neutral-600'}`}
                                onClick={() => setActiveTab(id)}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {label}
                            </Button>
                        ))}

                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2 mb-1.5 mt-4">Database</p>
                        <Button
                            variant={activeTab === 'tables' ? 'secondary' : 'ghost'}
                            className={`w-full justify-start gap-2 text-xs font-medium h-8 ${activeTab === 'tables' ? 'bg-neutral-100 text-neutral-950' : 'text-neutral-600'}`}
                            onClick={() => setActiveTab('tables')}
                        >
                            <Database className="h-3.5 w-3.5" />
                            Database Tables
                        </Button>
                    </nav>

                    {activeTab === 'tables' && (
                        <div className="pt-3 border-t border-neutral-100 flex-1 overflow-hidden flex flex-col">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2 mb-1.5">Tables</p>
                            <div className="space-y-0.5 overflow-y-auto flex-1">
                                {TABLES_CONFIG.map(table => (
                                    <button
                                        key={table.name}
                                        onClick={() => { setSelectedTable(table); setSearchQuery(''); }}
                                        className={`w-full text-left px-2.5 py-1.5 text-xs font-medium rounded transition-all flex items-center justify-between ${
                                            selectedTable.name === table.name
                                                ? 'bg-neutral-950 text-white'
                                                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                                        }`}
                                    >
                                        <span className="truncate">{table.label}</span>
                                        {selectedTable.name === table.name && <ChevronRight className="h-3 w-3 shrink-0" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>

                {/* Main content */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">

                    {/* ── OVERVIEW TAB ── */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Overview</h1>
                                    <p className="text-neutral-500 text-xs mt-0.5">Real-time trial statistics and participant response metrics.</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={loadOverviewData} disabled={overviewLoading} className="text-xs h-8 border-neutral-200 gap-1.5">
                                    <RefreshCw className={`h-3.5 w-3.5 ${overviewLoading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                            </div>

                            {overviewLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                                </div>
                            ) : (
                                <>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                        {[
                                            { label: 'Participants', value: profilesCount, sub: 'Total active trial accounts', Icon: Users },
                                            { label: 'Daily Check-ins', value: dailyCount, sub: 'Total submissions logged', Icon: Activity },
                                            { label: 'Voice Logs', value: voiceCount, sub: 'Voice responses stored', Icon: Mic },
                                            { label: 'Calendar Events', value: calendarCount, sub: 'Global schedule checkpoints', Icon: Calendar },
                                        ].map(({ label, value, sub, Icon }) => (
                                            <Card key={label} className="border border-neutral-200 shadow-none bg-white">
                                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                    <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{label}</CardTitle>
                                                    <Icon className="h-4 w-4 text-neutral-400" />
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-3xl font-bold tracking-tight">{value}</div>
                                                    <p className="text-[10px] text-neutral-400 mt-1">{sub}</p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>

                                    <div className="grid gap-6 lg:grid-cols-7">
                                        <Card className="lg:col-span-4 border border-neutral-200 bg-white shadow-none">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-semibold">Activity Timeline</CardTitle>
                                                <CardDescription className="text-[11px]">Daily check-ins over the past 7 days.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="pl-1">
                                                <div className="h-[240px]">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={chartData}>
                                                            <XAxis dataKey="date" stroke="#aaa" fontSize={10} tickLine={false} axisLine={false} />
                                                            <YAxis stroke="#aaa" fontSize={10} tickLine={false} axisLine={false} />
                                                            <Tooltip contentStyle={{ background: '#000', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '11px' }} />
                                                            <Line type="monotone" dataKey="checkins" stroke="#171717" strokeWidth={2.5} dot={{ r: 4, stroke: '#171717', fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="lg:col-span-3 border border-neutral-200 bg-white shadow-none">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-semibold">Latest Check-ins</CardTitle>
                                                <CardDescription className="text-[11px]">Most recent participant mood and stress logs.</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    {recentSubmissions.length === 0 ? (
                                                        <div className="text-center py-8 text-neutral-400 text-xs">No entries yet.</div>
                                                    ) : (
                                                        recentSubmissions.map(row => (
                                                            <div key={row.id} className="flex items-center gap-3 border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                                                                <Avatar className="h-7 w-7 bg-neutral-900 border border-neutral-200 shrink-0">
                                                                    <AvatarFallback className="text-white text-[10px] font-bold bg-neutral-900">
                                                                        {userInitial(row.user_id)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-semibold text-neutral-900 truncate">{resolveUser(row.user_id)}</p>
                                                                    <p className="text-[10px] text-neutral-400">
                                                                        {new Date(row.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} · {new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                </div>
                                                                <div className="flex gap-1 shrink-0">
                                                                    <Badge className="text-[9px] font-bold bg-neutral-950 text-white px-1.5 py-0.5 rounded">M:{row.mood}</Badge>
                                                                    <Badge variant="outline" className="text-[9px] font-semibold px-1.5 py-0.5 rounded border-neutral-200">S:{row.stress_level}</Badge>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* ── ANALYTICS TAB ── */}
                    {activeTab === 'analytics' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Analytics</h1>
                                    <p className="text-neutral-500 text-xs mt-0.5">Aggregated participant data, engagement indexes, and group comparisons.</p>
                                </div>
                                <div className="flex flex-col gap-2 shrink-0">
                                    {/* Timeframe selector */}
                                    <div className="flex bg-neutral-100 p-1 border border-neutral-200 rounded-lg">
                                        {(['today', 'week', 'month', 'custom'] as const).map(t => (
                                            <button
                                                key={t}
                                                onClick={() => {
                                                    setAnalyticsTimeframe(t);
                                                    if (t !== 'custom') loadAnalyticsData(t);
                                                }}
                                                className={`px-3 py-1.5 text-[11px] font-semibold rounded-md capitalize transition-all ${
                                                    analyticsTimeframe === t ? 'bg-white text-neutral-950 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
                                                }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                    {analyticsTimeframe === 'custom' && (
                                        <div className="flex items-center gap-2">
                                            <Input type="date" value={analyticsCustomStart} onChange={e => setAnalyticsCustomStart(e.target.value)} className="text-xs h-8 bg-white border-neutral-200 rounded-lg w-36" />
                                            <span className="text-xs text-neutral-400">to</span>
                                            <Input type="date" value={analyticsCustomEnd} onChange={e => setAnalyticsCustomEnd(e.target.value)} className="text-xs h-8 bg-white border-neutral-200 rounded-lg w-36" />
                                            <Button
                                                size="sm"
                                                onClick={() => loadAnalyticsData('custom', analyticsCustomStart, analyticsCustomEnd)}
                                                className="text-xs h-8 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg px-3"
                                            >
                                                Apply
                                            </Button>
                                        </div>
                                    )}
                                    {/* Group filter */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 shrink-0">Group</span>
                                        <div className="flex rounded-lg border border-neutral-200 overflow-hidden bg-white">
                                            {([
                                                { id: 'all', label: 'All Participants' },
                                                { id: 'cg', label: 'Control (.cg)' },
                                                { id: 'ex', label: 'Experimental (.ex)' },
                                            ] as { id: GroupFilter; label: string }[]).map(({ id, label }) => (
                                                <button
                                                    key={id}
                                                    onClick={() => setAnalyticsGroupFilter(id)}
                                                    className={`px-3 py-1.5 text-[11px] font-semibold border-r border-neutral-200 last:border-0 transition-colors ${
                                                        analyticsGroupFilter === id
                                                            ? id === 'cg' ? 'bg-sky-600 text-white' : id === 'ex' ? 'bg-violet-600 text-white' : 'bg-neutral-900 text-white'
                                                            : 'text-neutral-600 hover:bg-neutral-50'
                                                    }`}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {analyticsLoading ? (
                                <div className="flex flex-col items-center justify-center py-24 gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                                    <span className="text-xs text-neutral-500">Aggregating records…</span>
                                </div>
                            ) : analyticsTimeframe === 'custom' && !analyticsCustomStart ? (
                                <div className="text-center py-20 text-neutral-400 text-sm">Select a start date and click Apply.</div>
                            ) : (
                                <>
                                    {/* Primary metrics */}
                                    {analyticsGroupFilter !== 'all' && (
                                        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold ${analyticsGroupFilter === 'cg' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-violet-50 text-violet-700 border border-violet-200'}`}>
                                            <span className={`h-2 w-2 rounded-full ${analyticsGroupFilter === 'cg' ? 'bg-sky-500' : 'bg-violet-500'}`} />
                                            Showing data for {analyticsGroupFilter === 'cg' ? 'Control Group (.cg)' : 'Experimental Group (.ex)'} only
                                            <button onClick={() => setAnalyticsGroupFilter('all')} className="ml-auto text-[10px] underline opacity-70 hover:opacity-100">Clear filter</button>
                                        </div>
                                    )}

                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                        {[
                                            { label: 'Active Participants', value: activeUids.size, sub: 'Unique contributors in period', Icon: Users },
                                            { label: 'Avg Stress Level', value: avg(fSliders.map(d => d.stress_level)), sub: 'Scale 1 (low) – 5 (high)', Icon: Activity },
                                            { label: 'Avg Mood Index', value: avg(fSliders.map(d => d.mood)), sub: 'Scale 1 (poor) – 5 (excellent)', Icon: Activity },
                                            { label: 'Practice Minutes', value: fSliders.reduce((s, d) => s + (d.practice_duration || 0), 0), sub: 'Cumulative duration in period', Icon: Clock },
                                        ].map(({ label, value, sub, Icon }) => (
                                            <Card key={label} className="border border-neutral-200 bg-white shadow-none">
                                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                    <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{label}</CardTitle>
                                                    <Icon className="h-4 w-4 text-neutral-400" />
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-3xl font-bold tracking-tight">{value}</div>
                                                    <p className="text-[10px] text-neutral-400 mt-1">{sub}</p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>

                                    {/* Secondary metrics: questionnaire scores */}
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                        <Card className="border border-neutral-200 bg-white shadow-none">
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">PSS-10 Avg Score</CardTitle>
                                                <ClipboardList className="h-4 w-4 text-neutral-400" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-3xl font-bold tracking-tight">{avg(pss10Totals)}</div>
                                                <p className="text-[10px] text-neutral-400 mt-1">Perceived stress (10–50)</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="border border-neutral-200 bg-white shadow-none">
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">WEMWBS-14 Avg</CardTitle>
                                                <ClipboardList className="h-4 w-4 text-neutral-400" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-3xl font-bold tracking-tight">{avg(wemwbsTotals)}</div>
                                                <p className="text-[10px] text-neutral-400 mt-1">Wellbeing (14–70, higher=better)</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="border border-neutral-200 bg-white shadow-none">
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Engagement Rate</CardTitle>
                                                <TrendingUp className="h-4 w-4 text-neutral-400" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-3xl font-bold tracking-tight">{engagementRate}</div>
                                                <p className="text-[10px] text-neutral-400 mt-1">Active / total participants</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="border border-neutral-200 bg-white shadow-none">
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Questionnaires</CardTitle>
                                                <ClipboardList className="h-4 w-4 text-neutral-400" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-3xl font-bold tracking-tight">{fPss10.length + fWemwbs.length + fFfmq.length}</div>
                                                <p className="text-[10px] text-neutral-400 mt-1">Total responses in period</p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Charts row */}
                                    <div className="grid gap-6 lg:grid-cols-7">
                                        {/* Mood/Stress/Sleep trend */}
                                        <Card className="lg:col-span-4 border border-neutral-200 bg-white shadow-none">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-semibold">Mood · Stress · Sleep Trends</CardTitle>
                                                <CardDescription className="text-[11px]">Daily averages across all active participants.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="pl-1">
                                                <div className="h-[240px]">
                                                    {trendChartData.length === 0 ? (
                                                        <div className="h-full flex items-center justify-center text-xs text-neutral-400">No data in this range.</div>
                                                    ) : (
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <LineChart data={trendChartData}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                                <XAxis dataKey="label" stroke="#aaa" fontSize={10} tickLine={false} axisLine={false} />
                                                                <YAxis stroke="#aaa" fontSize={10} tickLine={false} axisLine={false} domain={[1, 5]} />
                                                                <Tooltip contentStyle={{ background: '#000', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '11px' }} />
                                                                <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                                                                <Line type="monotone" dataKey="Mood" stroke="#171717" strokeWidth={2} dot={{ r: 2 }} />
                                                                <Line type="monotone" dataKey="Stress" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 2 }} />
                                                                <Line type="monotone" dataKey="Sleep" stroke="#3b82f6" strokeWidth={2} strokeDasharray="2 2" dot={{ r: 2 }} />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Day-of-week + submissions breakdown */}
                                        <div className="lg:col-span-3 space-y-4">
                                            <Card className="border border-neutral-200 bg-white shadow-none">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-semibold">Check-ins by Day</CardTitle>
                                                    <CardDescription className="text-[11px]">Engagement pattern across weekdays.</CardDescription>
                                                </CardHeader>
                                                <CardContent className="pl-1">
                                                    <div className="h-[100px]">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={dowChartData} barSize={14}>
                                                                <XAxis dataKey="day" stroke="#aaa" fontSize={10} tickLine={false} axisLine={false} />
                                                                <Tooltip contentStyle={{ background: '#000', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '10px' }} />
                                                                <Bar dataKey="checkins" fill="#171717" radius={[3, 3, 0, 0]} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card className="border border-neutral-200 bg-white shadow-none">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-semibold">Questionnaire Breakdown</CardTitle>
                                                </CardHeader>
                                                <CardContent className="pl-1">
                                                    <div className="h-[90px]">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={questBreakdownData} barSize={20}>
                                                                <XAxis dataKey="name" stroke="#aaa" fontSize={9} tickLine={false} axisLine={false} />
                                                                <Tooltip contentStyle={{ background: '#000', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '10px' }} />
                                                                <Bar dataKey="count" fill="#6b7280" radius={[3, 3, 0, 0]} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>

                                    {/* FFMQ-15 Sub-scores */}
                                    {fFfmq.length > 0 && (
                                        <Card className="border border-neutral-200 bg-white shadow-none">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-semibold">FFMQ-15 Sub-score Averages</CardTitle>
                                                <CardDescription className="text-[11px]">Mindfulness facet averages for {fFfmq.length} response(s).</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                                    {[
                                                        { label: 'Observing', vals: ffmqObs },
                                                        { label: 'Describing', vals: ffmqDesc },
                                                        { label: 'Awareness', vals: ffmqAware },
                                                        { label: 'Non-Judging', vals: ffmqNJ },
                                                        { label: 'Non-Reactivity', vals: ffmqNR },
                                                    ].map(({ label, vals }) => (
                                                        <div key={label} className="text-center p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                                                            <div className="text-2xl font-bold text-neutral-900">{avg(vals)}</div>
                                                            <div className="text-[10px] text-neutral-500 mt-1 font-medium">{label}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Group Comparison (CG vs EX) — only shown when viewing all groups */}
                                    {analyticsGroupFilter === 'all' && (cgIds.size > 0 || exIds.size > 0) && (
                                        <Card className="border border-neutral-200 bg-white shadow-none">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-semibold">Group Comparison — Control vs Experimental</CardTitle>
                                                <CardDescription className="text-[11px]">Side-by-side metrics for .cg and .ex research groups in this period.</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-xs">
                                                        <thead>
                                                            <tr className="border-b border-neutral-200">
                                                                <th className="text-left py-2 pr-4 text-neutral-500 font-semibold">Metric</th>
                                                                <th className="text-center py-2 px-3 text-neutral-700 font-bold">Control (.cg)<br /><span className="font-normal text-neutral-400">{cgIds.size} profiles</span></th>
                                                                <th className="text-center py-2 px-3 text-neutral-700 font-bold">Experimental (.ex)<br /><span className="font-normal text-neutral-400">{exIds.size} profiles</span></th>
                                                                <th className="text-center py-2 pl-3 text-neutral-500 font-semibold">Difference</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {[
                                                                { label: 'Active Users', cg: new Set(cgSliders.map(d => d.user_id)).size, ex: new Set(exSliders.map(d => d.user_id)).size, fmt: (v: number) => String(v) },
                                                                { label: 'Check-ins', cg: cgSliders.length, ex: exSliders.length, fmt: (v: number) => String(v) },
                                                                { label: 'Avg Mood', cg: parseFloat(avg(cgSliders.map(d => d.mood))), ex: parseFloat(avg(exSliders.map(d => d.mood))), fmt: (v: number) => isNaN(v) ? '-' : v.toFixed(2) },
                                                                { label: 'Avg Stress', cg: parseFloat(avg(cgSliders.map(d => d.stress_level))), ex: parseFloat(avg(exSliders.map(d => d.stress_level))), fmt: (v: number) => isNaN(v) ? '-' : v.toFixed(2) },
                                                                { label: 'Avg Sleep', cg: parseFloat(avg(cgSliders.map(d => d.sleep_quality))), ex: parseFloat(avg(exSliders.map(d => d.sleep_quality))), fmt: (v: number) => isNaN(v) ? '-' : v.toFixed(2) },
                                                                { label: 'Practice Mins', cg: cgSliders.reduce((s, d) => s + (d.practice_duration || 0), 0), ex: exSliders.reduce((s, d) => s + (d.practice_duration || 0), 0), fmt: (v: number) => String(v) },
                                                            ].map(({ label, cg, ex, fmt }) => {
                                                                const diff = typeof cg === 'number' && typeof ex === 'number' && !isNaN(cg) && !isNaN(ex) ? ex - cg : null;
                                                                return (
                                                                    <tr key={label} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50">
                                                                        <td className="py-2.5 pr-4 text-neutral-600 font-medium">{label}</td>
                                                                        <td className="py-2.5 px-3 text-center font-semibold text-neutral-900">{fmt(cg)}</td>
                                                                        <td className="py-2.5 px-3 text-center font-semibold text-neutral-900">{fmt(ex)}</td>
                                                                        <td className={`py-2.5 pl-3 text-center font-semibold ${diff === null ? 'text-neutral-400' : diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-neutral-400'}`}>
                                                                            {diff === null ? '-' : `${diff > 0 ? '+' : ''}${typeof diff === 'number' && !Number.isInteger(diff) ? diff.toFixed(2) : diff}`}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Submissions breakdown summary */}
                                    <div className="grid gap-6 lg:grid-cols-7">
                                        <Card className="lg:col-span-3 border border-neutral-200 bg-white shadow-none">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-semibold">Submissions Summary</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                {[
                                                    { label: 'Daily Check-ins', count: fSliders.length, Icon: Activity },
                                                    { label: 'Voice Submissions', count: fVoice.length, Icon: Mic },
                                                    { label: 'Calendar Completed', count: fCalendar.filter(e => e.is_completed).length, Icon: Calendar },
                                                    { label: 'PSS-10 Responses', count: fPss10.length, Icon: ClipboardList },
                                                    { label: 'WEMWBS-14 Responses', count: fWemwbs.length, Icon: ClipboardList },
                                                    { label: 'FFMQ-15 Responses', count: fFfmq.length, Icon: ClipboardList },
                                                ].map(({ label, count, Icon }) => (
                                                    <div key={label} className="flex items-center justify-between border-b border-neutral-100 pb-2.5 last:border-0 last:pb-0">
                                                        <span className="text-xs text-neutral-600 flex items-center gap-1.5 font-medium">
                                                            <Icon className="h-3.5 w-3.5 text-neutral-400" />
                                                            {label}
                                                        </span>
                                                        <span className="text-xs font-bold text-neutral-900">{count}</span>
                                                    </div>
                                                ))}
                                            </CardContent>
                                        </Card>

                                        {/* Engagement leaderboard */}
                                        <Card className="lg:col-span-4 border border-neutral-200 bg-white shadow-none">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-semibold">Participant Engagement Index</CardTitle>
                                                <CardDescription className="text-[11px]">Ranked by total contributions in this period.</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="overflow-x-auto">
                                                    <Table>
                                                        <TableHeader className="bg-neutral-50">
                                                            <TableRow className="border-b border-neutral-200">
                                                                {['Participant', 'Check-ins', 'Voice', 'PSS', 'WEMWBS', 'FFMQ', 'Last Active'].map(h => (
                                                                    <TableHead key={h} className="text-[10px] font-semibold py-2 text-neutral-500">{h}</TableHead>
                                                                ))}
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {leaderboard.length === 0 ? (
                                                                <TableRow>
                                                                    <TableCell colSpan={7} className="text-center py-6 text-xs text-neutral-400">No contributions in this period.</TableCell>
                                                                </TableRow>
                                                            ) : (
                                                                leaderboard.map((r, i) => (
                                                                    <TableRow key={r.userId || i} className="hover:bg-neutral-50/40 border-b border-neutral-100 last:border-0">
                                                                        <TableCell className="py-2 text-xs font-semibold">{resolveUser(r.userId)}</TableCell>
                                                                        <TableCell className="py-2 text-xs">{r.checkins}</TableCell>
                                                                        <TableCell className="py-2 text-xs">{r.voice}</TableCell>
                                                                        <TableCell className="py-2 text-xs">{r.pss}</TableCell>
                                                                        <TableCell className="py-2 text-xs">{r.wemwbs}</TableCell>
                                                                        <TableCell className="py-2 text-xs">{r.ffmq}</TableCell>
                                                                        <TableCell className="py-2 text-xs text-neutral-500">
                                                                            {r.last ? new Date(r.last).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '-'}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* ── GROUP ASSIGNMENT TAB ── */}
                    {activeTab === 'groups' && <GroupAssignmentTab />}

                    {/* ── WEEKLY VIDEOS TAB ── */}
                    {activeTab === 'weekly-videos' && <WeeklyVideosTab />}

                    {/* ── CALENDAR TAB ── */}
                    {activeTab === 'calendar' && <CalendarTab />}

                    {/* ── DATABASE TABLES TAB ── */}
                    {activeTab === 'tables' && (
                        <div className="space-y-5 animate-in fade-in duration-300">
                            {/* Mobile table selector */}
                            <div className="md:hidden">
                                <Label htmlFor="table-select" className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5 block">Choose Table</Label>
                                <select
                                    id="table-select"
                                    value={selectedTable.name}
                                    onChange={e => {
                                        const found = TABLES_CONFIG.find(t => t.name === e.target.value);
                                        if (found) setSelectedTable(found);
                                    }}
                                    className="w-full text-xs h-9 px-3 rounded-lg border border-neutral-200 bg-white"
                                >
                                    {TABLES_CONFIG.map(t => <option key={t.name} value={t.name}>{t.label}</option>)}
                                </select>
                            </div>

                            {/* Header */}
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div>
                                    <h1 className="text-xl font-bold tracking-tight text-neutral-950">{selectedTable.label}</h1>
                                    <p className="text-neutral-500 text-xs mt-0.5">Browse, insert, edit, and delete records directly in the database.</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {!selectedTable.readOnly && (
                                        <Button onClick={openCreateDialog} className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs h-8 px-3 rounded-lg shadow-sm">
                                            <Plus className="mr-1 h-3.5 w-3.5" />
                                            Add Record
                                        </Button>
                                    )}
                                    <Button onClick={() => setIsExportDialogOpen(true)} variant="outline" className="border-neutral-300 text-neutral-700 bg-white font-medium text-xs h-8 px-3 rounded-lg hover:bg-neutral-50">
                                        <Download className="mr-1 h-3.5 w-3.5" />
                                        Export CSV
                                    </Button>
                                    <Button onClick={() => loadTableData(currentPage)} variant="outline" size="icon" className="h-8 w-8 bg-white border-neutral-300 hover:bg-neutral-50 rounded-lg text-neutral-600" title="Refresh">
                                        <RefreshCw className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Search + filter bar */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 flex items-center space-x-2 bg-white px-3 py-2 border border-neutral-200 rounded-lg shadow-xs">
                                        <Search className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                                        <Input
                                            type="text"
                                            placeholder={selectedTable.hasUserId ? 'Search by username or user ID…' : `Search by ${selectedTable.searchColumn}…`}
                                            value={searchQuery}
                                            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                            className="border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs px-0 h-6"
                                            aria-label="Search table"
                                        />
                                        {searchQuery && (
                                            <button onClick={() => { setSearchQuery(''); setCurrentPage(1); }} className="text-[10px] text-neutral-400 hover:text-neutral-900 font-bold">
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                    {(canGroupFilter || canDateFilter) && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowAdvFilters(p => !p)}
                                            className={`text-xs h-9 border-neutral-200 gap-1.5 rounded-lg ${hasActiveFilters ? 'bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800' : 'bg-white hover:bg-neutral-50 text-neutral-600'}`}
                                        >
                                            <Filter className="h-3 w-3" />
                                            Filters
                                            {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                                        </Button>
                                    )}
                                </div>

                                {showAdvFilters && (
                                    <div className="flex flex-wrap items-center gap-3 p-3 bg-white border border-neutral-200 rounded-lg animate-in fade-in slide-in-from-top-1 duration-150">
                                        {canDateFilter && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Date</span>
                                                <Input type="date" value={filterStartDate} onChange={e => { setFilterStartDate(e.target.value); setCurrentPage(1); }} className="text-xs h-7 w-32 border-neutral-200 rounded-md bg-neutral-50" />
                                                <span className="text-[10px] text-neutral-400">to</span>
                                                <Input type="date" value={filterEndDate} onChange={e => { setFilterEndDate(e.target.value); setCurrentPage(1); }} className="text-xs h-7 w-32 border-neutral-200 rounded-md bg-neutral-50" />
                                            </div>
                                        )}
                                        {canGroupFilter && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Group</span>
                                                <div className="flex rounded-md border border-neutral-200 overflow-hidden">
                                                    {(['all', 'cg', 'ex'] as GroupFilter[]).map(g => (
                                                        <button
                                                            key={g}
                                                            onClick={() => { setFilterGroup(g); setCurrentPage(1); }}
                                                            className={`px-2.5 py-1 text-[10px] font-semibold capitalize border-r border-neutral-200 last:border-0 transition-colors ${filterGroup === g ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
                                                        >
                                                            {g === 'all' ? 'All' : g === 'cg' ? 'Control' : 'Experimental'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {hasActiveFilters && (
                                            <button
                                                onClick={() => { setFilterStartDate(''); setFilterEndDate(''); setFilterGroup('all'); setCurrentPage(1); }}
                                                className="text-[10px] text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                                            >
                                                <X className="h-3 w-3" />
                                                Clear filters
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Table */}
                            <Card className="border border-neutral-200 bg-white overflow-hidden shadow-none rounded-lg">
                                {tableLoading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-neutral-50">
                                                <TableRow className="border-b border-neutral-200">
                                                    {selectedTable.tableColumns.map(col => {
                                                        const field = selectedTable.fields.find(f => f.name === col);
                                                        return (
                                                            <TableHead key={col} scope="col" className="text-neutral-700 font-semibold text-[11px] py-3">
                                                                {field?.label ?? col}
                                                            </TableHead>
                                                        );
                                                    })}
                                                    <TableHead scope="col" className="text-right text-neutral-700 font-semibold text-[11px] py-3 pr-5 w-20">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {paginatedData.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={selectedTable.tableColumns.length + 1} className="text-center py-10 text-neutral-400 text-xs">
                                                            {searchQuery || hasActiveFilters ? 'No records match the current filters.' : 'No records found.'}
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    paginatedData.map((row, idx) => (
                                                        <TableRow key={String(row[selectedTable.primaryKey] ?? idx)} className="hover:bg-neutral-50/40 border-b border-neutral-100 last:border-0">
                                                            {selectedTable.tableColumns.map(col => {
                                                                const val = row[col];
                                                                const field = selectedTable.fields.find(f => f.name === col);
                                                                if (field?.type === 'boolean') {
                                                                    return (
                                                                        <TableCell key={col} className="py-2.5 text-xs">
                                                                            <Badge className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${val ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 border border-neutral-200'}`}>
                                                                                {val ? 'YES' : 'NO'}
                                                                            </Badge>
                                                                        </TableCell>
                                                                    );
                                                                }
                                                                let display: string;
                                                                if (col === 'user_id' || (selectedTable.name === 'about_me_profiles' && col === 'id')) {
                                                                    display = resolveUser(val);
                                                                } else if (col === 'created_at' || col === 'updated_at' || col === 'event_date') {
                                                                    display = val ? new Date(String(val)).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) : '-';
                                                                } else {
                                                                    display = val !== null && val !== undefined ? String(val) : '-';
                                                                }
                                                                return (
                                                                    <TableCell key={col} className="py-2.5 text-xs max-w-[180px] truncate" title={String(val ?? '')}>
                                                                        {display}
                                                                    </TableCell>
                                                                );
                                                            })}
                                                            <TableCell className="text-right py-2.5 pr-5">
                                                                {!selectedTable.readOnly && (
                                                                    <div className="flex items-center justify-end gap-0.5">
                                                                        <Button
                                                                            onClick={() => openEditDialog(row)}
                                                                            variant="ghost" size="icon"
                                                                            className="h-7 w-7 hover:bg-neutral-100 text-neutral-500 rounded-md"
                                                                            aria-label="Edit row"
                                                                        >
                                                                            <Edit className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                        <Button
                                                                            onClick={() => setDeleteTargetId(row[selectedTable.primaryKey])}
                                                                            variant="ghost" size="icon"
                                                                            className="h-7 w-7 hover:bg-red-50 text-neutral-500 hover:text-red-600 rounded-md"
                                                                            aria-label="Delete row"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}

                                {/* Pagination */}
                                <div className="border-t border-neutral-200 px-5 py-3 flex items-center justify-between bg-neutral-50">
                                    <span className="text-[11px] font-medium text-neutral-500">
                                        {paginatedData.length === 0 ? '0 records' : `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, displayTotal)} of ${displayTotal} records`}
                                        {hasActiveFilters && <span className="ml-1 text-neutral-400">(filtered)</span>}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline" size="sm"
                                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="h-7 w-7 p-0 bg-white border-neutral-300 rounded-md"
                                        >
                                            <ChevronLeft className="h-3.5 w-3.5" />
                                        </Button>
                                        <span className="text-[11px] font-bold text-neutral-700">
                                            {currentPage} / {totalPages}
                                        </span>
                                        <Button
                                            variant="outline" size="sm"
                                            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="h-7 w-7 p-0 bg-white border-neutral-300 rounded-md"
                                        >
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </main>
            </div>

            {/* CRUD CREATE MODAL */}
            <CrudModal
                open={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSubmit={handleCreateSubmit}
                mode="create"
                table={mappedConfigForModal}
                values={formValues}
                onChange={handleFormChange}
            />

            {/* CRUD EDIT MODAL */}
            <CrudModal
                open={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSubmit={handleUpdateSubmit}
                mode="edit"
                table={mappedConfigForModal}
                values={formValues}
                onChange={handleFormChange}
            />

            {/* DELETE CONFIRM DIALOG */}
            <Dialog open={deleteTargetId !== null} onOpenChange={() => setDeleteTargetId(null)}>
                <DialogContent className="max-w-sm bg-white border border-neutral-200 rounded-xl shadow-lg">
                    <DialogHeader>
                        <DialogTitle className="text-neutral-950 font-bold text-base">Delete Record</DialogTitle>
                        <DialogDescription className="text-neutral-500 text-xs">
                            This will permanently remove this record from <strong>{selectedTable.label}</strong>. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => setDeleteTargetId(null)} className="text-xs border-neutral-200 text-neutral-600 rounded-lg">
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleDeleteConfirm} className="text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg">
                            Delete Record
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* EXPORT CSV DIALOG */}
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogContent className="max-w-md bg-white border border-neutral-200 rounded-xl shadow-lg">
                    <DialogHeader>
                        <DialogTitle className="text-neutral-950 font-bold text-base">Export CSV — {selectedTable.label}</DialogTitle>
                        <DialogDescription className="text-neutral-500 text-xs">
                            Exports all records (not just current page). Optionally filter by date range.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="exp-start" className="text-[11px] font-semibold text-neutral-700">Start Date</Label>
                                <Input id="exp-start" type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} className="text-xs h-9 bg-neutral-50 border-neutral-200 focus-visible:ring-0 rounded-lg" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="exp-end" className="text-[11px] font-semibold text-neutral-700">End Date</Label>
                                <Input id="exp-end" type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} className="text-xs h-9 bg-neutral-50 border-neutral-200 focus-visible:ring-0 rounded-lg" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="pt-4 border-t border-neutral-100 gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => { setExportStartDate(''); setExportEndDate(''); setIsExportDialogOpen(false); }} className="text-xs border-neutral-200 text-neutral-600 hover:bg-neutral-50 rounded-lg">
                            Cancel
                        </Button>
                        <Button onClick={triggerExportCSV} size="sm" disabled={exportLoading} className="text-xs bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg shadow-sm">
                            {exportLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Exporting…</> : 'Export All Data'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
