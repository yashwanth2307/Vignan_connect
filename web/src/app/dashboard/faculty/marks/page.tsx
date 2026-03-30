'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Upload, Loader2, CheckCircle2, Download, FileSpreadsheet, Save, Printer } from 'lucide-react';
import api from '@/lib/api';

export default function FacultyMarksPage() {
    const [semesters, setSemesters] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [selectedSemester, setSelectedSemester] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [marksData, setMarksData] = useState<Record<string, { mid1: string; mid2: string; internal: string; external: string }>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState<any>(null);

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

    const loadStudents = async () => {
        if (!selectedSection || !selectedSemester || !selectedSubject) return;
        setLoading(true);
        try {
            const studs = await api.get<any[]>(`/users/students/section/${selectedSection}`);
            setStudents(studs);
            const initial: Record<string, any> = {};
            studs.forEach(s => {
                initial[s.id] = { mid1: '', mid2: '', internal: '', external: '' };
            });
            setMarksData(initial);
        } catch {}
        setLoading(false);
    };

    useEffect(() => {
        if (selectedSection && selectedSemester) {
            (async () => {
                try {
                    const co = await api.get<any[]>('/course-offerings');
                    const filtered = co.filter((c: any) => c.sectionId === selectedSection && c.semesterId === selectedSemester);
                    setSubjects(filtered);
                } catch {}
            })();
        }
    }, [selectedSection, selectedSemester]);

    const handleSaveAll = async () => {
        if (!selectedSubject || !selectedSemester) return;
        setSaving(true);
        setResult(null);
        const entries = Object.entries(marksData)
            .filter(([_, v]) => v.mid1 || v.mid2 || v.internal || v.external)
            .map(([studentId, v]) => ({
                studentId,
                subjectId: subjects.find(s => s.id === selectedSubject)?.subjectId || selectedSubject,
                semesterId: selectedSemester,
                mid1: v.mid1 ? parseFloat(v.mid1) : undefined,
                mid2: v.mid2 ? parseFloat(v.mid2) : undefined,
                internal: v.internal ? parseFloat(v.internal) : undefined,
                external: v.external ? parseFloat(v.external) : undefined,
            }));

        try {
            const res = await api.post<any>('/exam/marks/bulk', { entries });
            setResult(res);
        } catch (e: any) {
            setResult({ error: e.message });
        }
        setSaving(false);
    };

    const updateMark = (studentId: string, field: string, value: string) => {
        setMarksData(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], [field]: value },
        }));
    };

    const downloadCSVTemplate = () => {
        const header = 'Roll No,Name,Mid 1,Mid 2,Internal,External\n';
        const rows = students.map(s => `${s.rollNo},${s.user?.name || ''},,,, `).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'marks_template.csv';
        a.click();
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">📝 Upload Marks</h2>
                <p className="text-[hsl(var(--muted-foreground))]">Enter and submit marks for your students</p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid sm:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Semester</label>
                            <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className="w-full h-10 rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 text-sm">
                                <option value="">Select Semester</option>
                                {semesters.map(s => <option key={s.id} value={s.id}>Sem {s.number} ({s.department?.code || ''})</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Section</label>
                            <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="w-full h-10 rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 text-sm">
                                <option value="">Select Section</option>
                                {sections.map(s => <option key={s.id} value={s.id}>{s.name} ({s.deptName})</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Subject</label>
                            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full h-10 rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 text-sm">
                                <option value="">Select Subject</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.subject?.code} — {s.subject?.title}</option>)}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <Button onClick={loadStudents} disabled={!selectedSection || !selectedSemester || !selectedSubject}>
                                Load Students
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Success/Error */}
            <AnimatePresence>
                {result && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <Card className={result.error ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : 'border-green-300 bg-green-50 dark:bg-green-950/20'}>
                            <CardContent className="p-4 flex items-center gap-3">
                                <CheckCircle2 className={`w-5 h-5 ${result.error ? 'text-red-600' : 'text-green-600'}`} />
                                <p className="font-medium text-sm">{result.error || `Saved ${result.created || 0} marks entries. ${result.failed || 0} failed.`}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Marks Table */}
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : students.length > 0 ? (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" /> {students.length} Students</CardTitle>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="w-3 h-3 mr-1" />Print</Button>
                            <Button size="sm" variant="outline" onClick={downloadCSVTemplate}><Download className="w-3 h-3 mr-1" />Download</Button>
                            <Button size="sm" variant="gradient" onClick={handleSaveAll} disabled={saving}>
                                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Save className="w-3 h-3 mr-1" />Save All</>}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-2 text-xs">#</th>
                                    <th className="text-left p-2 text-xs">Roll No</th>
                                    <th className="text-left p-2 text-xs">Name</th>
                                    <th className="text-center p-2 text-xs">Mid 1</th>
                                    <th className="text-center p-2 text-xs">Mid 2</th>
                                    <th className="text-center p-2 text-xs">Internal</th>
                                    <th className="text-center p-2 text-xs">External</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s, i) => (
                                    <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                                        className="border-b hover:bg-[hsl(var(--muted))]/30">
                                        <td className="p-2 text-xs text-[hsl(var(--muted-foreground))]">{i + 1}</td>
                                        <td className="p-2 font-mono text-xs">{s.rollNo}</td>
                                        <td className="p-2 text-xs font-medium">{s.user?.name}</td>
                                        <td className="p-1"><Input type="number" min={0} max={30} placeholder="0" className="text-center h-8 w-16 mx-auto" value={marksData[s.id]?.mid1 || ''} onChange={e => updateMark(s.id, 'mid1', e.target.value)} /></td>
                                        <td className="p-1"><Input type="number" min={0} max={30} placeholder="0" className="text-center h-8 w-16 mx-auto" value={marksData[s.id]?.mid2 || ''} onChange={e => updateMark(s.id, 'mid2', e.target.value)} /></td>
                                        <td className="p-1"><Input type="number" min={0} max={40} placeholder="0" className="text-center h-8 w-16 mx-auto" value={marksData[s.id]?.internal || ''} onChange={e => updateMark(s.id, 'internal', e.target.value)} /></td>
                                        <td className="p-1"><Input type="number" min={0} max={60} placeholder="0" className="text-center h-8 w-16 mx-auto" value={marksData[s.id]?.external || ''} onChange={e => updateMark(s.id, 'external', e.target.value)} /></td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Upload className="w-14 h-14 mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-semibold mb-2">Select Filters to Load Students</h3>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">Choose semester, section, and subject, then click Load Students to enter marks.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
