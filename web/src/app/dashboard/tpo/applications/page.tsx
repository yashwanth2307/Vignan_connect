'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Loader2, Check, X, User } from 'lucide-react';
import api from '@/lib/api';

export default function TPOApplicationsPage() {
    const [drives, setDrives] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDrive, setSelectedDrive] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const d = await api.get<any[]>('/placements/drives?all=true');
                setDrives(d);
            } catch {}
            setLoading(false);
        })();
    }, []);

    const updateStatus = async (appId: string, status: string) => {
        try {
            await api.patch(`/placements/applications/${appId}/status`, { status });
            const d = await api.get<any[]>('/placements/drives?all=true');
            setDrives(d);
        } catch (err: any) { alert(err.message); }
    };

    const activeDrive = drives.find(d => d.id === selectedDrive);
    const apps = activeDrive?.applications || [];

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Student Applications</h2>
                <p className="text-[hsl(var(--muted-foreground))]">Review and manage student placement applications</p>
            </div>

            <div className="flex flex-wrap gap-2">
                {drives.map(d => (
                    <Button key={d.id} variant={selectedDrive === d.id ? 'default' : 'outline'} size="sm" onClick={() => setSelectedDrive(d.id)}>
                        {d.companyName} ({d.applications?.length || 0})
                    </Button>
                ))}
            </div>

            {!selectedDrive ? (
                <Card><CardContent className="p-12 text-center"><ClipboardList className="w-12 h-12 mx-auto mb-4 text-[hsl(var(--muted-foreground))]" /><p className="text-[hsl(var(--muted-foreground))]">Select a drive above to view applications</p></CardContent></Card>
            ) : apps.length === 0 ? (
                <Card><CardContent className="p-12 text-center"><p className="text-[hsl(var(--muted-foreground))]">No applications for {activeDrive?.companyName} yet.</p></CardContent></Card>
            ) : (
                <div className="space-y-3">
                    {apps.map((app: any, i: number) => (
                        <motion.div key={app.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                            <Card className="hover:shadow-soft-lg transition-all">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                            {app.student?.user?.name?.charAt(0) || <User className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold">{app.student?.user?.name || 'Unknown'}</p>
                                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{app.student?.rollNo} • {app.student?.department?.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className={app.status === 'SELECTED' ? 'bg-green-100 text-green-700' : app.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                                            {app.status}
                                        </Badge>
                                        {app.status === 'APPLIED' && (
                                            <>
                                                <Button size="sm" variant="outline" className="text-green-600 border-green-200 h-8" onClick={() => updateStatus(app.id, 'SHORTLISTED')}>
                                                    <Check className="w-3 h-3 mr-1" /> Shortlist
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-red-500 border-red-200 h-8" onClick={() => updateStatus(app.id, 'REJECTED')}>
                                                    <X className="w-3 h-3 mr-1" /> Reject
                                                </Button>
                                            </>
                                        )}
                                        {app.status === 'SHORTLISTED' && (
                                            <Button size="sm" variant="outline" className="text-green-600 border-green-200 h-8" onClick={() => updateStatus(app.id, 'SELECTED')}>
                                                <Check className="w-3 h-3 mr-1" /> Select
                                            </Button>
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
