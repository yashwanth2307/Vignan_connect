'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Users, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';

export default function TPODashboard() {
    const { user } = useAuth();
    const [drives, setDrives] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const d = await api.get<any[]>('/placements/drives');
                setDrives(d);
            } catch { /* ignore */ }
            setLoading(false);
        }
        load();
    }, []);

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;

    const activeDrives = drives.filter(d => d.isActive);
    const totalApplications = drives.reduce((sum, d) => sum + (d.applications?.length || 0), 0);

    return (
        <div className="space-y-6">
            {/* Banner */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 p-8"
            >
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold text-white">Welcome, {user?.name}</h2>
                    <p className="text-cyan-100/80 text-sm">Training & Placement Office Dashboard</p>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px]" />
            </motion.div>

            <div className="grid sm:grid-cols-3 gap-4">
                {[
                    { label: 'Active Drives', value: activeDrives.length, icon: Briefcase, gradient: 'from-cyan-500 to-teal-600' },
                    { label: 'Total Applications', value: totalApplications, icon: Users, gradient: 'from-purple-500 to-purple-600' },
                    { label: 'Total Drives', value: drives.length, icon: TrendingUp, gradient: 'from-green-500 to-emerald-600' },
                ].map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <Card className="hover:shadow-soft-lg transition-all">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-[hsl(var(--muted-foreground))]">{stat.label}</p>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5" /> Recent Placement Drives</CardTitle></CardHeader>
                <CardContent>
                    {drives.length === 0 ? (
                        <p className="text-[hsl(var(--muted-foreground))] text-sm text-center py-8">No placement drives yet</p>
                    ) : (
                        <div className="space-y-3">
                            {drives.slice(0, 10).map((drive: any, i: number) => (
                                <motion.div key={drive.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--secondary))]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                                                {drive.companyName?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium">{drive.companyName}</p>
                                                <p className="text-xs text-[hsl(var(--muted-foreground))]">{drive.role} • {drive.packageLPA} LPA</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={drive.isActive ? 'default' : 'secondary'}>
                                                {drive.isActive ? 'Active' : 'Closed'}
                                            </Badge>
                                            <Badge variant="outline">{drive.applications?.length || 0} apps</Badge>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
