'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Loader2, Filter, GraduationCap, Printer, Download, Pencil } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

export default function AdminAttendancePage() {
    const [departments, setDepartments] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedSem, setSelectedSem] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    useEffect(() => {
        api.get<any[]>('/departments').then(setDepartments).catch(() => { });
        api.get<any[]>('/sections').then(setSections).catch(() => { });
        setInitialLoad(false);
    }, []);

    const filteredSections = selectedDept
        ? sections.filter(s => s.departmentId === selectedDept)
        : sections;

    const loadStudents = async () => {
        if (!selectedDept || !selectedSem || !selectedSection) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('sectionId', selectedSection);
            params.append('departmentId', selectedDept);
            params.append('semesterId', selectedSem);
            const data = await api.get<any[]>(`/attendance/students?${params.toString()}`);
            setStudents(data);
        } catch { setStudents([]); }
        setLoading(false);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        const header = 'Roll No,Name,Section,Department,Percentage,Present Count,Total Sessions\n';
        const rows = students.map(s => {
            const stats = s.attendanceStats || { attendancePercentage: 0, presentCount: 0, totalSessions: 0 };
            return `${s.rollNo},"${s.user?.name || ''}",${s.section?.name || ''},${s.department?.code || ''},${stats.attendancePercentage}%,${stats.presentCount},${stats.totalSessions}`;
        }).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Student_Registry_${selectedSection || 'All'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        if (selectedSection && selectedDept && selectedSem) {
            loadStudents();
        } else {
            setStudents([]);
        }
    }, [selectedSection, selectedDept, selectedSem]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Attendance — Student Registry</h2>
                    <p className="text-[hsl(var(--muted-foreground))]">View students by section, semester, and department</p>
                </div>
                <Link href="/dashboard/admin/attendance/edit">
                    <Button variant="outline"><Pencil className="w-4 h-4 mr-2" /> Override Past Attendance</Button>
                </Link>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                        <span className="font-medium text-sm">Filter Students</span>
                    </div>
                    <div className="grid sm:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Department</label>
                            <select
                                className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
                                value={selectedDept}
                                onChange={e => { setSelectedDept(e.target.value); setSelectedSection(''); }}
                            >
                                <option value="">All Departments</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Semester</label>
                            <select
                                className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
                                value={selectedSem}
                                onChange={e => setSelectedSem(e.target.value)}
                            >
                                <option value="">Select Semester</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Section</label>
                            <select
                                className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
                                value={selectedSection}
                                onChange={e => setSelectedSection(e.target.value)}
                            >
                                <option value="">All Sections</option>
                                {filteredSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <Button 
                            onClick={loadStudents} 
                            variant="gradient"
                            disabled={!selectedDept || !selectedSem || !selectedSection}
                        >
                            <Search className="w-4 h-4 mr-1" /> Search
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results */}
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : students.length > 0 ? (
                <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium">
                            Showing <span className="text-blue-600 font-bold">{students.length}</span> students
                        </span>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={handlePrint}>
                                <Printer className="w-3.5 h-3.5 mr-1" /> Print
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleDownload}>
                                <Download className="w-3.5 h-3.5 mr-1" /> Download
                            </Button>
                        </div>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {students.map((s, i) => (
                            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                                <Card className="hover:shadow-soft transition-shadow">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                            {s.user?.name?.charAt(0) || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate">{s.user?.name}</p>
                                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{s.rollNo}</p>
                                            <div className="flex gap-1.5 mt-1">
                                                <Badge variant="outline" className="text-[10px]">{s.section?.name}</Badge>
                                                <Badge variant="secondary" className="text-[10px]">{s.department?.code}</Badge>
                                            </div>
                                        </div>
                                        {s.attendanceStats && (
                                            <div className="text-right shrink-0 flex flex-col items-end justify-center">
                                                <span className={`text-lg font-bold ${s.attendanceStats.attendancePercentage >= 75 ? 'text-green-500' : s.attendanceStats.attendancePercentage >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                                                    {s.attendanceStats.attendancePercentage}%
                                                </span>
                                                <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-medium">
                                                    {s.attendanceStats.presentCount}/{s.attendanceStats.totalSessions} Sessions
                                                </span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ) : (selectedSection && selectedDept && selectedSem) ? (
                <Card>
                    <CardContent className="py-12 text-center text-[hsl(var(--muted-foreground))]">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <h3 className="font-semibold mb-1">No Students Found</h3>
                        <p className="text-sm">No students are registered in the selected filters.</p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center text-[hsl(var(--muted-foreground))]">
                        <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <h3 className="font-semibold mb-1">Select Filters</h3>
                        <p className="text-sm">Choose a department, semester, and section to view registered students.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
