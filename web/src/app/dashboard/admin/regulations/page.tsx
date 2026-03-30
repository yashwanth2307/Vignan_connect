'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Loader2, X, Pencil, Trash2 } from 'lucide-react';
import api from '@/lib/api';

export default function RegulationsPage() {
    const [regulations, setRegulations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [activeFrom, setActiveFrom] = useState('');
    const [minAttendance, setMinAttendance] = useState('75');
    const [passMark, setPassMark] = useState('40');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const load = async () => {
        try {
            const data = await api.get<any[]>('/regulations');
            setRegulations(data);
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
                await api.put(`/regulations/${editingId}`, {
                    code,
                    activeFrom: new Date(activeFrom).toISOString(),
                    rulesJson: { minAttendance: +minAttendance, passMark: +passMark, internalWeightage: 30, externalWeightage: 70 },
                });
            } else {
                await api.post('/regulations', {
                    code,
                    activeFrom: new Date(activeFrom).toISOString(),
                    rulesJson: { minAttendance: +minAttendance, passMark: +passMark, internalWeightage: 30, externalWeightage: 70 },
                });
            }
            setShowForm(false);
            setEditingId(null);
            setCode('');
            setActiveFrom('');
            await load();
        } catch (err: any) { setError(err.message); }
        setSaving(false);
    };

    const handleEdit = (reg: any) => {
        setEditingId(reg.id);
        setCode(reg.code);
        setActiveFrom(new Date(reg.activeFrom).toISOString().split('T')[0]);
        setMinAttendance(reg.rulesJson?.minAttendance?.toString() || '75');
        setPassMark(reg.rulesJson?.passMark?.toString() || '40');
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this regulation?')) return;
        try {
            await api.delete(`/regulations/${id}`);
            await load();
        } catch(err:any) {
            alert(err.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Regulations</h2>
                    <p className="text-[hsl(var(--muted-foreground))]">Manage academic regulations (R20, R22, etc.)</p>
                </div>
                <Button onClick={() => { setShowForm(true); setEditingId(null); setCode(''); setActiveFrom(''); }} variant="gradient"><Plus className="w-4 h-4" /> Add Regulation</Button>
            </div>

            {showForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle>{editingId ? 'Edit' : 'Create'} Regulation</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
                        </CardHeader>
                        <CardContent>
                            {error && <div className="text-red-500 text-sm mb-3 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl">{error}</div>}
                            <form onSubmit={handleSubmit} className="grid sm:grid-cols-5 gap-4">
                                <div className="space-y-1">
                                    <Label>Code</Label>
                                    <Input placeholder="R22" value={code} onChange={e => setCode(e.target.value)} required />
                                </div>
                                <div className="space-y-1">
                                    <Label>Active From</Label>
                                    <Input type="date" value={activeFrom} onChange={e => setActiveFrom(e.target.value)} required />
                                </div>
                                <div className="space-y-1">
                                    <Label>Min Attendance %</Label>
                                    <Input type="number" value={minAttendance} onChange={e => setMinAttendance(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Pass Mark</Label>
                                    <Input type="number" value={passMark} onChange={e => setPassMark(e.target.value)} />
                                </div>
                                <div className="flex items-end">
                                    <Button type="submit" disabled={saving} className="w-full">
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
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {regulations.map((reg, i) => (
                        <motion.div key={reg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <Card className="hover:shadow-soft-lg transition-all group">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-lg">{reg.code}</p>
                                                <p className="text-xs text-[hsl(var(--muted-foreground))]">v{reg.version}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(reg)} className="h-8 w-8"><Pencil className="w-3 h-3" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(reg.id)} className="h-8 w-8 text-red-500"><Trash2 className="w-3 h-3" /></Button>
                                        </div>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        <p><span className="text-[hsl(var(--muted-foreground))]">Active from:</span> {new Date(reg.activeFrom).toLocaleDateString()}</p>
                                        {reg.rulesJson && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <Badge variant="outline">Min Att: {reg.rulesJson.minAttendance}%</Badge>
                                                <Badge variant="outline">Pass: {reg.rulesJson.passMark}</Badge>
                                            </div>
                                        )}
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
