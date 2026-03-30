'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Plus, Loader2, X, Trash2, Edit2 } from 'lucide-react';
import api from '@/lib/api';

export default function CourseOfferingsPage() {
    const [offerings, setOfferings] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [facultyList, setFacultyList] = useState<any[]>([]);
    const [semesters, setSemesters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ id: '', subjectId: '', sectionId: '', facultyId: '', semesterId: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const load = async () => {
        try {
            const [o, s, u] = await Promise.all([
                api.get<any[]>('/course-offerings'),
                api.get<any[]>('/subjects'),
                api.get<any[]>('/users'),
            ]);
            setOfferings(o);
            setSubjects(s);
            const fac = u.filter((x: any) => x.role === 'FACULTY' || x.role === 'HOD').map((x: any) => ({ id: x.faculty?.id, name: x.name, userId: x.id })).filter((x: any) => x.id);
            setFacultyList(fac);
            const depts = await api.get<any[]>('/departments');
            const allSections: any[] = [];
            for (const d of depts) {
                const detail = await api.get<any>(`/departments/${d.id}`);
                if (detail.sections) detail.sections.forEach((sec: any) => allSections.push(sec));
            }
            setSections(allSections);
        } catch { /* ignore */ }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            if (form.id) {
                await api.put(`/course-offerings/${form.id}`, { subjectId: form.subjectId, sectionId: form.sectionId, facultyId: form.facultyId });
            } else {
                await api.post('/course-offerings', { subjectId: form.subjectId, sectionId: form.sectionId, facultyId: form.facultyId });
            }
            setShowForm(false);
            setForm({ id: '', subjectId: '', sectionId: '', facultyId: '', semesterId: '' });
            await load();
        } catch (err: any) { setError(err.message); }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this course offering? This will clear related timetable slots and attendance records.')) return;
        try {
            setLoading(true);
            await api.delete(`/course-offerings/${id}`);
            await load();
        } catch (err: any) { alert(err.message); setLoading(false); }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Course Offerings</h2>
                    <p className="text-[hsl(var(--muted-foreground))]">Assign subjects to sections with faculty</p>
                </div>
                <Button onClick={() => setShowForm(true)} variant="gradient"><Plus className="w-4 h-4" /> Assign</Button>
            </div>

            {showForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle>Create Course Offering</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
                        </CardHeader>
                        <CardContent>
                            {error && <div className="text-red-500 text-sm mb-3 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl">{error}</div>}
                            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label>Subject</Label>
                                    <select value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })} required className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                        <option value="">Select</option>
                                        {subjects.map(s => <option key={s.id} value={s.id}>{s.code} - {s.title}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Section</Label>
                                    <select value={form.sectionId} onChange={e => setForm({ ...form, sectionId: e.target.value })} required className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                        <option value="">Select</option>
                                        {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Faculty</Label>
                                    <select value={form.facultyId} onChange={e => setForm({ ...form, facultyId: e.target.value })} required className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                        <option value="">Select</option>
                                        {facultyList.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}</Button>
                                </div>
                            </form>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">Note: Semester is auto-linked from subject. The API will handle resolution.</p>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : (
                <div className="space-y-3">
                    {offerings.map((co, i) => (
                        <motion.div key={co.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                            <Card className="hover:shadow-soft transition-all">
                                <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                            <GraduationCap className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">{co.subject?.title}</p>
                                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{co.subject?.code} → {co.section?.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">{co.faculty?.user?.name || 'N/A'}</Badge>
                                        <Badge variant="outline">{co.section?.department?.name || ''}</Badge>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500" onClick={() => {
                                            setForm({ id: co.id, subjectId: co.subjectId, sectionId: co.sectionId, facultyId: co.facultyId, semesterId: co.semesterId });
                                            setShowForm(true);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(co.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
