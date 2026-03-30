'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileDown, Loader2, Printer, BarChart3, ClipboardCheck, Filter } from 'lucide-react';
import api from '@/lib/api';

export default function ReportsPage() {
    const [semesters, setSemesters] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [selectedSemester, setSelectedSemester] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedDept, setSelectedDept] = useState('');
    const [batchStart, setBatchStart] = useState('');
    const [reportType, setReportType] = useState<'marks' | 'attendance'>('marks');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        (async () => {
            try {
                const sems = await api.get<any[]>('/exam/semesters');
                setSemesters(sems);
                const depts = await api.get<any[]>('/departments');
                setDepartments(depts);
                const allSec: any[] = [];
                for (const d of depts) {
                    const detail = await api.get<any>(`/departments/${d.id}`);
                    if (detail.sections) detail.sections.forEach((s: any) => allSec.push({ ...s, deptName: d.name }));
                }
                setSections(allSec);
            } catch {}
        })();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            let url = `/exam/reports/${reportType}?`;
            if (selectedSemester) url += `semesterId=${selectedSemester}&`;
            if (selectedSection) url += `sectionId=${selectedSection}&`;
            if (selectedDept) url += `departmentId=${selectedDept}&`;
            if (batchStart) url += `batchStartYear=${batchStart}&`;
            const result = await api.get<any[]>(url);
            setData(result);
        } catch (e: any) { alert(e.message); }
        setLoading(false);
    };

    const downloadCSV = () => {
        if (data.length === 0) return;
        const keys = Object.keys(data[0]);
        const header = keys.join(',') + '\n';
        const rows = data.map(r => keys.map(k => r[k] ?? '').join(',')).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${reportType}_report.csv`;
        a.click();
    };

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;
        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(`
            <html><head><title>${reportType === 'marks' ? 'Marks' : 'Attendance'} Report</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { font-size: 18px; margin-bottom: 4px; }
                p { font-size: 12px; color: #666; margin-bottom: 16px; }
                table { width: 100%; border-collapse: collapse; font-size: 11px; }
                th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
                th { background: #f5f5f5; font-weight: 600; }
                tr:nth-child(even) { background: #fafafa; }
                .low { color: red; font-weight: bold; }
                @media print { body { padding: 0; } }
            </style></head><body>
            <h1>Vignan Institute — ${reportType === 'marks' ? 'Marks' : 'Attendance'} Report</h1>
            <p>Generated: ${new Date().toLocaleString()} | Records: ${data.length}</p>
            ${content.innerHTML}
            </body></html>
        `);
        win.document.close();
        win.print();
    };

    const marksColumns = ['rollNo', 'name', 'section', 'department', 'subject', 'subjectTitle', 'semester', 'mid1', 'mid2', 'internal', 'external', 'final', 'status'];
    const attendanceColumns = ['rollNo', 'name', 'section', 'department', 'subject', 'totalClasses', 'present', 'absent', 'late', 'od', 'ml', 'percentage'];
    const columns = reportType === 'marks' ? marksColumns : attendanceColumns;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">📊 Reports & Downloads</h2>
                <p className="text-[hsl(var(--muted-foreground))]">Generate, print, and download attendance & marks reports</p>
            </div>

            {/* Report Type */}
            <div className="flex gap-2">
                <Button variant={reportType === 'marks' ? 'gradient' : 'outline'} size="sm" onClick={() => { setReportType('marks'); setData([]); }}>
                    <BarChart3 className="w-4 h-4 mr-1" /> Marks Report
                </Button>
                <Button variant={reportType === 'attendance' ? 'gradient' : 'outline'} size="sm" onClick={() => { setReportType('attendance'); setData([]); }}>
                    <ClipboardCheck className="w-4 h-4 mr-1" /> Attendance Report
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><Filter className="w-4 h-4" /> Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid sm:grid-cols-5 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Semester</label>
                            <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className="w-full h-9 rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 text-sm">
                                <option value="">All</option>
                                {semesters.map(s => <option key={s.id} value={s.id}>Sem {s.number}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Department</label>
                            <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} className="w-full h-9 rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 text-sm">
                                <option value="">All</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Section</label>
                            <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="w-full h-9 rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 text-sm">
                                <option value="">All</option>
                                {sections.map(s => <option key={s.id} value={s.id}>{s.name} ({s.deptName})</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium">Batch Start Year</label>
                            <select value={batchStart} onChange={e => setBatchStart(e.target.value)} className="w-full h-9 rounded-xl border border-[hsl(var(--input))] bg-transparent px-3 text-sm">
                                <option value="">All</option>
                                {[2022, 2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <Button onClick={fetchReport} size="sm" className="w-full">Fetch Report</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            {data.length > 0 && (
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={downloadCSV}><FileDown className="w-3 h-3 mr-1" />Download CSV</Button>
                    <Button size="sm" variant="outline" onClick={handlePrint}><Printer className="w-3 h-3 mr-1" />Print Report</Button>
                    <Badge variant="secondary">{data.length} records</Badge>
                </div>
            )}

            {/* Data Table */}
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : data.length > 0 ? (
                <div ref={printRef} className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr>
                                {columns.map(col => (
                                    <th key={col} className="p-2 text-left text-xs font-semibold border-b capitalize">{col.replace(/([A-Z])/g, ' $1')}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => (
                                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.005 }}
                                    className="border-b hover:bg-[hsl(var(--muted))]/30">
                                    {columns.map(col => (
                                        <td key={col} className={`p-2 text-xs ${col === 'percentage' && (row[col] || 0) < 75 ? 'text-red-600 font-bold' : ''}`}>
                                            {col === 'percentage' ? `${row[col]}%` : (row[col] ?? '-')}
                                        </td>
                                    ))}
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <Card>
                    <CardContent className="py-16 text-center">
                        <FileDown className="w-14 h-14 mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-semibold mb-2">Select Filters & Fetch</h3>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">Choose filters above and click Fetch Report to view downloadable data.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
