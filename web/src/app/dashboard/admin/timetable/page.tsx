'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Loader2, X } from 'lucide-react';
import api from '@/lib/api';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function TimetablePage() {
    const [slots, setSlots] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [offerings, setOfferings] = useState<any[]>([]);
    const [selectedSection, setSelectedSection] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ sectionId: '', dayOfWeek: '', hourIndex: '1', startTime: '09:00', endTime: '09:50', courseOfferingId: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const loadSections = async () => {
        try {
            const depts = await api.get<any[]>('/departments');
            const allSec: any[] = [];
            for (const d of depts) {
                const detail = await api.get<any>(`/departments/${d.id}`);
                if (detail.sections) detail.sections.forEach((s: any) => allSec.push({ ...s, deptName: d.name }));
            }
            setSections(allSec);
            if (allSec.length > 0 && !selectedSection) setSelectedSection(allSec[0].id);
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

    useEffect(() => { loadSections(); }, []);
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

    const grouped = DAYS.reduce((acc, day) => {
        acc[day] = slots.filter(s => s.dayOfWeek === day).sort((a: any, b: any) => a.hourIndex - b.hourIndex);
        return acc;
    }, {} as Record<string, any[]>);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold">Timetable</h2>
                    <p className="text-[hsl(var(--muted-foreground))]">Manage class schedules</p>
                </div>
                <div className="flex gap-2">
                    <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="h-10 rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 text-sm">
                        {sections.map(s => <option key={s.id} value={s.id}>{s.name} ({s.deptName})</option>)}
                    </select>
                    <Button onClick={() => setShowForm(true)} variant="gradient" size="sm"><Plus className="w-4 h-4" /> Add Slot</Button>
                </div>
            </div>

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

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : (
                <div className="space-y-4">
                    {DAYS.map(day => (
                        <Card key={day}>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Calendar className="w-4 h-4" /> {day}</CardTitle></CardHeader>
                            <CardContent>
                                {grouped[day]?.length > 0 ? (
                                    <div className="flex gap-3 flex-wrap">
                                        {grouped[day].map((slot: any) => (
                                            <div key={slot.id} className="bg-[hsl(var(--secondary))] rounded-xl p-3 min-w-[160px]">
                                                <p className="font-medium text-sm">{slot.courseOffering?.subject?.title}</p>
                                                <p className="text-xs text-[hsl(var(--muted-foreground))]">{slot.courseOffering?.subject?.code}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <Badge variant="outline" className="text-[10px]">Period {slot.hourIndex}</Badge>
                                                    <Badge variant="secondary" className="text-[10px]">{slot.startTime}-{slot.endTime}</Badge>
                                                </div>
                                                <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">{slot.courseOffering?.faculty?.user?.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">No classes scheduled</p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
