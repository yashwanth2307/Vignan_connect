'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket, Loader2, CheckCircle2, Shield, Lock, Unlock, FileDown, BarChart3 } from 'lucide-react';
import api from '@/lib/api';

export default function ExamCellPage() {
    const [semesters, setSemesters] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [selectedSemester, setSelectedSemester] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [marks, setMarks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [genResult, setGenResult] = useState<any>(null);
    const [tab, setTab] = useState<'halltickets' | 'marks'>('halltickets');

    useEffect(() => {
        (async () => {
            try {
                const sems = await api.get<any[]>('/exam/semesters');
                setSemesters(sems);
                const depts = await api.get<any[]>('/departments');
                const allSec: any[] = [];
                for (const d of depts) {
                    const detail = await api.get<any>(`/departments/${d.id}`);
                    if (detail.sections) detail.sections.forEach((s: any) => allSec.push({ ...s, deptName: d.name }));
                }
                setSections(allSec);
            } catch {}
        })();
    }, []);

    const generateHallTickets = async () => {
        if (!selectedSemester) return;
        setGenerating(true);
        setGenResult(null);
        try {
            const res = await api.post<any>('/exam/hall-tickets/generate', {
                semesterId: selectedSemester,
                sectionId: selectedSection || undefined,
            });
            setGenResult(res);
        } catch (e: any) { setGenResult({ error: e.message }); }
        setGenerating(false);
    };

    const loadMarks = async () => {
        if (!selectedSemester) return;
        setLoading(true);
        try {
            const data = await api.get<any[]>(`/exam/marks?semesterId=${selectedSemester}`);
            setMarks(data);
        } catch {}
        setLoading(false);
    };

    const verifyMark = async (id: string) => {
        try {
            await api.patch(`/exam/marks/${id}/verify`, {});
            loadMarks();
        } catch {}
    };

    const lockMark = async (id: string) => {
        try {
            await api.patch(`/exam/marks/${id}/lock`, {});
            loadMarks();
        } catch {}
    };

    const releaseResults = async () => {
        if (!selectedSemester || !confirm('Release all locked marks for this semester?')) return;
        try {
            await api.post(`/exam/results/release/${selectedSemester}`, {});
            alert('Results released!');
            loadMarks();
        } catch (e: any) { alert(e.message); }
    };

    const downloadMarksReport = async () => {
        if (!selectedSemester) return;
        try {
            let url = `/exam/reports/marks?semesterId=${selectedSemester}`;
            if (selectedSection) url += `&sectionId=${selectedSection}`;
            const data = await api.get<any[]>(url);
            const header = 'Roll No,Name,Section,Department,Subject,Subject Title,Semester,Mid 1,Mid 2,Internal,External,Final,Status\n';
            const rows = data.map(r => `${r.rollNo},${r.name},${r.section},${r.department},${r.subject},${r.subjectTitle},${r.semester},${r.mid1 || ''},${r.mid2 || ''},${r.internal || ''},${r.external || ''},${r.final || ''},${r.status}`).join('\n');
            const blob = new Blob([header + rows], { type: 'text/csv' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `marks_report_sem${semesters.find(s => s.id === selectedSemester)?.number || ''}.csv`;
            a.click();
        } catch (e: any) { alert(e.message); }
    };

    const downloadAttendanceReport = async () => {
        if (!selectedSemester) return;
        try {
            let url = `/exam/reports/attendance?semesterId=${selectedSemester}`;
            if (selectedSection) url += `&sectionId=${selectedSection}`;
            const data = await api.get<any[]>(url);
            const header = 'Roll No,Name,Section,Department,Subject,Total Classes,Present,Absent,Late,OD,ML,Percentage\n';
            const rows = data.map(r => `${r.rollNo},${r.name},${r.section},${r.department},${r.subject},${r.totalClasses},${r.present},${r.absent},${r.late},${r.od},${r.ml},${r.percentage}%`).join('\n');
            const blob = new Blob([header + rows], { type: 'text/csv' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `attendance_report_sem${semesters.find(s => s.id === selectedSemester)?.number || ''}.csv`;
            a.click();
        } catch (e: any) { alert(e.message); }
    };

    const statusColor: Record<string, string> = {
        DRAFT: 'bg-gray-100 text-gray-700',
        SUBMITTED: 'bg-blue-100 text-blue-700',
        VERIFIED: 'bg-yellow-100 text-yellow-700',
        LOCKED: 'bg-orange-100 text-orange-700',
        RELEASED: 'bg-green-100 text-green-700',
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">🏛️ Examination Cell</h2>
                <p className="text-[hsl(var(--muted-foreground))]">Hall tickets, marks verification, and result release</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <Button variant={tab === 'halltickets' ? 'gradient' : 'outline'} size="sm" onClick={() => setTab('halltickets')}>
                    <Ticket className="w-4 h-4 mr-1" /> Hall Tickets
                </Button>
                <Button variant={tab === 'marks' ? 'gradient' : 'outline'} size="sm" onClick={() => { setTab('marks'); loadMarks(); }}>
                    <BarChart3 className="w-4 h-4 mr-1" /> Marks & Results
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Semester</label>
                            <select value={selectedSemester} onChange={e => { setSelectedSemester(e.target.value); }} className="w-full h-10 rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 text-sm">
                                <option value="">Select Semester</option>
                                {semesters.map(s => <option key={s.id} value={s.id}>Sem {s.number} ({s.department?.code || ''})</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Section (optional)</label>
                            <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="w-full h-10 rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 text-sm">
                                <option value="">All Sections</option>
                                {sections.map(s => <option key={s.id} value={s.id}>{s.name} ({s.deptName})</option>)}
                            </select>
                        </div>
                        <div className="flex items-end gap-2">
                            <Button size="sm" variant="outline" onClick={downloadMarksReport} disabled={!selectedSemester}>
                                <FileDown className="w-3 h-3 mr-1" /> Marks CSV
                            </Button>
                            <Button size="sm" variant="outline" onClick={downloadAttendanceReport} disabled={!selectedSemester}>
                                <FileDown className="w-3 h-3 mr-1" /> Attendance CSV
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Hall Tickets Tab */}
            {tab === 'halltickets' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Ticket className="w-5 h-5" /> Generate Hall Tickets</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                            Generate hall tickets for all students in the selected semester. Students can then download their hall tickets from their dashboard.
                        </p>
                        <Button onClick={generateHallTickets} variant="gradient" disabled={generating || !selectedSemester}>
                            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Ticket className="w-4 h-4 mr-1" /> Generate Hall Tickets</>}
                        </Button>
                        <AnimatePresence>
                            {genResult && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className={`p-4 rounded-xl border ${genResult.error ? 'border-red-200 bg-red-50 dark:bg-red-950/20' : 'border-green-200 bg-green-50 dark:bg-green-950/20'}`}>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className={`w-5 h-5 ${genResult.error ? 'text-red-600' : 'text-green-600'}`} />
                                        <p className="font-medium text-sm">{genResult.error || genResult.message}</p>
                                    </div>
                                    {genResult.generated !== undefined && (
                                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Generated: {genResult.generated} / Total students: {genResult.total}</p>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            )}

            {/* Marks Tab */}
            {tab === 'marks' && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Marks ({marks.length})</CardTitle>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={loadMarks}><Loader2 className="w-3 h-3 mr-1" />Refresh</Button>
                            <Button size="sm" variant="gradient" onClick={releaseResults} disabled={!selectedSemester}>
                                <Unlock className="w-3 h-3 mr-1" />Release Results
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
                        ) : marks.length === 0 ? (
                            <p className="text-center text-sm text-[hsl(var(--muted-foreground))] py-8">No marks found. Select a semester and refresh.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2 text-xs">Roll No</th>
                                            <th className="text-left p-2 text-xs">Name</th>
                                            <th className="text-left p-2 text-xs">Subject</th>
                                            <th className="text-center p-2 text-xs">Mid 1</th>
                                            <th className="text-center p-2 text-xs">Mid 2</th>
                                            <th className="text-center p-2 text-xs">Internal</th>
                                            <th className="text-center p-2 text-xs">External</th>
                                            <th className="text-center p-2 text-xs">Status</th>
                                            <th className="text-center p-2 text-xs">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {marks.map((m, i) => (
                                            <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }}
                                                className="border-b hover:bg-[hsl(var(--muted))]/30">
                                                <td className="p-2 text-xs font-mono">{m.student?.rollNo}</td>
                                                <td className="p-2 text-xs">{m.student?.user?.name}</td>
                                                <td className="p-2 text-xs">{m.subject?.code}</td>
                                                <td className="p-2 text-center text-xs">{m.mid1 ?? '-'}</td>
                                                <td className="p-2 text-center text-xs">{m.mid2 ?? '-'}</td>
                                                <td className="p-2 text-center text-xs">{m.internal ?? '-'}</td>
                                                <td className="p-2 text-center text-xs">{m.external ?? '-'}</td>
                                                <td className="p-2 text-center">
                                                    <Badge className={`text-[10px] ${statusColor[m.status] || ''}`}>{m.status}</Badge>
                                                </td>
                                                <td className="p-2 text-center">
                                                    <div className="flex gap-1 justify-center">
                                                        {m.status === 'SUBMITTED' && (
                                                            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => verifyMark(m.id)}>
                                                                <Shield className="w-3 h-3 mr-1" />Verify
                                                            </Button>
                                                        )}
                                                        {m.status === 'VERIFIED' && (
                                                            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => lockMark(m.id)}>
                                                                <Lock className="w-3 h-3 mr-1" />Lock
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
