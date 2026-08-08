'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Flag, CheckCircle, Download, Loader2, Calendar } from 'lucide-react';
import api from '@/lib/api';

export default function FacultyAssignmentsPage() {
    const [offerings, setOfferings] = useState<any[]>([]);
    const [selectedCO, setSelectedCO] = useState<string>('');
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    // Form
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueAt, setDueAt] = useState('');
    const [creating, setCreating] = useState(false);

    // Flag Modal
    const [flagSubmissionId, setFlagSubmissionId] = useState<string | null>(null);
    const [flagRemarks, setFlagRemarks] = useState('');
    const [flagging, setFlagging] = useState(false);

    useEffect(() => {
        api.get<any[]>('/course-offerings/my').then(data => {
            setOfferings(data);
            if (data.length > 0) {
                setSelectedCO(data[0].id);
                loadAssignments(data[0].id);
            } else {
                setLoading(false);
            }
        }).catch(() => setLoading(false));
    }, []);

    const loadAssignments = async (coId: string) => {
        setLoading(true);
        try {
            const data = await api.get<any[]>(`/assignments/course-offering/${coId}`);
            setAssignments(data);
        } catch {}
        setLoading(false);
    };

    const handleCOChange = (coId: string) => {
        setSelectedCO(coId);
        loadAssignments(coId);
    };

    const handleCreateAssignment = async () => {
        if (!title || !dueAt || !selectedCO) return;
        setCreating(true);
        try {
            await api.post('/assignments', {
                courseOfferingId: selectedCO,
                title,
                description,
                dueAt,
            });
            setTitle(''); setDescription(''); setDueAt('');
            setShowCreate(false);
            loadAssignments(selectedCO);
        } catch (e: any) { alert(e.message); }
        setCreating(false);
    };

    const handleFlagSubmission = async () => {
        if (!flagSubmissionId) return;
        setFlagging(true);
        try {
            await api.patch(`/assignments/submissions/${flagSubmissionId}/flag`, {
                remarks: flagRemarks,
            });
            alert('Submission flagged for resubmission with remarks.');
            setFlagSubmissionId(null);
            setFlagRemarks('');
            loadAssignments(selectedCO);
        } catch (e: any) { alert(e.message); }
        setFlagging(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Course Assignments</h2>
                    <p className="text-[hsl(var(--muted-foreground))]">Create assignments, evaluate PDF submissions, and flag for resubmission.</p>
                </div>
                <Button variant="gradient" onClick={() => setShowCreate(!showCreate)}>
                    <Plus className="w-4 h-4 mr-1" /> Create Assignment
                </Button>
            </div>

            {/* Select Course Offering */}
            <Card>
                <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                    <label className="text-sm font-medium">Select Subject / Section:</label>
                    <select
                        value={selectedCO}
                        onChange={(e) => handleCOChange(e.target.value)}
                        className="flex h-10 rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 text-sm min-w-[280px]"
                    >
                        {offerings.map((o) => (
                            <option key={o.id} value={o.id}>
                                {o.subject?.code} - {o.subject?.title} ({o.section?.name})
                            </option>
                        ))}
                    </select>
                </CardContent>
            </Card>

            {/* Create Form */}
            {showCreate && (
                <Card className="border-2 border-blue-300 dark:border-blue-800">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="text-lg font-bold">Create New Assignment</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Assignment Title *</label>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Assignment 1: Matrix Inversion & Linear Systems"
                                    className="w-full h-10 rounded-xl border px-3 text-sm bg-transparent"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Due Date & Time *</label>
                                <input
                                    type="datetime-local"
                                    value={dueAt}
                                    onChange={(e) => setDueAt(e.target.value)}
                                    className="w-full h-10 rounded-xl border px-3 text-sm bg-transparent"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Instructions / Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Detailed instructions for student PDF submission..."
                                className="w-full h-20 rounded-xl border p-3 text-sm bg-transparent"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="gradient" onClick={handleCreateAssignment} disabled={creating || !title || !dueAt}>
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Assignment'}
                            </Button>
                            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Assignments List */}
            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : (
                <div className="space-y-6">
                    {assignments.map((assignment) => (
                        <Card key={assignment.id} className="overflow-hidden border">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-start justify-between flex-wrap gap-2">
                                    <div>
                                        <h3 className="text-xl font-bold">{assignment.title}</h3>
                                        {assignment.description && <p className="text-sm text-gray-500 mt-1">{assignment.description}</p>}
                                    </div>
                                    <Badge variant="outline"><Calendar className="w-3.5 h-3.5 mr-1" /> Due: {new Date(assignment.dueAt).toLocaleString()}</Badge>
                                </div>

                                <div className="border-t pt-4 space-y-3">
                                    <h4 className="font-semibold text-sm text-[hsl(var(--muted-foreground))]">
                                        Student Submissions ({assignment.submissions?.length || 0})
                                    </h4>

                                    <div className="space-y-2">
                                        {assignment.submissions?.map((sub: any) => (
                                            <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl border bg-gray-50/50 dark:bg-gray-900/30 flex-wrap gap-2">
                                                <div>
                                                    <p className="font-semibold text-sm">{sub.student?.user?.name}</p>
                                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Roll No: {sub.student?.rollNo}</p>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {sub.isFlagged ? (
                                                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">Flagged: &quot;{sub.remarks}&quot;</Badge>
                                                    ) : sub.status === 'RESUBMITTED' ? (
                                                        <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">Resubmitted</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Submitted</Badge>
                                                    )}

                                                    <Button variant="outline" size="sm" asChild>
                                                        <a href={sub.fileUrl} target="_blank" rel="noreferrer">
                                                            <Download className="w-3.5 h-3.5 mr-1" /> View PDF
                                                        </a>
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setFlagSubmissionId(sub.id);
                                                            setFlagRemarks(sub.remarks || '');
                                                        }}
                                                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                    >
                                                        <Flag className="w-4 h-4 mr-1" /> Flag for Resubmission
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}

                                        {(!assignment.submissions || assignment.submissions.length === 0) && (
                                            <p className="text-xs text-gray-400 py-2 italic">No student submissions received yet.</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {assignments.length === 0 && !showCreate && (
                        <Card>
                            <CardContent className="py-12 text-center text-[hsl(var(--muted-foreground))]">
                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                No assignments created for this course offering yet.
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Flag Modal */}
            {flagSubmissionId && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border space-y-4">
                        <h3 className="text-xl font-bold">Flag Submission for Resubmission</h3>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            Enter remarks explaining why the student needs to re-submit their assignment in PDF format.
                        </p>
                        <textarea
                            value={flagRemarks}
                            onChange={(e) => setFlagRemarks(e.target.value)}
                            placeholder="e.g. Solution for Problem 3 is incomplete. Please re-check and resubmit in PDF."
                            className="w-full h-24 rounded-xl border p-3 text-sm bg-transparent"
                        />
                        <div className="flex gap-2">
                            <Button onClick={handleFlagSubmission} disabled={flagging} variant="gradient" className="flex-1">
                                {flagging ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Resubmission Request'}
                            </Button>
                            <Button onClick={() => setFlagSubmissionId(null)} variant="outline">Cancel</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
