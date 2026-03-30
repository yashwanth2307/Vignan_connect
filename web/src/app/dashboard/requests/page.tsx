'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Send, Inbox, Loader2, X, Plus, CheckCircle2, XCircle, Clock,
    FileText, AlertCircle, CalendarDays, Users, MessageSquare, ClipboardCheck
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

type Tab = 'inbox' | 'sent' | 'new';
type RequestType = 'LEAVE' | 'ATTENDANCE_CORRECTION' | 'GENERAL';

export default function RequestsPage() {
    const { user } = useAuth();
    const [tab, setTab] = useState<Tab>('inbox');
    const [inbox, setInbox] = useState<any[]>([]);
    const [sent, setSent] = useState<any[]>([]);
    const [recipients, setRecipients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // New request form
    const [requestType, setRequestType] = useState<RequestType>('GENERAL');
    const [form, setForm] = useState<any>({
        subject: '', message: '', toUserId: '',
        leaveFrom: '', leaveTo: '', leaveType: 'SICK',
        rollNumbers: '', correctionDate: '', periodNumbers: '', newStatus: 'PRESENT',
    });

    useEffect(() => { loadData(); }, [tab]);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            if (tab === 'inbox') {
                const data = await api.get<any[]>('/requests/inbox');
                setInbox(data);
            } else if (tab === 'sent') {
                const data = await api.get<any[]>('/requests/sent');
                setSent(data);
            } else if (tab === 'new') {
                const data = await api.get<any[]>('/requests/recipients');
                setRecipients(data);
            }
        } catch (err: any) { setError(err.message); }
        setLoading(false);
    };

    const submitRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true); setError('');
        try {
            await api.post('/requests', { ...form, type: requestType });
            setTab('sent');
            setForm({ subject: '', message: '', toUserId: '', leaveFrom: '', leaveTo: '', leaveType: 'SICK', rollNumbers: '', correctionDate: '', periodNumbers: '', newStatus: 'PRESENT' });
        } catch (err: any) { setError(err.message); }
        setSaving(false);
    };

    const respondToRequest = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        const remarks = prompt(`Enter remarks for ${status.toLowerCase()}:`);
        if (remarks === null) return;
        try {
            await api.patch(`/requests/${id}/respond`, { status, adminRemarks: remarks });
            loadData();
        } catch (err: any) { alert(err.message); }
    };

    const statusColor = (s: string) => {
        switch (s) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'APPROVED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'REJECTED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return '';
        }
    };

    const typeIcon = (t: string) => {
        switch (t) {
            case 'LEAVE': return <CalendarDays className="w-4 h-4 text-blue-500" />;
            case 'ATTENDANCE_CORRECTION': return <ClipboardCheck className="w-4 h-4 text-orange-500" />;
            default: return <MessageSquare className="w-4 h-4 text-violet-500" />;
        }
    };

    const tabs = [
        { id: 'inbox' as Tab, label: 'Inbox', icon: Inbox, count: inbox.filter(r => r.status === 'PENDING').length },
        { id: 'sent' as Tab, label: 'Sent', icon: Send },
        { id: 'new' as Tab, label: 'New Request', icon: Plus },
    ];

    const isApprover = user?.role === 'ADMIN' || user?.role === 'HOD' || user?.role === 'FACULTY';

    const renderRequestCard = (r: any, isInbox: boolean) => (
        <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="hover:shadow-soft transition-all">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            {typeIcon(r.type)}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <p className="font-semibold text-sm">{r.subject}</p>
                                    <Badge variant="outline" className="text-[10px]">{r.type.replace('_', ' ')}</Badge>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor(r.status)}`}>{r.status}</span>
                                </div>
                                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2 line-clamp-2">{r.message}</p>
                                <div className="flex items-center gap-3 text-[10px] text-[hsl(var(--muted-foreground))]">
                                    <span>From: <b>{r.fromUser?.name}</b> ({r.fromUser?.role})</span>
                                    <span>To: <b>{r.toUser?.name}</b> ({r.toUser?.role})</span>
                                    <span>{new Date(r.createdAt).toLocaleString()}</span>
                                </div>

                                {/* Leave details */}
                                {r.type === 'LEAVE' && r.leaveFrom && (
                                    <div className="mt-2 flex items-center gap-3 text-xs bg-blue-50 dark:bg-blue-950/20 p-2 rounded-lg">
                                        <CalendarDays className="w-3 h-3 text-blue-500" />
                                        <span>Leave: {new Date(r.leaveFrom).toLocaleDateString()} – {new Date(r.leaveTo).toLocaleDateString()}</span>
                                        <Badge variant="outline" className="text-[10px]">{r.leaveType}</Badge>
                                    </div>
                                )}

                                {/* Attendance correction details */}
                                {r.type === 'ATTENDANCE_CORRECTION' && (
                                    <div className="mt-2 text-xs bg-orange-50 dark:bg-orange-950/20 p-2 rounded-lg space-y-1">
                                        <p><b>Roll Numbers:</b> {r.rollNumbers}</p>
                                        {r.correctionDate && <p><b>Date:</b> {new Date(r.correctionDate).toLocaleDateString()}</p>}
                                        {r.periodNumbers && <p><b>Periods:</b> {r.periodNumbers}</p>}
                                        {r.newStatus && <p><b>Change to:</b> {r.newStatus}</p>}
                                    </div>
                                )}

                                {/* Admin remarks */}
                                {r.adminRemarks && (
                                    <div className="mt-2 text-xs bg-[hsl(var(--muted)/0.3)] p-2 rounded-lg">
                                        <b>Remarks:</b> {r.adminRemarks}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action buttons for inbox */}
                        {isInbox && r.status === 'PENDING' && isApprover && (
                            <div className="flex items-center gap-2 shrink-0">
                                <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50" onClick={() => respondToRequest(r.id, 'APPROVED')}>
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                                </Button>
                                <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => respondToRequest(r.id, 'REJECTED')}>
                                    <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Service Requests
                </h2>
                <p className="text-[hsl(var(--muted-foreground))]">Leave requests, attendance corrections, and general communications</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[hsl(var(--muted)/0.3)] p-1 rounded-xl overflow-x-auto">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tab === t.id
                            ? 'bg-[hsl(var(--background))] shadow-sm text-[hsl(var(--foreground))]'
                            : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                            }`}
                    >
                        <t.icon className="w-4 h-4" />
                        {t.label}
                        {t.id === 'inbox' && (t as any).count > 0 && (
                            <span className="bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">{(t as any).count}</span>
                        )}
                    </button>
                ))}
            </div>

            {error && <div className="text-red-500 text-sm bg-red-50 dark:bg-red-950/30 p-3 rounded-xl">{error}</div>}
            {loading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>}

            {/* ═══ INBOX ═══ */}
            {!loading && tab === 'inbox' && (
                <div className="space-y-3">
                    {inbox.length === 0 && (
                        <div className="text-center py-16">
                            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">No requests in your inbox</p>
                        </div>
                    )}
                    {inbox.map(r => renderRequestCard(r, true))}
                </div>
            )}

            {/* ═══ SENT ═══ */}
            {!loading && tab === 'sent' && (
                <div className="space-y-3">
                    {sent.length === 0 && (
                        <div className="text-center py-16">
                            <Send className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">No requests sent yet</p>
                        </div>
                    )}
                    {sent.map(r => renderRequestCard(r, false))}
                </div>
            )}

            {/* ═══ NEW REQUEST ═══ */}
            {!loading && tab === 'new' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5" /> Create New Request</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submitRequest} className="space-y-5">
                                {/* Request Type */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Request Type</Label>
                                    <div className="flex gap-2 flex-wrap">
                                        {[
                                            { id: 'GENERAL' as RequestType, label: 'General Request', icon: MessageSquare, color: 'from-violet-500 to-purple-600' },
                                            { id: 'LEAVE' as RequestType, label: 'Leave Request', icon: CalendarDays, color: 'from-blue-500 to-cyan-600' },
                                            ...(user?.role === 'FACULTY' || user?.role === 'HOD' ? [{ id: 'ATTENDANCE_CORRECTION' as RequestType, label: 'Attendance Correction', icon: ClipboardCheck, color: 'from-orange-500 to-red-600' }] : []),
                                        ].map(t => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setRequestType(t.id)}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${requestType === t.id
                                                    ? `bg-gradient-to-r ${t.color} text-white border-transparent shadow-md`
                                                    : 'border-[hsl(var(--border))] hover:border-[hsl(var(--foreground)/0.3)]'
                                                    }`}
                                            >
                                                <t.icon className="w-4 h-4" />
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* To (recipient) */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label>Send To *</Label>
                                        <select
                                            value={form.toUserId}
                                            onChange={e => setForm({ ...form, toUserId: e.target.value })}
                                            required
                                            className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm"
                                        >
                                            <option value="">Select Recipient</option>
                                            {recipients.map(r => (
                                                <option key={r.id} value={r.id}>{r.name} ({r.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Subject *</Label>
                                        <Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required placeholder="Brief subject line" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label>Message *</Label>
                                    <textarea
                                        value={form.message}
                                        onChange={e => setForm({ ...form, message: e.target.value })}
                                        required
                                        rows={4}
                                        placeholder="Describe your request in detail..."
                                        className="flex w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm"
                                    />
                                </div>

                                {/* Leave-specific fields */}
                                {requestType === 'LEAVE' && (
                                    <div className="grid sm:grid-cols-3 gap-4 bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200/50 dark:border-blue-800/30">
                                        <div className="sm:col-span-3">
                                            <h4 className="text-xs font-bold tracking-wider text-blue-600 dark:text-blue-400 mb-2 uppercase flex items-center gap-1">
                                                <CalendarDays className="w-3 h-3" /> Leave Details
                                            </h4>
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Leave Type</Label>
                                            <select value={form.leaveType} onChange={e => setForm({ ...form, leaveType: e.target.value })} className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                                <option value="SICK">Sick Leave</option>
                                                <option value="PERSONAL">Personal Leave</option>
                                                <option value="OD">On Duty (OD)</option>
                                                <option value="OTHER">Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label>From Date</Label>
                                            <Input type="date" value={form.leaveFrom} onChange={e => setForm({ ...form, leaveFrom: e.target.value })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>To Date</Label>
                                            <Input type="date" value={form.leaveTo} onChange={e => setForm({ ...form, leaveTo: e.target.value })} />
                                        </div>
                                    </div>
                                )}

                                {/* Attendance correction fields */}
                                {requestType === 'ATTENDANCE_CORRECTION' && (
                                    <div className="grid sm:grid-cols-2 gap-4 bg-orange-50/50 dark:bg-orange-950/20 p-4 rounded-xl border border-orange-200/50 dark:border-orange-800/30">
                                        <div className="sm:col-span-2">
                                            <h4 className="text-xs font-bold tracking-wider text-orange-600 dark:text-orange-400 mb-2 uppercase flex items-center gap-1">
                                                <ClipboardCheck className="w-3 h-3" /> Attendance Correction Details
                                            </h4>
                                        </div>
                                        <div className="space-y-1 sm:col-span-2">
                                            <Label>Roll Numbers (comma-separated) *</Label>
                                            <Input value={form.rollNumbers} onChange={e => setForm({ ...form, rollNumbers: e.target.value })} placeholder="22CSE001, 22CSE015, 22CSE032" required />
                                            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">List the roll numbers of students whose attendance needs correction</p>
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Date of Correction</Label>
                                            <Input type="date" value={form.correctionDate} onChange={e => setForm({ ...form, correctionDate: e.target.value })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Period Numbers</Label>
                                            <Input value={form.periodNumbers} onChange={e => setForm({ ...form, periodNumbers: e.target.value })} placeholder="1, 2, 3" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Change Status To</Label>
                                            <select value={form.newStatus} onChange={e => setForm({ ...form, newStatus: e.target.value })} className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-transparent px-4 py-2 text-sm">
                                                <option value="PRESENT">Present</option>
                                                <option value="ABSENT">Absent</option>
                                                <option value="OD">On Duty (OD)</option>
                                                <option value="ML">Medical Leave (ML)</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-2 border-t">
                                    <Button type="button" variant="outline" onClick={() => setTab('inbox')}>Cancel</Button>
                                    <Button type="submit" variant="gradient" disabled={saving}>
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-1" /> Submit Request</>}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    );
}
