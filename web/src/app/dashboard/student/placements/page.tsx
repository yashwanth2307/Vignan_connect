'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, DollarSign, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';

export default function StudentPlacementsPage() {
    const [drives, setDrives] = useState<any[]>([]);
    const [myApplications, setMyApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [dRes, aRes] = await Promise.all([
                api.get<any[]>('/placements/drives'),
                api.get<any[]>('/placements/my-applications')
            ]);
            setDrives(dRes || []);
            setMyApplications(aRes || []);
        } catch (e: any) { alert(e.message); }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const applyToDrive = async (driveId: string) => {
        const resumeUrl = prompt("Enter your Resume Link (Google Drive / PDF URL):");
        if (!resumeUrl) return;

        setApplying(driveId);
        try {
            await api.post(`/placements/drives/${driveId}/apply`, { resume: resumeUrl });
            alert("Applied successfully!");
            loadData();
        } catch (e: any) {
            alert(e.response?.data?.message || e.message);
        }
        setApplying(null);
    };

    const hasApplied = (driveId: string) => {
        return myApplications.some(a => a.driveId === driveId);
    };

    const getApplicationStatus = (driveId: string) => {
        const app = myApplications.find(a => a.driveId === driveId);
        return app ? app.status : null;
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'SELECTED': return 'bg-green-500';
            case 'SHORTLISTED': return 'bg-blue-500';
            case 'REJECTED': return 'bg-red-500';
            default: return 'bg-yellow-500';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400">
                        Campus Placements
                    </h2>
                    <p className="text-[hsl(var(--muted-foreground))] mt-1">Browse active drives and track your applications</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>
            ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Active Drives */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-teal-600" /> Active Drives
                        </h3>
                        {drives.filter(d => d.isActive).length === 0 ? (
                            <Card className="border-dashed"><CardContent className="p-8 text-center text-[hsl(var(--muted-foreground))]">No active placement drives right now.</CardContent></Card>
                        ) : (
                            drives.filter(d => d.isActive).map((d, i) => {
                                const applied = hasApplied(d.id);
                                const status = getApplicationStatus(d.id);
                                return (
                                    <motion.div key={d.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                                        <Card className="hover:shadow-md transition-all border border-[hsl(var(--border))]/50 overflow-hidden relative">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-teal-500" />
                                            <CardContent className="p-5">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-lg">{d.companyName}</h4>
                                                        <p className="text-sm font-medium text-teal-600 dark:text-teal-400">{d.role}</p>
                                                    </div>
                                                    {applied && status && (
                                                        <Badge className={`${getStatusColor(status)} text-white`}>{status}</Badge>
                                                    )}
                                                </div>
                                                <div className="mt-4 grid grid-cols-2 gap-y-2 text-sm text-[hsl(var(--muted-foreground))]">
                                                    <div className="flex items-center gap-2"><DollarSign className="w-4 h-4" /> {d.packageLPA} LPA</div>
                                                    {d.location && <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {d.location}</div>}
                                                    <div className="col-span-2 text-xs bg-[hsl(var(--muted))] p-2 rounded mt-2">
                                                        <span className="font-semibold text-[hsl(var(--foreground))]">Eligibility:</span> {d.eligibilityCriteria || 'No specific criteria listed'}
                                                    </div>
                                                </div>
                                                <div className="mt-4">
                                                    {applied ? (
                                                        <Button disabled className="w-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                                                            <CheckCircle2 className="w-4 h-4 mr-2" /> Applied
                                                        </Button>
                                                    ) : (
                                                        <Button 
                                                            className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white" 
                                                            onClick={() => applyToDrive(d.id)}
                                                            disabled={applying === d.id}
                                                        >
                                                            {applying === d.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Apply Now'}
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>

                    {/* My Applications */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> My Applications
                        </h3>
                        {myApplications.length === 0 ? (
                            <Card className="border-dashed"><CardContent className="p-8 text-center text-[hsl(var(--muted-foreground))]">You haven&apos;t applied to any drives yet.</CardContent></Card>
                        ) : (
                            myApplications.map((app, i) => (
                                <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                                    <Card className="border border-[hsl(var(--border))]/50">
                                        <CardContent className="p-4 flex justify-between items-center bg-gradient-to-r from-transparent to-[hsl(var(--muted))]/30">
                                            <div>
                                                <h4 className="font-semibold">{app.drive?.companyName}</h4>
                                                <p className="text-xs text-[hsl(var(--muted-foreground))]">{app.drive?.role}</p>
                                            </div>
                                            <div className="text-right">
                                                <Badge className={`${getStatusColor(app.status)} text-white shadow-sm mb-1`}>{app.status}</Badge>
                                                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                                                    Applied on {new Date(app.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
