import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { 
    Loader2, 
    Download, 
    Users, 
    Activity, 
    Mic, 
    Plus, 
    Edit, 
    Trash2, 
    RefreshCw, 
    Calendar,
    ChevronRight,
    Search,
    LayoutDashboard,
    Database,
    LogOut,
    ChevronLeft,
    TrendingUp,
    Clock,
    ClipboardList,
    CheckSquare
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// Structured imports
import { TABLES_CONFIG } from '@/lib/tableConfig';
import { fetchOverviewMetrics, fetchTablePage } from '@/lib/adminData';
import { useUserMap } from '@/hooks/useUserMap';
import { CrudModal } from '@/components/admin/CrudModal';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'tables' | 'analytics'>('overview');
    const [selectedTable, setSelectedTable] = useState(TABLES_CONFIG[0]);
    const [tableData, setTableData] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [overviewLoading, setOverviewLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);
    const [totalTableCount, setTotalTableCount] = useState(0);
    // Analytics states
    const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'today' | 'week' | 'month'>('week');
    const [analyticsData, setAnalyticsData] = useState<{
        dailySliders: any[];
        voiceRecordings: any[];
        calendarEvents: any[];
        pss10: any[];
        wemwbs14: any[];
        ffmq15: any[];
    }>({
        dailySliders: [],
        voiceRecordings: [],
        calendarEvents: [],
        pss10: [],
        wemwbs14: [],
        ffmq15: [],
    });
    const analyticsCache = useRef<Record<string, {
        dailySliders: any[];
        voiceRecordings: any[];
        calendarEvents: any[];
        pss10: any[];
        wemwbs14: any[];
        ffmq15: any[];
    }>>({});
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    
    // User maps resolving hook
    const { userMap, resolveUser, findUserIdsByName, refreshUserMap } = useUserMap();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;

    // Time frame state for Export
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [exportStartDate, setExportStartDate] = useState('');
    const [exportEndDate, setExportEndDate] = useState('');
    
    // Overview Metrics state
    const [profilesCount, setProfilesCount] = useState(0);
    const [dailyCount, setDailyCount] = useState(0);
    const [voiceCount, setVoiceCount] = useState(0);
    const [calendarCount, setCalendarCount] = useState(0);
    const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    
    // CRUD Modals state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState<any | null>(null);
    const [formValues, setFormValues] = useState<Record<string, any>>({});

    useEffect(() => {
        loadOverviewData();
    }, []);

    useEffect(() => {
        if (activeTab === 'tables') {
            setCurrentPage(1);
        } else if (activeTab === 'analytics') {
            const cacheKey = analyticsTimeframe;
            if (analyticsCache.current[cacheKey]) {
                setAnalyticsData(analyticsCache.current[cacheKey]);
            } else {
                loadAnalyticsData(analyticsTimeframe);
            }
        }
    }, [selectedTable, activeTab, analyticsTimeframe]);

    useEffect(() => {
        if (activeTab === 'tables') loadTableData(currentPage);
    }, [currentPage, selectedTable.name, activeTab]);

    const loadAnalyticsData = async (timeframe: 'today' | 'week' | 'month') => {
        setAnalyticsLoading(true);
        try {
            const now = new Date();
            let startDate = new Date();
            if (timeframe === 'today') {
                startDate.setHours(0, 0, 0, 0);
            } else if (timeframe === 'week') {
                startDate.setDate(now.getDate() - 7);
            } else if (timeframe === 'month') {
                startDate.setDate(now.getDate() - 30);
            }
            const dateStr = startDate.toISOString();

            const [daily, voice, calendar, pss, wemwbs, ffmq] = await Promise.all([
                supabase.from('daily_sliders').select('*').gte('created_at', dateStr).order('created_at', { ascending: true }),
                supabase.from('voice_recordings').select('*').gte('created_at', dateStr),
                supabase.from('calendar_events').select('*').gte('created_at', dateStr),
                supabase.from('questionnaire_pss10_responses').select('*').gte('created_at', dateStr),
                supabase.from('questionnaire_wemwbs14_responses').select('*').gte('created_at', dateStr),
                supabase.from('questionnaire_ffmq15_responses').select('*').gte('created_at', dateStr),
            ]);

            const next = {
                dailySliders: daily.data || [],
                voiceRecordings: voice.data || [],
                calendarEvents: calendar.data || [],
                pss10: pss.data || [],
                wemwbs14: wemwbs.data || [],
                ffmq15: ffmq.data || [],
            };
            setAnalyticsData(next);
            analyticsCache.current[timeframe] = next;
        } catch (err: any) {
            toast.error(`Error loading analytics: ${err.message}`);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            toast.success("Successfully logged out");
            navigate('/login');
        } catch (error: any) {
            toast.error(error.message || "Failed to log out");
        }
    };

    const loadOverviewData = async () => {
        setOverviewLoading(true);
        try {
            const metrics = await fetchOverviewMetrics();
            setProfilesCount(metrics.profilesCount);
            setDailyCount(metrics.dailyCount);
            setVoiceCount(metrics.voiceCount);
            setCalendarCount(metrics.calendarCount);
            setRecentSubmissions(metrics.recentSubmissions);
            setChartData(metrics.chartData);
        } catch (err: any) {
            toast.error(`Error loading dashboard: ${err.message}`);
        } finally {
            setOverviewLoading(false);
        }
    };

    const loadTableData = async (page = currentPage) => {
        setTableLoading(true);
        try {
            const { rows, total } = await fetchTablePage(
                selectedTable.name,
                selectedTable.primaryKey,
                page,
                pageSize
            );
            setTableData(rows);
            setTotalTableCount(total);
        } catch (err: any) {
            toast.error(`Error fetching table data: ${err.message}`);
        } finally {
            setTableLoading(false);
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedTable.readOnly) return;

        const payload: Record<string, any> = {};
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
            toast.success("Record created successfully");
            setIsCreateOpen(false);
            setFormValues({});
            loadTableData(currentPage);
            loadOverviewData();
            if (selectedTable.name === 'profiles') refreshUserMap();
        } catch (err: any) {
            toast.error(`Create failed: ${err.message}`);
        }
    };

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRow || selectedTable.readOnly) return;

        const payload: Record<string, any> = {};
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
            toast.success("Record updated successfully");
            setIsEditOpen(false);
            setSelectedRow(null);
            setFormValues({});
            loadTableData(currentPage);
            if (selectedTable.name === 'profiles') refreshUserMap();
        } catch (err: any) {
            toast.error(`Update failed: ${err.message}`);
        }
    };

    const handleDelete = async (id: any) => {
        if (selectedTable.readOnly) return;
        if (!confirm("Are you sure you want to delete this record? This action is permanent.")) return;

        try {
            const { error } = await supabase
                .from(selectedTable.name)
                .delete()
                .eq(selectedTable.primaryKey, id);

            if (error) throw error;
            toast.success("Record deleted successfully");
            loadTableData(currentPage);
            loadOverviewData();
            if (selectedTable.name === 'profiles') refreshUserMap();
        } catch (err: any) {
            toast.error(`Delete failed: ${err.message}`);
        }
    };

    const triggerExportCSV = () => {
        let filtered = tableData;

        // Apply time frame filter if specified
        if (exportStartDate || exportEndDate) {
            filtered = tableData.filter(row => {
                const dateVal = row.created_at || row.updated_at || row.event_date || row.published_at;
                if (!dateVal) return true;
                const rowDate = new Date(dateVal);
                if (exportStartDate && rowDate < new Date(exportStartDate)) return false;
                if (exportEndDate) {
                    const limitDate = new Date(exportEndDate);
                    limitDate.setHours(23, 59, 59, 999);
                    if (rowDate > limitDate) return false;
                }
                return true;
            });
        }

        if (filtered.length === 0) {
            toast.error("No data matching the selected timeframe");
            return;
        }

        const headers = Object.keys(filtered[0]);
        const csvContent = [
            headers.join(','),
            ...filtered.map(row => headers.map(fieldName => {
                const val = row[fieldName];
                if (val === null || val === undefined) return '';
                const valStr = String(val).replace(/"/g, '""');
                return valStr.includes(',') || valStr.includes('\n') || valStr.includes('"') ? `"${valStr}"` : valStr;
            }).join(','))
        ].join('\r\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${selectedTable.name}_export_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Exported ${filtered.length} rows successfully`);
        setIsExportDialogOpen(false);
    };

    const openCreateDialog = () => {
        const defaults: Record<string, any> = {};
        selectedTable.fields.forEach(f => {
            if (f.defaultValue !== undefined) defaults[f.name] = f.defaultValue;
        });
        setFormValues(defaults);
        setIsCreateOpen(true);
    };

    const openEditDialog = (row: any) => {
        setSelectedRow(row);
        const vals: Record<string, any> = {};
        selectedTable.fields.forEach(f => {
            vals[f.name] = row[f.name] ?? '';
        });
        setFormValues(vals);
        setIsEditOpen(true);
    };

    const handleFormChange = (field: string, value: any) => {
        setFormValues(prev => ({ ...prev, [field]: value }));
    };

    // Filter table content based on search query, with support for searching by username
    const filteredTableData = tableData.filter(row => {
        if (!searchQuery) return true;

        // If the table config points to user_id or id, look up username
        if (selectedTable.hasUserId) {
            const matchingIds = findUserIdsByName(searchQuery);
            if (matchingIds.includes(row.user_id)) return true;
            if (row.user_id && row.user_id.toLowerCase().includes(searchQuery.toLowerCase())) return true;
        } else if (selectedTable.name === 'profiles') {
            const username = row.username || '';
            const researchId = row.research_id || '';
            return username.toLowerCase().includes(searchQuery.toLowerCase()) || researchId.toLowerCase().includes(searchQuery.toLowerCase());
        }

        const val = row[selectedTable.searchColumn];
        if (!val) return false;
        return String(val).toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Pagination calculations
    const totalPages = searchQuery
        ? Math.ceil(filteredTableData.length / pageSize) || 1
        : Math.ceil(totalTableCount / pageSize) || 1;
    const paginatedData = searchQuery
        ? filteredTableData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        : filteredTableData;
    const displayTotal = searchQuery ? filteredTableData.length : totalTableCount;

    // Dynamically inject profiles list into fields requiring a user_id
    const mappedConfigForModal = {
        ...selectedTable,
        fields: selectedTable.fields.map(field => {
            if (field.name === 'user_id') {
                return {
                    ...field,
                    type: 'select' as const,
                    options: Array.from(userMap.entries()).map(([id, name]) => ({
                        label: `${name} (${id.slice(0, 6)})`,
                        value: id
                    }))
                };
            }
            return field;
        })
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col font-sans antialiased text-neutral-900 selection:bg-neutral-900 selection:text-neutral-50">
            {/* Header */}
            <header className="border-b border-neutral-200 bg-white sticky top-0 z-30">
                <div className="flex h-16 items-center px-6 justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-neutral-900 flex items-center justify-center rounded">
                            <Database className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-bold tracking-tight text-neutral-950">MindFlow Panel</span>
                        <span className="text-xs px-2 py-0.5 bg-neutral-100 rounded text-neutral-600 border border-neutral-200">Admin</span>
                    </div>

                    <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Administrator</span>
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleLogout}
                            className="text-neutral-500 hover:text-neutral-900 flex items-center gap-1.5"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </header>

            {/* Workspace */}
            <div className="flex flex-1 overflow-hidden">
                
                {/* Left Sidebar */}
                <aside className="w-64 border-r border-neutral-200 bg-white p-4 space-y-6 flex-shrink-0 hidden md:block">
                    <div className="space-y-1">
                        <Button
                            variant={activeTab === 'overview' ? 'secondary' : 'ghost'}
                            className={`w-full justify-start gap-2.5 font-medium ${activeTab === 'overview' ? 'bg-neutral-100 text-neutral-950' : 'text-neutral-600'}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            <LayoutDashboard className="h-4.5 w-4.5" />
                            Dashboard Overview
                        </Button>
                        <Button
                            variant={activeTab === 'tables' ? 'secondary' : 'ghost'}
                            className={`w-full justify-start gap-2.5 font-medium ${activeTab === 'tables' ? 'bg-neutral-100 text-neutral-950' : 'text-neutral-600'}`}
                            onClick={() => setActiveTab('tables')}
                        >
                            <Database className="h-4.5 w-4.5" />
                            Database Tables
                        </Button>
                        <Button
                            variant={activeTab === 'analytics' ? 'secondary' : 'ghost'}
                            className={`w-full justify-start gap-2.5 font-medium ${activeTab === 'analytics' ? 'bg-neutral-100 text-neutral-950' : 'text-neutral-600'}`}
                            onClick={() => setActiveTab('analytics')}
                        >
                            <TrendingUp className="h-4.5 w-4.5" />
                            Timeframe Analytics
                        </Button>
                    </div>

                    {activeTab === 'tables' && (
                        <div className="pt-4 border-t border-neutral-100">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-3 mb-2">Available Tables</p>
                            <div className="space-y-0.5 overflow-y-auto max-h-[calc(100vh-270px)]">
                                {TABLES_CONFIG.map(table => (
                                    <button
                                        key={table.name}
                                        onClick={() => {
                                            setSelectedTable(table);
                                            setSearchQuery('');
                                        }}
                                        className={`w-full text-left px-3 py-2 text-xs font-medium rounded transition-all flex items-center justify-between ${
                                            selectedTable.name === table.name
                                                ? 'bg-neutral-950 text-white font-semibold'
                                                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                                        }`}
                                    >
                                        <span>{table.label}</span>
                                        {selectedTable.name === table.name && <ChevronRight className="h-3 w-3" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>

                {/* Main View */}
                <main className="flex-1 overflow-y-auto p-8">
                    
                    {(activeTab === 'overview' && overviewLoading) || (activeTab === 'tables' && tableLoading) ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-neutral-900" />
                        </div>
                    ) : null}

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight text-neutral-950">Overview</h1>
                                <p className="text-neutral-500 text-sm mt-1">Real-time trial statistics and participant response metrics.</p>
                            </div>

                            {/* Cards */}
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                <Card className="border border-neutral-200 shadow-xs bg-white">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-neutral-500">Participants</CardTitle>
                                        <Users className="h-4.5 w-4.5 text-neutral-400" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold tracking-tight">{profilesCount}</div>
                                        <p className="text-[11px] text-neutral-400 mt-1">Total active trial accounts</p>
                                    </CardContent>
                                </Card>

                                <Card className="border border-neutral-200 shadow-xs bg-white">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-neutral-500">Daily Sliders</CardTitle>
                                        <Activity className="h-4.5 w-4.5 text-neutral-400" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold tracking-tight">{dailyCount}</div>
                                        <p className="text-[11px] text-neutral-400 mt-1">Total checkins logged</p>
                                    </CardContent>
                                </Card>

                                <Card className="border border-neutral-200 shadow-xs bg-white">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-neutral-500">Voice Logs</CardTitle>
                                        <Mic className="h-4.5 w-4.5 text-neutral-400" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold tracking-tight">{voiceCount}</div>
                                        <p className="text-[11px] text-neutral-400 mt-1">Voice responses stored</p>
                                    </CardContent>
                                </Card>

                                <Card className="border border-neutral-200 shadow-xs bg-white">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-neutral-500">Calendar Actions</CardTitle>
                                        <Calendar className="h-4.5 w-4.5 text-neutral-400" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold tracking-tight">{calendarCount}</div>
                                        <p className="text-[11px] text-neutral-400 mt-1">Global schedule checkpoints</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Chart & Stream */}
                            <div className="grid gap-6 lg:grid-cols-7">
                                <Card className="lg:col-span-4 border border-neutral-200 bg-white">
                                    <CardHeader>
                                        <CardTitle className="text-base font-semibold">Activity Timeline</CardTitle>
                                        <CardDescription className="text-xs">Checks logged by all participants over the last 7 days.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pl-1">
                                        <div className="h-[280px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={chartData}>
                                                    <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                                                    <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                                                    <Tooltip contentStyle={{ background: '#000', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '12px' }} />
                                                    <Line type="monotone" dataKey="checkins" stroke="#171717" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, stroke: '#171717', fill: '#fff' }} activeDot={{ r: 6 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="lg:col-span-3 border border-neutral-200 bg-white">
                                    <CardHeader>
                                        <CardTitle className="text-base font-semibold">Latest Actions</CardTitle>
                                        <CardDescription className="text-xs">Real-time check-in logs and user mood indices.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {recentSubmissions.length === 0 ? (
                                                <div className="text-center py-8 text-neutral-400 text-xs">No entries found.</div>
                                            ) : (
                                                recentSubmissions.map((row) => (
                                                    <div className="flex items-center gap-3 border-b border-neutral-100 pb-3 last:border-0 last:pb-0" key={row.id}>
                                                        <Avatar className="h-8 w-8 bg-neutral-900 border border-neutral-200">
                                                            <AvatarFallback className="text-white text-[10px] font-bold">U</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-semibold text-neutral-900 truncate">
                                                                {resolveUser(row.user_id)}
                                                            </p>
                                                            <p className="text-[10px] text-neutral-400">
                                                                {new Date(row.created_at).toLocaleDateString()} at {new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <Badge variant="outline" className="text-[9px] font-bold border-neutral-900 px-1.5 py-0.5 bg-neutral-950 text-white rounded">
                                                                Mood: {row.mood}
                                                            </Badge>
                                                            <Badge variant="outline" className="text-[9px] font-semibold px-1.5 py-0.5 border-neutral-200 rounded">
                                                                Stress: {row.stress_level}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* ANALYTICS TAB */}
                    {activeTab === 'analytics' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight text-neutral-950">Timeframe Analytics</h1>
                                    <p className="text-neutral-500 text-sm mt-1">Aggregated participant data and engagement indexes.</p>
                                </div>
                                <div className="flex bg-neutral-100 p-1 border border-neutral-200 rounded-lg shrink-0">
                                    {(['today', 'week', 'month'] as const).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setAnalyticsTimeframe(t)}
                                            className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-all ${
                                                analyticsTimeframe === t
                                                    ? 'bg-white text-neutral-950 shadow-xs'
                                                    : 'text-neutral-500 hover:text-neutral-900'
                                            }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {analyticsLoading ? (
                                <div className="flex flex-col items-center justify-center py-24 gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-neutral-900" />
                                    <span className="text-xs font-medium text-neutral-500">Aggregating timeframe records…</span>
                                </div>
                            ) : (
                                <>
                                    {/* Metrics Grid */}
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                        <Card className="border border-neutral-200 bg-white">
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-neutral-500">Active Participants</CardTitle>
                                                <Users className="h-4.5 w-4.5 text-neutral-400" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-3xl font-bold tracking-tight">
                                                    {(() => {
                                                        const uids = new Set([
                                                            ...analyticsData.dailySliders.map(d => d.user_id),
                                                            ...analyticsData.voiceRecordings.map(d => d.user_id),
                                                            ...analyticsData.pss10.map(d => d.user_id),
                                                            ...analyticsData.wemwbs14.map(d => d.user_id),
                                                            ...analyticsData.ffmq15.map(d => d.user_id),
                                                        ].filter(Boolean));
                                                        return uids.size;
                                                    })()}
                                                </div>
                                                <p className="text-[11px] text-neutral-400 mt-1">Unique active participants in period</p>
                                            </CardContent>
                                        </Card>

                                        <Card className="border border-neutral-200 bg-white">
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-neutral-500">Avg Stress Level</CardTitle>
                                                <Activity className="h-4.5 w-4.5 text-neutral-400" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-3xl font-bold tracking-tight">
                                                    {analyticsData.dailySliders.length > 0
                                                        ? (analyticsData.dailySliders.reduce((sum, item) => sum + item.stress_level, 0) / analyticsData.dailySliders.length).toFixed(2)
                                                        : '-'}
                                                </div>
                                                <p className="text-[11px] text-neutral-400 mt-1">Scale of 1 (low) to 5 (high)</p>
                                            </CardContent>
                                        </Card>

                                        <Card className="border border-neutral-200 bg-white">
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-neutral-500">Avg Mood Index</CardTitle>
                                                <Activity className="h-4.5 w-4.5 text-neutral-400" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-3xl font-bold tracking-tight">
                                                    {analyticsData.dailySliders.length > 0
                                                        ? (analyticsData.dailySliders.reduce((sum, item) => sum + item.mood, 0) / analyticsData.dailySliders.length).toFixed(2)
                                                        : '-'}
                                                </div>
                                                <p className="text-[11px] text-neutral-400 mt-1">Scale of 1 (poor) to 5 (excellent)</p>
                                            </CardContent>
                                        </Card>

                                        <Card className="border border-neutral-200 bg-white">
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-neutral-500">Practice Minutes</CardTitle>
                                                <Clock className="h-4.5 w-4.5 text-neutral-400" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-3xl font-bold tracking-tight">
                                                    {analyticsData.dailySliders.reduce((sum, item) => sum + (item.practice_duration || 0), 0)}
                                                </div>
                                                <p className="text-[11px] text-neutral-400 mt-1">Cumulative duration in period</p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Charts and Breakdown */}
                                    <div className="grid gap-6 lg:grid-cols-7">
                                        {/* Trends Chart */}
                                        <Card className="lg:col-span-4 border border-neutral-200 bg-white">
                                            <CardHeader>
                                                <CardTitle className="text-base font-semibold">Stress & Mood Trends</CardTitle>
                                                <CardDescription className="text-xs">Visual tracking of participant averages over time.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="pl-1">
                                                <div className="h-[280px]">
                                                    {(() => {
                                                        const grouped = new Map<string, { moodSum: number; stressSum: number; count: number }>();
                                                        analyticsData.dailySliders.forEach(slider => {
                                                            const rawDate = new Date(slider.created_at);
                                                            const key = analyticsTimeframe === 'today'
                                                                ? rawDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                                : rawDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
                                                            
                                                            const ext = grouped.get(key) || { moodSum: 0, stressSum: 0, count: 0 };
                                                            ext.moodSum += slider.mood;
                                                            ext.stressSum += slider.stress_level;
                                                            ext.count += 1;
                                                            grouped.set(key, ext);
                                                        });

                                                        const chartPoints = Array.from(grouped.entries()).map(([label, s]) => ({
                                                            label,
                                                            Mood: Number((s.moodSum / s.count).toFixed(2)),
                                                            Stress: Number((s.stressSum / s.count).toFixed(2)),
                                                        }));

                                                        if (chartPoints.length === 0) {
                                                            return <div className="h-full flex items-center justify-center text-xs text-neutral-400">No telemetry data recorded in this range.</div>;
                                                        }

                                                        return (
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <LineChart data={chartPoints}>
                                                                    <XAxis dataKey="label" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                                                                    <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} domain={[1, 5]} />
                                                                    <Tooltip contentStyle={{ background: '#000', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '11px' }} />
                                                                    <Line type="monotone" dataKey="Mood" stroke="#171717" strokeWidth={2} dot={{ r: 3 }} />
                                                                    <Line type="monotone" dataKey="Stress" stroke="#a3a3a3" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                                                                </LineChart>
                                                            </ResponsiveContainer>
                                                        );
                                                    })()}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Activity Breakdown */}
                                        <Card className="lg:col-span-3 border border-neutral-200 bg-white">
                                            <CardHeader>
                                                <CardTitle className="text-base font-semibold">Submissions Breakdown</CardTitle>
                                                <CardDescription className="text-xs">Summary of all research entities loaded in period.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                                                    <span className="text-xs font-medium text-neutral-600 flex items-center gap-1.5">
                                                        <Activity className="h-4 w-4 text-neutral-400" />
                                                        Daily Check-ins
                                                    </span>
                                                    <span className="text-xs font-bold text-neutral-900">{analyticsData.dailySliders.length}</span>
                                                </div>
                                                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                                                    <span className="text-xs font-medium text-neutral-600 flex items-center gap-1.5">
                                                        <Mic className="h-4 w-4 text-neutral-400" />
                                                        Voice Submissions
                                                    </span>
                                                    <span className="text-xs font-bold text-neutral-900">{analyticsData.voiceRecordings.length}</span>
                                                </div>
                                                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                                                    <span className="text-xs font-medium text-neutral-600 flex items-center gap-1.5">
                                                        <CheckSquare className="h-4 w-4 text-neutral-400" />
                                                        Calendar Completes
                                                    </span>
                                                    <span className="text-xs font-bold text-neutral-900">{analyticsData.calendarEvents.filter(e => e.is_completed).length}</span>
                                                </div>
                                                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                                                    <span className="text-xs font-medium text-neutral-600 flex items-center gap-1.5">
                                                        <ClipboardList className="h-4 w-4 text-neutral-400" />
                                                        PSS-10 Questionnaires
                                                    </span>
                                                    <span className="text-xs font-bold text-neutral-900">{analyticsData.pss10.length}</span>
                                                </div>
                                                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                                                    <span className="text-xs font-medium text-neutral-600 flex items-center gap-1.5">
                                                        <ClipboardList className="h-4 w-4 text-neutral-400" />
                                                        WEMWBS-14 Questionnaires
                                                    </span>
                                                    <span className="text-xs font-bold text-neutral-900">{analyticsData.wemwbs14.length}</span>
                                                </div>
                                                <div className="flex items-center justify-between pb-1">
                                                    <span className="text-xs font-medium text-neutral-600 flex items-center gap-1.5">
                                                        <ClipboardList className="h-4 w-4 text-neutral-400" />
                                                        FFMQ-15 Questionnaires
                                                    </span>
                                                    <span className="text-xs font-bold text-neutral-900">{analyticsData.ffmq15.length}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Participant Engagement Leaderboard */}
                                    <Card className="border border-neutral-200 bg-white">
                                        <CardHeader>
                                            <CardTitle className="text-base font-semibold">Participant Engagement Index</CardTitle>
                                            <CardDescription className="text-xs">Active researchers ranked by contributions during this time period.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader className="bg-neutral-50">
                                                        <TableRow className="border-b border-neutral-200">
                                                            <TableHead className="text-xs font-semibold py-2">Participant</TableHead>
                                                            <TableHead className="text-xs font-semibold py-2">Check-ins logged</TableHead>
                                                            <TableHead className="text-xs font-semibold py-2">Voice recordings</TableHead>
                                                            <TableHead className="text-xs font-semibold py-2 text-right">Last Contribution</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {(() => {
                                                            const eMap = new Map<string, { checkins: number; voice: number; last: string }>();
                                                            analyticsData.dailySliders.forEach(s => {
                                                                const stats = eMap.get(s.user_id) || { checkins: 0, voice: 0, last: '' };
                                                                stats.checkins += 1;
                                                                if (!stats.last || s.created_at > stats.last) stats.last = s.created_at;
                                                                eMap.set(s.user_id, stats);
                                                            });
                                                            analyticsData.voiceRecordings.forEach(v => {
                                                                const stats = eMap.get(v.user_id) || { checkins: 0, voice: 0, last: '' };
                                                                stats.voice += 1;
                                                                if (!stats.last || v.created_at > stats.last) stats.last = v.created_at;
                                                                eMap.set(v.user_id, stats);
                                                            });

                                                            const rows = Array.from(eMap.entries()).map(([userId, stats]) => ({
                                                                userId,
                                                                ...stats
                                                            })).sort((a, b) => (b.checkins + b.voice) - (a.checkins + a.voice));

                                                            if (rows.length === 0) {
                                                                return (
                                                                    <TableRow>
                                                                        <TableCell colSpan={4} className="text-center py-6 text-xs text-neutral-400">
                                                                            No participant contributions found in this timeframe.
                                                                        </TableCell>
                                                                    </TableRow>
                                                                );
                                                            }

                                                            return rows.map((r, idx) => (
                                                                <TableRow key={r.userId || idx} className="hover:bg-neutral-50/40 border-b border-neutral-100 last:border-0">
                                                                    <TableCell className="py-2.5 text-xs font-semibold">{resolveUser(r.userId)}</TableCell>
                                                                    <TableCell className="py-2.5 text-xs">{r.checkins}</TableCell>
                                                                    <TableCell className="py-2.5 text-xs">{r.voice}</TableCell>
                                                                    <TableCell className="py-2.5 text-xs text-right text-neutral-500">
                                                                        {r.last ? new Date(r.last).toLocaleDateString() : '-'}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ));
                                                        })()}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </>
                            )}
                        </div>
                    )}

                    {/* DATABASE TABLES TAB */}
                    {activeTab === 'tables' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            
                            {/* Table Selector for smaller layouts */}
                            <div className="md:hidden">
                                <Label htmlFor="table-select" className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Choose Table</Label>
                                <select
                                    id="table-select"
                                    value={selectedTable.name}
                                    onChange={(e) => {
                                        const found = TABLES_CONFIG.find(t => t.name === e.target.value);
                                        if (found) setSelectedTable(found);
                                    }}
                                    className="w-full text-xs h-9 px-3 rounded-lg border border-neutral-200 bg-white"
                                >
                                    {TABLES_CONFIG.map(t => (
                                        <option key={t.name} value={t.name}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Header Panel */}
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-neutral-950">{selectedTable.label}</h1>
                                    <p className="text-neutral-500 text-xs mt-0.5">Edit, insert, and delete records directly inside Supabase database.</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {!selectedTable.readOnly && (
                                    <Button
                                        onClick={openCreateDialog}
                                        className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs h-9 px-3.5 rounded-lg shadow-sm"
                                    >
                                        <Plus className="mr-1.5 h-4 w-4" />
                                        Add Record
                                    </Button>
                                    )}
                                    <Button
                                        onClick={() => setIsExportDialogOpen(true)}
                                        variant="outline"
                                        className="border-neutral-300 text-neutral-700 bg-white font-medium text-xs h-9 px-3.5 rounded-lg hover:bg-neutral-50"
                                    >
                                        <Download className="mr-1.5 h-4 w-4" />
                                        Export CSV
                                    </Button>
                                    <Button
                                        onClick={() => loadTableData(currentPage)}
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9 bg-white border-neutral-300 hover:bg-neutral-50 rounded-lg text-neutral-600"
                                        title="Sync Table"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Filter Bar */}
                            <div className="flex items-center space-x-2.5 bg-white px-3 py-2 border border-neutral-200 rounded-lg shadow-xs">
                                <Search className="h-4 w-4 text-neutral-400" />
                                <Input
                                    type="text"
                                    placeholder={selectedTable.hasUserId ? "Search by username or user ID…" : `Search by ${selectedTable.searchColumn}…`}
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs px-0 h-7"
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => {
                                            setSearchQuery('');
                                            setCurrentPage(1);
                                        }}
                                        className="text-[10px] text-neutral-400 hover:text-neutral-950 font-bold px-1"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            {/* Main Table view */}
                            <Card className="border border-neutral-200 bg-white overflow-hidden shadow-sm rounded-lg">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-neutral-50">
                                            <TableRow className="border-b border-neutral-200">
                                                {selectedTable.tableColumns.map(col => {
                                                    const field = selectedTable.fields.find(f => f.name === col);
                                                    return (
                                                        <TableHead key={col} className="text-neutral-700 font-semibold text-xs py-3">
                                                            {field ? field.label : col}
                                                        </TableHead>
                                                    );
                                                })}
                                                <TableHead className="text-right text-neutral-700 font-semibold text-xs py-3 pr-6 w-24">
                                                    Actions
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedData.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={selectedTable.tableColumns.length + 1} className="text-center py-10 text-neutral-400 text-xs font-medium">
                                                        No database rows found.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                paginatedData.map((row, idx) => (
                                                    <TableRow key={row[selectedTable.primaryKey] || idx} className="hover:bg-neutral-50/40 border-b border-neutral-100 last:border-0">
                                                        {selectedTable.tableColumns.map(col => {
                                                            const val = row[col];
                                                            let renderedVal = String(val ?? '-');
                                                            const field = selectedTable.fields.find(f => f.name === col);

                                                            // Determine output display format
                                                            if (col === 'user_id' || (selectedTable.name === 'about_me_profiles' && col === 'id')) {
                                                                renderedVal = resolveUser(val);
                                                            } else if (field?.type === 'boolean') {
                                                                return (
                                                                    <TableCell key={col} className="py-2.5 text-xs">
                                                                        <Badge className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${val ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 border border-neutral-200'}`}>
                                                                            {val ? 'TRUE' : 'FALSE'}
                                                                        </Badge>
                                                                    </TableCell>
                                                                );
                                                            } else if (col === 'created_at' || col === 'updated_at') {
                                                                renderedVal = val ? new Date(val).toLocaleDateString() : '-';
                                                            }

                                                            return (
                                                                <TableCell key={col} className="py-2.5 text-xs max-w-[200px] truncate" title={String(val || '')}>
                                                                    {renderedVal}
                                                                </TableCell>
                                                            );
                                                        })}
                                                        <TableCell className="text-right py-2.5 pr-6">
                                                            {!selectedTable.readOnly && (
                                                            <div className="flex items-center justify-end space-x-1">
                                                                <Button
                                                                    onClick={() => openEditDialog(row)}
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 hover:bg-neutral-100 text-neutral-600 rounded-md"
                                                                    title="Edit Row"
                                                                >
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleDelete(row[selectedTable.primaryKey])}
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 hover:bg-red-50 text-red-600 rounded-md"
                                                                    title="Delete Row"
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

                                {/* Pagination controls */}
                                <div className="border-t border-neutral-200 px-6 py-3.5 flex items-center justify-between bg-neutral-50">
                                    <span className="text-[11px] font-medium text-neutral-500">
                                        Showing {paginatedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, displayTotal)} of {displayTotal} records
                                    </span>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="h-8 w-8 p-0 bg-white border-neutral-300 rounded-md"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="text-[11px] font-bold text-neutral-700">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="h-8 w-8 p-0 bg-white border-neutral-300 rounded-md"
                                        >
                                            <ChevronRight className="h-4 w-4" />
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

            {/* EXPORT CSV WITH DATE TIME FRAME DIALOG */}
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogContent className="max-w-md bg-white border border-neutral-200 rounded-xl shadow-lg">
                    <DialogHeader>
                        <DialogTitle className="text-neutral-950 font-bold text-base">Export CSV Data</DialogTitle>
                        <DialogDescription className="text-neutral-500 text-xs">
                            Optionally specify a timeframe to extract records. Leave both blank to download all table contents.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="start-date" className="text-[11px] font-semibold text-neutral-700">Start Date</Label>
                                <Input
                                    id="start-date"
                                    type="date"
                                    value={exportStartDate}
                                    onChange={e => setExportStartDate(e.target.value)}
                                    className="text-xs h-9 bg-neutral-50 border-neutral-200 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="end-date" className="text-[11px] font-semibold text-neutral-700">End Date</Label>
                                <Input
                                    id="end-date"
                                    type="date"
                                    value={exportEndDate}
                                    onChange={e => setExportEndDate(e.target.value)}
                                    className="text-xs h-9 bg-neutral-50 border-neutral-200 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t border-neutral-100 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setExportStartDate('');
                                setExportEndDate('');
                                setIsExportDialogOpen(false);
                            }}
                            className="text-xs border-neutral-200 text-neutral-600 hover:bg-neutral-50 rounded-lg"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={triggerExportCSV}
                            size="sm"
                            className="text-xs bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg shadow-sm"
                        >
                            Export Table
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
