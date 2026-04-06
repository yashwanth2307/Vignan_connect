'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Plus, Trash2, Loader2, Link as LinkIcon, Download, Sparkles, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/api';

export default function AdminEventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [formUrl, setFormUrl] = useState('');
    const [isInternalRegistration, setIsInternalRegistration] = useState(true);
    const [startsAt, setStartsAt] = useState('');
    const [expiresAt, setExpiresAt] = useState('');

    const load = async () => {
        try {
            const data = await api.get<any[]>('/events');
            setEvents(data);
        } catch { }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async () => {
        if (!title || !startsAt || !expiresAt) return alert('Fill required fields');
        setSaving(true);
        try {
            await api.post('/events', {
                title, description, imageUrl, formUrl: isInternalRegistration ? null : formUrl,
                isInternalRegistration, startsAt, expiresAt
            });
            setTitle(''); setDescription(''); setImageUrl(''); setFormUrl('');
            setStartsAt(''); setExpiresAt('');
            setShowForm(false);
            load();
        } catch (e: any) { alert(e.message); }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this event?')) return;
        try {
            await api.delete(`/events/${id}`);
            load();
        } catch { }
    };

    const downloadResponses = async (id: string, title: string) => {
        try {
            const registrations = await api.get<any[]>(`/events/${id}/registrations`);
            if (registrations.length === 0) return alert('No registrations yet.');

            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Name,Roll No,Email,Department,Registered At\n";

            registrations.forEach((reg: any) => {
                const s = reg.student;
                csvContent += `"${s.user?.name || ''}","${s.rollNo}","${s.user?.email || ''}","${s.department?.name || ''}","${new Date(reg.registeredAt).toLocaleString()}"\n`;
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `${title.replace(/\s+/g, '_')}_Responses.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e: any) {
            alert('Failed to download responses');
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 4 * 1024 * 1024) return alert("Image is too large! Maximum limit is 4MB.");
        const reader = new FileReader();
        reader.onloadend = () => setImageUrl(reader.result as string);
        reader.readAsDataURL(file);
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Platform Events & Registrations</h2>
                    <p className="text-[hsl(var(--muted-foreground))]">Manage technical and cultural events, and download participant lists.</p>
                </div>
                <Button variant="gradient" onClick={() => setShowForm(!showForm)}>
                    <Plus className="w-4 h-4 mr-1" /> Add Event
                </Button>
            </div>

            {showForm && (
                <Card className="border-2 border-dashed border-purple-300 dark:border-purple-800">
                    <CardContent className="p-6 space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Event Title *</label>
                                <input value={title} onChange={e => setTitle(e.target.value)}
                                    className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
                                    placeholder="e.g. Hackathon 2026" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Upload Banner Image</label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold flex items-center file:bg-[hsl(var(--primary))] file:text-white"
                                />
                                {imageUrl && <p className="text-xs text-green-500 mt-1">✓ Banner attached</p>}
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Starts At *</label>
                                <input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)}
                                    className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Ends At *</label>
                                <input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                                    className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm" />
                            </div>
                        </div>

                        <div className="p-4 bg-[hsl(var(--secondary))] rounded-xl space-y-3">
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id="internalReg" 
                                    checked={isInternalRegistration} 
                                    onChange={e => setIsInternalRegistration(e.target.checked)} 
                                    className="w-4 h-4" 
                                />
                                <label htmlFor="internalReg" className="text-sm font-bold flex items-center gap-1 cursor-pointer">
                                    <Sparkles className="w-4 h-4 text-purple-500" /> Use V-Connect Built-in Registration Form
                                </label>
                            </div>
                            {!isInternalRegistration && (
                                <div className="space-y-1 pl-6">
                                    <label className="text-sm font-medium">External Form URL (Google Forms, etc.)</label>
                                    <input value={formUrl} onChange={e => setFormUrl(e.target.value)}
                                        className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
                                        placeholder="https://forms.gle/..." />
                                </div>
                            )}
                            {isInternalRegistration && (
                                <p className="text-xs text-green-600 pl-6 border-l-2 border-green-500 ml-1">
                                    Students will be able to register with one-click directly inside V-Connect. Admin can download their responses later.
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Detailed Description</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)}
                                className="flex w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm min-h-[80px]"
                                placeholder="Details about rules, venues, prizes..." />
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                            <Button variant="gradient" onClick={handleCreate} disabled={saving || !title || !startsAt || !expiresAt}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Event'}
                            </Button>
                            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((ev) => (
                    <Card key={ev.id} className="overflow-hidden hover:shadow-lg transition-shadow group flex flex-col">
                        {ev.imageUrl ? (
                           <img src={ev.imageUrl} alt={ev.title} className="w-full h-40 object-cover border-b" />
                        ) : (
                           <div className="w-full h-40 bg-[hsl(var(--secondary))] flex items-center justify-center border-b text-[hsl(var(--muted-foreground))]">
                               <Sparkles className="w-10 h-10 opacity-20" />
                           </div>
                        )}
                        <CardContent className="p-4 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg leading-tight line-clamp-2">{ev.title}</h3>
                                <div className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full whitespace-nowrap font-semibold">
                                    {ev._count?.registrations || 0} Registered
                                </div>
                            </div>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1 mb-1">
                                <CalendarIcon className="w-3.5 h-3.5" />
                                {new Date(ev.startsAt).toLocaleDateString()} - {new Date(ev.expiresAt).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-snug flex-1">
                                {ev.description || 'No detailed description provided.'}
                            </p>
                            <div className="border-t pt-3 flex items-center justify-between mt-auto">
                                {ev.isInternalRegistration ? (
                                    <Button variant="outline" size="sm" onClick={() => downloadResponses(ev.id, ev.title)} className="bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/30">
                                        <Download className="w-4 h-4 mr-1.5" /> CSV Responses
                                    </Button>
                                ) : (
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={ev.formUrl || '#'} target="_blank" rel="noreferrer">
                                            <LinkIcon className="w-4 h-4 mr-1.5" /> External Form
                                        </a>
                                    </Button>
                                )}
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(ev.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 px-2 min-w-0">
                                    <Trash2 className="w-4 h-4 shrink-0" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {events.length === 0 && !showForm && (
                     <div className="col-span-full py-16 text-center text-[hsl(var(--muted-foreground))] flex flex-col items-center">
                         <CalendarIcon className="w-12 h-12 opacity-20 mb-3" />
                         <p>No events found. Start organizing!</p>
                     </div>
                )}
            </div>
        </div>
    );
}
