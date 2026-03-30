'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Users, CheckCircle2, XCircle, Loader2, UserCheck, UserX, ClipboardList, Clock, Briefcase, Stethoscope } from 'lucide-react';
import api from '@/lib/api';

type AttStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'OD' | 'ML';

const STATUS_META: Record<AttStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: any }> = {
    PRESENT: { label: 'Present', color: 'text-green-700', bgColor: 'bg-green-50 dark:bg-green-950/20', borderColor: 'border-green-300 dark:border-green-800', icon: CheckCircle2 },
    ABSENT:  { label: 'Absent',  color: 'text-red-700',   bgColor: 'bg-red-50 dark:bg-red-950/20',     borderColor: 'border-red-300 dark:border-red-800',     icon: XCircle },
    LATE:    { label: 'Late',    color: 'text-yellow-700', bgColor: 'bg-yellow-50 dark:bg-yellow-950/20', borderColor: 'border-yellow-300 dark:border-yellow-800', icon: Clock },
    OD:      { label: 'On Duty', color: 'text-blue-700',   bgColor: 'bg-blue-50 dark:bg-blue-950/20',   borderColor: 'border-blue-300 dark:border-blue-800',   icon: Briefcase },
    ML:      { label: 'Medical', color: 'text-purple-700', bgColor: 'bg-purple-50 dark:bg-purple-950/20', borderColor: 'border-purple-300 dark:border-purple-800', icon: Stethoscope },
};

const STATUS_CYCLE: AttStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'OD', 'ML'];

function AttendanceContent() {
    const searchParams = useSearchParams();
    const coId = searchParams.get('coId') || '';
    const hour = searchParams.get('hour') || '1';

    const [offerings, setOfferings] = useState<any[]>([]);
    const [selectedCO, setSelectedCO] = useState(coId);
    const [selectedHour, setSelectedHour] = useState(hour);
    const [session, setSession] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, AttStatus>>({});
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        api.get<any[]>('/course-offerings/my').then(data => {
            setOfferings(data);
            if (!selectedCO && data.length > 0) setSelectedCO(data[0].id);
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const startSession = async () => {
        setStarting(true);
        try {
            const data = await api.post<any>('/attendance/sessions/start', {
                courseOfferingId: selectedCO,
                hourIndex: +selectedHour,
            });
            setSession(data.session);
            const studentsList = data.students || [];
            setStudents(studentsList);
            const defaultMap: Record<string, AttStatus> = {};
            studentsList.forEach((s: any) => { defaultMap[s.id] = 'PRESENT'; });
            setAttendanceMap(defaultMap);
            setSubmitted(false);
        } catch (err: any) {
            alert(err.message);
        }
        setStarting(false);
    };

    const cycleStatus = (studentId: string) => {
        setAttendanceMap(prev => {
            const current = prev[studentId] || 'PRESENT';
            const idx = STATUS_CYCLE.indexOf(current);
            const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
            return { ...prev, [studentId]: next };
        });
    };

    const markAllStatus = (status: AttStatus) => {
        const map: Record<string, AttStatus> = {};
        students.forEach(s => { map[s.id] = status; });
        setAttendanceMap(map);
    };

    const statusCounts = STATUS_CYCLE.reduce((acc, s) => {
        acc[s] = Object.values(attendanceMap).filter(v => v === s).length;
        return acc;
    }, {} as Record<AttStatus, number>);

    const submitAttendance = async () => {
        if (!session) return;
        setSaving(true);
        try {
            const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
                studentId, status
            }));
            await api.post(`/attendance/sessions/${session.id}/mark`, { records });
            await api.post(`/attendance/sessions/${session.id}/stop`);
            setSubmitted(true);
        } catch (err: any) { alert(err.message); }
        setSaving(false);
    };

    const resetSession = () => {
        setSession(null);
        setStudents([]);
        setAttendanceMap({});
        setSubmitted(false);
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Mark Attendance</h2>
                <p className="text-[hsl(var(--muted-foreground))]">Click each student to cycle: Present → Absent → Late → OD → Medical Leave</p>
            </div>

            {!session ? (
                <Card>
                    <CardContent className="p-6">
                        <div className="grid sm:grid-cols-3 gap-4 items-end">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Course Offering</label>
                                <select value={selectedCO} onChange={e => setSelectedCO(e.target.value)} className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                    {offerings.length === 0 && <option>No offerings found</option>}
                                    {offerings.map(o => <option key={o.id} value={o.id}>{o.subject?.code} - {o.subject?.title} ({o.section?.name})</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Hour / Period</label>
                                <select value={selectedHour} onChange={e => setSelectedHour(e.target.value)} className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(h => <option key={h} value={h}>Period {h}</option>)}
                                </select>
                            </div>
                            <Button onClick={startSession} disabled={starting || !selectedCO} variant="gradient" size="lg">
                                {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Play className="w-4 h-4" /> Start Session</>}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : submitted ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card className="border-green-200 dark:border-green-800">
                        <CardContent className="p-8 text-center">
                            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                            <h3 className="text-2xl font-bold mb-2 text-green-700 dark:text-green-400">Attendance Submitted!</h3>
                            <div className="flex flex-wrap gap-3 justify-center mb-4">
                                {STATUS_CYCLE.map(s => statusCounts[s] > 0 && (
                                    <span key={s} className={`font-semibold ${STATUS_META[s].color}`}>
                                        {statusCounts[s]} {STATUS_META[s].label}
                                    </span>
                                ))}
                                <span className="text-[hsl(var(--muted-foreground))]">/ {students.length} Total</span>
                            </div>
                            <div className="flex gap-3 justify-center mb-4">
                                <Badge variant="secondary">{session.courseOffering?.subject?.title || 'Subject'}</Badge>
                                <Badge variant="outline">{session.courseOffering?.section?.name || 'Section'}</Badge>
                                <Badge variant="outline">Period {session.hourIndex}</Badge>
                            </div>
                            <Button onClick={resetSession} variant="gradient" className="mt-3">
                                <ClipboardList className="w-4 h-4 mr-2" /> Take Another Attendance
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                <div className="space-y-4">
                    <Card className="overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    <CardTitle className="text-lg">Mark Attendance</CardTitle>
                                </div>
                                <Button variant="outline" size="sm" onClick={resetSession} className="text-white border-white/30 hover:bg-white/20">
                                    <Square className="w-4 h-4 mr-1" /> Cancel
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="flex flex-wrap gap-3 mb-4">
                                <Badge variant="secondary">{session.courseOffering?.subject?.title || 'Subject'}</Badge>
                                <Badge variant="outline">{session.courseOffering?.section?.name || 'Section'}</Badge>
                                <Badge variant="outline">Period {session.hourIndex}</Badge>
                                <Badge>{new Date().toLocaleDateString()}</Badge>
                            </div>
                            <div className="flex gap-2 items-center flex-wrap mb-2">
                                {STATUS_CYCLE.map(s => {
                                    const meta = STATUS_META[s];
                                    return (
                                        <Button key={s} size="sm" variant="outline" onClick={() => markAllStatus(s)}
                                            className={`text-xs ${meta.color} hover:${meta.bgColor}`}>
                                            All {meta.label}
                                        </Button>
                                    );
                                })}
                                <div className="ml-auto flex gap-3 text-sm font-medium flex-wrap">
                                    {STATUS_CYCLE.map(s => statusCounts[s] > 0 && (
                                        <span key={s} className={STATUS_META[s].color}>
                                            {statusCounts[s]} {STATUS_META[s].label}
                                        </span>
                                    ))}
                                    <span className="text-[hsl(var(--muted-foreground))]">/ {students.length} Total</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {students.map((s, i) => {
                            const status = attendanceMap[s.id] || 'PRESENT';
                            const meta = STATUS_META[status];
                            const IconComp = meta.icon;
                            return (
                                <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.015 }}>
                                    <button
                                        onClick={() => cycleStatus(s.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${meta.bgColor} ${meta.borderColor}`}
                                    >
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors
                                            ${status === 'PRESENT' ? 'bg-green-500 text-white' :
                                            status === 'ABSENT' ? 'bg-red-500 text-white' :
                                            status === 'LATE' ? 'bg-yellow-500 text-white' :
                                            status === 'OD' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'}`}>
                                            <IconComp className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{s.user?.name}</p>
                                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{s.rollNo}</p>
                                        </div>
                                        <Badge className={`text-[10px] shrink-0 
                                            ${status === 'PRESENT' ? 'bg-green-100 text-green-700 border-green-200' :
                                            status === 'ABSENT' ? 'bg-red-100 text-red-700 border-red-200' :
                                            status === 'LATE' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                            status === 'OD' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                            'bg-purple-100 text-purple-700 border-purple-200'}`}>
                                            {meta.label.toUpperCase()}
                                        </Badge>
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>

                    {students.length === 0 && (
                        <Card>
                            <CardContent className="py-12 text-center text-[hsl(var(--muted-foreground))]">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                No students registered in this section
                            </CardContent>
                        </Card>
                    )}

                    {students.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="sticky bottom-4">
                            <Button onClick={submitAttendance} disabled={saving} variant="gradient" size="lg" className="w-full text-base py-6 shadow-lg">
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5 mr-2" />
                                        Submit — {STATUS_CYCLE.filter(s => statusCounts[s] > 0).map(s => `${statusCounts[s]} ${STATUS_META[s].label}`).join(', ')}
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function FacultyAttendancePage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
            <AttendanceContent />
        </Suspense>
    );
}
