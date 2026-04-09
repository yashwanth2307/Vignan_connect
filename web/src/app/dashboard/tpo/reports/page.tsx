'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Loader2, Briefcase, Users, TrendingUp, Award } from 'lucide-react';
import api from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function TPOReportsPage() {
    const [stats, setStats] = useState<any>(null);
    const [drives, setDrives] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [s, d] = await Promise.all([
                    api.get<any>('/placements/drives/stats'),
                    api.get<any[]>('/placements/drives?all=true'),
                ]);
                setStats(s);
                setDrives(d);
            } catch {}
            setLoading(false);
        })();
    }, []);

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;

    const chartData = drives.map(d => ({
        name: d.companyName?.substring(0, 12),
        applications: d.applications?.length || d._count?.applications || 0,
        package: d.packageLPA || 0,
    }));

    const statusData = [
        { name: 'Selected', value: stats?.selected || 0 },
        { name: 'Shortlisted', value: stats?.shortlisted || 0 },
        { name: 'Applied', value: stats?.applied || 0 },
        { name: 'Rejected', value: stats?.rejected || 0 },
    ].filter(d => d.value > 0);

    const statCards = [
        { label: 'Total Drives', value: stats?.totalDrives || drives.length, icon: Briefcase, gradient: 'from-cyan-500 to-teal-600' },
        { label: 'Total Applications', value: stats?.totalApplications || 0, icon: Users, gradient: 'from-purple-500 to-indigo-600' },
        { label: 'Students Selected', value: stats?.selected || 0, icon: Award, gradient: 'from-green-500 to-emerald-600' },
        { label: 'Avg Package (LPA)', value: stats?.avgPackage?.toFixed(1) || '0', icon: TrendingUp, gradient: 'from-orange-500 to-red-500' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Placement Reports</h2>
                <p className="text-[hsl(var(--muted-foreground))]">Analytics and statistics for campus placements</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <Card className="hover:shadow-soft-lg transition-all">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center`}><s.icon className="w-6 h-6 text-white" /></div>
                                <div><p className="text-sm text-[hsl(var(--muted-foreground))]">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Applications per Company</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                                <Bar dataKey="applications" fill="#6366f1" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Application Status Distribution</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={statusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                    {statusData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
