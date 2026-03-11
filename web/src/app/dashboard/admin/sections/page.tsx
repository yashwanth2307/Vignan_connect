'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Layers, Plus, Trash2, Loader2, X } from 'lucide-react';
import api from '@/lib/api';

export default function SectionsPage() {
    const [sections, setSections] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const load = async () => {
        try {
            const [depts] = await Promise.all([api.get<any[]>('/departments')]);
            setDepartments(depts);
            const allSections: any[] = [];
            for (const d of depts) {
                const detail = await api.get<any>(`/departments/${d.id}`);
                if (detail.sections) {
                    detail.sections.forEach((s: any) => allSections.push({ ...s, departmentName: d.name, departmentCode: d.code }));
                }
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
            await api.post('/sections', { name, departmentId });
            setShowForm(false);
            setName('');
            setDepartmentId('');
            await load();
        } catch (err: any) { setError(err.message); }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this section?')) return;
        try {
            await api.delete(`/sections/${id}`);
            await load();
        } catch (err: any) { alert(err.message); }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Sections</h2>
                    <p className="text-[hsl(var(--muted-foreground))]">Manage sections within departments</p>
                </div>
                <Button onClick={() => setShowForm(true)} variant="gradient"><Plus className="w-4 h-4" /> Add Section</Button>
            </div>

            {showForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle>Create Section</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
                        </CardHeader>
                        <CardContent>
                            {error && <div className="text-red-500 text-sm mb-3 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl">{error}</div>}
                            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 space-y-1">
                                    <Label>Section Name</Label>
                                    <Input placeholder="CSE-A" value={name} onChange={e => setName(e.target.value)} required />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <Label>Department</Label>
                                    <select value={departmentId} onChange={e => setDepartmentId(e.target.value)} required className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                        <option value="">Select department</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <Button type="submit" disabled={saving}>
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                                    </Button>
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
                    {sections.map((sec, i) => (
                        <motion.div key={sec.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <Card className="hover:shadow-soft-lg transition-all group">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                                                <Layers className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-semibold">{sec.name}</p>
                                                <Badge variant="secondary" className="mt-1">{sec.departmentCode || sec.departmentName}</Badge>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(sec.id)} className="h-8 w-8 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></Button>
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
