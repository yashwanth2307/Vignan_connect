'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, CheckCircle2, History, Pencil, Save, AlertTriangle, Trash2, RotateCcw } from 'lucide-react';
import api from '@/lib/api';

type AttStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'OD' | 'ML';

export default function AdminAttendanceEditPage() {
    const [departments, setDepartments] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    
    // Filters
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedSem, setSelectedSem] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [loading, setLoading] = useState(false);

    // Editing State
    const [courseOfferings, setCourseOfferings] = useState<any[]>([]);
    const [selectedCO, setSelectedCO] = useState('');
    const [sessions, setSessions] = useState<any[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState('');
    
    const [records, setRecords] = useState<any[]>([]);
    const [editMap, setEditMap] = useState<Record<string, AttStatus>>({});
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        api.get<any[]>('/departments').then(setDepartments).catch(() => {});
        api.get<any[]>('/sections').then(setSections).catch(() => {});
    }, []);

    const filteredSections = selectedDept ? sections.filter(s => s.departmentId === selectedDept) : sections;

    // Load Course Offerings when section changes
    useEffect(() => {
        if (selectedSection) {
            setLoading(true);
            api.get<any[]>(`/course-offerings?sectionId=${selectedSection}`).then(data => {
                setCourseOfferings(data);
                setSelectedCO('');
                setSessions([]);
                setSelectedSessionId('');
                setRecords([]);
            }).catch(() => {}).finally(() => setLoading(false));
        }
    }, [selectedSection]);

    // Load Sessions when Course Offering changes
    useEffect(() => {
        if (selectedCO) {
            setLoading(true);
            api.get<any[]>(`/attendance/sessions/list/${selectedCO}`).then(data => {
                setSessions(data);
                setSelectedSessionId('');
                setRecords([]);
            }).catch(() => {}).finally(() => setLoading(false));
        }
    }, [selectedCO]);

    // Load Records when Session changes
    useEffect(() => {
        if (selectedSessionId) {
            setLoading(true);
            api.get<any[]>(`/attendance/sessions/${selectedSessionId}/records`).then(data => {
                setRecords(data);
                const map: Record<string, AttStatus> = {};
                data.forEach((r: any) => {
                    map[r.studentId] = r.status;
                });
                setEditMap(map);
                setMessage('');
            }).catch(() => {}).finally(() => setLoading(false));
        }
    }, [selectedSessionId]);

    const handleSave = async () => {
        if (!selectedSessionId) return;
        setSaving(true);
        try {
            const updates = Object.entries(editMap).map(([studentId, status]) => ({ studentId, status }));
            await api.post(`/attendance/sessions/${selectedSessionId}/mark`, { records: updates });
            setMessage('Attendance successfully updated.');
            setTimeout(() => setMessage(''), 3000);
        } catch (err: any) {
            alert(err.message);
        }
        setSaving(false);
    };

    const handleResetSession = async () => {
        if (!selectedSessionId) return;
        if (!confirm('This will DELETE all attendance records for this session and reopen it. Are you sure?')) return;
        setSaving(true);
        try {
            const result = await api.post<any>(`/attendance/sessions/${selectedSessionId}/reset`);
            setMessage(result.message || 'Session reset successfully.');
            setRecords([]);
            setEditMap({});
            setSelectedSessionId('');
            // Reload sessions
            if (selectedCO) {
                const data = await api.get<any[]>(`/attendance/sessions/list/${selectedCO}`);
                setSessions(data);
            }
            setTimeout(() => setMessage(''), 5000);
        } catch (err: any) { alert(err.message); }
        setSaving(false);
    };

    const handleDeleteSession = async () => {
        if (!selectedSessionId) return;
        if (!confirm('This will PERMANENTLY DELETE this session and ALL its records. This cannot be undone. Continue?')) return;
        setSaving(true);
        try {
            await api.delete(`/attendance/sessions/${selectedSessionId}`);
            setMessage('Session deleted successfully.');
            setRecords([]);
            setEditMap({});
            setSelectedSessionId('');
            if (selectedCO) {
                const data = await api.get<any[]>(`/attendance/sessions/list/${selectedCO}`);
                setSessions(data);
            }
            setTimeout(() => setMessage(''), 5000);
        } catch (err: any) { alert(err.message); }
        setSaving(false);
    };

    const handleResetSection = async () => {
        if (!selectedSection) return;
        if (!confirm('WARNING: This will DELETE ALL attendance sessions and records for this ENTIRE SECTION. This is irreversible. Are you absolutely sure?')) return;
        setSaving(true);
        try {
            const result = await api.post<any>(`/attendance/section/${selectedSection}/reset`);
            setMessage(result.message || 'Section attendance reset.');
            setSessions([]);
            setRecords([]);
            setEditMap({});
            setSelectedSessionId('');
            setSelectedCO('');
            setTimeout(() => setMessage(''), 5000);
        } catch (err: any) { alert(err.message); }
        setSaving(false);
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-2"><Pencil className="w-6 h-6 text-amber-500" /> Override / Edit Attendance</h2>
                <p className="text-[hsl(var(--muted-foreground))]">Administrators can modify any past or incorrect attendance session.</p>
            </div>

            <Card>
                <CardContent className="p-5">
                    <div className="grid sm:grid-cols-4 gap-4 mb-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Department</label>
                            <select className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm" value={selectedDept} onChange={e => { setSelectedDept(e.target.value); setSelectedSection(''); }}>
                                <option value="">Select Department</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Semester</label>
                            <select className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm" value={selectedSem} onChange={e => setSelectedSem(e.target.value)}>
                                <option value="">Select Semester</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Section</label>
                            <select className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm" value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
                                <option value="">Select Section</option>
                                {filteredSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <Button onClick={handleResetSection} disabled={saving || !selectedSection} variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50 whitespace-nowrap">
                                <Trash2 className="w-3 h-3 mr-1"/> Reset All Section
                            </Button>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-[hsl(var(--border))]">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-blue-600 dark:text-blue-400">1. Select Course Subject</label>
                            <select disabled={!selectedSection || courseOfferings.length === 0} className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm" value={selectedCO} onChange={e => setSelectedCO(e.target.value)}>
                                <option value="">{courseOfferings.length === 0 ? 'No courses found' : 'Select a Course'}</option>
                                {courseOfferings.map(co => <option key={co.id} value={co.id}>{co.subject?.title} ({co.subject?.code})</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-blue-600 dark:text-blue-400">2. Select Past Session</label>
                            <select disabled={!selectedCO || sessions.length === 0} className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm" value={selectedSessionId} onChange={e => setSelectedSessionId(e.target.value)}>
                                <option value="">{sessions.length === 0 ? 'No sessions found' : 'Pick Date / Hour'}</option>
                                {sessions.map(s => <option key={s.id} value={s.id}>{new Date(s.date).toLocaleDateString()} - Hour {s.hourIndex} ({s.status})</option>)}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                 <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
            ) : records.length > 0 && selectedSessionId ? (
                <Card className="border-amber-200 dark:border-amber-900 border-2">
                    <CardHeader className="bg-amber-50 dark:bg-amber-950/20 py-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <History className="w-5 h-5 text-amber-600" /> Session Roster ({records.length} students)
                        </CardTitle>
                        {message && <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1"/> {message}</Badge>}
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[500px] overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[hsl(var(--muted))] sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="p-3 font-semibold w-16">Roll No</th>
                                        <th className="p-3 font-semibold">Student Name</th>
                                        <th className="p-3 font-semibold w-48 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[hsl(var(--border)/0.5)]">
                                    {records.map((r) => (
                                        <tr key={r.studentId} className="hover:bg-[hsl(var(--secondary)/0.5)] transition-colors">
                                            <td className="p-3 whitespace-nowrap font-medium text-[hsl(var(--muted-foreground))]">{r.student.rollNo}</td>
                                            <td className="p-3">{r.student.user.name}</td>
                                            <td className="p-3 w-48 text-center">
                                                <select 
                                                    value={editMap[r.studentId] || 'ABSENT'}
                                                    onChange={e => setEditMap({...editMap, [r.studentId]: e.target.value as AttStatus})}
                                                    className={`w-full flex h-8 rounded-md border text-xs px-2 font-semibold ${
                                                        editMap[r.studentId] === 'PRESENT' ? 'bg-green-100 text-green-800 border-green-300' :
                                                        editMap[r.studentId] === 'ABSENT' ? 'bg-red-100 text-red-800 border-red-300' :
                                                        'bg-amber-100 text-amber-800 border-amber-300'
                                                    }`}
                                                >
                                                    <option value="PRESENT">PRESENT</option>
                                                    <option value="ABSENT">ABSENT</option>
                                                    <option value="LATE">LATE</option>
                                                    <option value="OD">OD</option>
                                                    <option value="ML">ML</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 bg-[hsl(var(--muted)/0.5)] border-t flex items-center justify-between flex-wrap gap-2">
                            <div className="flex gap-2">
                                <Button onClick={handleResetSession} disabled={saving} variant="outline" size="sm" className="text-amber-600 border-amber-300 hover:bg-amber-50">
                                    <RotateCcw className="w-3 h-3 mr-1"/> Reset Session
                                </Button>
                                <Button onClick={handleDeleteSession} disabled={saving} variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
                                    <Trash2 className="w-3 h-3 mr-1"/> Delete Session
                                </Button>
                            </div>
                            <Button onClick={handleSave} disabled={saving} variant="gradient">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1"/> Save Overrides</>}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : selectedCO && !selectedSessionId && sessions.length > 0 ? (
                <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
                    Select a past session to view or edit records.
                </div>
            ) : null}
        </div>
    );
}
