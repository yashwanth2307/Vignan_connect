'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, BookOpen, Calendar, ClipboardCheck, BarChart3, Layers } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#667eea', '#764ba2', '#11998e', '#38ef7d'];

export default function HODDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ sections: 0, students: 0, faculty: 0, subjects: 0, courseOfferings: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [depts, users, subjects, offerings] = await Promise.all([
                    api.get<any[]>('/departments'),
                    api.get<any[]>('/users'),
                    api.get<any[]>('/subjects'),
                    api.get<any[]>('/course-offerings'),
                ]);
                const myDept = user?.faculty?.department?.name || '';
                setStats({
                    sections: depts.reduce((acc: number, d: any) => acc + (d._count?.sections || 0), 0),
                    students: users.filter((u: any) => u.role === 'STUDENT').length,
                    faculty: users.filter((u: any) => u.role === 'FACULTY' || u.role === 'HOD').length,
                    subjects: subjects.length,
                    courseOfferings: offerings.length,
                });
            } catch { /* ignore */ }
            setLoading(false);
        }
        load();
    }, [user]);

    const deptName = user?.faculty?.department?.name || 'My Department';

    const statCards = [
        { label: 'Sections', value: stats.sections, icon: Layers, gradient: 'from-purple-500 to-purple-600' },
        { label: 'Students', value: stats.students, icon: Users, gradient: 'from-green-500 to-emerald-600' },
        { label: 'Faculty', value: stats.faculty, icon: Building2, gradient: 'from-orange-500 to-red-500' },
        { label: 'Subjects', value: stats.subjects, icon: BookOpen, gradient: 'from-cyan-500 to-blue-500' },
    ];

    const chartData = statCards.map(s => ({ name: s.label, value: s.value }));

    return (
        <div className="space-y-6">
            {/* Campus Banner */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-2xl overflow-hidden"
            >
                <img src="/images/campus2.jpg" alt="Campus" className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-950/90 via-indigo-950/80 to-purple-950/70" />
                <div className="absolute inset-0 flex items-center px-6 gap-4">
                    <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center p-1">
                        <img src="/images/logo.png" alt="Logo" className="w-12 h-12 rounded-full object-contain" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">HOD Dashboard</h2>
                        <p className="text-blue-200/80 text-sm">{deptName} — Department Overview</p>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                        <Card className="hover:shadow-soft-lg transition-all duration-300 overflow-hidden group">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-[hsl(var(--muted-foreground))]">{stat.label}</p>
                                        <p className="text-3xl font-bold mt-1">{loading ? '—' : stat.value}</p>
                                    </div>
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <stat.icon className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Card>
                        <CardHeader><CardTitle>Department Overview</CardTitle></CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                                    <Bar dataKey="value" fill="#667eea" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    <Card>
                        <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {[
                                { icon: ClipboardCheck, label: 'Review Attendance Reports', desc: 'Check attendance % across sections', color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30' },
                                { icon: Calendar, label: 'Manage Timetable', desc: 'View and edit timetable for your department', color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30' },
                                { icon: Users, label: 'Faculty Management', desc: 'Approve leaves, assign subjects', color: 'text-green-500 bg-green-50 dark:bg-green-950/30' },
                                { icon: BarChart3, label: 'View Reports', desc: 'Department performance analytics', color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30' },
                            ].map((action, i) => (
                                <div key={action.label} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[hsl(var(--accent))] transition-colors cursor-pointer group">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                                        <action.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{action.label}</p>
                                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{action.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
