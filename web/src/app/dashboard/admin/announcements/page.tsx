'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Plus, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';

export default function AdminAnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetRole, setTargetRole] = useState('');
    const [isImportant, setIsImportant] = useState(false);

    const load = async () => {
        try {
            const data = await api.get<any[]>('/announcements');
            setAnnouncements(data);
        } catch { }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async () => {
        if (!title || !message) return;
        setSaving(true);
        try {
            await api.post('/announcements', {
                title, message, targetRole: targetRole || null, isImportant
            });
            setTitle(''); setMessage(''); setTargetRole(''); setIsImportant(false);
            setShowForm(false);
            load();
        } catch (e: any) { alert(e.message); }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to dismiss this announcement?')) return;
        try {
            await api.delete(`/announcements/${id}`);
            load();
        } catch { }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Announcements</h2>
                    <p className="text-[hsl(var(--muted-foreground))]">Broadcast important information to the institution.</p>
                </div>
                <Button variant="gradient" onClick={() => setShowForm(!showForm)}>
                    <Plus className="w-4 h-4 mr-1" /> Add Announcement
                </Button>
            </div>

            {showForm && (
                <Card className="border-2 border-dashed border-blue-300 dark:border-blue-800">
                    <CardContent className="p-6 space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Title *</label>
                                <input value={title} onChange={e => setTitle(e.target.value)}
                                    className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
                                    placeholder="e.g. Exam Schedule Released" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Target Role</label>
                                <select value={targetRole} onChange={e => setTargetRole(e.target.value)}
                                    className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm">
                                    <option value="">All Roles (Global)</option>
                                    <option value="STUDENT">Students Only</option>
                                    <option value="FACULTY">Faculty Only</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Message *</label>
                            <textarea value={message} onChange={e => setMessage(e.target.value)}
                                className="flex w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm min-h-[80px]"
                                placeholder="Detailed announcement content..." />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <input type="checkbox" id="isImportant" checked={isImportant} onChange={e => setIsImportant(e.target.checked)} className="w-4 h-4" />
                            <label htmlFor="isImportant" className="text-sm font-semibold text-red-600 flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4" /> Display as Red Scrolling Information Bar
                            </label>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button variant="gradient" onClick={handleCreate} disabled={saving || !title || !message}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Announcement'}
                            </Button>
                            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-4">
                {announcements.map(ann => (
                    <Card key={ann.id} className={`overflow-hidden transition-shadow ${ann.isImportant ? 'border-red-500/50 bg-red-50/50 dark:bg-red-950/10' : ''}`}>
                        <CardContent className="p-4 flex gap-4">
                            <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${ann.isImportant ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                {ann.isImportant ? <AlertTriangle className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-bold text-lg">{ann.title}</h3>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(ann.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 -my-1">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="text-sm text-gray-500 mb-2 leading-relaxed whitespace-pre-wrap">{ann.message}</p>
                                <div className="flex items-center gap-3 text-[10px] text-[hsl(var(--muted-foreground))]">
                                    <span>By: {ann.createdBy?.name || 'Admin'}</span>
                                    <span>Target: {ann.targetRole || 'Global'}</span>
                                    <span>{new Date(ann.createdAt).toLocaleString()}</span>
                                    {ann.isImportant && <span className="bg-red-100 text-red-700 px-2 rounded-full font-bold">SCROLLING BADGE</span>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {announcements.length === 0 && !showForm && (
                    <div className="py-12 text-center text-[hsl(var(--muted-foreground))] flex flex-col items-center">
                        <Bell className="w-12 h-12 opacity-20 mb-3" />
                        <p>No active announcements.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
