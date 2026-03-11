'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Pencil, Trash2, Loader2, X } from 'lucide-react';
import api from '@/lib/api';

interface Department {
    id: string;
    name: string;
    code: string;
    _count?: { sections: number; students: number; faculty: number };
}

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const load = async () => {
        try {
            const data = await api.get<Department[]>('/departments');
            setDepartments(data);
        } catch { /* ignore */ }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            if (editingId) {
                await api.put(`/departments/${editingId}`, { name, code });
            } else {
                await api.post('/departments', { name, code });
            }
            setShowForm(false);
            setEditingId(null);
            setName('');
            setCode('');
            await load();
        } catch (err: any) {
            setError(err.message);
        }
        setSaving(false);
    };

    const handleEdit = (dept: Department) => {
        setEditingId(dept.id);
        setName(dept.name);
        setCode(dept.code);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this department?')) return;
        try {
            await api.delete(`/departments/${id}`);
            await load();
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Departments</h2>
                    <p className="text-[hsl(var(--muted-foreground))]">Manage academic departments</p>
                </div>
                <Button onClick={() => { setShowForm(true); setEditingId(null); setName(''); setCode(''); }} variant="gradient">
                    <Plus className="w-4 h-4" /> Add Department
                </Button>
            </div>

            {showForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle>{editingId ? 'Edit' : 'Create'} Department</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
                        </CardHeader>
                        <CardContent>
                            {error && <div className="text-red-500 text-sm mb-3 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl">{error}</div>}
                            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 space-y-1">
                                    <Label>Department Name</Label>
                                    <Input placeholder="Computer Science and Engineering" value={name} onChange={e => setName(e.target.value)} required />
                                </div>
                                <div className="w-full sm:w-32 space-y-1">
                                    <Label>Code</Label>
                                    <Input placeholder="CSE" value={code} onChange={e => setCode(e.target.value)} required />
                                </div>
                                <div className="flex items-end">
                                    <Button type="submit" disabled={saving}>
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Update' : 'Create'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : departments.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-[hsl(var(--muted-foreground))]">No departments yet. Create one to get started.</CardContent></Card>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departments.map((dept, i) => (
                        <motion.div key={dept.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <Card className="hover:shadow-soft-lg transition-all group">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                                <Building2 className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-semibold">{dept.name}</p>
                                                <Badge variant="secondary" className="mt-1">{dept.code}</Badge>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(dept)} className="h-8 w-8"><Pencil className="w-3 h-3" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(dept.id)} className="h-8 w-8 text-red-500"><Trash2 className="w-3 h-3" /></Button>
                                        </div>
                                    </div>
                                    {dept._count && (
                                        <div className="flex gap-4 mt-4 text-xs text-[hsl(var(--muted-foreground))]">
                                            <span>{dept._count.sections} sections</span>
                                            <span>{dept._count.students} students</span>
                                            <span>{dept._count.faculty} faculty</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
