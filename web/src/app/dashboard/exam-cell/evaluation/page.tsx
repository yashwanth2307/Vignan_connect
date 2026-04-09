'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, Loader2, CheckCircle2, FileJson, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';

export default function MarksVerificationPage() {
    const [marks, setMarks] = useState<any[]>([]);
    const [semesters, setSemesters] = useState<any[]>([]);
    const [selectedSemester, setSelectedSemester] = useState('');
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState<string | null>(null);

    useEffect(() => {
        api.get<any[]>('/exam/semesters').then(setSemesters).catch(console.error);
    }, []);

    const fetchMarks = async () => {
        if (!selectedSemester) return;
        setLoading(true);
        try {
            const data = await api.get<any[]>(`/exam/marks?semesterId=${selectedSemester}`);
            setMarks(data);
        } catch (e: any) { alert(e.message); }
        setLoading(false);
    };

    const verifySingle = async (id: string) => {
        setVerifying(id);
        try {
            await api.patch(`/exam/marks/${id}/verify`, {});
            await fetchMarks();
        } catch (e: any) { alert(e.message); }
        setVerifying(null);
    };

    const verifyAll = async () => {
        const unverified = marks.filter(m => m.status === 'SUBMITTED');
        if (unverified.length === 0) return;
        if (!confirm(`Verify ${unverified.length} pending mark entries?`)) return;
        
        setVerifying('all');
        try {
            for (const m of unverified) {
                await api.patch(`/exam/marks/${m.id}/verify`, {});
            }
            await fetchMarks();
            alert('All submitted marks have been verified.');
        } catch(e: any) { alert(e.message); }
        setVerifying(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Marks Verification</h2>
                    <p className="text-[hsl(var(--muted-foreground))]">Verify marks uploaded by faculty before they are locked</p>
                </div>
                <div className="flex items-center gap-2">
                    <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className="h-10 rounded-xl border border-[hsl(var(--border))] bg-transparent px-3 text-sm">
                        <option value="">Select Semester to Review</option>
                        {semesters.map(s => <option key={s.id} value={s.id}>Sem {s.number} ({s.department?.code})</option>)}
                    </select>
                    <Button onClick={fetchMarks} disabled={!selectedSemester || loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load Marks'}
                    </Button>
                </div>
            </div>

            {marks.length > 0 && (
                <div className="flex justify-between items-center bg-[hsl(var(--primary))] text-white p-4 rounded-xl shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><ClipboardCheck className="w-5 h-5" /></div>
                        <div>
                            <p className="font-bold">Pending Reviews</p>
                            <p className="text-xs text-white/80">{marks.filter(m => m.status === 'SUBMITTED').length} mark entries are waiting for verification</p>
                        </div>
                    </div>
                    {marks.filter(m => m.status === 'SUBMITTED').length > 0 && (
                        <Button onClick={verifyAll} disabled={verifying === 'all'} className="bg-white text-[hsl(var(--primary))] hover:bg-gray-100">
                            {verifying === 'all' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Verify All Pending
                        </Button>
                    )}
                </div>
            )}

            {!selectedSemester ? (
                <Card><CardContent className="py-16 text-center">
                    <FileJson className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">Select a semester to review marks</p>
                </CardContent></Card>
            ) : marks.length === 0 && !loading ? (
                <Card><CardContent className="py-16 text-center">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500 opacity-60" />
                    <p className="text-lg">No marks have been uploaded by faculty for this semester yet.</p>
                </CardContent></Card>
            ) : (
                <Card>
                    <CardHeader><CardTitle>Marks Ledger</CardTitle></CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-3">Student Roll No</th>
                                    <th className="text-left p-3">Subject</th>
                                    <th className="text-center p-3">Mid 1</th>
                                    <th className="text-center p-3">Mid 2</th>
                                    <th className="text-center p-3">Internal</th>
                                    <th className="text-center p-3">External</th>
                                    <th className="text-center p-3">Status</th>
                                    <th className="text-right p-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {marks.map((m, i) => (
                                    <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="border-b hover:bg-[hsl(var(--muted))]/20">
                                        <td className="p-3 font-mono font-medium">{m.student?.rollNo}</td>
                                        <td className="p-3">{m.subject?.code}</td>
                                        <td className="p-3 text-center">{m.mid1 ?? '-'}</td>
                                        <td className="p-3 text-center">{m.mid2 ?? '-'}</td>
                                        <td className="p-3 text-center">{m.internal ?? '-'}</td>
                                        <td className="p-3 text-center">{m.external ?? '-'}</td>
                                        <td className="p-3 text-center">
                                            <Badge variant={m.status === 'VERIFIED' ? 'default' : m.status === 'LOCKED' ? 'secondary' : 'outline'} className={m.status === 'VERIFIED' ? 'bg-green-100 text-green-700' : ''}>
                                                {m.status}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-right">
                                            {m.status === 'SUBMITTED' ? (
                                                <Button size="sm" variant="outline" className="text-green-600 border-green-200" onClick={() => verifySingle(m.id)} disabled={verifying === m.id || verifying === 'all'}>
                                                    {verifying === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3 mr-1" /> Verify</>}
                                                </Button>
                                            ) : (
                                                <Button size="sm" variant="ghost" disabled><CheckCircle2 className="w-4 h-4 text-green-500" /></Button>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
