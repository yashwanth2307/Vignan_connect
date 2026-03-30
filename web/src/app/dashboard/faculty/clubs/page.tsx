'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Calendar as CalendarIcon, Loader2, Building2, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';

export default function FacultyClubsPage() {
    const { user } = useAuth();
    const [clubs, setClubs] = useState<any[]>([]);
    const [faculty, setFaculty] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [eventOpen, setEventOpen] = useState(false);
    const [selectedClubId, setSelectedClubId] = useState('');
    const [formData, setFormData] = useState({ name: '', category: 'Technical', description: '', coordinatorId: '' });
    const [eventData, setEventData] = useState({ title: '', description: '', date: '', venue: '' });

    const loadData = async () => {
        try {
            const [cData, fData] = await Promise.all([
                api.get<any[]>('/clubs'),
                api.get<any[]>('/users?role=FACULTY')
            ]);
            setClubs(cData);
            setFaculty(fData);
        } catch (e: any) { alert(e.message); }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [user]);

    const createClub = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/clubs', formData);
            setOpen(false);
            setFormData({ name: '', category: 'Technical', description: '', coordinatorId: '' });
            loadData();
        } catch (e: any) { alert(e.message); }
    };

    const deleteClub = async (id: string) => {
        if (!confirm('Are you sure you want to delete this club?')) return;
        try {
            await api.delete(`/clubs/${id}`);
            loadData();
        } catch (e: any) { alert(e.message); }
    };

    const createEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/clubs/${selectedClubId}/events`, eventData);
            setEventOpen(false);
            setEventData({ title: '', description: '', date: '', venue: '' });
            alert('Event successfully created');
            loadData();
        } catch (e: any) { alert(e.message); }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Campus Clubs
                    </h2>
                    <p className="text-[hsl(var(--muted-foreground))] mt-1">Manage clubs and schedule events</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild onClick={() => setOpen(true)}>
                        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"><Plus className="w-4 h-4 mr-2" /> Create Club</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Create New Club</DialogTitle></DialogHeader>
                        <form onSubmit={createClub} className="space-y-4 pt-4">
                            <div>
                                <label className="text-sm font-medium">Club Name</label>
                                <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Category</label>
                                <select required className="w-full border rounded-md h-10 px-3 bg-transparent" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option value="Technical">Technical</option>
                                    <option value="Cultural">Cultural</option>
                                    <option value="Sports">Sports</option>
                                    <option value="Social">Social</option>
                                    <option value="Literary">Literary</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Description</label>
                                <Input required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Coordinator (Faculty)</label>
                                <select required className="w-full border rounded-md h-10 px-3 bg-transparent" value={formData.coordinatorId} onChange={e => setFormData({ ...formData, coordinatorId: e.target.value })}>
                                    <option value="">Select Faculty Coordinator</option>
                                    {faculty.map(f => (
                                        <option key={f.id} value={f.id}>{f.name} ({f.email})</option>
                                    ))}
                                </select>
                            </div>
                            <Button type="submit" className="w-full">Create Club</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {clubs.map((c, i) => (
                        <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                            <Card className="h-full hover:shadow-xl transition-all border border-[hsl(var(--border))]/50 overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                                            <Building2 className="w-5 h-5 text-indigo-500" />
                                            {c.name}
                                        </CardTitle>
                                        <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200">
                                            {c.category}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1 mt-2">
                                        <Users className="w-3.5 h-3.5" /> Coordinator: You
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm line-clamp-3">{c.description}</p>
                                    <div className="flex justify-between items-center text-xs font-semibold text-[hsl(var(--muted-foreground))]">
                                        <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {c._count?.members || 0} Members</div>
                                        <div className="flex items-center gap-1"><CalendarIcon className="w-3.5 h-3.5" /> {c._count?.events || 0} Events</div>
                                    </div>
                                    
                                    <Dialog open={eventOpen && selectedClubId === c.id} onOpenChange={(isOpen: boolean) => {
                                        setEventOpen(isOpen);
                                        if (isOpen) setSelectedClubId(c.id);
                                    }}>
                                        <DialogTrigger asChild onClick={() => { setEventOpen(true); setSelectedClubId(c.id); }}>
                                            <Button variant="outline" className="w-full border-dashed"><Plus className="w-3 h-3 mr-2" /> Schedule Event</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader><DialogTitle>Schedule Event for {c.name}</DialogTitle></DialogHeader>
                                            <form onSubmit={createEvent} className="space-y-4 pt-4">
                                                <div>
                                                    <label className="text-sm font-medium">Event Title</label>
                                                    <Input required value={eventData.title} onChange={e => setEventData({ ...eventData, title: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium">Description</label>
                                                    <Input required value={eventData.description} onChange={e => setEventData({ ...eventData, description: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium">Event Date</label>
                                                    <Input type="datetime-local" required value={eventData.date} onChange={e => setEventData({ ...eventData, date: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium">Venue</label>
                                                    <Input required value={eventData.venue} onChange={e => setEventData({ ...eventData, venue: e.target.value })} />
                                                </div>
                                                <Button type="submit" className="w-full">Create Event</Button>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                    <Button variant="outline" size="sm" className="w-full text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 mt-2" onClick={() => deleteClub(c.id)}>
                                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Club
                                    </Button>

                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                    {clubs.length === 0 && (
                        <div className="col-span-full py-12 text-center text-[hsl(var(--muted-foreground))]">
                            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            No clubs exist yet. Create one above.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
