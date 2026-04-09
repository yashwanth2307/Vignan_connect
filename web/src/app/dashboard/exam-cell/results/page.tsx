'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Loader2, Send, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';

export default function ExamResultsPage() {
    const [semesters, setSemesters] = useState<any[]>([]);
    const [selectedSemester, setSelectedSemester] = useState('');
    const [marks, setMarks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [publishing, setPublishing] = useState(false);

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

    const handleRelease = async () => {
        if (!selectedSemester) return;
        if (!confirm('Are you sure you want to release the results? This will notify students and cannot be undone.')) return;
        setPublishing(true);
        try {
            await api.post(`/exam/results/release/${selectedSemester}`, {});
            alert('Results released successfully!');
            await fetchMarks();
        } catch(e: any) { alert(e.message); }
        setPublishing(false);
    };

    const verifiedMarks = marks.filter(m => m.status === 'VERIFIED' || m.status === 'LOCKED');
    const releasedMarks = marks.filter(m => m.status === 'RELEASED');
    const pendingMarks = marks.filter(m => m.status === 'SUBMITTED' || m.status === 'DRAFT');

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Results Publishing</h2>
                    <p className="text-[hsl(var(--muted-foreground))]">Publish verified marks to student dashboards and trigger email notifications.</p>
                </div>
                <div className="flex items-center gap-2">
                    <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className="h-10 rounded-xl border border-[hsl(var(--border))] bg-transparent px-3 text-sm">
                        <option value="">Select Semester</option>
                        {semesters.map(s => <option key={s.id} value={s.id}>Sem {s.number} ({s.department?.code})</option>)}
                    </select>
                    <Button onClick={fetchMarks} disabled={!selectedSemester || loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load Status'}
                    </Button>
                </div>
            </div>

            {selectedSemester && marks.length > 0 && (
                <div className="grid sm:grid-cols-3 gap-6">
                    <Card className="border-l-4 border-l-yellow-400">
                        <CardContent className="p-6 text-center">
                            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1">Pending Verification</p>
                            <p className="text-4xl font-bold">{pendingMarks.length}</p>
                            <p className="text-xs text-yellow-600 mt-2">Cannot be published yet</p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="p-6 text-center">
                            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1">Ready to Publish</p>
                            <p className="text-4xl font-bold text-blue-600">{verifiedMarks.length}</p>
                            <p className="text-xs text-blue-500 mt-2">Verified, awaiting release</p>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-green-500">
                        <CardContent className="p-6 text-center">
                            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1">Already Published</p>
                            <p className="text-4xl font-bold text-green-600">{releasedMarks.length}</p>
                            <p className="text-xs text-green-500 mt-2">Visible to students</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {selectedSemester && marks.length > 0 && (
                <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 flex flex-col sm:flex-row items-center justify-between text-white gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                                <Award className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">Publish Semester Results</h3>
                                <p className="text-blue-100 mt-1 max-w-md">This action will take all {verifiedMarks.length} "Verified" mark entries and publish them to the student dashboards simultaneously.</p>
                            </div>
                        </div>
                        <Button 
                            size="lg" 
                            variant="secondary" 
                            className="w-full sm:w-auto font-bold text-blue-700 hover:bg-gray-100 h-14 px-8 shadow-2xl"
                            onClick={handleRelease}
                            disabled={publishing || verifiedMarks.length === 0}
                        >
                            {publishing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
                            Publish {verifiedMarks.length} Results
                        </Button>
                    </div>
                </Card>
            )}

            {!selectedSemester && (
                <Card><CardContent className="py-24 text-center">
                    <Award className="w-16 h-16 mx-auto mb-4 opacity-20 text-[hsl(var(--muted-foreground))]" />
                    <p className="text-xl font-medium">Select a semester to publish results</p>
                </CardContent></Card>
            )}
        </div>
    );
}
