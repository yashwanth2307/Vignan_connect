'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageCircle, ClipboardCheck, BarChart3, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#667eea', '#764ba2', '#11998e', '#38ef7d', '#F2994A', '#EB5757', '#2F80ED'];

export default function StudentDashboard() {
    const { user } = useAuth();
    const [attendance, setAttendance] = useState<any>(null);
    const [todaySlots, setTodaySlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const sectionId = user?.student?.sectionId;
                const [att, today] = await Promise.all([
                    api.get<any>('/attendance/student/my'),
                    sectionId ? api.get<any[]>(`/timetable/today/section/${sectionId}`) : Promise.resolve([]),
                ]);
                setAttendance(att);
                setTodaySlots(today);
            } catch { /* ignore */ }
            setLoading(false);
        }
        load();
    }, [user]);

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;

    const summary = attendance?.summary || [];
    const overallPercent = summary.length > 0 ? Math.round(summary.reduce((a: number, s: any) => a + s.percentage, 0) / summary.length) : 0;

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
                        <h2 className="text-2xl font-bold text-white">Welcome, {user?.name}</h2>
                        <p className="text-blue-200/80 text-sm">{user?.student?.rollNo} • {user?.student?.section?.name} • {user?.student?.department?.name}</p>
                    </div>
                </div>
            </motion.div>

            <div className="grid sm:grid-cols-4 gap-4">
                {[
                    { label: 'Overall Attendance', value: `${overallPercent}%`, icon: ClipboardCheck, gradient: 'from-blue-500 to-blue-600', color: overallPercent >= 75 ? 'text-green-500' : 'text-red-500' },
                    { label: 'Subjects', value: summary.length, icon: BarChart3, gradient: 'from-purple-500 to-purple-600' },
                    { label: "Today's Classes", value: todaySlots.length, icon: Calendar, gradient: 'from-green-500 to-emerald-600' },
                    { label: 'Groups', value: '→', icon: MessageCircle, gradient: 'from-orange-500 to-red-500', link: '/dashboard/student/groups' },
                ].map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                        {stat.link ? (
                            <Link href={stat.link}>
                                <Card className="hover:shadow-soft-lg transition-all cursor-pointer group">
                                    <CardContent className="p-5 flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                            <stat.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-[hsl(var(--muted-foreground))]">{stat.label}</p>
                                            <p className="text-2xl font-bold">{stat.value}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ) : (
                            <Card className="hover:shadow-soft-lg transition-all">
                                <CardContent className="p-5 flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                                        <stat.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-[hsl(var(--muted-foreground))]">{stat.label}</p>
                                        <p className={`text-2xl font-bold ${'color' in stat ? stat.color : ''}`}>{stat.value}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Attendance Chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Card>
                        <CardHeader><CardTitle>Attendance by Subject</CardTitle></CardHeader>
                        <CardContent>
                            {summary.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={summary}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="subjectCode" tick={{ fontSize: 11 }} />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                                        <Bar dataKey="percentage" name="Attendance %" radius={[8, 8, 0, 0]}>
                                            {summary.map((_: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">No attendance data yet</p>}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Today's Schedule */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" /> Today&apos;s Schedule</CardTitle></CardHeader>
                        <CardContent>
                            {todaySlots.length === 0 ? (
                                <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">No classes today</p>
                            ) : (
                                <div className="space-y-3">
                                    {todaySlots.map((slot: any, i: number) => (
                                        <motion.div key={slot.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--secondary))]">
                                                <Badge variant="outline">P{slot.hourIndex}</Badge>
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">{slot.courseOffering?.subject?.title}</p>
                                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{slot.startTime}-{slot.endTime} • {slot.courseOffering?.faculty?.user?.name}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
