'use client';

import React, { useEffect, useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Code2, Flame, Trophy, BookOpen, Plus, Loader2, X, Send, StickyNote, Swords, ChevronRight, Monitor } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

const VSCodeIDE = lazy(() => import('@/components/code-arena/vscode-ide'));

type Tab = 'problems' | 'ide' | 'notes' | 'contests' | 'leaderboard';

export default function CodeArenaPage() {
    const { user } = useAuth();
    const [tab, setTab] = useState<Tab>('problems');
    const [problems, setProblems] = useState<any[]>([]);
    const [streak, setStreak] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedProblem, setSelectedProblem] = useState<any>(null);
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [submitting, setSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<any>(null);
    const [notes, setNotes] = useState<any[]>([]);
    const [contests, setContests] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [showNewProblem, setShowNewProblem] = useState(false);
    const [showNewNote, setShowNewNote] = useState(false);
    const [showNewContest, setShowNewContest] = useState(false);
    const [newProblem, setNewProblem] = useState({ title: '', description: '', difficulty: 'EASY', tags: '', sampleInput: '', sampleOutput: '', points: 10, inputFormat: '', outputFormat: '', constraints: '' });
    const [newNote, setNewNote] = useState({ title: '', content: '', tags: '' });
    const [newContest, setNewContest] = useState({ title: '', description: '', startTime: '', endTime: '', problemIds: [] as string[] });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const isFaculty = user?.role === 'FACULTY' || user?.role === 'HOD' || user?.role === 'ADMIN';
    const isStudent = user?.role === 'STUDENT';

    useEffect(() => {
        loadData();
    }, [tab]);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            if (tab === 'problems' || tab === 'ide') {
                const p = await api.get<any[]>('/code-arena/problems');
                setProblems(p);
                if (isStudent) {
                    try {
                        const s = await api.get('/code-arena/streaks/my');
                        setStreak(s);
                        const st = await api.get('/code-arena/stats/my');
                        setStats(st);
                    } catch { }
                }
            }
            if (tab === 'notes' && isStudent) {
                const n = await api.get<any[]>('/code-arena/notes/my');
                setNotes(n);
            }
            if (tab === 'contests') {
                const c = await api.get<any[]>('/code-arena/contests');
                setContests(c);
            }
            if (tab === 'leaderboard') {
                const l = await api.get<any[]>('/code-arena/leaderboard/campus');
                setLeaderboard(l);
            }
        } catch (err: any) {
            setError(err.message);
        }
        setLoading(false);
    };

    const handleSubmitCode = async (lang: string, codeContent: string) => {
        if (!selectedProblem || !codeContent.trim()) return;
        setSubmitting(true);
        setSubmitResult(null);
        try {
            const result = await api.post(`/code-arena/problems/${selectedProblem.id}/submit`, { language: lang, code: codeContent });
            setSubmitResult(result);
            loadData();
        } catch (err: any) { setError(err.message); }
        setSubmitting(false);
    };

    const handleCreateProblem = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true); setError('');
        try {
            await api.post('/code-arena/problems', newProblem);
            setShowNewProblem(false);
            setNewProblem({ title: '', description: '', difficulty: 'EASY', tags: '', sampleInput: '', sampleOutput: '', points: 10, inputFormat: '', outputFormat: '', constraints: '' });
            loadData();
        } catch (err: any) { setError(err.message); }
        setSaving(false);
    };

    const handleCreateNote = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true); setError('');
        try {
            await api.post('/code-arena/notes', newNote);
            setShowNewNote(false);
            setNewNote({ title: '', content: '', tags: '' });
            loadData();
        } catch (err: any) { setError(err.message); }
        setSaving(false);
    };

    const handleCreateContest = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true); setError('');
        try {
            await api.post('/code-arena/contests', newContest);
            setShowNewContest(false);
            setNewContest({ title: '', description: '', startTime: '', endTime: '', problemIds: [] });
            loadData();
        } catch (err: any) { setError(err.message); }
        setSaving(false);
    };

    const difficultyColor = (d: string) => {
        switch (d) {
            case 'EASY': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'HARD': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return '';
        }
    };

    const tabs = [
        { id: 'problems' as Tab, label: 'Problems', icon: Code2 },
        { id: 'ide' as Tab, label: 'Code IDE', icon: Monitor },
        ...(isStudent ? [{ id: 'notes' as Tab, label: 'Notes', icon: StickyNote }] : []),
        { id: 'contests' as Tab, label: 'Contests', icon: Swords },
        { id: 'leaderboard' as Tab, label: 'Leaderboard', icon: Trophy },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                        V-Connect Code Arena
                    </h2>
                    <p className="text-[hsl(var(--muted-foreground))]">Practice coding, compete, and earn V-Points!</p>
                </div>
                {isStudent && streak && (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-200 dark:border-orange-800">
                            <Flame className="w-5 h-5 text-orange-500" />
                            <span className="font-bold text-orange-600 dark:text-orange-400">{streak.currentStreak}</span>
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">day streak</span>
                        </div>
                        {stats && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-200 dark:border-violet-800">
                                <Trophy className="w-5 h-5 text-violet-500" />
                                <span className="font-bold text-violet-600 dark:text-violet-400">{stats.totalVPoints}</span>
                                <span className="text-xs text-[hsl(var(--muted-foreground))]">V-Points</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Stats Bar for Students */}
            {isStudent && stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Problems Solved', value: stats.problemsSolved, color: 'from-blue-500 to-cyan-500' },
                        { label: 'Easy', value: stats.difficultyBreakdown?.EASY || 0, color: 'from-green-500 to-emerald-500' },
                        { label: 'Medium', value: stats.difficultyBreakdown?.MEDIUM || 0, color: 'from-yellow-500 to-orange-500' },
                        { label: 'Hard', value: stats.difficultyBreakdown?.HARD || 0, color: 'from-red-500 to-pink-500' },
                    ].map((s, i) => (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <Card className="border-0 shadow-sm">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                                        <span className="text-white font-bold text-sm">{s.value}</span>
                                    </div>
                                    <span className="text-xs text-[hsl(var(--muted-foreground))]">{s.label}</span>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-[hsl(var(--muted)/0.3)] p-1 rounded-xl overflow-x-auto">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => { setTab(t.id); if (t.id !== 'ide') { setSelectedProblem(null); setSubmitResult(null); } }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tab === t.id
                            ? 'bg-[hsl(var(--background))] shadow-sm text-[hsl(var(--foreground))]'
                            : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                            }`}
                    >
                        <t.icon className="w-4 h-4" />
                        {t.label}
                    </button>
                ))}
            </div>

            {error && <div className="text-red-500 text-sm bg-red-50 dark:bg-red-950/30 p-3 rounded-xl">{error}</div>}
            {loading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>}

            {/* ═══ PROBLEMS TAB ═══ */}
            {!loading && tab === 'problems' && (
                <div className="space-y-4">
                    {isFaculty && (
                        <div className="flex justify-end">
                            <Button onClick={() => setShowNewProblem(true)} variant="gradient"><Plus className="w-4 h-4" /> Add Problem</Button>
                        </div>
                    )}

                    {showNewProblem && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle>Create Problem</CardTitle>
                                    <Button variant="ghost" size="icon" onClick={() => setShowNewProblem(false)}><X className="w-4 h-4" /></Button>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleCreateProblem} className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-1 sm:col-span-2">
                                            <Label>Title</Label>
                                            <input value={newProblem.title} onChange={e => setNewProblem({ ...newProblem, title: e.target.value })} required className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm" />
                                        </div>
                                        <div className="space-y-1 sm:col-span-2">
                                            <Label>Description (Markdown)</Label>
                                            <textarea value={newProblem.description} onChange={e => setNewProblem({ ...newProblem, description: e.target.value })} required rows={4} className="flex w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Difficulty</Label>
                                            <select value={newProblem.difficulty} onChange={e => setNewProblem({ ...newProblem, difficulty: e.target.value })} className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                                <option value="EASY">Easy</option>
                                                <option value="MEDIUM">Medium</option>
                                                <option value="HARD">Hard</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Points</Label>
                                            <input type="number" value={newProblem.points} onChange={e => setNewProblem({ ...newProblem, points: Number(e.target.value) })} className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Tags (comma-separated)</Label>
                                            <input value={newProblem.tags} onChange={e => setNewProblem({ ...newProblem, tags: e.target.value })} className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm" placeholder="arrays,sorting,dp" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Input Format</Label>
                                            <textarea value={newProblem.inputFormat} onChange={e => setNewProblem({ ...newProblem, inputFormat: e.target.value })} rows={2} className="flex w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm font-mono" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Sample Input</Label>
                                            <textarea value={newProblem.sampleInput} onChange={e => setNewProblem({ ...newProblem, sampleInput: e.target.value })} rows={2} className="flex w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm font-mono" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Sample Output</Label>
                                            <textarea value={newProblem.sampleOutput} onChange={e => setNewProblem({ ...newProblem, sampleOutput: e.target.value })} rows={2} className="flex w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm font-mono" />
                                        </div>
                                        <div className="flex items-end sm:col-span-2">
                                            <Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Problem'}</Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    <div className="space-y-3">
                        {problems.map((p, i) => (
                            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                                <Card className="hover:shadow-soft transition-all cursor-pointer" onClick={() => { setSelectedProblem(p); setTab('ide'); setSubmitResult(null); }}>
                                    <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                                                <Code2 className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-semibold">{p.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor(p.difficulty)}`}>{p.difficulty}</span>
                                                    <span className="text-xs text-[hsl(var(--muted-foreground))]">{p.points} pts</span>
                                                    {p.tags && p.tags.split(',').filter(Boolean).map((t: string) => (
                                                        <Badge key={t.trim()} variant="outline" className="text-[10px]">{t.trim()}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                        {problems.length === 0 && <p className="text-center text-[hsl(var(--muted-foreground))] py-12">No problems yet. {isFaculty && 'Create the first one!'}</p>}
                    </div>
                </div>
            )}

            {/* ═══ IDE TAB — VS Code Style ═══ */}
            {!loading && tab === 'ide' && (
                <div>
                    {!selectedProblem ? (
                        <div>
                            {/* Free mode IDE — no problem selected */}
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <Monitor className="w-5 h-5 text-violet-500" />
                                        Free Practice Mode
                                    </h3>
                                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                        Write and run code in 8+ languages — or pick a problem from the Problems tab
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setTab('problems')}>
                                    <Code2 className="w-4 h-4" /> Browse Problems
                                </Button>
                            </div>
                            <Suspense fallback={
                                <div className="flex items-center justify-center h-96 bg-[#1e1e2e] rounded-xl">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                                </div>
                            }>
                                <VSCodeIDE isStudent={isStudent} />
                            </Suspense>
                        </div>
                    ) : (
                        <div>
                            {/* Problem solving mode */}
                            <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => { setSelectedProblem(null); setSubmitResult(null); }}
                                        className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                                    >
                                        ← Back
                                    </button>
                                    <div>
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            {selectedProblem.title}
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor(selectedProblem.difficulty)}`}>
                                                {selectedProblem.difficulty}
                                            </span>
                                        </h3>
                                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{selectedProblem.points} points</p>
                                    </div>
                                </div>
                            </div>
                            <Suspense fallback={
                                <div className="flex items-center justify-center h-96 bg-[#1e1e2e] rounded-xl">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                                </div>
                            }>
                                <VSCodeIDE
                                    problem={selectedProblem}
                                    onSubmitCode={handleSubmitCode}
                                    submitResult={submitResult}
                                    isStudent={isStudent}
                                    submitting={submitting}
                                />
                            </Suspense>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ NOTES TAB ═══ */}
            {!loading && tab === 'notes' && isStudent && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => setShowNewNote(true)} variant="gradient"><Plus className="w-4 h-4" /> New Note</Button>
                    </div>

                    {showNewNote && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle>Create Note</CardTitle>
                                    <Button variant="ghost" size="icon" onClick={() => setShowNewNote(false)}><X className="w-4 h-4" /></Button>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleCreateNote} className="space-y-4">
                                        <div className="space-y-1">
                                            <Label>Title</Label>
                                            <input value={newNote.title} onChange={e => setNewNote({ ...newNote, title: e.target.value })} required className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Content (Markdown)</Label>
                                            <textarea value={newNote.content} onChange={e => setNewNote({ ...newNote, content: e.target.value })} required rows={6} className="flex w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm font-mono" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Tags (comma-separated)</Label>
                                            <input value={newNote.tags} onChange={e => setNewNote({ ...newNote, tags: e.target.value })} className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm" placeholder="arrays,strings,dp" />
                                        </div>
                                        <Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Note'}</Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {notes.map((n, i) => (
                            <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                                <Card className="hover:shadow-soft transition-all">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <StickyNote className="w-4 h-4 text-yellow-500" />
                                            <p className="font-semibold text-sm">{n.title}</p>
                                        </div>
                                        <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-3 font-mono">{n.content}</p>
                                        {n.tags && (
                                            <div className="flex gap-1 mt-2 flex-wrap">
                                                {n.tags.split(',').filter(Boolean).map((t: string) => (
                                                    <Badge key={t.trim()} variant="outline" className="text-[10px]">{t.trim()}</Badge>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                        {notes.length === 0 && <p className="text-center text-[hsl(var(--muted-foreground))] py-12 col-span-full">No notes yet. Start taking coding notes!</p>}
                    </div>
                </div>
            )}

            {/* ═══ CONTESTS TAB ═══ */}
            {!loading && tab === 'contests' && (
                <div className="space-y-4">
                    {isFaculty && (
                        <div className="flex justify-end">
                            <Button onClick={() => setShowNewContest(true)} variant="gradient"><Plus className="w-4 h-4" /> Create Contest</Button>
                        </div>
                    )}

                    {showNewContest && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle>Create Weekly Contest</CardTitle>
                                    <Button variant="ghost" size="icon" onClick={() => setShowNewContest(false)}><X className="w-4 h-4" /></Button>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleCreateContest} className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-1 sm:col-span-2">
                                            <Label>Title</Label>
                                            <input value={newContest.title} onChange={e => setNewContest({ ...newContest, title: e.target.value })} required className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Start Time</Label>
                                            <input type="datetime-local" value={newContest.startTime} onChange={e => setNewContest({ ...newContest, startTime: e.target.value })} required className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>End Time</Label>
                                            <input type="datetime-local" value={newContest.endTime} onChange={e => setNewContest({ ...newContest, endTime: e.target.value })} required className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm" />
                                        </div>
                                        <div className="space-y-1 sm:col-span-2">
                                            <Label>Select Problems</Label>
                                            <div className="max-h-48 overflow-y-auto border border-[hsl(var(--input))] rounded-xl p-2 space-y-1">
                                                {problems.map(p => (
                                                    <label key={p.id} className="flex items-center gap-2 px-2 py-1 hover:bg-[hsl(var(--accent))] rounded-lg cursor-pointer text-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={newContest.problemIds.includes(p.id)}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    setNewContest({ ...newContest, problemIds: [...newContest.problemIds, p.id] });
                                                                } else {
                                                                    setNewContest({ ...newContest, problemIds: newContest.problemIds.filter(id => id !== p.id) });
                                                                }
                                                            }}
                                                            className="rounded"
                                                        />
                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${difficultyColor(p.difficulty)}`}>{p.difficulty[0]}</span>
                                                        {p.title}
                                                    </label>
                                                ))}
                                                {problems.length === 0 && <p className="text-xs text-[hsl(var(--muted-foreground))]">Create problems first</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-end sm:col-span-2">
                                            <Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Contest'}</Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    <div className="space-y-3">
                        {contests.map((c, i) => {
                            const now = new Date();
                            const start = new Date(c.startTime);
                            const end = new Date(c.endTime);
                            const isLive = now >= start && now <= end;
                            const isUpcoming = now < start;
                            return (
                                <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                                    <Card className={`hover:shadow-soft transition-all ${isLive ? 'border-2 border-green-500' : ''}`}>
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between flex-wrap gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLive ? 'bg-gradient-to-br from-green-500 to-emerald-600' : isUpcoming ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
                                                        <Swords className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">{c.title}</p>
                                                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                                            {new Date(c.startTime).toLocaleString()} — {new Date(c.endTime).toLocaleString()}
                                                        </p>
                                                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                                            By: {c.createdByFaculty?.user?.name} • {c.problems?.length || 0} problems • {c.participations?.length || 0} participants
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={isLive ? 'default' : isUpcoming ? 'secondary' : 'outline'}>
                                                        {isLive ? '🔴 LIVE' : isUpcoming ? '⏳ Upcoming' : '✅ Completed'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                        {contests.length === 0 && <p className="text-center text-[hsl(var(--muted-foreground))] py-12">No contests yet. {isFaculty && 'Create a weekly contest!'}</p>}
                    </div>
                </div>
            )}

            {/* ═══ LEADERBOARD TAB ═══ */}
            {!loading && tab === 'leaderboard' && (
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Campus Leaderboard</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[hsl(var(--border))]">
                                            <th className="text-left py-3 px-2 font-semibold">#</th>
                                            <th className="text-left py-3 px-2 font-semibold">Name</th>
                                            <th className="text-left py-3 px-2 font-semibold">Roll No</th>
                                            <th className="text-left py-3 px-2 font-semibold">Section</th>
                                            <th className="text-right py-3 px-2 font-semibold">V-Points</th>
                                            <th className="text-right py-3 px-2 font-semibold">Solved</th>
                                            <th className="text-right py-3 px-2 font-semibold">Streak</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboard.map((s, i) => (
                                            <tr key={s.studentId} className={`border-b border-[hsl(var(--border)/0.3)] hover:bg-[hsl(var(--accent)/0.3)] transition-colors ${i < 3 ? 'font-semibold' : ''}`}>
                                                <td className="py-3 px-2">
                                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                                </td>
                                                <td className="py-3 px-2">{s.name}</td>
                                                <td className="py-3 px-2 text-[hsl(var(--muted-foreground))]">{s.rollNo}</td>
                                                <td className="py-3 px-2">
                                                    <Badge variant="outline">{s.section} • {s.department}</Badge>
                                                </td>
                                                <td className="py-3 px-2 text-right text-violet-600 dark:text-violet-400 font-bold">{s.totalVPoints}</td>
                                                <td className="py-3 px-2 text-right">{s.problemsSolved}</td>
                                                <td className="py-3 px-2 text-right">
                                                    <span className="flex items-center gap-1 justify-end">
                                                        <Flame className="w-3 h-3 text-orange-500" />{s.currentStreak}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {leaderboard.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="text-center py-12 text-[hsl(var(--muted-foreground))]">
                                                    No data yet. Start solving problems to appear on the leaderboard!
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
