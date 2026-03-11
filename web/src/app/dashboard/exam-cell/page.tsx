'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ClipboardCheck, BarChart3, Users, Award, Calendar, BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import api from '@/lib/api';

export default function ExamCellDashboard() {
    const [stats, setStats] = useState({ exams: 0, evaluations: 0, subjects: 0, students: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [users, subjects] = await Promise.all([
                    api.get<any[]>('/users'),
                    api.get<any[]>('/subjects'),
                ]);
                setStats({
                    exams: 0,
                    evaluations: 0,
                    subjects: subjects.length,
                    students: users.filter((u: any) => u.role === 'STUDENT').length,
                });
            } catch { /* ignore */ }
            setLoading(false);
        }
        load();
    }, []);

    const statCards = [
        { label: 'Active Exams', value: stats.exams, icon: FileText, gradient: 'from-red-500 to-rose-600' },
        { label: 'Evaluations', value: stats.evaluations, icon: ClipboardCheck, gradient: 'from-blue-500 to-blue-600' },
        { label: 'Subjects', value: stats.subjects, icon: BookOpen, gradient: 'from-purple-500 to-purple-600' },
        { label: 'Total Students', value: stats.students, icon: Users, gradient: 'from-green-500 to-emerald-600' },
    ];

    return (
        <div className="space-y-6">
            {/* Campus Banner */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-2xl overflow-hidden"
            >
                <img src="/images/campus1.jpg" alt="Campus" className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-red-950/90 via-rose-950/80 to-purple-950/70" />
                <div className="absolute inset-0 flex items-center px-6 gap-4">
                    <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center p-1">
                        <img src="/images/logo.png" alt="Logo" className="w-12 h-12 rounded-full object-contain" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Exam Cell Dashboard</h2>
                        <p className="text-red-200/80 text-sm">Manage examinations, evaluations, and results</p>
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
                        <CardHeader><CardTitle>Exam Management</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {[
                                { icon: Calendar, label: 'Create Exam Session', desc: 'Schedule new mid/semester exams', href: '/dashboard/exam-cell/sessions', color: 'text-red-500 bg-red-50 dark:bg-red-950/30' },
                                { icon: FileText, label: 'Generate Answer Scripts', desc: 'Create barcoded answer sheets for students', href: '/dashboard/exam-cell/scripts', color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30' },
                                { icon: ClipboardCheck, label: 'Distribute for Evaluation', desc: 'Assign scripts to faculty for blind evaluation', href: '/dashboard/exam-cell/evaluation', color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30' },
                                { icon: BarChart3, label: 'Release Results', desc: 'Verify marks and publish results', href: '/dashboard/exam-cell/results', color: 'text-green-500 bg-green-50 dark:bg-green-950/30' },
                            ].map((action) => (
                                <Link key={action.label} href={action.href}>
                                    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-[hsl(var(--accent))] transition-colors cursor-pointer group">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                                            <action.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{action.label}</p>
                                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{action.desc}</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    <Card>
                        <CardHeader><CardTitle>Exam Workflow</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { step: '1', title: 'Create Session', desc: 'Set up exam (Mid-1, Mid-2, Semester)', status: 'ready' },
                                    { step: '2', title: 'Generate Scripts', desc: 'Auto-create barcoded answer sheets per student', status: 'ready' },
                                    { step: '3', title: 'Conduct Exam', desc: 'Print and distribute answer scripts', status: 'pending' },
                                    { step: '4', title: 'Blind Evaluation', desc: 'Faculty evaluates without seeing names', status: 'pending' },
                                    { step: '5', title: 'Verify & Publish', desc: 'Cross-verify marks and release results', status: 'pending' },
                                ].map((item, i) => (
                                    <div key={item.step} className="flex items-start gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${item.status === 'ready' ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]'}`}>
                                            {item.step}
                                        </div>
                                        <div className="flex-1 pb-4 border-b border-[hsl(var(--border)/0.5)] last:border-0">
                                            <p className="font-medium text-sm">{item.title}</p>
                                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
