'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Calendar as CalendarIcon, Loader2, Sparkles, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';

export default function StudentClubsPage() {
    const { user } = useAuth();
    const [clubs, setClubs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadClubs = async () => {
        try {
            const data = await api.get<any[]>('/clubs');
            setClubs(data);
        } catch (e: any) { alert(e.message); }
        setLoading(false);
    };

    useEffect(() => { loadClubs(); }, []);

    const joinClub = async (id: string) => {
        if (!confirm('Are you sure you want to join this club?')) return;
        try {
            await api.post(`/clubs/${id}/join`);
            alert('Successfully joined the club.');
            loadClubs();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const leaveClub = async (id: string) => {
        if (!confirm('Are you sure you want to leave this club?')) return;
        try {
            await api.delete(`/clubs/${id}/leave`);
            alert('You have left the club.');
            loadClubs();
        } catch (e: any) {
            alert(e.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        Campus Clubs
                    </h2>
                    <p className="text-[hsl(var(--muted-foreground))] mt-1">Discover and join student organizations</p>
                </div>
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
                                        <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 relative z-10 hover:bg-indigo-100">
                                            {c.category}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1 mt-2">
                                        <Users className="w-3.5 h-3.5" /> Coordinator: {c.coordinator?.name || 'N/A'}
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm line-clamp-3">{c.description || 'A vibrant community for students.'}</p>
                                    <div className="flex gap-4 text-xs font-semibold text-[hsl(var(--muted-foreground))]">
                                        <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {c._count?.members || 0} Members</div>
                                        <div className="flex items-center gap-1"><CalendarIcon className="w-3.5 h-3.5" /> {c._count?.events || 0} Events</div>
                                    </div>
                                    {c.members?.some((m: any) => m.student.userId === user?.id) ? (
                                        <Button onClick={() => leaveClub(c.id)} variant="destructive" className="w-full">
                                            Leave Club
                                        </Button>
                                    ) : (
                                        <Button onClick={() => joinClub(c.id)} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30">
                                            <Sparkles className="w-4 h-4 mr-2" /> Join Club
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                    {clubs.length === 0 && (
                        <div className="col-span-full py-12 text-center text-[hsl(var(--muted-foreground))]">
                            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            No clubs have been formed yet.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
