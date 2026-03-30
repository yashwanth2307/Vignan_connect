'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Loader2, X, Wand2, Trash2, CheckCircle2, AlertTriangle, Printer, Download } from 'lucide-react';
import api from '@/lib/api';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_SHORT: Record<string, string> = {
    MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed',
    THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat'
};

const SUBJECT_COLORS = [
    'bg-blue-100 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    'bg-purple-100 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
    'bg-green-100 dark:bg-green-950/30 border-green-200 dark:border-green-800',
    'bg-orange-100 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
    'bg-pink-100 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800',
    'bg-teal-100 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800',
    'bg-yellow-100 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
    'bg-red-100 dark:bg-red-950/30 border-red-200 dark:border-red-800',
];

export default function TimetablePage() {
    const [slots, setSlots] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [semesters, setSemesters] = useState<any[]>([]);
    const [offerings, setOfferings] = useState<any[]>([]);
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [genResult, setGenResult] = useState<any>(null);
    const [form, setForm] = useState({ sectionId: '', dayOfWeek: '', hourIndex: '1', startTime: '09:00', endTime: '09:50', courseOfferingId: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const loadSections = async () => {
        try {
            const depts = await api.get<any[]>('/departments');
            const allSec: any[] = [];
            for (const d of depts) {
                const detail = await api.get<any>(`/departments/${d.id}`);
                if (detail.sections) detail.sections.forEach((s: any) => allSec.push({ ...s, deptName: d.name, deptCode: d.code }));
            }
            setSections(allSec);
            if (allSec.length > 0 && !selectedSection) setSelectedSection(allSec[0].id);
        } catch { /* ignore */ }
    };

    const loadSemesters = async () => {
        try {
            const sems = await api.get<any[]>('/exam/semesters');
            setSemesters(sems);
            if (sems.length > 0 && !selectedSemester) setSelectedSemester(sems[0].id);
        } catch { /* ignore */ }
    };

    const loadSlots = async (secId: string) => {
        if (!secId) return;
        setLoading(true);
        try {
            const data = await api.get<any[]>(`/timetable/section/${secId}`);
            setSlots(data);
            const co = await api.get<any[]>('/course-offerings');
            setOfferings(co.filter((c: any) => c.sectionId === secId));
        } catch { /* ignore */ }
        setLoading(false);
    };

    useEffect(() => { loadSections(); loadSemesters(); }, []);
    useEffect(() => { if (selectedSection) loadSlots(selectedSection); }, [selectedSection]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await api.post('/timetable', { ...form, hourIndex: +form.hourIndex, sectionId: selectedSection });
            setShowForm(false);
            await loadSlots(selectedSection);
        } catch (err: any) { setError(err.message); }
        setSaving(false);
    };

    const handleAutoGenerate = async () => {
        if (!selectedSection || !selectedSemester) {
            setError('Please select a section and semester first.');
            return;
        }
        setGenerating(true);
        setGenResult(null);
        setError('');
        try {
            const result = await api.post<any>('/timetable/auto-generate', {
                sectionId: selectedSection,
                semesterId: selectedSemester,
            });
            setGenResult(result);
            await loadSlots(selectedSection);
        } catch (err: any) { setError(err.message || 'Auto-generate failed'); }
        setGenerating(false);
    };

    const handleClearSection = async () => {
        try {
            await api.delete(`/timetable/section/${selectedSection}/clear`);
            await loadSlots(selectedSection);
            setGenResult({ message: 'Timetable cleared successfully.' });
        } catch (err: any) { setError(err.message || 'Clear failed'); }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        let csv = 'Day,Period 1,Period 2,Period 3,Period 4,Period 5,Period 6,Period 7\n';
        DAYS.forEach(day => {
            const row = [day];
            for (let i = 1; i <= 7; i++) {
                const slot = slots.find(s => s.dayOfWeek === day && s.hourIndex === i);
                if (slot) {
                    row.push(`"${slot.courseOffering?.subject?.title} (${slot.courseOffering?.subject?.code})"`);
                } else {
                    row.push('Free');
                }
            }
            csv += row.join(',') + '\n';
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Timetable.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Build color map for subjects
    const subjectColorMap = new Map<string, string>();
    let colorIdx = 0;
    slots.forEach(s => {
        const subCode = s.courseOffering?.subject?.code;
        if (subCode && !subjectColorMap.has(subCode)) {
            subjectColorMap.set(subCode, SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length]);
            colorIdx++;
        }
    });

    const grouped = DAYS.reduce((acc, day) => {
        acc[day] = slots.filter(s => s.dayOfWeek === day).sort((a: any, b: any) => a.hourIndex - b.hourIndex);
        return acc;
    }, {} as Record<string, any[]>);

    // Build a grid view (period 1-7 across columns)
    const maxPeriods = 7;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold">Timetable</h2>
                    <p className="text-[hsl(var(--muted-foreground))]">Manage class schedules — auto-generate or add manually</p>
                </div>
                <div className="flex gap-2 flex-wrap items-end">
                    <div className="space-y-1">
                        <label className="text-xs font-medium">Section</label>
                        <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="h-10 rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 text-sm">
                            {sections.map(s => <option key={s.id} value={s.id}>{s.name} ({s.deptCode || s.deptName})</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium">Semester</label>
                        <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className="h-10 rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 text-sm">
                            <option value="">Select Semester</option>
                            {semesters.map(s => <option key={s.id} value={s.id}>Sem {s.number}</option>)}
                        </select>
                    </div>
                    <Button onClick={handleAutoGenerate} variant="gradient" disabled={generating || !selectedSemester}>
                        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Wand2 className="w-4 h-4 mr-1" /> Auto-Generate</>}
                    </Button>
                    <Button onClick={() => setShowForm(true)} variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" /> Manual</Button>
                    {slots.length > 0 && (
                        <>
                            <Button onClick={handlePrint} variant="outline" size="sm"><Printer className="w-4 h-4 mr-1" /> Print</Button>
                            <Button onClick={handleDownload} variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Download</Button>
                            <Button onClick={handleClearSection} variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">
                                <Trash2 className="w-4 h-4 mr-1" /> Clear
                            </Button>
                        </>
                    )}
                </div>
            </div>
            
            {error && (
                <div className="bg-red-50 dark:bg-red-950/20 text-red-600 px-4 py-3 rounded-xl border border-red-200 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p className="font-medium text-sm">{error}</p>
                    <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setError('')}><X className="w-4 h-4" /></Button>
                </div>
            )}

            {/* Auto-generate success */}
            <AnimatePresence>
                {genResult && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
                            <CardContent className="p-4 flex items-center gap-3">
                                <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                                <div>
                                    <p className="font-semibold text-green-700 dark:text-green-400">{genResult.message}</p>
                                    <p className="text-sm text-green-600">{genResult.offerings} subjects → {genResult.slotsCreated} periods</p>
                                </div>
                                <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setGenResult(null)}><X className="w-4 h-4" /></Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Manual add form */}
            {showForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle>Add Timetable Slot</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
                        </CardHeader>
                        <CardContent>
                            {error && <div className="text-red-500 text-sm mb-3 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl">{error}</div>}
                            <form onSubmit={handleSubmit} className="grid sm:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label>Day</Label>
                                    <select value={form.dayOfWeek} onChange={e => setForm({ ...form, dayOfWeek: e.target.value })} required className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                        <option value="">Select</option>
                                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1"><Label>Hour Index</Label><Input type="number" min={1} max={8} value={form.hourIndex} onChange={e => setForm({ ...form, hourIndex: e.target.value })} /></div>
                                <div className="space-y-1">
                                    <Label>Course Offering</Label>
                                    <select value={form.courseOfferingId} onChange={e => setForm({ ...form, courseOfferingId: e.target.value })} required className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                        <option value="">Select</option>
                                        {offerings.map(o => <option key={o.id} value={o.id}>{o.subject?.code} - {o.subject?.title}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1"><Label>Start Time</Label><Input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} /></div>
                                <div className="space-y-1"><Label>End Time</Label><Input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} /></div>
                                <div className="flex items-end"><Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}</Button></div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Timetable Grid */}
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : slots.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Calendar className="w-14 h-14 mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-semibold mb-2">No Timetable Yet</h3>
                        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                            Select a section and semester, then click <strong>Auto-Generate</strong> to create the timetable automatically.
                        </p>
                        <div className="flex items-center gap-2 justify-center text-sm p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 max-w-md mx-auto">
                            <AlertTriangle className="w-4 h-4 text-blue-500 shrink-0" />
                            <p className="text-blue-700 dark:text-blue-400">
                                Make sure <strong>course offerings</strong> are created for this section before generating.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr>
                                <th className="p-2 text-left text-xs font-semibold border-b w-20">Day</th>
                                {Array.from({ length: maxPeriods }, (_, i) => (
                                    <th key={i} className="p-2 text-center text-xs font-semibold border-b">
                                        Period {i + 1}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {DAYS.map((day, di) => (
                                <motion.tr key={day} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: di * 0.05 }}
                                    className="border-b hover:bg-[hsl(var(--muted))]/30 transition-colors">
                                    <td className="p-2 font-semibold text-xs">{DAY_SHORT[day]}</td>
                                    {Array.from({ length: maxPeriods }, (_, period) => {
                                        const slot = grouped[day]?.find(s => s.hourIndex === period + 1);
                                        if (!slot) return <td key={period} className="p-1"><div className="h-16 rounded-lg border border-dashed border-[hsl(var(--border))]/30"></div></td>;
                                        
                                        const subCode = slot.courseOffering?.subject?.code || '';
                                        const colorClass = subjectColorMap.get(subCode) || SUBJECT_COLORS[0];
                                        
                                        return (
                                            <td key={period} className="p-1">
                                                <div className={`rounded-lg p-2 h-16 flex flex-col justify-between border ${colorClass} transition-all hover:shadow-md`}>
                                                    <div>
                                                        <p className="font-semibold text-[11px] truncate">{slot.courseOffering?.subject?.title}</p>
                                                        <p className="text-[9px] text-[hsl(var(--muted-foreground))]">{subCode}</p>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[8px] text-[hsl(var(--muted-foreground))]">{slot.startTime}-{slot.endTime}</span>
                                                        <span className="text-[8px] truncate max-w-[60px]">{slot.courseOffering?.faculty?.user?.name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Legend */}
            {slots.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {Array.from(subjectColorMap.entries()).map(([code, color]) => (
                        <div key={code} className={`text-xs px-2 py-1 rounded-lg border ${color} font-medium`}>{code}</div>
                    ))}
                </div>
            )}
        </div>
    );
}
