'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Users, CheckCircle2, XCircle, Loader2, UserCheck, UserX, ClipboardList } from 'lucide-react';
import api from '@/lib/api';

function AttendanceContent() {
    const searchParams = useSearchParams();
    const coId = searchParams.get('coId') || '';
    const hour = searchParams.get('hour') || '1';

    const [offerings, setOfferings] = useState<any[]>([]);
    const [selectedCO, setSelectedCO] = useState(coId);
    const [selectedHour, setSelectedHour] = useState(hour);
    const [session, setSession] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    // Track attendance status per student: 'PRESENT' | 'ABSENT'
    const [attendanceMap, setAttendanceMap] = useState<Record<string, 'PRESENT' | 'ABSENT'>>({});
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
            // Default all students to PRESENT
            const defaultMap: Record<string, 'PRESENT' | 'ABSENT'> = {};
            studentsList.forEach((s: any) => { defaultMap[s.id] = 'PRESENT'; });
            setAttendanceMap(defaultMap);
            setSubmitted(false);
        } catch (err: any) {
            alert(err.message);
        }
        setStarting(false);
    };

    const toggleStudent = (studentId: string) => {
        setAttendanceMap(prev => ({
            ...prev,
            [studentId]: prev[studentId] === 'PRESENT' ? 'ABSENT' : 'PRESENT',
        }));
    };

    const markAllPresent = () => {
        const map: Record<string, 'PRESENT' | 'ABSENT'> = {};
        students.forEach(s => { map[s.id] = 'PRESENT'; });
        setAttendanceMap(map);
    };

    const markAllAbsent = () => {
        const map: Record<string, 'PRESENT' | 'ABSENT'> = {};
        students.forEach(s => { map[s.id] = 'ABSENT'; });
        setAttendanceMap(map);
    };

    const presentCount = Object.values(attendanceMap).filter(v => v === 'PRESENT').length;
    const absentCount = Object.values(attendanceMap).filter(v => v === 'ABSENT').length;

    const submitAttendance = async () => {
        if (!session) return;
        setSaving(true);
        try {
            const presentIds = Object.entries(attendanceMap)
                .filter(([, status]) => status === 'PRESENT')
                .map(([id]) => id);
            await api.post(`/attendance/sessions/${session.id}/mark`, {
                studentIds: presentIds,
            });
            // Stop the session after marking
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
                <p className="text-[hsl(var(--muted-foreground))]">Select course offering, then mark each student as Present or Absent</p>
            </div>

            {/* === No Active Session: Show Start Controls === */}
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
                /* === Submission Success === */
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card className="border-green-200 dark:border-green-800">
                        <CardContent className="p-8 text-center">
                            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                            <h3 className="text-2xl font-bold mb-2 text-green-700 dark:text-green-400">Attendance Submitted!</h3>
                            <p className="text-[hsl(var(--muted-foreground))] mb-4">
                                <span className="text-green-600 font-semibold">{presentCount} Present</span> &nbsp;•&nbsp;
                                <span className="text-red-500 font-semibold">{absentCount} Absent</span> &nbsp;•&nbsp;
                                Total {students.length} students
                            </p>
                            <div className="flex gap-3 justify-center">
                                <Badge variant="secondary">{session.courseOffering?.subject?.title || 'Subject'}</Badge>
                                <Badge variant="outline">{session.courseOffering?.section?.name || 'Section'}</Badge>
                                <Badge variant="outline">Period {session.hourIndex}</Badge>
                            </div>
                            <Button onClick={resetSession} variant="gradient" className="mt-6">
                                <ClipboardList className="w-4 h-4 mr-2" /> Take Another Attendance
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                /* === Active Session: Mark Students === */
                <div className="space-y-4">
                    {/* Session Header */}
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
                            <div className="flex gap-2 items-center flex-wrap">
                                <Button size="sm" variant="outline" onClick={markAllPresent} className="text-xs text-green-600 border-green-200 hover:bg-green-50">
                                    <UserCheck className="w-3.5 h-3.5 mr-1" /> All Present
                                </Button>
                                <Button size="sm" variant="outline" onClick={markAllAbsent} className="text-xs text-red-500 border-red-200 hover:bg-red-50">
                                    <UserX className="w-3.5 h-3.5 mr-1" /> All Absent
                                </Button>
                                <div className="ml-auto flex gap-3 text-sm font-medium">
                                    <span className="text-green-600">✓ {presentCount} Present</span>
                                    <span className="text-red-500">✗ {absentCount} Absent</span>
                                    <span className="text-[hsl(var(--muted-foreground))]">/ {students.length} Total</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Student List */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {students.map((s, i) => {
                            const status = attendanceMap[s.id] || 'PRESENT';
                            const isPresent = status === 'PRESENT';
                            return (
                                <motion.div
                                    key={s.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.015 }}
                                >
                                    <button
                                        onClick={() => toggleStudent(s.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${isPresent
                                                ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800'
                                                : 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800'
                                            }`}
                                    >
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${isPresent
                                                ? 'bg-green-500 text-white'
                                                : 'bg-red-500 text-white'
                                            }`}>
                                            {isPresent ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{s.user?.name}</p>
                                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{s.rollNo}</p>
                                        </div>
                                        <Badge
                                            className={`text-[10px] shrink-0 ${isPresent
                                                    ? 'bg-green-100 text-green-700 border-green-200'
                                                    : 'bg-red-100 text-red-700 border-red-200'
                                                }`}
                                        >
                                            {isPresent ? 'PRESENT' : 'ABSENT'}
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

                    {/* Submit Button */}
                    {students.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="sticky bottom-4">
                            <Button onClick={submitAttendance} disabled={saving} variant="gradient" size="lg" className="w-full text-base py-6 shadow-lg">
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5 mr-2" />
                                        Submit Attendance — {presentCount} Present, {absentCount} Absent
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
