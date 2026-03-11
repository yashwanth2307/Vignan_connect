'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Plus, Loader2, X } from 'lucide-react';
import api from '@/lib/api';

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [regulations, setRegulations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ code: '', title: '', credits: '4', semesterNumber: '1', regulationId: '', departmentId: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const load = async () => {
        try {
            const [s, d, r] = await Promise.all([
                api.get<any[]>('/subjects'),
                api.get<any[]>('/departments'),
                api.get<any[]>('/regulations'),
            ]);
            setSubjects(s);
            setDepartments(d);
            setRegulations(r);
        } catch { /* ignore */ }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await api.post('/subjects', { ...form, credits: +form.credits, semesterNumber: +form.semesterNumber });
            setShowForm(false);
            setForm({ code: '', title: '', credits: '4', semesterNumber: '1', regulationId: '', departmentId: '' });
            await load();
        } catch (err: any) { setError(err.message); }
        setSaving(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Subjects</h2>
                    <p className="text-[hsl(var(--muted-foreground))]">Manage academic subjects</p>
                </div>
                <Button onClick={() => setShowForm(true)} variant="gradient"><Plus className="w-4 h-4" /> Add Subject</Button>
            </div>

            {showForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle>Create Subject</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
                        </CardHeader>
                        <CardContent>
                            {error && <div className="text-red-500 text-sm mb-3 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl">{error}</div>}
                            <form onSubmit={handleSubmit} className="grid sm:grid-cols-3 gap-4">
                                <div className="space-y-1"><Label>Code</Label><Input placeholder="CS301" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required /></div>
                                <div className="space-y-1"><Label>Title</Label><Input placeholder="Data Structures" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
                                <div className="space-y-1"><Label>Credits</Label><Input type="number" value={form.credits} onChange={e => setForm({ ...form, credits: e.target.value })} required /></div>
                                <div className="space-y-1"><Label>Semester Number</Label><Input type="number" value={form.semesterNumber} onChange={e => setForm({ ...form, semesterNumber: e.target.value })} required /></div>
                                <div className="space-y-1">
                                    <Label>Department</Label>
                                    <select value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })} required className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                        <option value="">Select</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Regulation</Label>
                                    <select value={form.regulationId} onChange={e => setForm({ ...form, regulationId: e.target.value })} required className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                        <option value="">Select</option>
                                        {regulations.map(r => <option key={r.id} value={r.id}>{r.code}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-end sm:col-span-3">
                                    <Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjects.map((sub, i) => (
                        <motion.div key={sub.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <Card className="hover:shadow-soft-lg transition-all">
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                            <BookOpen className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">{sub.title}</p>
                                            <div className="flex gap-2 mt-1">
                                                <Badge variant="secondary">{sub.code}</Badge>
                                                <Badge variant="outline">{sub.credits} credits</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">Semester {sub.semesterNumber}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
