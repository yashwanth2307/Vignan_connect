'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, BookOpen, GraduationCap, ClipboardCheck, Layers } from 'lucide-react';
import api from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#667eea', '#764ba2', '#11998e', '#38ef7d', '#F2994A', '#EB5757'];

interface Stats {
    departments: number;
    sections: number;
    students: number;
    faculty: number;
    subjects: number;
    courseOfferings: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats>({ departments: 0, sections: 0, students: 0, faculty: 0, subjects: 0, courseOfferings: 0 });
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
                setStats({
                    departments: depts.length,
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
    }, []);

    const statCards = [
        { label: 'Departments', value: stats.departments, icon: Building2, gradient: 'from-blue-500 to-blue-600' },
        { label: 'Sections', value: stats.sections, icon: Layers, gradient: 'from-purple-500 to-purple-600' },
        { label: 'Students', value: stats.students, icon: GraduationCap, gradient: 'from-green-500 to-emerald-600' },
        { label: 'Faculty', value: stats.faculty, icon: Users, gradient: 'from-orange-500 to-red-500' },
        { label: 'Subjects', value: stats.subjects, icon: BookOpen, gradient: 'from-cyan-500 to-blue-500' },
        { label: 'Course Offerings', value: stats.courseOfferings, icon: ClipboardCheck, gradient: 'from-pink-500 to-rose-500' },
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
                <img src="/images/campus1.jpg" alt="Campus" className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-950/90 via-indigo-950/80 to-purple-950/70" />
                <div className="absolute inset-0 flex items-center px-6 gap-4">
                    <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center p-1">
                        <img src="/images/logo.png" alt="Logo" className="w-12 h-12 rounded-full object-contain" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
                        <p className="text-blue-200/80 text-sm">Vignan Institute of Technology and Science — Overview</p>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {statCards.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                    >
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
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    <Card>
                        <CardHeader><CardTitle>Institution Overview</CardTitle></CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                                    <YAxis />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                        {chartData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                    <Card>
                        <CardHeader><CardTitle>Distribution</CardTitle></CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={chartData.filter(d => d.value > 0)} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                                        {chartData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
