'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, AlertTriangle, Clock, Loader2, Download } from 'lucide-react';
import api from '@/lib/api';

export default function StudentAssignmentsPage() {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submittingId, setSubmittingId] = useState<string | null>(null);

    const load = async () => {
        try {
            const data = await api.get<any[]>('/assignments/student/my');
            setAssignments(data);
        } catch {}
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleFileUpload = async (assignmentId: string, file: File) => {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            alert('Only PDF files are allowed for assignment submissions!');
            return;
        }
        setSubmittingId(assignmentId);
        try {
            const formData = new FormData();
            formData.append('file', file);
            await api.post(`/assignments/${assignmentId}/submit`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            alert('Assignment submitted successfully!');
            load();
        } catch (e: any) {
            alert(e.message);
        }
        setSubmittingId(null);
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">My Assignments</h2>
                <p className="text-[hsl(var(--muted-foreground))]">View deadlines, upload PDF submissions, and check faculty remarks.</p>
            </div>

            <div className="space-y-4">
                {assignments.map((item) => {
                    const sub = item.mySubmission;
                    const isOverdue = new Date(item.dueAt) < new Date();
                    const isFlagged = sub?.isFlagged || sub?.status === 'RESUBMISSION_REQUESTED';

                    return (
                        <Card key={item.id} className={`overflow-hidden border transition-all ${isFlagged ? 'border-amber-500 bg-amber-50/30 dark:bg-amber-950/10' : ''}`}>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-start justify-between flex-wrap gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline">{item.courseOffering?.subject?.code}</Badge>
                                            <span className="text-xs text-[hsl(var(--muted-foreground))]">{item.courseOffering?.subject?.title}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{item.title}</h3>
                                        {item.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>}
                                    </div>
                                    <div className="text-right">
                                        <Badge className={`px-3 py-1 ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                            <Clock className="w-3.5 h-3.5 mr-1" /> Due: {new Date(item.dueAt).toLocaleDateString()}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Flagged Resubmission Banner */}
                                {isFlagged && (
                                    <div className="p-4 rounded-2xl bg-amber-100 dark:bg-amber-900/30 border border-amber-300 text-amber-900 dark:text-amber-200 flex gap-3 items-start">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                        <div className="space-y-1 text-sm">
                                            <p className="font-bold">Resubmission Requested by Faculty</p>
                                            <p className="italic bg-white/50 dark:bg-black/20 p-2 rounded-lg">&quot;{sub?.remarks || 'Please revise your submission and re-upload in PDF format.'}&quot;</p>
                                        </div>
                                    </div>
                                )}

                                {/* Status & Upload Action */}
                                <div className="flex items-center justify-between flex-wrap gap-4 pt-2 border-t">
                                    <div className="flex items-center gap-2">
                                        {sub ? (
                                            sub.status === 'RESUBMISSION_REQUESTED' ? (
                                                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">Resubmission Requested</Badge>
                                            ) : sub.status === 'RESUBMITTED' ? (
                                                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">Resubmitted ✓</Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Submitted ✓ ({new Date(sub.submittedAt).toLocaleDateString()})</Badge>
                                            )
                                        ) : (
                                            <Badge variant="secondary">Pending Submission</Badge>
                                        )}

                                        {sub?.fileUrl && (
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={sub.fileUrl} target="_blank" rel="noreferrer">
                                                    <Download className="w-3.5 h-3.5 mr-1" /> View My Submission
                                                </a>
                                            </Button>
                                        )}
                                    </div>

                                    <div>
                                        <label className="cursor-pointer">
                                            <input
                                                type="file"
                                                accept="application/pdf"
                                                className="hidden"
                                                disabled={submittingId === item.id}
                                                onChange={(e) => {
                                                    const f = e.target.files?.[0];
                                                    if (f) handleFileUpload(item.id, f);
                                                }}
                                            />
                                            <Button variant={isFlagged ? 'gradient' : sub ? 'outline' : 'gradient'} size="sm" asChild disabled={submittingId === item.id}>
                                                <span>
                                                    {submittingId === item.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : isFlagged ? (
                                                        <><Upload className="w-4 h-4 mr-1" /> Re-upload Assignment (PDF)</>
                                                    ) : sub ? (
                                                        <><Upload className="w-4 h-4 mr-1" /> Update Submission (PDF)</>
                                                    ) : (
                                                        <><Upload className="w-4 h-4 mr-1" /> Upload PDF Document</>
                                                    )}
                                                </span>
                                            </Button>
                                        </label>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {assignments.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center text-[hsl(var(--muted-foreground))]">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            No assignments assigned for your current semester subjects.
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
