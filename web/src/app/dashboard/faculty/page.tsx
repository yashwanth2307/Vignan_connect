'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Calendar, ClipboardCheck, Users, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';

export default function FacultyDashboard() {
    const { user } = useAuth();
    const [offerings, setOfferings] = useState<any[]>([]);
    const [todaySlots, setTodaySlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [o, t] = await Promise.all([
                    api.get<any[]>('/course-offerings/my'),
                    api.get<any[]>('/timetable/today/faculty'),
                ]);
                setOfferings(o);
                setTodaySlots(t);
            } catch { /* ignore */ }
            setLoading(false);
        }
        load();
    }, []);

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;

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
                        <h2 className="text-2xl font-bold text-white">Welcome, {user?.name}</h2>
                        <p className="text-blue-200/80 text-sm">Faculty Dashboard</p>
                    </div>
                </div>
            </motion.div>

            <div className="grid sm:grid-cols-3 gap-4">
                {[
                    { label: 'My Courses', value: offerings.length, icon: BookOpen, gradient: 'from-blue-500 to-blue-600' },
                    { label: "Today's Classes", value: todaySlots.length, icon: Calendar, gradient: 'from-purple-500 to-purple-600' },
                    { label: 'Attendance', value: '→', icon: ClipboardCheck, gradient: 'from-green-500 to-emerald-600' },
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
                <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" /> Today&apos;s Schedule</CardTitle></CardHeader>
                <CardContent>
                    {todaySlots.length === 0 ? (
                        <p className="text-[hsl(var(--muted-foreground))] text-sm">No classes today</p>
                    ) : (
                        <div className="space-y-3">
                            {todaySlots.map((slot: any, i: number) => (
                                <motion.div key={slot.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--secondary))]">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline">Period {slot.hourIndex}</Badge>
                                            <div>
                                                <p className="font-medium">{slot.courseOffering?.subject?.title}</p>
                                                <p className="text-xs text-[hsl(var(--muted-foreground))]">{slot.courseOffering?.section?.name} • {slot.startTime}-{slot.endTime}</p>
                                            </div>
                                        </div>
                                        <Link href={`/dashboard/faculty/attendance?coId=${slot.courseOfferingId}&hour=${slot.hourIndex}`}>
                                            <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1">
                                                <ClipboardCheck className="w-3 h-3" /> Take Attendance
                                            </button>
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5" /> My Course Offerings</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid sm:grid-cols-2 gap-3">
                        {offerings.map((co: any, i: number) => (
                            <motion.div key={co.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                <div className="p-4 rounded-xl border border-[hsl(var(--border))] hover:shadow-soft transition-all">
                                    <p className="font-semibold">{co.subject?.title}</p>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{co.subject?.code} • {co.section?.name}</p>
                                    <Badge variant="secondary" className="mt-2">{co.section?.department?.name}</Badge>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
