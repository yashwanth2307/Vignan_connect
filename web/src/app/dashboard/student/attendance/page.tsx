'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, Loader2, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#667eea', '#764ba2', '#11998e', '#38ef7d', '#F2994A', '#EB5757'];

export default function StudentAttendancePage() {
    const [attendance, setAttendance] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<any>('/attendance/student/my').then(setAttendance).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const summary = attendance?.summary || [];

    const handlePrint = () => window.print();

    const handleDownload = () => {
        let csv = 'Subject Code,Subject Title,Attended Sessions,Total Sessions,Percentage\n';
        summary.forEach((s: any) => {
            csv += `"${s.subjectCode}","${s.subjectTitle}",${s.attended},${s.totalSessions},${s.percentage}%\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'My_Attendance.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div><h2 className="text-2xl font-bold">My Attendance</h2><p className="text-[hsl(var(--muted-foreground))]">Subject-wise attendance overview</p></div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="w-4 h-4 mr-1" /> Print</Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}><Download className="w-4 h-4 mr-1" /> Download</Button>
                </div>
            </div>

            {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
                <>
                    {/* Chart */}
                    <Card>
                        <CardHeader><CardTitle>Attendance Percentage by Subject</CardTitle></CardHeader>
                        <CardContent>
                            {summary.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={summary}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="subjectCode" />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                                        <Bar dataKey="percentage" name="%" radius={[8, 8, 0, 0]}>
                                            {summary.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <p className="text-center py-8 text-[hsl(var(--muted-foreground))]">No attendance data</p>}
                        </CardContent>
                    </Card>

                    {/* Subject Cards */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {summary.map((s: any, i: number) => (
                            <motion.div key={s.courseOfferingId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                <Card className="hover:shadow-soft-lg transition-all">
                                    <CardContent className="p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <ClipboardCheck className="w-5 h-5 text-[hsl(var(--primary))]" />
                                                <div>
                                                    <p className="font-semibold text-sm">{s.subjectTitle}</p>
                                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{s.subjectCode}</p>
                                                </div>
                                            </div>
                                            <span className={`text-2xl font-bold ${s.percentage >= 75 ? 'text-green-500' : s.percentage >= 60 ? 'text-amber-500' : 'text-red-500'}`}>{s.percentage}%</span>
                                        </div>
                                        <div className="w-full bg-[hsl(var(--secondary))] rounded-full h-2.5">
                                            <div className={`h-2.5 rounded-full ${s.percentage >= 75 ? 'bg-green-500' : s.percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(s.percentage, 100)}%` }} />
                                        </div>
                                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">{s.attended}/{s.totalSessions} sessions</p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
