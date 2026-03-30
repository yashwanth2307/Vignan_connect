'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Loader2, X, UserCheck, UserX, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ShieldCheck, Trash2, Pencil } from 'lucide-react';
import api from '@/lib/api';
import * as XLSX from 'xlsx';

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [regulations, setRegulations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'all' | 'student' | 'faculty' | 'staff'>('all');
    const [showStudentForm, setShowStudentForm] = useState(false);
    const [showFacultyForm, setShowFacultyForm] = useState(false);
    const [showStaffForm, setShowStaffForm] = useState(false);
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const [showFacultyBulkUpload, setShowFacultyBulkUpload] = useState(false);
    const [form, setForm] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [bulkResult, setBulkResult] = useState<any>(null);
    const [bulkUploading, setBulkUploading] = useState(false);
    const [bulkData, setBulkData] = useState<any[]>([]);
    const [bulkDeptId, setBulkDeptId] = useState('');
    const [bulkSectionId, setBulkSectionId] = useState('');
    const [bulkRegId, setBulkRegId] = useState('');
    const [bulkBatchStart, setBulkBatchStart] = useState('2022');
    const [bulkBatchEnd, setBulkBatchEnd] = useState('2026');
    // Faculty bulk upload states
    const [facultyBulkData, setFacultyBulkData] = useState<any[]>([]);
    const [facultyBulkDeptId, setFacultyBulkDeptId] = useState('');
    const [facultyBulkRole, setFacultyBulkRole] = useState<'FACULTY' | 'HOD'>('FACULTY');
    const [facultyBulkResult, setFacultyBulkResult] = useState<any>(null);
    const [facultyBulkUploading, setFacultyBulkUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const facultyFileInputRef = useRef<HTMLInputElement>(null);
    
    // Edit state
    const [editingUser, setEditingUser] = useState<any>(null);
    const [editForm, setEditForm] = useState<any>({});

    const closeAllForms = () => {
        setShowStudentForm(false);
        setShowFacultyForm(false);
        setShowStaffForm(false);
        setShowBulkUpload(false);
        setShowFacultyBulkUpload(false);
        setForm({});
        setError('');
        setBulkData([]);
        setBulkResult(null);
        setFacultyBulkData([]);
        setFacultyBulkResult(null);
        setEditingUser(null);
        setEditForm({});
    };

    const load = async () => {
        try {
            const [u, d, r] = await Promise.all([api.get<any[]>('/users'), api.get<any[]>('/departments'), api.get<any[]>('/regulations')]);
            setUsers(u);
            setDepartments(d);
            setRegulations(r);
            const allSections: any[] = [];
            for (const dept of d) {
                const detail = await api.get<any>(`/departments/${dept.id}`);
                if (detail.sections) detail.sections.forEach((s: any) => allSections.push(s));
            }
            setSections(allSections);
        } catch { /* ignore */ }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const createStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const payload: any = {
                ...form,
                batchStartYear: +form.batchStartYear,
                batchEndYear: +form.batchEndYear,
            };
            if (form.currentYear) payload.currentYear = +form.currentYear;
            if (form.currentSemester) payload.currentSemester = +form.currentSemester;
            // Remove empty optional strings
            Object.keys(payload).forEach(k => {
                if (payload[k] === '' || payload[k] === undefined) delete payload[k];
            });
            await api.post('/users/students', payload);
            setShowStudentForm(false);
            setForm({});
            await load();
        } catch (err: any) { setError(err.message); }
        setSaving(false);
    };

    const createFaculty = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await api.post('/users/faculty', { ...form });
            setShowFacultyForm(false);
            setForm({});
            await load();
        } catch (err: any) { setError(err.message); }
        setSaving(false);
    };

    const createStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await api.post('/users/staff', { ...form });
            setShowStaffForm(false);
            setForm({});
            await load();
        } catch (err: any) { setError(err.message); }
        setSaving(false);
    };

    const toggleActive = async (id: string) => {
        try {
            await api.patch(`/users/${id}/toggle-active`);
            await load();
        } catch (err: any) { alert(err.message); }
    };

    const deleteUser = async (id: string, name: string) => {
        if (!confirm(`⚠️ Are you sure you want to PERMANENTLY DELETE "${name}"?\n\nThis will remove ALL their data (attendance, marks, submissions, etc.) and cannot be undone.`)) return;
        try {
            await api.delete(`/users/${id}`);
            await load();
        } catch (err: any) { alert(err.message); }
    };

    const handleEditClick = (user: any) => {
        closeAllForms();
        setEditingUser(user);
        setEditForm({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            rollNo: user.student?.rollNo || '',
            empId: user.faculty?.empId || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const submitEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await api.patch(`/users/${editingUser.id}`, editForm);
            setEditingUser(null);
            setEditForm({});
            await load();
        } catch (err: any) { setError(err.message); }
        setSaving(false);
    };

    // -- Excel/CSV Upload Handler for Students --
    const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

        let rows: Record<string, string>[] = [];

        if (isExcel) {
            const buffer = await file.arrayBuffer();
            const wb = XLSX.read(buffer, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
            rows = json;
        } else {
            const text = await file.text();
            const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
            if (lines.length < 2) {
                setError('File must have a header row and at least one data row');
                return;
            }
            const delimiter = lines[0].includes('\t') ? '\t' : ',';
            const headers = lines[0].split(delimiter).map(h => h.trim());
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
                const row: Record<string, string> = {};
                headers.forEach((h, idx) => { row[h] = cols[idx] || ''; });
                rows.push(row);
            }
        }

        if (rows.length === 0) {
            setError('No data rows found in the file');
            return;
        }

        // Auto-detect columns by header names
        const headerKeys = Object.keys(rows[0]);
        const normalize = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');
        const findCol = (keywords: string[]) =>
            headerKeys.find(h => keywords.some(k => normalize(h).includes(k))) || '';

        const nameCol = findCol(['name', 'studentname', 'fullname']);
        const emailCol = findCol(['email', 'emailid', 'emailaddress']);
        const rollCol = findCol(['roll', 'rollno', 'rollnumber', 'htno', 'hallticket']);
        const phoneCol = findCol(['phone', 'mobile', 'contact']);

        if (!nameCol || !emailCol || !rollCol) {
            setError(`Could not find required columns. Found: ${headerKeys.join(', ')}. Need: Name, Email, RollNo`);
            return;
        }

        const parsed: any[] = [];
        for (const row of rows) {
            const name = String(row[nameCol] || '').trim();
            const email = String(row[emailCol] || '').trim();
            const rollNo = String(row[rollCol] || '').trim();
            const phone = phoneCol ? String(row[phoneCol] || '').trim() : undefined;
            if (!name || !email || !rollNo) continue;
            parsed.push({ name, email, rollNo, phone: phone || undefined });
        }

        setBulkData(parsed);
        setError('');
    };

    const handleBulkSubmit = async () => {
        if (!bulkDeptId || !bulkSectionId || !bulkRegId || bulkData.length === 0) {
            setError('Please select department, section, regulation and upload a file');
            return;
        }

        setBulkUploading(true);
        setError('');
        setBulkResult(null);

        try {
            const students = bulkData.map(s => ({
                ...s,
                sectionId: bulkSectionId,
                departmentId: bulkDeptId,
                regulationId: bulkRegId,
                batchStartYear: +bulkBatchStart,
                batchEndYear: +bulkBatchEnd,
            }));

            const result = await api.post('/users/students/bulk', { students });
            setBulkResult(result);
            await load();
        } catch (err: any) { setError(err.message); }
        setBulkUploading(false);
    };

    // -- Excel/CSV Upload Handler for Faculty --
    const handleFacultyExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
        let rows: Record<string, string>[] = [];

        if (isExcel) {
            const buffer = await file.arrayBuffer();
            const wb = XLSX.read(buffer, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
        } else {
            const text = await file.text();
            const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
            if (lines.length < 2) { setError('File must have a header row and at least one data row'); return; }
            const delimiter = lines[0].includes('\t') ? '\t' : ',';
            const headers = lines[0].split(delimiter).map(h => h.trim());
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
                const row: Record<string, string> = {};
                headers.forEach((h, idx) => { row[h] = cols[idx] || ''; });
                rows.push(row);
            }
        }

        if (rows.length === 0) { setError('No data rows found in the file'); return; }

        const headerKeys = Object.keys(rows[0]);
        const normalize = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');
        const findCol = (keywords: string[]) =>
            headerKeys.find(h => keywords.some(k => normalize(h).includes(k))) || '';

        const nameCol = findCol(['name', 'facultyname', 'fullname']);
        const emailCol = findCol(['email', 'emailid', 'emailaddress']);
        const empIdCol = findCol(['emp', 'empid', 'employeeid', 'staffid', 'facid']);
        const phoneCol = findCol(['phone', 'mobile', 'contact']);
        const dateCol = findCol(['join', 'dateofjoin', 'joiningdate', 'doj']);

        if (!nameCol || !emailCol || !empIdCol) {
            setError(`Could not find required columns. Found: ${headerKeys.join(', ')}. Need: Name, Email, EmpId`);
            return;
        }

        const parsed: any[] = [];
        for (const row of rows) {
            const name = String(row[nameCol] || '').trim();
            const email = String(row[emailCol] || '').trim();
            const empId = String(row[empIdCol] || '').trim();
            const phone = phoneCol ? String(row[phoneCol] || '').trim() : undefined;
            const dateOfJoin = dateCol ? String(row[dateCol] || '').trim() : new Date().toISOString().split('T')[0];
            if (!name || !email || !empId) continue;
            parsed.push({ name, email, empId, phone: phone || undefined, dateOfJoin: dateOfJoin || new Date().toISOString().split('T')[0] });
        }

        setFacultyBulkData(parsed);
        setError('');
    };

    const handleFacultyBulkSubmit = async () => {
        if (!facultyBulkDeptId || facultyBulkData.length === 0) {
            setError('Please select department and upload a file');
            return;
        }

        setFacultyBulkUploading(true);
        setError('');
        setFacultyBulkResult(null);

        let created = 0, failed = 0;
        const errors: any[] = [];

        for (const fac of facultyBulkData) {
            try {
                await api.post('/users/faculty', {
                    name: fac.name,
                    email: fac.email,
                    empId: fac.empId,
                    phone: fac.phone,
                    departmentId: facultyBulkDeptId,
                    dateOfJoin: fac.dateOfJoin,
                    role: facultyBulkRole,
                });
                created++;
            } catch (err: any) {
                failed++;
                errors.push({ empId: fac.empId, error: err.message });
            }
        }

        setFacultyBulkResult({ created, failed, errors, totalProcessed: facultyBulkData.length });
        await load();
        setFacultyBulkUploading(false);
    };

    const filtered = tab === 'all' ? users : tab === 'student' ? users.filter(u => u.role === 'STUDENT') :
        tab === 'faculty' ? users.filter(u => ['FACULTY', 'HOD'].includes(u.role)) :
            users.filter(u => ['EXAM_CELL', 'TPO'].includes(u.role));

    const roleColors: Record<string, string> = {
        ADMIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        FACULTY: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        HOD: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        STUDENT: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        EXAM_CELL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        TPO: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold">Users</h2>
                    <p className="text-[hsl(var(--muted-foreground))]">Manage students, faculty, and staff</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button onClick={() => { closeAllForms(); setShowBulkUpload(true); }} variant="outline" size="sm">
                        <Upload className="w-4 h-4" /> Bulk Students
                    </Button>
                    <Button onClick={() => { closeAllForms(); setShowFacultyBulkUpload(true); }} variant="outline" size="sm">
                        <Upload className="w-4 h-4" /> Bulk Faculty
                    </Button>
                    <Button onClick={() => { closeAllForms(); setShowStudentForm(true); }} variant="gradient" size="sm"><Plus className="w-4 h-4" /> Student</Button>
                    <Button onClick={() => { closeAllForms(); setShowFacultyForm(true); }} variant="outline" size="sm"><Plus className="w-4 h-4" /> Faculty</Button>
                    <Button onClick={() => { closeAllForms(); setShowStaffForm(true); }} variant="outline" size="sm"><ShieldCheck className="w-4 h-4" /> Exam Cell / TPO</Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {(['all', 'student', 'faculty', 'staff'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--secondary))]'}`}>
                        {t === 'staff' ? 'Exam Cell / TPO' : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </div>

            {/* Bulk Upload Students Form */}
            {showBulkUpload && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="border-2 border-dashed border-blue-300 dark:border-blue-700">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-blue-500" /> Bulk Upload Students (Excel/CSV)</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowBulkUpload(false)}><X className="w-4 h-4" /></Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {error && <div className="text-red-500 text-sm bg-red-50 dark:bg-red-950/30 p-3 rounded-xl">{error}</div>}

                            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl text-sm">
                                <p className="font-semibold text-blue-700 dark:text-blue-400 mb-2">Excel / CSV Upload:</p>
                                <p className="text-[hsl(var(--muted-foreground))]">Upload <strong>.xlsx, .xls, or .csv</strong> file with columns: <strong>Name, Email, RollNo</strong> (and optionally <strong>Phone</strong>)</p>
                                <p className="text-[hsl(var(--muted-foreground))] mt-1">Password auto-generated as: <strong>{'student@{rollNo}'}</strong></p>
                                <p className="text-[hsl(var(--muted-foreground))] mt-1 text-xs">Column names are auto-detected - headers like Student Name, Email ID, Roll Number, Hall Ticket No all work.</p>
                            </div>

                            <div className="grid sm:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label>Department</Label>
                                    <select value={bulkDeptId} onChange={e => setBulkDeptId(e.target.value)} required className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                        <option value="">Select</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Section</Label>
                                    <select value={bulkSectionId} onChange={e => setBulkSectionId(e.target.value)} required className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                        <option value="">Select</option>
                                        {sections.filter(s => !bulkDeptId || s.departmentId === bulkDeptId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Regulation</Label>
                                    <select value={bulkRegId} onChange={e => setBulkRegId(e.target.value)} required className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                        <option value="">Select</option>
                                        {regulations.map(r => <option key={r.id} value={r.id}>{r.code}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Batch Start Year</Label>
                                    <Input type="number" value={bulkBatchStart} onChange={e => setBulkBatchStart(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Batch End Year</Label>
                                    <Input type="number" value={bulkBatchEnd} onChange={e => setBulkBatchEnd(e.target.value)} />
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv,.tsv,.txt"
                                    onChange={handleExcelUpload}
                                    className="hidden"
                                />
                                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="w-4 h-4" /> Choose Excel / CSV File
                                </Button>
                                {bulkData.length > 0 && (
                                    <Badge variant="secondary" className="text-sm">{bulkData.length} students parsed</Badge>
                                )}
                            </div>

                            {bulkData.length > 0 && (
                                <div className="max-h-48 overflow-y-auto border rounded-xl">
                                    <table className="w-full text-xs">
                                        <thead><tr className="bg-[hsl(var(--muted))]"><th className="p-2 text-left">Name</th><th className="p-2 text-left">Email</th><th className="p-2 text-left">Roll No</th><th className="p-2 text-left">Password</th></tr></thead>
                                        <tbody>
                                            {bulkData.slice(0, 20).map((s, i) => (
                                                <tr key={i} className="border-t border-[hsl(var(--border)/0.3)]">
                                                    <td className="p-2">{s.name}</td>
                                                    <td className="p-2">{s.email}</td>
                                                    <td className="p-2">{s.rollNo}</td>
                                                    <td className="p-2 text-[hsl(var(--muted-foreground))]">student@{s.rollNo}</td>
                                                </tr>
                                            ))}
                                            {bulkData.length > 20 && <tr><td colSpan={4} className="p-2 text-center text-[hsl(var(--muted-foreground))]">... and {bulkData.length - 20} more</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <Button onClick={handleBulkSubmit} disabled={bulkUploading || bulkData.length === 0} variant="gradient">
                                {bulkUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" /> Upload {bulkData.length} Students</>}
                            </Button>

                            {bulkResult && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-xl space-y-2">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                            <p className="font-semibold text-green-700 dark:text-green-400">
                                                Upload Complete: {bulkResult.created} created, {bulkResult.failed} failed
                                            </p>
                                        </div>
                                        {bulkResult.errors?.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {bulkResult.errors.map((e: any, i: number) => (
                                                    <div key={i} className="flex items-center gap-2 text-xs text-red-600">
                                                        <AlertCircle className="w-3 h-3" />
                                                        <span>{e.rollNo}: {e.error}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Bulk Upload Faculty Form */}
            {showFacultyBulkUpload && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="border-2 border-dashed border-purple-300 dark:border-purple-700">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="w-5 h-5 text-purple-500" /> Bulk Upload Faculty (Excel/CSV)</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowFacultyBulkUpload(false)}><X className="w-4 h-4" /></Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {error && <div className="text-red-500 text-sm bg-red-50 dark:bg-red-950/30 p-3 rounded-xl">{error}</div>}

                            <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-xl text-sm">
                                <p className="font-semibold text-purple-700 dark:text-purple-400 mb-2">Faculty Excel / CSV Upload:</p>
                                <p className="text-[hsl(var(--muted-foreground))]">Upload <strong>.xlsx, .xls, or .csv</strong> file with columns: <strong>Name, Email, EmpId</strong> (and optionally <strong>Phone, DateOfJoin</strong>)</p>
                                <p className="text-[hsl(var(--muted-foreground))] mt-1">Password auto-generated as: <strong>{'faculty@{empId}'}</strong></p>
                                <p className="text-[hsl(var(--muted-foreground))] mt-1 text-xs">Column names are auto-detected - headers like Faculty Name, Email ID, Employee ID, Staff ID all work.</p>
                            </div>

                            <div className="grid sm:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label>Department</Label>
                                    <select value={facultyBulkDeptId} onChange={e => setFacultyBulkDeptId(e.target.value)} required className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                        <option value="">Select</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Role</Label>
                                    <select value={facultyBulkRole} onChange={e => setFacultyBulkRole(e.target.value as 'FACULTY' | 'HOD')} className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                        <option value="FACULTY">Faculty</option>
                                        <option value="HOD">HOD</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <input
                                    ref={facultyFileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv,.tsv,.txt"
                                    onChange={handleFacultyExcelUpload}
                                    className="hidden"
                                />
                                <Button variant="outline" onClick={() => facultyFileInputRef.current?.click()}>
                                    <Upload className="w-4 h-4" /> Choose Excel / CSV File
                                </Button>
                                {facultyBulkData.length > 0 && (
                                    <Badge variant="secondary" className="text-sm">{facultyBulkData.length} faculty parsed</Badge>
                                )}
                            </div>

                            {facultyBulkData.length > 0 && (
                                <div className="max-h-48 overflow-y-auto border rounded-xl">
                                    <table className="w-full text-xs">
                                        <thead><tr className="bg-[hsl(var(--muted))]"><th className="p-2 text-left">Name</th><th className="p-2 text-left">Email</th><th className="p-2 text-left">Emp ID</th><th className="p-2 text-left">Password</th></tr></thead>
                                        <tbody>
                                            {facultyBulkData.slice(0, 20).map((f, i) => (
                                                <tr key={i} className="border-t border-[hsl(var(--border)/0.3)]">
                                                    <td className="p-2">{f.name}</td>
                                                    <td className="p-2">{f.email}</td>
                                                    <td className="p-2">{f.empId}</td>
                                                    <td className="p-2 text-[hsl(var(--muted-foreground))]">faculty@{f.empId}</td>
                                                </tr>
                                            ))}
                                            {facultyBulkData.length > 20 && <tr><td colSpan={4} className="p-2 text-center text-[hsl(var(--muted-foreground))]">... and {facultyBulkData.length - 20} more</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <Button onClick={handleFacultyBulkSubmit} disabled={facultyBulkUploading || facultyBulkData.length === 0} variant="gradient">
                                {facultyBulkUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" /> Upload {facultyBulkData.length} Faculty</>}
                            </Button>

                            {facultyBulkResult && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-xl space-y-2">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                            <p className="font-semibold text-green-700 dark:text-green-400">
                                                Upload Complete: {facultyBulkResult.created} created, {facultyBulkResult.failed} failed
                                            </p>
                                        </div>
                                        {facultyBulkResult.errors?.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {facultyBulkResult.errors.map((e: any, i: number) => (
                                                    <div key={i} className="flex items-center gap-2 text-xs text-red-600">
                                                        <AlertCircle className="w-3 h-3" />
                                                        <span>{e.empId}: {e.error}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Create Student Form */}
            {showStudentForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle>Register Student — Complete Details</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowStudentForm(false)}><X className="w-4 h-4" /></Button>
                        </CardHeader>
                        <CardContent>
                            {error && <div className="text-red-500 text-sm mb-3 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl">{error}</div>}
                            <form onSubmit={createStudent} className="space-y-6">

                                {/* Section 1: Basic Info */}
                                <div>
                                    <h4 className="font-semibold text-sm text-[hsl(var(--primary))] mb-3 border-b pb-1">📋 Basic Information</h4>
                                    <div className="grid sm:grid-cols-3 gap-4">
                                        <div className="space-y-1"><Label>Full Name *</Label><Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Ravi Kumar" /></div>
                                        <div className="space-y-1"><Label>Email *</Label><Input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="ravi@vignan.edu" /></div>
                                        <div className="space-y-1"><Label>Roll No *</Label><Input value={form.rollNo || ''} onChange={e => setForm({ ...form, rollNo: e.target.value })} required placeholder="22CSE001" /></div>
                                        <div className="space-y-1"><Label>Phone</Label><Input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" /></div>
                                        <div className="space-y-1"><Label>Student Phone</Label><Input value={form.studentPhone || ''} onChange={e => setForm({ ...form, studentPhone: e.target.value })} placeholder="9876543210" /></div>
                                        <div className="space-y-1">
                                            <Label>Password</Label>
                                            <Input value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={`student@${form.rollNo || 'rollNo'}`} />
                                            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Leave blank for default: student@{'{rollNo}'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Personal Details */}
                                <div>
                                    <h4 className="font-semibold text-sm text-[hsl(var(--primary))] mb-3 border-b pb-1">👤 Personal Details</h4>
                                    <div className="grid sm:grid-cols-4 gap-4">
                                        <div className="space-y-1"><Label>Date of Birth</Label><Input type="date" value={form.dob || ''} onChange={e => setForm({ ...form, dob: e.target.value })} /></div>
                                        <div className="space-y-1">
                                            <Label>Gender</Label>
                                            <select value={form.gender || ''} onChange={e => setForm({ ...form, gender: e.target.value })} className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                                <option value="">Select</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Blood Group</Label>
                                            <select value={form.bloodGroup || ''} onChange={e => setForm({ ...form, bloodGroup: e.target.value })} className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                                <option value="">Select</option>
                                                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1"><Label>Aadhar Number</Label><Input value={form.aadharNumber || ''} onChange={e => setForm({ ...form, aadharNumber: e.target.value })} placeholder="123456789012" maxLength={12} /></div>
                                        <div className="space-y-1">
                                            <Label>Category</Label>
                                            <select value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })} className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                                <option value="">Select</option>
                                                {['OC', 'BC-A', 'BC-B', 'BC-C', 'BC-D', 'BC-E', 'SC', 'ST', 'EWS'].map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1"><Label>Religion</Label><Input value={form.religion || ''} onChange={e => setForm({ ...form, religion: e.target.value })} placeholder="Hindu" /></div>
                                        <div className="space-y-1"><Label>Nationality</Label><Input value={form.nationality || 'Indian'} onChange={e => setForm({ ...form, nationality: e.target.value })} /></div>
                                        <div className="space-y-1">
                                            <Label>Admission Type</Label>
                                            <select value={form.admissionType || 'REGULAR'} onChange={e => setForm({ ...form, admissionType: e.target.value })} className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                                <option value="REGULAR">Regular</option>
                                                <option value="LATERAL">Lateral Entry</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Family Details */}
                                <div>
                                    <h4 className="font-semibold text-sm text-[hsl(var(--primary))] mb-3 border-b pb-1">👨‍👩‍👦 Family Details</h4>
                                    <div className="grid sm:grid-cols-4 gap-4">
                                        <div className="space-y-1"><Label>Father Name</Label><Input value={form.fatherName || ''} onChange={e => setForm({ ...form, fatherName: e.target.value })} placeholder="Suresh Kumar" /></div>
                                        <div className="space-y-1"><Label>Father Phone</Label><Input value={form.fatherPhone || ''} onChange={e => setForm({ ...form, fatherPhone: e.target.value })} placeholder="9876543211" /></div>
                                        <div className="space-y-1"><Label>Father Occupation</Label><Input value={form.fatherOccupation || ''} onChange={e => setForm({ ...form, fatherOccupation: e.target.value })} placeholder="Business" /></div>
                                        <div className="space-y-1"><Label>Father Email</Label><Input value={form.fatherEmail || ''} onChange={e => setForm({ ...form, fatherEmail: e.target.value })} /></div>
                                        <div className="space-y-1"><Label>Mother Name</Label><Input value={form.motherName || ''} onChange={e => setForm({ ...form, motherName: e.target.value })} placeholder="Sunitha" /></div>
                                        <div className="space-y-1"><Label>Mother Phone</Label><Input value={form.motherPhone || ''} onChange={e => setForm({ ...form, motherPhone: e.target.value })} /></div>
                                        <div className="space-y-1"><Label>Mother Occupation</Label><Input value={form.motherOccupation || ''} onChange={e => setForm({ ...form, motherOccupation: e.target.value })} /></div>
                                        <div className="space-y-1"><Label>Mother Email</Label><Input value={form.motherEmail || ''} onChange={e => setForm({ ...form, motherEmail: e.target.value })} /></div>
                                        <div className="space-y-1"><Label>Guardian Name</Label><Input value={form.guardianName || ''} onChange={e => setForm({ ...form, guardianName: e.target.value })} /></div>
                                        <div className="space-y-1"><Label>Guardian Phone</Label><Input value={form.guardianPhone || ''} onChange={e => setForm({ ...form, guardianPhone: e.target.value })} /></div>
                                        <div className="space-y-1"><Label>Guardian Relation</Label><Input value={form.guardianRelation || ''} onChange={e => setForm({ ...form, guardianRelation: e.target.value })} placeholder="Uncle" /></div>
                                    </div>
                                </div>

                                {/* Section 4: Address */}
                                <div>
                                    <h4 className="font-semibold text-sm text-[hsl(var(--primary))] mb-3 border-b pb-1">📍 Address</h4>
                                    <div className="grid sm:grid-cols-3 gap-4">
                                        <div className="space-y-1 sm:col-span-3"><Label>Present Address</Label><Input value={form.presentAddress || ''} onChange={e => setForm({ ...form, presentAddress: e.target.value })} placeholder="H.No 1-2-3, Main Road" /></div>
                                        <div className="space-y-1 sm:col-span-3"><Label>Permanent Address</Label><Input value={form.permanentAddress || ''} onChange={e => setForm({ ...form, permanentAddress: e.target.value })} placeholder="Same as above or different" /></div>
                                        <div className="space-y-1"><Label>City</Label><Input value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Guntur" /></div>
                                        <div className="space-y-1"><Label>State</Label><Input value={form.state || ''} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="Andhra Pradesh" /></div>
                                        <div className="space-y-1"><Label>Pincode</Label><Input value={form.pincode || ''} onChange={e => setForm({ ...form, pincode: e.target.value })} placeholder="522001" maxLength={6} /></div>
                                    </div>
                                </div>

                                {/* Section 5: Academic Details */}
                                <div>
                                    <h4 className="font-semibold text-sm text-[hsl(var(--primary))] mb-3 border-b pb-1">🎓 Academic Details</h4>
                                    <div className="grid sm:grid-cols-4 gap-4">
                                        <div className="space-y-1">
                                            <Label>Department *</Label>
                                            <select value={form.departmentId || ''} onChange={e => setForm({ ...form, departmentId: e.target.value })} required className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                                <option value="">Select</option>
                                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Section *</Label>
                                            <select value={form.sectionId || ''} onChange={e => setForm({ ...form, sectionId: e.target.value })} required className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                                <option value="">Select</option>
                                                {sections.filter(s => !form.departmentId || s.departmentId === form.departmentId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Regulation *</Label>
                                            <select value={form.regulationId || ''} onChange={e => setForm({ ...form, regulationId: e.target.value })} required className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                                <option value="">Select</option>
                                                {regulations.map(r => <option key={r.id} value={r.id}>{r.code}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1"><Label>Batch Start Year *</Label><Input type="number" value={form.batchStartYear || ''} onChange={e => setForm({ ...form, batchStartYear: e.target.value })} required placeholder="2022" /></div>
                                        <div className="space-y-1"><Label>Batch End Year *</Label><Input type="number" value={form.batchEndYear || ''} onChange={e => setForm({ ...form, batchEndYear: e.target.value })} required placeholder="2026" /></div>
                                        <div className="space-y-1">
                                            <Label>Current Year</Label>
                                            <select value={form.currentYear || '1'} onChange={e => setForm({ ...form, currentYear: +e.target.value })} className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                                {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Current Semester</Label>
                                            <select value={form.currentSemester || '1'} onChange={e => setForm({ ...form, currentSemester: +e.target.value })} className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2 border-t">
                                    <Button type="button" variant="outline" onClick={() => setShowStudentForm(false)}>Cancel</Button>
                                    <Button type="submit" variant="gradient" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register Student'}</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Create Faculty Form */}
            {showFacultyForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle>Register Faculty / HOD</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowFacultyForm(false)}><X className="w-4 h-4" /></Button>
                        </CardHeader>
                        <CardContent>
                            {error && <div className="text-red-500 text-sm mb-3 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl">{error}</div>}
                            <form onSubmit={createFaculty} className="grid sm:grid-cols-3 gap-4">
                                <div className="space-y-1"><Label>Name</Label><Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                                <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
                                <div className="space-y-1"><Label>Phone</Label><Input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                                <div className="space-y-1"><Label>Employee ID</Label><Input value={form.empId || ''} onChange={e => setForm({ ...form, empId: e.target.value })} required /></div>
                                <div className="space-y-1">
                                    <Label>Password</Label>
                                    <Input value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={`faculty@${form.empId || 'empId'}`} />
                                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Leave blank for default: faculty@{'{empId}'}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label>Role</Label>
                                    <select value={form.role || 'FACULTY'} onChange={e => setForm({ ...form, role: e.target.value })} className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                        <option value="FACULTY">Faculty</option>
                                        <option value="HOD">HOD</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Department</Label>
                                    <select value={form.departmentId || ''} onChange={e => setForm({ ...form, departmentId: e.target.value })} required className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                        <option value="">Select</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1"><Label>Date of Joining</Label><Input type="date" value={form.dateOfJoin || ''} onChange={e => setForm({ ...form, dateOfJoin: e.target.value })} required /></div>
                                <div className="flex items-end">
                                    <Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register'}</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Create Staff (Exam Cell / TPO) Form */}
            {showStaffForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-red-500" /> Register Exam Cell / TPO Staff</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowStaffForm(false)}><X className="w-4 h-4" /></Button>
                        </CardHeader>
                        <CardContent>
                            {error && <div className="text-red-500 text-sm mb-3 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl">{error}</div>}
                            <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl text-sm text-amber-700 dark:text-amber-400 mb-4">
                                <p>Staff users (Exam Cell / TPO) do <strong>not</strong> need Department, Section, or Employee ID. They only need Name, Email, and Role.</p>
                                <p className="mt-1">Default password: <strong>staff@{'{emailPrefix}'}</strong> (e.g., for exam@vignan.edu → staff@exam)</p>
                            </div>
                            <form onSubmit={createStaff} className="grid sm:grid-cols-3 gap-4">
                                <div className="space-y-1"><Label>Name</Label><Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                                <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
                                <div className="space-y-1"><Label>Phone</Label><Input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                                <div className="space-y-1">
                                    <Label>Role</Label>
                                    <select value={form.role || 'EXAM_CELL'} onChange={e => setForm({ ...form, role: e.target.value })} required className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                        <option value="EXAM_CELL">Exam Cell</option>
                                        <option value="TPO">TPO (Placements)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Password (optional)</Label>
                                    <Input value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={`staff@${form.email ? form.email.split('@')[0] : 'emailPrefix'}`} />
                                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Leave blank for default</p>
                                </div>
                                <div className="flex items-end">
                                    <Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register Staff'}</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Edit User Form */}
            {editingUser && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="border-2 border-amber-300 dark:border-amber-700">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="flex items-center gap-2"><Pencil className="w-5 h-5 text-amber-500" /> Edit User details</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setEditingUser(null)}><X className="w-4 h-4" /></Button>
                        </CardHeader>
                        <CardContent>
                            {error && <div className="text-red-500 text-sm mb-3 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl">{error}</div>}
                            <form onSubmit={submitEdit} className="grid sm:grid-cols-3 gap-4">
                                <div className="space-y-1"><Label>Name</Label><Input value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required /></div>
                                <div className="space-y-1"><Label>Email</Label><Input type="email" value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} required /></div>
                                <div className="space-y-1"><Label>Phone</Label><Input value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
                                {editingUser.role === 'STUDENT' && (
                                    <div className="space-y-1"><Label>Roll Number</Label><Input value={editForm.rollNo || ''} onChange={e => setEditForm({ ...editForm, rollNo: e.target.value })} required /></div>
                                )}
                                {editingUser.role === 'FACULTY' && (
                                    <div className="space-y-1"><Label>Employee ID</Label><Input value={editForm.empId || ''} onChange={e => setEditForm({ ...editForm, empId: e.target.value })} required /></div>
                                )}
                                <div className="flex items-end sm:col-span-3 justify-end mt-2 pt-2 border-t border-[hsl(var(--border))]">
                                    <Button type="submit" disabled={saving} variant="gradient">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update User'}</Button>
                                    <Button type="button" variant="outline" className="ml-2" onClick={() => setEditingUser(null)}>Cancel</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : (
                <div className="space-y-2">
                    {filtered.length === 0 && (
                        <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No users found in this category</p>
                        </div>
                    )}
                    {filtered.map((user, i) => (
                        <motion.div key={user.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                            <Card className="hover:shadow-soft transition-all">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
                                            {user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                        </div>
                                        <div>
                                            <p className="font-medium">{user.name}</p>
                                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{user.email}</p>
                                            {user.student && <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Roll: {user.student.rollNo} | {user.student.section?.name} | {user.student.department?.name}</p>}
                                            {user.faculty && <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Emp: {user.faculty.empId} | {user.faculty.department?.name}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleColors[user.role] || ''}`}>{user.role}</span>
                                        <Button variant="ghost" size="icon" onClick={() => toggleActive(user.id)} title={user.isActive ? 'Deactivate' : 'Activate'}>
                                            {user.isActive ? <UserCheck className="w-4 h-4 text-green-500" /> : <UserX className="w-4 h-4 text-red-500" />}
                                        </Button>
                                        {user.role !== 'ADMIN' && (
                                            <>
                                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(user)} title="Edit User">
                                                    <Pencil className="w-4 h-4 text-amber-500 hover:text-amber-600" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => deleteUser(user.id, user.name)} title="Delete User Permanently">
                                                    <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
