'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Plus, MessageCircle, FileText, ChevronRight, Send,
    ClipboardCheck, Shield, Award, AlertTriangle, CheckCircle,
    XCircle, Clock, Loader2, Search, UserPlus, Trash2, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import api from '@/lib/api';

// ───────── Types ─────────

interface Group {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    courseOffering?: { subject: { title: string }; section?: { name: string } };
    faculty?: { user: { name: string } };
    _count: { members: number; messages: number; assignments: number };
    members?: any[];
    createdAt: string;
}

interface GroupMessage {
    id: string;
    content: string;
    sender: { id: string; name: string; role: string };
    createdAt: string;
}

interface GroupAssignment {
    id: string;
    title: string;
    description: string;
    dueAt: string;
    maxPoints: number;
    _count: { submissions: number };
    submissions?: any[];
    group?: any;
}

// ───────── Main Page ─────────

export default function GroupsPage() {
    const { user } = useAuth();
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [activeTab, setActiveTab] = useState<'chat' | 'assignments' | 'members'>('chat');
    const [loading, setLoading] = useState(true);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showCreateAssignment, setShowCreateAssignment] = useState(false);

    const isStudent = user?.role === 'STUDENT';

    const loadGroups = useCallback(async () => {
        try {
            const data = await api.get<Group[]>('/groups/my');
            setGroups(data);
        } catch { /* silent */ }
        setLoading(false);
    }, []);

    useEffect(() => { loadGroups(); }, [loadGroups]);

    const selectGroup = async (group: Group) => {
        try {
            const detail = await api.get<Group>(`/groups/${group.id}`);
            setSelectedGroup(detail);
            setActiveTab('chat');
        } catch { /* silent */ }
    };

    if (loading) return <LoadingState />;

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
            {/* Left Sidebar — Group List */}
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={`${selectedGroup ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))]`}
            >
                <div className="p-4 border-b border-[hsl(var(--border))]">
                    <div className="flex items-center justify-between mb-3">
                        <h1 className="text-lg font-bold flex items-center gap-2">
                            <Users className="w-5 h-5 text-[hsl(var(--primary))]" />
                            My Groups
                        </h1>
                        {!isStudent && (
                            <Button size="sm" onClick={() => setShowCreateGroup(true)}>
                                <Plus className="w-4 h-4 mr-1" /> New
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {groups.length === 0 ? (
                        <div className="p-8 text-center text-[hsl(var(--muted-foreground))]">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">{isStudent ? 'No groups yet' : 'Create your first group'}</p>
                        </div>
                    ) : (
                        groups.map(group => (
                            <motion.div
                                key={group.id}
                                whileHover={{ backgroundColor: 'hsl(var(--accent))' }}
                                onClick={() => selectGroup(group)}
                                className={`p-4 border-b border-[hsl(var(--border))] cursor-pointer transition-colors ${selectedGroup?.id === group.id ? 'bg-[hsl(var(--accent))]' : ''
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-sm truncate">{group.name}</h3>
                                        {group.courseOffering && (
                                            <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{group.courseOffering.subject.title}</p>
                                        )}
                                        <div className="flex gap-3 mt-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{group._count.members}</span>
                                            <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{group._count.messages}</span>
                                            <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{group._count.assignments}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))] mt-1 flex-shrink-0" />
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </motion.div>

            {/* Right Content — Chat / Assignments / Members */}
            {selectedGroup ? (
                <div className="flex-1 flex flex-col">
                    {/* Group Header with Tabs */}
                    <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                        <div className="p-4 flex items-center gap-3">
                            <button onClick={() => setSelectedGroup(null)} className="md:hidden text-[hsl(var(--muted-foreground))]">←</button>
                            <div className="flex-1">
                                <h2 className="font-bold">{selectedGroup.name}</h2>
                                <p className="text-xs text-[hsl(var(--muted-foreground))]">{selectedGroup._count.members} members</p>
                            </div>
                        </div>
                        <div className="flex border-t border-[hsl(var(--border))]">
                            {(['chat', 'assignments', 'members'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-2.5 text-sm font-medium capitalize transition-colors relative ${activeTab === tab
                                        ? 'text-[hsl(var(--primary))]'
                                        : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                                        }`}
                                >
                                    {tab}
                                    {activeTab === tab && (
                                        <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[hsl(var(--primary))]" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-hidden">
                        {activeTab === 'chat' && <ChatTab groupId={selectedGroup.id} />}
                        {activeTab === 'assignments' && (
                            <AssignmentsTab
                                groupId={selectedGroup.id}
                                isStudent={isStudent}
                                showCreate={showCreateAssignment}
                                setShowCreate={setShowCreateAssignment}
                            />
                        )}
                        {activeTab === 'members' && (
                            <MembersTab group={selectedGroup} isStudent={isStudent} onRefresh={() => selectGroup(selectedGroup)} />
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 hidden md:flex items-center justify-center bg-[hsl(var(--background))]">
                    <div className="text-center text-[hsl(var(--muted-foreground))]">
                        <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">Select a group to start</p>
                        <p className="text-sm mt-1">Choose a group from the sidebar</p>
                    </div>
                </div>
            )}

            {/* Create Group Modal */}
            <AnimatePresence>
                {showCreateGroup && (
                    <CreateGroupModal
                        onClose={() => setShowCreateGroup(false)}
                        onCreated={() => { setShowCreateGroup(false); loadGroups(); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ───────── Chat Tab ─────────

function ChatTab({ groupId }: { groupId: string }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<GroupMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await api.get<GroupMessage[]>(`/groups/${groupId}/messages`);
                setMessages(data.reverse());
            } catch { /* silent */ }
            setLoading(false);
        })();
    }, [groupId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!newMessage.trim() || sending) return;
        setSending(true);
        try {
            const msg = await api.post<GroupMessage>(`/groups/${groupId}/messages`, { content: newMessage.trim() });
            setMessages(prev => [...prev, msg]);
            setNewMessage('');
        } catch { /* silent */ }
        setSending(false);
    };

    if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                    <div className="text-center text-[hsl(var(--muted-foreground))] py-12">
                        <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No messages yet. Start the conversation!</p>
                    </div>
                )}
                {messages.map(msg => {
                    const isMe = msg.sender.id === user?.id;
                    return (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe
                                ? 'bg-[hsl(var(--primary))] text-white rounded-br-md'
                                : 'bg-[hsl(var(--accent))] rounded-bl-md'
                                }`}>
                                {!isMe && (
                                    <p className="text-xs font-semibold mb-0.5 opacity-70">
                                        {msg.sender.name}
                                        {msg.sender.role !== 'STUDENT' && (
                                            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-white/20">Faculty</span>
                                        )}
                                    </p>
                                )}
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-[hsl(var(--muted-foreground))]'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Message Input */}
            <div className="p-3 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                <form
                    onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                    className="flex gap-2"
                >
                    <Input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </form>
            </div>
        </div>
    );
}

// ───────── Assignments Tab ─────────

function AssignmentsTab({ groupId, isStudent, showCreate, setShowCreate }: {
    groupId: string;
    isStudent: boolean;
    showCreate: boolean;
    setShowCreate: (v: boolean) => void;
}) {
    const [assignments, setAssignments] = useState<GroupAssignment[]>([]);
    const [selectedAssignment, setSelectedAssignment] = useState<GroupAssignment | null>(null);
    const [loading, setLoading] = useState(true);

    const loadAssignments = useCallback(async () => {
        try {
            const data = await api.get<GroupAssignment[]>(`/groups/${groupId}/assignments`);
            setAssignments(data);
        } catch { /* silent */ }
        setLoading(false);
    }, [groupId]);

    useEffect(() => { loadAssignments(); }, [loadAssignments]);

    if (selectedAssignment) {
        return (
            <AssignmentDetailView
                assignment={selectedAssignment}
                isStudent={isStudent}
                onBack={() => { setSelectedAssignment(null); loadAssignments(); }}
            />
        );
    }

    if (loading) return <div className="flex-1 flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

    return (
        <div className="overflow-y-auto h-full">
            {!isStudent && (
                <div className="p-4 border-b border-[hsl(var(--border))]">
                    <Button onClick={() => setShowCreate(true)} className="w-full" variant="outline">
                        <Plus className="w-4 h-4 mr-2" /> Create Assignment
                    </Button>
                </div>
            )}

            {assignments.length === 0 ? (
                <div className="p-8 text-center text-[hsl(var(--muted-foreground))]">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No assignments yet</p>
                </div>
            ) : (
                <div className="p-4 space-y-3">
                    {assignments.map(a => {
                        const isPastDue = new Date(a.dueAt) < new Date();
                        return (
                            <motion.div
                                key={a.id}
                                whileHover={{ scale: 1.01 }}
                                onClick={async () => {
                                    try {
                                        const detail = await api.get<GroupAssignment>(`/groups/assignments/${a.id}`);
                                        setSelectedAssignment(detail);
                                    } catch { /* silent */ }
                                }}
                                className="cursor-pointer"
                            >
                                <Card className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-sm">{a.title}</h3>
                                                <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 mt-1">{a.description}</p>
                                            </div>
                                            <div className="flex items-center gap-1 ml-3">
                                                <Award className="w-3.5 h-3.5 text-amber-500" />
                                                <span className="text-xs font-semibold text-amber-600">{a.maxPoints} pts</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 mt-3 text-xs text-[hsl(var(--muted-foreground))]">
                                            <span className={`flex items-center gap-1 ${isPastDue ? 'text-red-500' : 'text-green-600'}`}>
                                                <Clock className="w-3 h-3" />
                                                {isPastDue ? 'Past due' : `Due ${new Date(a.dueAt).toLocaleDateString()}`}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <ClipboardCheck className="w-3 h-3" />
                                                {a._count.submissions} submitted
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Create Assignment Modal */}
            <AnimatePresence>
                {showCreate && (
                    <CreateAssignmentModal
                        groupId={groupId}
                        onClose={() => setShowCreate(false)}
                        onCreated={() => { setShowCreate(false); loadAssignments(); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ───────── Assignment Detail View ─────────

function AssignmentDetailView({ assignment, isStudent, onBack }: {
    assignment: GroupAssignment;
    isStudent: boolean;
    onBack: () => void;
}) {
    const [submissionContent, setSubmissionContent] = useState('');
    const [mySubmission, setMySubmission] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);
    const [plagiarismLoading, setPlagiarismLoading] = useState(false);
    const [plagiarismResult, setPlagiarismResult] = useState<any>(null);
    const [reviewingId, setReviewingId] = useState<string | null>(null);
    const [reviewRemarks, setReviewRemarks] = useState('');
    const [reviewPoints, setReviewPoints] = useState('');

    useEffect(() => {
        if (isStudent) {
            api.get(`/groups/assignments/${assignment.id}/my-submission`).then(setMySubmission).catch(() => { });
        }
    }, [assignment.id, isStudent]);

    const handleSubmit = async () => {
        if (!submissionContent.trim()) return;
        setSubmitting(true);
        try {
            const sub = await api.post(`/groups/assignments/${assignment.id}/submit`, { content: submissionContent });
            setMySubmission(sub);
        } catch { /* silent */ }
        setSubmitting(false);
    };

    const runPlagiarismCheck = async () => {
        setPlagiarismLoading(true);
        try {
            const result = await api.post(`/groups/assignments/${assignment.id}/plagiarism-check`);
            setPlagiarismResult(result);
        } catch { /* silent */ }
        setPlagiarismLoading(false);
    };

    const reviewSubmission = async (submissionId: string, status: 'VERIFIED' | 'FLAGGED') => {
        try {
            await api.post(`/groups/submissions/${submissionId}/review`, {
                status,
                vPointsAwarded: reviewPoints ? parseInt(reviewPoints) : undefined,
                facultyRemarks: reviewRemarks || undefined,
            });
            // Refresh
            const detail = await api.get<GroupAssignment>(`/groups/assignments/${assignment.id}`);
            Object.assign(assignment, detail);
            setReviewingId(null);
            setReviewRemarks('');
            setReviewPoints('');
            onBack();
        } catch { /* silent */ }
    };

    const isPastDue = new Date(assignment.dueAt) < new Date();

    return (
        <div className="overflow-y-auto h-full p-4 space-y-4">
            <button onClick={onBack} className="text-sm text-[hsl(var(--primary))] hover:underline flex items-center gap-1">
                ← Back to assignments
            </button>

            {/* Assignment Info */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-lg">{assignment.title}</CardTitle>
                            <CardDescription className="mt-1">{assignment.description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-lg">
                            <Award className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-bold text-amber-600">{assignment.maxPoints} V-Points</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 text-sm">
                        <span className={`flex items-center gap-1 ${isPastDue ? 'text-red-500' : 'text-green-600'}`}>
                            <Clock className="w-4 h-4" />
                            Due: {new Date(assignment.dueAt).toLocaleString()}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Student: Submit Assignment */}
            {isStudent && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            {mySubmission ? 'Your Submission' : 'Submit Assignment'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {mySubmission ? (
                            <div className="space-y-3">
                                <div className="p-3 rounded-lg bg-[hsl(var(--accent))]">
                                    <p className="text-sm whitespace-pre-wrap">{mySubmission.content}</p>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <StatusBadge status={mySubmission.status} />
                                    {mySubmission.similarityScore != null && (
                                        <span className={`flex items-center gap-1 ${mySubmission.similarityScore >= 70 ? 'text-red-500' : mySubmission.similarityScore >= 40 ? 'text-amber-500' : 'text-green-500'}`}>
                                            <Shield className="w-3.5 h-3.5" />
                                            {mySubmission.similarityScore}% similarity
                                        </span>
                                    )}
                                    {mySubmission.vPointsAwarded > 0 && (
                                        <span className="flex items-center gap-1 text-amber-600">
                                            <Award className="w-3.5 h-3.5" />
                                            +{mySubmission.vPointsAwarded} V-Points
                                        </span>
                                    )}
                                </div>
                                {mySubmission.facultyRemarks && (
                                    <p className="text-sm text-[hsl(var(--muted-foreground))] italic">
                                        Faculty remarks: {mySubmission.facultyRemarks}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <textarea
                                    value={submissionContent}
                                    onChange={e => setSubmissionContent(e.target.value)}
                                    placeholder="Write your assignment here..."
                                    rows={8}
                                    disabled={isPastDue}
                                    className="w-full rounded-lg border border-[hsl(var(--border))] p-3 text-sm bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] resize-none"
                                />
                                <Button onClick={handleSubmit} disabled={!submissionContent.trim() || submitting || isPastDue} className="w-full">
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                    {isPastDue ? 'Past Due Date' : 'Submit Assignment'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Faculty: View Submissions & Plagiarism */}
            {!isStudent && (
                <>
                    {/* Plagiarism Check Button */}
                    <Card className="border-purple-200 dark:border-purple-800">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                        <Shield className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm">AI Plagiarism Detection</h3>
                                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                            Analyze all submissions for similarity
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={runPlagiarismCheck}
                                    disabled={plagiarismLoading}
                                    variant="outline"
                                    className="border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-300"
                                >
                                    {plagiarismLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                                    Run Check
                                </Button>
                            </div>

                            {/* Plagiarism Results */}
                            {plagiarismResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 space-y-2"
                                >
                                    <div className="flex gap-3 text-sm">
                                        <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                            {plagiarismResult.totalSubmissions} checked
                                        </span>
                                        <span className="px-2 py-1 rounded bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
                                            {plagiarismResult.flagged} flagged
                                        </span>
                                        <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300">
                                            {plagiarismResult.clean} clean
                                        </span>
                                    </div>
                                    <div className="space-y-1.5 mt-2">
                                        {plagiarismResult.results?.map((r: any) => (
                                            <div key={r.submissionId} className={`flex items-center justify-between p-2 rounded-lg text-sm ${r.status === 'FLAGGED'
                                                ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800'
                                                : 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
                                                }`}>
                                                <span className="font-medium">{r.studentName}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold ${r.similarityScore >= 70 ? 'text-red-600' : r.similarityScore >= 40 ? 'text-amber-600' : 'text-green-600'}`}>
                                                        {r.similarityScore}%
                                                    </span>
                                                    {r.status === 'FLAGGED' ? (
                                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                                    ) : (
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Submissions List */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Submissions ({assignment.submissions?.length || 0})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {assignment.submissions?.length === 0 && (
                                <p className="text-sm text-[hsl(var(--muted-foreground))]">No submissions yet</p>
                            )}
                            {assignment.submissions?.map((sub: any) => (
                                <div key={sub.id} className="border border-[hsl(var(--border))] rounded-lg p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-sm">{sub.student.user.name}</p>
                                            <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                                Submitted {new Date(sub.submittedAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={sub.status} />
                                            {sub.similarityScore != null && (
                                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${sub.similarityScore >= 70 ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' :
                                                    sub.similarityScore >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                                                        'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                                                    }`}>
                                                    {sub.similarityScore}%
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-2 rounded bg-[hsl(var(--accent))] text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                                        {sub.content}
                                    </div>

                                    {sub.vPointsAwarded > 0 && (
                                        <p className="text-xs text-amber-600 flex items-center gap-1">
                                            <Award className="w-3 h-3" /> +{sub.vPointsAwarded} V-Points awarded
                                        </p>
                                    )}

                                    {/* Review Actions */}
                                    {sub.status !== 'VERIFIED' && (
                                        <div>
                                            {reviewingId === sub.id ? (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-2 mt-2">
                                                    <Input
                                                        placeholder="Remarks (optional)"
                                                        value={reviewRemarks}
                                                        onChange={e => setReviewRemarks(e.target.value)}
                                                    />
                                                    <Input
                                                        placeholder={`V-Points (max ${assignment.maxPoints})`}
                                                        type="number"
                                                        value={reviewPoints}
                                                        onChange={e => setReviewPoints(e.target.value)}
                                                        max={assignment.maxPoints}
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => reviewSubmission(sub.id, 'VERIFIED')}>
                                                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Verify & Award
                                                        </Button>
                                                        <Button size="sm" variant="destructive" className="flex-1" onClick={() => reviewSubmission(sub.id, 'FLAGGED')}>
                                                            <XCircle className="w-3.5 h-3.5 mr-1" /> Flag
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={() => setReviewingId(null)}>Cancel</Button>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <Button size="sm" variant="outline" onClick={() => setReviewingId(sub.id)} className="mt-1">
                                                    <Eye className="w-3.5 h-3.5 mr-1" /> Review
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}

// ───────── Members Tab ─────────

function MembersTab({ group, isStudent, onRefresh }: { group: Group; isStudent: boolean; onRefresh: () => void }) {
    const [sections, setSections] = useState<any[]>([]);
    const [selectedSection, setSelectedSection] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        if (!isStudent) {
            api.get('/sections').then((data: any) => setSections(data)).catch(() => { });
        }
    }, [isStudent]);

    const addSection = async () => {
        if (!selectedSection) return;
        setAdding(true);
        try {
            await api.post(`/groups/${group.id}/members/section/${selectedSection}`);
            onRefresh();
        } catch { /* silent */ }
        setAdding(false);
    };

    const removeMember = async (studentId: string) => {
        try {
            await api.delete(`/groups/${group.id}/members/${studentId}`);
            onRefresh();
        } catch { /* silent */ }
    };

    return (
        <div className="overflow-y-auto h-full p-4 space-y-4">
            {/* Add Section (Faculty Only) */}
            {!isStudent && (
                <Card>
                    <CardContent className="p-4">
                        <Label className="text-sm font-medium mb-2 block">Add Entire Section</Label>
                        <div className="flex gap-2">
                            <select
                                value={selectedSection}
                                onChange={e => setSelectedSection(e.target.value)}
                                className="flex-1 rounded-md border border-[hsl(var(--border))] px-3 py-2 text-sm bg-[hsl(var(--background))]"
                            >
                                <option value="">Select section...</option>
                                {sections.map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.name} — {s.department?.name || ''}</option>
                                ))}
                            </select>
                            <Button onClick={addSection} disabled={!selectedSection || adding}>
                                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Members List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Members ({group.members?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {group.members?.map((m: any) => (
                        <div key={m.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                    {m.student.user.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{m.student.user.name}</p>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{m.student.user.email}</p>
                                </div>
                            </div>
                            {!isStudent && (
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => removeMember(m.student.id)}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            )}
                        </div>
                    ))}
                    {(!group.members || group.members.length === 0) && (
                        <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">No members yet</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ───────── Create Group Modal ─────────

function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) return;
        setLoading(true);
        try {
            await api.post('/groups', { name, description: description || undefined });
            onCreated();
        } catch { /* silent */ }
        setLoading(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-[hsl(var(--card))] rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
                <h2 className="text-lg font-bold mb-4">Create New Group</h2>
                <div className="space-y-4">
                    <div>
                        <Label>Group Name</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. CSE-A Data Structures" />
                    </div>
                    <div>
                        <Label>Description (optional)</Label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Brief description..."
                            rows={3}
                            className="w-full rounded-lg border border-[hsl(var(--border))] p-3 text-sm bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] resize-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleCreate} disabled={!name.trim() || loading} className="flex-1">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                            Create Group
                        </Button>
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ───────── Create Assignment Modal ─────────

function CreateAssignmentModal({ groupId, onClose, onCreated }: { groupId: string; onClose: () => void; onCreated: () => void }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueAt, setDueAt] = useState('');
    const [maxPoints, setMaxPoints] = useState('10');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!title.trim() || !description.trim() || !dueAt) return;
        setLoading(true);
        try {
            await api.post(`/groups/${groupId}/assignments`, {
                title,
                description,
                dueAt: new Date(dueAt).toISOString(),
                maxPoints: parseInt(maxPoints) || 10,
            });
            onCreated();
        } catch { /* silent */ }
        setLoading(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-[hsl(var(--card))] rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
                <h2 className="text-lg font-bold mb-4">Create Assignment</h2>
                <div className="space-y-4">
                    <div>
                        <Label>Title</Label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Binary Search Implementation" />
                    </div>
                    <div>
                        <Label>Description</Label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Assignment details and instructions..."
                            rows={4}
                            className="w-full rounded-lg border border-[hsl(var(--border))] p-3 text-sm bg-[hsl(var(--background))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] resize-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label>Due Date</Label>
                            <Input type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)} />
                        </div>
                        <div>
                            <Label>Max V-Points</Label>
                            <Input type="number" value={maxPoints} onChange={e => setMaxPoints(e.target.value)} min={1} />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleCreate} disabled={!title.trim() || !description.trim() || !dueAt || loading} className="flex-1">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                            Create
                        </Button>
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ───────── Status Badge ─────────

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
        SUBMITTED: { bg: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300', icon: <Clock className="w-3 h-3" /> },
        REVIEWED: { bg: 'bg-indigo-100 dark:bg-indigo-950', text: 'text-indigo-700 dark:text-indigo-300', icon: <Eye className="w-3 h-3" /> },
        FLAGGED: { bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-700 dark:text-red-300', icon: <AlertTriangle className="w-3 h-3" /> },
        VERIFIED: { bg: 'bg-green-100 dark:bg-green-950', text: 'text-green-700 dark:text-green-300', icon: <CheckCircle className="w-3 h-3" /> },
    };
    const c = config[status] || config.SUBMITTED;
    return (
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
            {c.icon}
            {status}
        </span>
    );
}

// ───────── Loading State ─────────

function LoadingState() {
    return (
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[hsl(var(--primary))]" />
                <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Loading groups...</p>
            </div>
        </div>
    );
}
