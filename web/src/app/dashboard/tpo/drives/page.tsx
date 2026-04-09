'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Plus, Loader2, X, Calendar, DollarSign, MapPin, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '@/lib/api';

export default function TPODrivesPage() {
    const [drives, setDrives] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [companyName, setCompanyName] = useState('');
    const [role, setRole] = useState('');
    const [packageLPA, setPackageLPA] = useState('');
    const [location, setLocation] = useState('');
    const [eligibilityCriteria, setEligibilityCriteria] = useState('');
    const [description, setDescription] = useState('');
    const [lastDate, setLastDate] = useState('');

    const load = async () => {
        try {
            const d = await api.get<any[]>('/placements/drives?all=true');
            setDrives(d);
        } catch {}
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await api.post('/placements/drives', {
                companyName, role, packageLPA: parseFloat(packageLPA), location,
                eligibilityCriteria, description,
                lastDate: lastDate ? new Date(lastDate).toISOString() : undefined,
            });
            setShowForm(false);
            resetForm();
            await load();
        } catch (err: any) { setError(err.message); }
        setSaving(false);
    };

    const resetForm = () => {
        setCompanyName(''); setRole(''); setPackageLPA(''); setLocation('');
        setEligibilityCriteria(''); setDescription(''); setLastDate('');
    };

    const toggleActive = async (id: string) => {
        try { await api.patch(`/placements/drives/${id}/toggle`, {}); await load(); } catch {}
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Placement Drives</h2>
                    <p className="text-[hsl(var(--muted-foreground))]">Create and manage campus placement drives</p>
                </div>
                <Button onClick={() => setShowForm(true)} variant="gradient">
                    <Plus className="w-4 h-4 mr-1" /> New Drive
                </Button>
            </div>

            {showForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle>Create Placement Drive</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); resetForm(); }}><X className="w-4 h-4" /></Button>
                        </CardHeader>
                        <CardContent>
                            {error && <div className="text-red-500 text-sm mb-3 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl">{error}</div>}
                            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-1"><Label>Company Name *</Label><Input value={companyName} onChange={e => setCompanyName(e.target.value)} required /></div>
                                <div className="space-y-1"><Label>Job Role *</Label><Input value={role} onChange={e => setRole(e.target.value)} required /></div>
                                <div className="space-y-1"><Label>Package (LPA) *</Label><Input type="number" step="0.1" value={packageLPA} onChange={e => setPackageLPA(e.target.value)} required /></div>
                                <div className="space-y-1"><Label>Location</Label><Input value={location} onChange={e => setLocation(e.target.value)} /></div>
                                <div className="space-y-1"><Label>Last Date to Apply</Label><Input type="date" value={lastDate} onChange={e => setLastDate(e.target.value)} /></div>
                                <div className="space-y-1"><Label>Eligibility Criteria</Label><Input value={eligibilityCriteria} onChange={e => setEligibilityCriteria(e.target.value)} /></div>
                                <div className="space-y-1 sm:col-span-2 lg:col-span-2"><Label>Description</Label><Input value={description} onChange={e => setDescription(e.target.value)} /></div>
                                <div className="flex items-end"><Button type="submit" disabled={saving} className="w-full">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Drive'}</Button></div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : drives.length === 0 ? (
                <Card><CardContent className="p-12 text-center"><Briefcase className="w-12 h-12 mx-auto mb-4 text-[hsl(var(--muted-foreground))]" /><h3 className="text-lg font-semibold mb-2">No Placement Drives</h3><p className="text-[hsl(var(--muted-foreground))]">Create your first placement drive above.</p></CardContent></Card>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {drives.map((d, i) => (
                        <motion.div key={d.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <Card className="hover:shadow-soft-lg transition-all overflow-hidden relative">
                                <div className={`absolute top-0 left-0 right-0 h-1 ${d.isActive ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gray-300'}`} />
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white font-bold">{d.companyName?.charAt(0)}</div>
                                            <div>
                                                <p className="font-semibold">{d.companyName}</p>
                                                <p className="text-xs text-[hsl(var(--muted-foreground))]">{d.role}</p>
                                            </div>
                                        </div>
                                        <Badge variant={d.isActive ? 'default' : 'secondary'}>{d.isActive ? 'Active' : 'Closed'}</Badge>
                                    </div>
                                    <div className="space-y-1.5 text-xs text-[hsl(var(--muted-foreground))] mb-3">
                                        <div className="flex items-center gap-2"><DollarSign className="w-3.5 h-3.5" />{d.packageLPA} LPA</div>
                                        {d.location && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" />{d.location}</div>}
                                        <div className="flex items-center gap-2"><Briefcase className="w-3.5 h-3.5" />{d.applications?.length || d._count?.applications || 0} Applications</div>
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => toggleActive(d.id)}>
                                        {d.isActive ? <><ToggleRight className="w-3 h-3 mr-1" /> Close Drive</> : <><ToggleLeft className="w-3 h-3 mr-1" /> Reopen Drive</>}
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
