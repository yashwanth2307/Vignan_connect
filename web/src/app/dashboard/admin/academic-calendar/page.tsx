'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Calendar, Plus, Trash2, Eye, EyeOff, Loader2, AlertTriangle,
    GraduationCap, BookOpen, PartyPopper, Clock, Star
} from 'lucide-react';
import api from '@/lib/api';

const EVENT_TYPES = [
    { value: 'HOLIDAY', label: 'Holiday', color: 'bg-red-500', icon: PartyPopper },
    { value: 'EXAM', label: 'Exam', color: 'bg-orange-500', icon: BookOpen },
    { value: 'SEMESTER_START', label: 'Semester Start', color: 'bg-green-500', icon: Star },
    { value: 'SEMESTER_END', label: 'Semester End', color: 'bg-blue-500', icon: Clock },
    { value: 'INTERNAL_EXAM', label: 'Internal Exam', color: 'bg-purple-500', icon: GraduationCap },
    { value: 'WORKING_SATURDAY', label: 'Working Saturday', color: 'bg-yellow-600', icon: Calendar },
    { value: 'SPECIAL_EVENT', label: 'Special Event', color: 'bg-pink-500', icon: Star },
    { value: 'RESULT_DATE', label: 'Result Date', color: 'bg-teal-500', icon: BookOpen },
];

function getEventMeta(type: string) {
    return EVENT_TYPES.find(e => e.value === type) || EVENT_TYPES[0];
}

export default function AcademicCalendarPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [eventType, setEventType] = useState('HOLIDAY');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [academicYear, setAcademicYear] = useState('2024-25');
    const [semester, setSemester] = useState('');
    const [description, setDescription] = useState('');

    const loadEvents = async () => {
        try {
            const data = await api.get<any[]>('/academic-calendar');
            setEvents(data);
        } catch { }
        setLoading(false);
    };

    useEffect(() => { loadEvents(); }, []);

    const handleCreate = async () => {
        if (!title || !startDate) return;
        setSaving(true);
        try {
            await api.post('/academic-calendar', {
                title, eventType, startDate, endDate: endDate || undefined,
                academicYear, semester: semester ? parseInt(semester) : undefined,
                description: description || undefined
            });
            setTitle(''); setStartDate(''); setEndDate(''); setDescription('');
            setSemester(''); setShowForm(false);
            loadEvents();
        } catch (e: any) { alert(e.message); }
        setSaving(false);
    };

    const togglePublish = async (id: string) => {
        try {
            await api.put(`/academic-calendar/${id}/toggle-publish`);
            loadEvents();
        } catch { }
    };

    const deleteEvent = async (id: string) => {
        if (!confirm('Delete this event?')) return;
        try {
            await api.delete(`/academic-calendar/${id}`);
            loadEvents();
        } catch { }
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Academic Calendar</h2>
                    <p className="text-[hsl(var(--muted-foreground))]">Manage academic events, holidays, and exam schedules</p>
                </div>
                <Button variant="gradient" onClick={() => setShowForm(!showForm)}>
                    <Plus className="w-4 h-4 mr-1" /> Add Event
                </Button>
            </div>

            {/* Create Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <Card className="border-2 border-dashed border-blue-300 dark:border-blue-800">
                            <CardContent className="p-6 space-y-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Event Title *</label>
                                        <input value={title} onChange={e => setTitle(e.target.value)}
                                            className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
                                            placeholder="e.g. Sankranti Holiday" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Event Type</label>
                                        <select value={eventType} onChange={e => setEventType(e.target.value)}
                                            className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm">
                                            {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Start Date *</label>
                                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                            className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">End Date</label>
                                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                            className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Academic Year</label>
                                        <select value={academicYear} onChange={e => setAcademicYear(e.target.value)}
                                            className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm">
                                            <option value="2023-24">2023-24</option>
                                            <option value="2024-25">2024-25</option>
                                            <option value="2025-26">2025-26</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Semester (optional)</label>
                                        <select value={semester} onChange={e => setSemester(e.target.value)}
                                            className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm">
                                            <option value="">All Semesters</option>
                                            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Description</label>
                                    <textarea value={description} onChange={e => setDescription(e.target.value)}
                                        className="flex w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm min-h-[60px]"
                                        placeholder="Optional description..." />
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="gradient" onClick={handleCreate} disabled={saving || !title || !startDate}>
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Event'}
                                    </Button>
                                    <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Events List */}
            {events.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-[hsl(var(--muted-foreground))]">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <h3 className="font-semibold mb-1">No Events Yet</h3>
                        <p className="text-sm">Add academic events like holidays, exams, and semester dates.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {events.map((event, i) => {
                        const meta = getEventMeta(event.eventType);
                        const IconComp = meta.icon;
                        return (
                            <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                                <Card className="hover:shadow-soft transition-shadow">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className={`w-11 h-11 rounded-xl ${meta.color} flex items-center justify-center text-white shrink-0`}>
                                            <IconComp className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-semibold text-sm">{event.title}</p>
                                                <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
                                                {event.isPublished ?
                                                    <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200">Published</Badge> :
                                                    <Badge variant="secondary" className="text-[10px]">Draft</Badge>
                                                }
                                            </div>
                                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                                                {new Date(event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                {event.endDate && ` — ${new Date(event.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                                                {' • '}{event.academicYear}
                                                {event.semester && ` • Sem ${event.semester}`}
                                            </p>
                                            {event.description && <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{event.description}</p>}
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <Button size="sm" variant="outline" onClick={() => togglePublish(event.id)}
                                                className="text-xs">
                                                {event.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => deleteEvent(event.id)}
                                                className="text-xs text-red-500 border-red-200 hover:bg-red-50">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
