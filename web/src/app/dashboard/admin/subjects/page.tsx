'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Upload, Plus, Trash2, Loader2, BookOpen, Download,
    CheckCircle2, XCircle, FileSpreadsheet, AlertTriangle, Pencil
} from 'lucide-react';
import api from '@/lib/api';

export default function SubjectBulkUploadPage() {
    const [departments, setDepartments] = useState<any[]>([]);
    const [regulations, setRegulations] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Upload state
    const [showUpload, setShowUpload] = useState(false);
    const [csvText, setCsvText] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<any>(null);

    // Single add state
    const [showAdd, setShowAdd] = useState(false);
    const [singleData, setSingleData] = useState({
        id: '', code: '', title: '', credits: 4, semesterNumber: 1, weeklyHours: 3, 
        subjectType: 'THEORY', isLab: false, isElective: false, 
        regulationId: '', departmentId: ''
    });

    // Quick-add state
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedReg, setSelectedReg] = useState('');

    useEffect(() => {
        Promise.all([
            api.get<any[]>('/departments'),
            api.get<any[]>('/regulations'),
            api.get<any[]>('/subjects'),
        ]).then(([depts, regs, subs]) => {
            setDepartments(depts);
            setRegulations(regs);
            setSubjects(subs);
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const filteredSubjects = subjects.filter(s => {
        if (selectedDept && s.departmentId !== selectedDept) return false;
        if (selectedReg && s.regulationId !== selectedReg) return false;
        return true;
    });

    const parseCsvAndUpload = async () => {
        if (!csvText.trim()) return;
        setUploading(true);
        setUploadResult(null);

        try {
            const lines = csvText.trim().split('\n');
            const header = lines[0].split(',').map(h => h.trim().toLowerCase());
            
            const parsed = lines.slice(1).map(line => {
                const cols = line.split(',').map(c => c.trim());
                const obj: any = {};
                header.forEach((h, i) => {
                    const normHeader = h.replace(/[^a-z0-9]/g, '');
                    if (normHeader.includes('credit')) {
                        obj['credits'] = parseInt(cols[i]) || 0;
                    } else if (normHeader.includes('sem')) {
                        obj['semesterNumber'] = parseInt(cols[i]) || 0;
                    } else if (normHeader.includes('week') || normHeader.includes('hours')) {
                        obj['weeklyHours'] = parseInt(cols[i]) || 0;
                    } else if (normHeader === 'islab' || normHeader === 'lab') {
                        const val = cols[i]?.toLowerCase();
                        obj['isLab'] = val === 'true' || val === '1' || val === 'yes' || val === 'y';
                    } else if (normHeader.includes('elective')) {
                        const val = cols[i]?.toLowerCase();
                        obj['isElective'] = val === 'true' || val === '1' || val === 'yes' || val === 'y';
                    } else if (normHeader.includes('type')) {
                        obj['subjectType'] = cols[i]?.toUpperCase() || 'THEORY';
                    } else if (normHeader === 'code' || normHeader === 'subjectcode') {
                        obj['code'] = cols[i];
                    } else if (normHeader.includes('title') || normHeader.includes('name')) {
                        obj['title'] = cols[i];
                    } else if (normHeader.includes('reg')) {
                        obj['regulationCode'] = cols[i]?.toUpperCase();
                    } else if (normHeader.includes('dept') || normHeader.includes('department')) {
                        obj['departmentCode'] = cols[i]?.toUpperCase();
                    }
                });

                // Resolve regulation/department by code if needed
                if (obj.regulationCode && !obj.regulationId) {
                    const reg = regulations.find(r => r.code === obj.regulationCode);
                    if (reg) obj.regulationId = reg.id;
                }
                if (obj.departmentCode && !obj.departmentId) {
                    const dept = departments.find(d => d.code === obj.departmentCode);
                    if (dept) obj.departmentId = dept.id;
                }
                
                // Strip out fields not allowed by CreateSubjectDto validation
                delete obj.regulationCode;
                delete obj.departmentCode;
                delete obj.id;

                return obj;
            }).filter(o => o.code && o.title && o.regulationId && o.departmentId);

            if (parsed.length === 0) {
                alert('No valid rows found. Please check your CSV format.');
                setUploading(false);
                return;
            }

            const result = await api.post<any>('/subjects/bulk-upload', { subjects: parsed });
            setUploadResult(result);
            
            // Reload subjects
            const subs = await api.get<any[]>('/subjects');
            setSubjects(subs);
        } catch (e: any) {
            alert(e.message);
        }
        setUploading(false);
    };

    const handleAddSingle = async () => {
        if (!singleData.code || !singleData.title || !singleData.departmentId || !singleData.regulationId) {
            alert('Please fill all required fields');
            return;
        }
        setUploading(true);
        try {
            const payload = { ...singleData };
            delete (payload as any).id; // Remove ID to bypass validation errors for Create

            if (singleData.id) {
                await api.put(`/subjects/${singleData.id}`, payload);
            } else {
                await api.post('/subjects', payload);
            }
            setSingleData({ ...singleData, id: '', code: '', title: '' });
            setShowAdd(false);
            const subs = await api.get<any[]>('/subjects');
            setSubjects(subs);
        } catch (e: any) {
            alert(e.message);
        }
        setUploading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this subject?')) return;
        try {
            await api.delete(`/subjects/${id}`);
            const subs = await api.get<any[]>('/subjects');
            setSubjects(subs);
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleEditClick = (sub: any) => {
        setSingleData({
            id: sub.id,
            code: sub.code || '',
            title: sub.title || '',
            credits: sub.credits || 0,
            semesterNumber: sub.semesterNumber || 1,
            weeklyHours: sub.weeklyHours || 3,
            subjectType: sub.subjectType || 'THEORY',
            isLab: sub.isLab || false,
            isElective: sub.isElective || false,
            regulationId: sub.regulationId || '',
            departmentId: sub.departmentId || ''
        });
        setShowAdd(true);
        setShowUpload(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const sampleCsv = `code,title,credits,semesterNumber,weeklyHours,subjectType,isLab,isElective,regulationCode,departmentCode
CS301,Data Structures,4,3,4,THEORY,false,false,R22,CSE
CS302,Digital Logic Design,3,3,3,THEORY,false,false,R22,CSE
CS303L,Data Structures Lab,1,3,3,LAB,true,false,R22,CSE`;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setCsvText(text);
        };
        reader.readAsText(file);
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Subjects Management</h2>
                    <p className="text-[hsl(var(--muted-foreground))]">Manage subjects and bulk upload via CSV</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { 
                        setSingleData({ id: '', code: '', title: '', credits: 4, semesterNumber: 1, weeklyHours: 3, subjectType: 'THEORY', isLab: false, isElective: false, regulationId: '', departmentId: '' });
                        setShowAdd(!showAdd); 
                        setShowUpload(false); 
                    }}>
                        <Plus className="w-4 h-4 mr-1" /> Add Subject
                    </Button>
                    <Button variant="gradient" onClick={() => { setShowUpload(!showUpload); setShowAdd(false); }}>
                        <Upload className="w-4 h-4 mr-1" /> Bulk Upload
                    </Button>
                </div>
            </div>

            {/* Single Add Form */}
            <AnimatePresence>
                {showAdd && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <Card className="border-2 border-blue-200 dark:border-blue-900 mb-6">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <BookOpen className="w-5 h-5" /> {singleData.id ? 'Edit Subject' : 'Add New Subject'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Code *</label>
                                        <input value={singleData.code} onChange={e => setSingleData({...singleData, code: e.target.value})} className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm" placeholder="CS301" />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-sm font-medium">Title *</label>
                                        <input value={singleData.title} onChange={e => setSingleData({...singleData, title: e.target.value})} className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm" placeholder="Data Structures" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Credits</label>
                                        <input type="number" value={singleData.credits} onChange={e => setSingleData({...singleData, credits: parseInt(e.target.value) || 0})} className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Semester *</label>
                                        <input type="number" value={singleData.semesterNumber} onChange={e => setSingleData({...singleData, semesterNumber: parseInt(e.target.value) || 0})} className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Type</label>
                                        <select value={singleData.subjectType} onChange={e => setSingleData({...singleData, subjectType: e.target.value, isLab: e.target.value === 'LAB'})} className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm">
                                            <option value="THEORY">THEORY</option>
                                            <option value="LAB">LAB</option>
                                            <option value="PROJECT">PROJECT</option>
                                            <option value="SEMINAR">SEMINAR</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Department *</label>
                                        <select value={singleData.departmentId} onChange={e => setSingleData({...singleData, departmentId: e.target.value})} className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm">
                                            <option value="">Select Dept</option>
                                            {departments.map(d => <option key={d.id} value={d.id}>{d.code}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Regulation *</label>
                                        <select value={singleData.regulationId} onChange={e => setSingleData({...singleData, regulationId: e.target.value})} className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm">
                                            <option value="">Select Regulation</option>
                                            {regulations.map(r => <option key={r.id} value={r.id}>{r.code}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="gradient" onClick={handleAddSingle} disabled={uploading}>
                                        {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />} {singleData.id ? 'Update Subject' : 'Save Subject'}
                                    </Button>
                                    <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bulk Upload Form */}
            <AnimatePresence>
                {showUpload && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <Card className="border-2 border-dashed border-blue-300 dark:border-blue-800">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileSpreadsheet className="w-5 h-5" /> CSV Bulk Upload
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">CSV Format Guide</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-500">
                                        Headers: code, title, credits, semesterNumber, weeklyHours, subjectType (THEORY|LAB|PROJECT|SEMINAR), isLab, isElective, regulationCode, departmentCode
                                    </p>
                                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                                        <label className="cursor-pointer">
                                            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                                            <div className="flex h-8 items-center rounded-md border border-blue-300 dark:border-blue-700 bg-white dark:bg-blue-950 px-3 text-xs font-medium hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors text-blue-700 dark:text-blue-300">
                                                <Upload className="w-3 h-3 mr-2" /> Choose .csv file
                                            </div>
                                        </label>
                                        <span className="text-xs text-[hsl(var(--muted-foreground))]">or load</span>
                                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setCsvText(sampleCsv)}>
                                            <Download className="w-3 h-3 mr-1" /> Sample
                                        </Button>
                                        <span className="text-xs text-[hsl(var(--muted-foreground))]">or paste below</span>
                                    </div>
                                </div>
                                <textarea value={csvText} onChange={e => setCsvText(e.target.value)}
                                    className="flex w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm font-mono min-h-[150px]"
                                    placeholder="Select a .csv file above or paste your CSV data here..." />
                                <div className="flex gap-2">
                                    <Button variant="gradient" onClick={parseCsvAndUpload} disabled={uploading || !csvText.trim()}>
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-1" /> Upload</>}
                                    </Button>
                                    <Button variant="outline" onClick={() => { setShowUpload(false); setUploadResult(null); setCsvText(''); }}>Cancel</Button>
                                </div>

                                {uploadResult && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="p-4 rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                                            <span className="font-semibold text-green-700 dark:text-green-400">Upload Complete</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <div className="text-center p-2 rounded-lg bg-white dark:bg-black/20">
                                                <p className="text-2xl font-bold text-blue-600">{uploadResult.totalProcessed}</p>
                                                <p className="text-xs text-[hsl(var(--muted-foreground))]">Total</p>
                                            </div>
                                            <div className="text-center p-2 rounded-lg bg-white dark:bg-black/20">
                                                <p className="text-2xl font-bold text-green-600">{uploadResult.created}</p>
                                                <p className="text-xs text-[hsl(var(--muted-foreground))]">Created</p>
                                            </div>
                                            <div className="text-center p-2 rounded-lg bg-white dark:bg-black/20">
                                                <p className="text-2xl font-bold text-red-500">{uploadResult.failed}</p>
                                                <p className="text-xs text-[hsl(var(--muted-foreground))]">Failed</p>
                                            </div>
                                        </div>
                                        {uploadResult.errors?.length > 0 && (
                                            <div className="mt-3 space-y-1">
                                                <p className="text-xs font-medium text-red-600">Errors:</p>
                                                {uploadResult.errors.map((e: any, i: number) => (
                                                    <p key={i} className="text-xs text-red-500">• {e.code}: {e.error}</p>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Department</label>
                            <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)}
                                className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm">
                                <option value="">All Departments</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Regulation</label>
                            <select value={selectedReg} onChange={e => setSelectedReg(e.target.value)}
                                className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm">
                                <option value="">All Regulations</option>
                                {regulations.map(r => <option key={r.id} value={r.id}>{r.code}</option>)}
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Subjects Table */}
            <div className="text-sm font-medium">
                Showing <span className="text-blue-600 font-bold">{filteredSubjects.length}</span> subjects
            </div>
            {filteredSubjects.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-[hsl(var(--muted-foreground))]">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <h3 className="font-semibold mb-1">No Subjects Found</h3>
                        <p className="text-sm">Upload subjects via CSV or create them individually.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-[hsl(var(--muted))]">
                                <th className="px-4 py-3 text-left font-medium">Code</th>
                                <th className="px-4 py-3 text-left font-medium">Title</th>
                                <th className="px-4 py-3 text-center font-medium">Sem</th>
                                <th className="px-4 py-3 text-center font-medium">Credits</th>
                                <th className="px-4 py-3 text-center font-medium">Hrs/Wk</th>
                                <th className="px-4 py-3 text-center font-medium">Type</th>
                                <th className="px-4 py-3 text-center font-medium">Dept</th>
                                <th className="px-4 py-3 text-center font-medium">Reg</th>
                                <th className="px-4 py-3 text-center font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubjects.map((sub, i) => (
                                <motion.tr key={sub.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                                    className="border-b hover:bg-[hsl(var(--muted))]/50 transition-colors">
                                    <td className="px-4 py-2.5 font-mono font-semibold">{sub.code}</td>
                                    <td className="px-4 py-2.5">{sub.title}</td>
                                    <td className="px-4 py-2.5 text-center">{sub.semesterNumber}</td>
                                    <td className="px-4 py-2.5 text-center">{sub.credits}</td>
                                    <td className="px-4 py-2.5 text-center">{sub.weeklyHours || 3}</td>
                                    <td className="px-4 py-2.5 text-center">
                                        <Badge variant={sub.isLab ? 'default' : 'outline'} className="text-[10px]">
                                            {sub.subjectType || 'THEORY'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-2.5 text-center">
                                        <Badge variant="secondary" className="text-[10px]">{sub.department?.code}</Badge>
                                    </td>
                                    <td className="px-4 py-2.5 text-center">
                                        <Badge variant="outline" className="text-[10px]">{sub.regulation?.code}</Badge>
                                    </td>
                                    <td className="px-4 py-2.5 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50" onClick={() => handleEditClick(sub)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/50" onClick={() => handleDelete(sub.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
