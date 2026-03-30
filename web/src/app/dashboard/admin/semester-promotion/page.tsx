'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowUpCircle, Users, Loader2, AlertTriangle, CheckCircle2,
    History, ChevronRight, GraduationCap, Filter
} from 'lucide-react';
import api from '@/lib/api';

export default function SemesterPromotionPage() {
    const [departments, setDepartments] = useState<any[]>([]);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [promoting, setPromoting] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // Filters
    const [selectedDept, setSelectedDept] = useState('');
    const [batchStart, setBatchStart] = useState('2022');
    const [batchEnd, setBatchEnd] = useState('2026');
    const [currentSem, setCurrentSem] = useState('1');
    const [academicYear, setAcademicYear] = useState('2024-25');
    const [notes, setNotes] = useState('');
    const [eligibleCount, setEligibleCount] = useState(0);
    const [previewLoaded, setPreviewLoaded] = useState(false);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        api.get<any[]>('/departments').then(setDepartments).catch(() => {});
        api.get<any[]>('/semester-promotion/history').then(setHistory).catch(() => {});
        setLoading(false);
    }, []);

    const loadCandidates = async () => {
        if (!selectedDept) return;
        setLoading(true);
        setResult(null);
        try {
            const data = await api.get<any>(`/semester-promotion/candidates?departmentId=${selectedDept}&batchStartYear=${batchStart}&batchEndYear=${batchEnd}&currentSemester=${currentSem}`);
            setCandidates(data.students);
            setEligibleCount(data.eligibleCount);
            setPreviewLoaded(true);
        } catch (e: any) {
            alert(e.message);
        }
        setLoading(false);
    };

    const executePromotion = async () => {
        const targetSem = parseInt(currentSem) === 8 ? 'Alumni' : `Semester ${parseInt(currentSem) + 1}`;
        if (!confirm(`Are you sure you want to promote ${eligibleCount} students from Semester ${currentSem} to ${targetSem}? This action is irreversible.`)) return;
        setPromoting(true);
        try {
            const res = await api.post<any>('/semester-promotion/execute', {
                departmentId: selectedDept,
                batchStartYear: parseInt(batchStart),
                batchEndYear: parseInt(batchEnd),
                currentSemester: parseInt(currentSem),
                academicYear, notes: notes || undefined
            });
            setResult(res);
            setCandidates([]);
            setPreviewLoaded(false);
            // reload history
            api.get<any[]>('/semester-promotion/history').then(setHistory).catch(() => {});
        } catch (e: any) { alert(e.message); }
        setPromoting(false);
    };

    const toYear = (sem: number) => Math.ceil(sem / 2);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Semester Promotion</h2>
                    <p className="text-[hsl(var(--muted-foreground))]">Promote students to the next semester. Old attendance records are preserved.</p>
                </div>
                <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
                    <History className="w-4 h-4 mr-1" /> {showHistory ? 'Hide' : 'Show'} History
                </Button>
            </div>

            {/* Promotion Filters */}
            <Card>
                <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                        <span className="font-medium text-sm">Select Batch & Semester</span>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Department</label>
                            <select value={selectedDept} onChange={e => { setSelectedDept(e.target.value); setPreviewLoaded(false); }}
                                className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm">
                                <option value="">Select Department</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Batch Start Year</label>
                            <select value={batchStart} onChange={e => { setBatchStart(e.target.value); setPreviewLoaded(false); }}
                                className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm">
                                {[2020,2021,2022,2023,2024,2025].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Batch End Year</label>
                            <select value={batchEnd} onChange={e => { setBatchEnd(e.target.value); setPreviewLoaded(false); }}
                                className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm">
                                {[2024,2025,2026,2027,2028,2029].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Current Semester</label>
                            <select value={currentSem} onChange={e => { setCurrentSem(e.target.value); setPreviewLoaded(false); }}
                                className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm">
                                {[1,2,3,4,5,6,7,8].map(s => (
                                    <option key={s} value={s}>
                                        Semester {s} → {s === 8 ? 'Alumni' : s + 1}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Button variant="gradient" onClick={loadCandidates} disabled={!selectedDept || loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Preview'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Success Result */}
            {result && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card className="border-green-200 dark:border-green-800">
                        <CardContent className="p-6 text-center">
                            <CheckCircle2 className="w-14 h-14 mx-auto mb-3 text-green-500" />
                            <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-1">{result.message}</h3>
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">Promotion ID: {result.promotionId}</p>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Preview Candidates */}
            {previewLoaded && candidates.length > 0 && (
                <div className="space-y-4">
                    <Card className="overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ArrowUpCircle className="w-5 h-5" />
                                    <CardTitle className="text-lg">
                                        Promote {eligibleCount} Students: Semester {currentSem}
                                        <ChevronRight className="w-4 h-4 inline mx-1" />
                                        {parseInt(currentSem) === 8 ? 'Alumni Status' : `Semester ${parseInt(currentSem) + 1}`}
                                        {parseInt(currentSem) !== 8 && toYear(parseInt(currentSem)) !== toYear(parseInt(currentSem) + 1) &&
                                            <span className="ml-2 text-sm opacity-80">(Year {toYear(parseInt(currentSem))} → {toYear(parseInt(currentSem) + 1)})</span>
                                        }
                                    </CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="space-y-1 mb-4">
                                <label className="text-sm font-medium">Academic Year</label>
                                <select value={academicYear} onChange={e => setAcademicYear(e.target.value)}
                                    className="flex h-10 w-full max-w-xs rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm">
                                    <option value="2023-24">2023-24</option>
                                    <option value="2024-25">2024-25</option>
                                    <option value="2025-26">2025-26</option>
                                </select>
                            </div>
                            <div className="space-y-1 mb-4">
                                <label className="text-sm font-medium">Notes (optional)</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                                    className="flex w-full max-w-md rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm min-h-[50px]"
                                    placeholder="e.g. End of semester 1 exams completed" />
                            </div>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4 max-h-[300px] overflow-y-auto">
                                {candidates.map((s: any, i: number) => (
                                    <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }}>
                                        <div className="flex items-center gap-2 p-2 rounded-lg border">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                                {s.user?.name?.charAt(0) || '?'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{s.user?.name}</p>
                                                <p className="text-xs text-[hsl(var(--muted-foreground))]">{s.rollNo} • {s.section?.name}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 flex-1">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
                            <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                This will update <strong>{eligibleCount}</strong> students&apos; status from <strong>Semester {currentSem}</strong> to <strong>{parseInt(currentSem) === 8 ? 'Alumni' : `Semester ${parseInt(currentSem) + 1}`}</strong>.
                                Existing attendance records will be preserved.
                            </p>
                        </div>
                        <Button variant="gradient" size="lg" onClick={executePromotion} disabled={promoting} className="whitespace-nowrap">
                            {promoting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <><ArrowUpCircle className="w-5 h-5 mr-2" /> Execute Promotion</>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {previewLoaded && candidates.length === 0 && !result && (
                <Card>
                    <CardContent className="py-12 text-center text-[hsl(var(--muted-foreground))]">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <h3 className="font-semibold mb-1">No Eligible Students</h3>
                        <p className="text-sm">No students found matching the selected batch, department, and semester.</p>
                    </CardContent>
                </Card>
            )}

            {/* Promotion History */}
            {showHistory && (
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><History className="w-5 h-5" /> Promotion History</h3>
                    {history.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center text-[hsl(var(--muted-foreground))]">
                                <p className="text-sm">No promotions have been executed yet.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        history.map((p: any, i: number) => (
                            <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                                <Card className="hover:shadow-soft transition-shadow">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shrink-0">
                                            <ArrowUpCircle className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-sm">
                                                Semester {p.fromSemester} → {p.toSemester}
                                                {p.fromYear !== p.toYear && <span className="ml-1">(Year {p.fromYear} → {p.toYear})</span>}
                                            </p>
                                            <div className="flex gap-2 mt-1">
                                                <Badge variant="secondary" className="text-[10px]">{p.promotedCount} students</Badge>
                                                <Badge variant="outline" className="text-[10px]">{p.academicYear}</Badge>
                                                <Badge variant="outline" className="text-[10px]">
                                                    Batch: {p.batchStartYear}-{p.batchEndYear}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                                                {new Date(p.promotedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
