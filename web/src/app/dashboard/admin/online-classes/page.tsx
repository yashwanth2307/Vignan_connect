'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Video, Plus, Loader2, X, Clock, Calendar, Monitor, PhoneOff } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

const PLATFORMS = ['In-App', 'Google Meet', 'Zoom', 'Microsoft Teams', 'Other'];

function getStatusColor(status: string) {
    switch (status) {
        case 'LIVE': return 'bg-green-500/10 text-green-600 border-green-200';
        case 'SCHEDULED': return 'bg-blue-500/10 text-blue-600 border-blue-200';
        case 'COMPLETED': return 'bg-gray-500/10 text-gray-500 border-gray-200';
        case 'CANCELLED': return 'bg-red-500/10 text-red-500 border-red-200';
        default: return 'bg-gray-500/10 text-gray-500 border-gray-200';
    }
}

function getPlatformGradient(platform: string) {
    switch (platform) {
        case 'In-App': return 'from-indigo-500 to-violet-600';
        case 'Google Meet': return 'from-green-500 to-emerald-600';
        case 'Zoom': return 'from-blue-500 to-blue-700';
        case 'Microsoft Teams': return 'from-purple-500 to-indigo-600';
        default: return 'from-gray-500 to-gray-700';
    }
}

export default function OnlineClassesPage() {
    const { user } = useAuth();
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [activeRoom, setActiveRoom] = useState<string | null>(null);
    const [activeClassTitle, setActiveClassTitle] = useState('');

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [meetingLink, setMeetingLink] = useState('');
    const [platform, setPlatform] = useState('In-App');
    const [scheduledAt, setScheduledAt] = useState('');
    const [durationMinutes, setDurationMinutes] = useState('60');

    const canCreate = user && ['ADMIN', 'FACULTY', 'HOD'].includes(user.role);

    const load = async () => {
        try {
            const data = await api.get<any[]>('/online-classes');
            setClasses(data);
        } catch { /* ignore */ }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await api.post('/online-classes', {
                title,
                description: description || undefined,
                meetingLink: platform === 'In-App' ? undefined : meetingLink,
                platform,
                scheduledAt: new Date(scheduledAt).toISOString(),
                durationMinutes: parseInt(durationMinutes) || 60,
            });
            setShowForm(false);
            setTitle(''); setDescription(''); setMeetingLink('');
            setPlatform('In-App');
            setScheduledAt(''); setDurationMinutes('60');
            await load();
        } catch (err: any) { setError(err.message); }
        setSaving(false);
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            await api.put(`/online-classes/${id}`, { status });
            await load();
        } catch { /* ignore */ }
    };

    const joinInApp = (cls: any) => {
        const room = cls.roomName || `vconnect-class-${cls.id.slice(0, 8)}`;
        setActiveRoom(room);
        setActiveClassTitle(cls.title);
    };

    const leaveRoom = () => {
        setActiveRoom(null);
        setActiveClassTitle('');
    };

    // In-app video room view
    if (activeRoom) {
        const jitsiDomain = 'meet.jit.si';
        const jitsiUrl = `https://${jitsiDomain}/${activeRoom}#config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.prejoinPageEnabled=false&config.disableDeepLinking=true&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false`;

        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">{activeClassTitle}</h2>
                        <p className="text-[hsl(var(--muted-foreground))]">Live In-App Class</p>
                    </div>
                    <Button onClick={leaveRoom} variant="destructive" size="lg">
                        <PhoneOff className="w-4 h-4 mr-2" /> Leave Class
                    </Button>
                </div>
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl overflow-hidden shadow-lg border border-[hsl(var(--border))]">
                    <iframe
                        src={jitsiUrl}
                        style={{ width: '100%', height: 'calc(100vh - 200px)', minHeight: '500px', border: 0 }}
                        allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                        allowFullScreen
                    />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Online Classes</h2>
                    <p className="text-[hsl(var(--muted-foreground))]">Schedule and join virtual classes in-app</p>
                </div>
                {canCreate && (
                    <Button onClick={() => setShowForm(true)} variant="gradient">
                        <Plus className="w-4 h-4" /> Schedule Class
                    </Button>
                )}
            </div>

            {showForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle>Schedule Online Class</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {error && <div className="text-red-500 text-sm mb-3 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl">{error}</div>}
                            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label>Title *</Label>
                                    <Input placeholder="Data Structures - Linked Lists" value={title} onChange={e => setTitle(e.target.value)} required />
                                </div>
                                <div className="space-y-1">
                                    <Label>Platform</Label>
                                    <select
                                        className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
                                        value={platform}
                                        onChange={e => setPlatform(e.target.value)}
                                    >
                                        {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                {platform !== 'In-App' && (
                                    <div className="space-y-1">
                                        <Label>Meeting Link *</Label>
                                        <Input placeholder="https://meet.google.com/..." value={meetingLink} onChange={e => setMeetingLink(e.target.value)} required={platform !== 'In-App'} />
                                    </div>
                                )}
                                {platform === 'In-App' && (
                                    <div className="space-y-1">
                                        <Label>Platform</Label>
                                        <div className="h-10 flex items-center px-3 rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/20 text-sm text-green-700 dark:text-green-400">
                                            ✅ Video will happen inside V-Connect
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <Label>Scheduled Date & Time *</Label>
                                    <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} required />
                                </div>
                                <div className="space-y-1">
                                    <Label>Duration (minutes)</Label>
                                    <Input type="number" min="5" value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} />
                                </div>
                                <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                                    <Label>Description</Label>
                                    <Input placeholder="Optional description..." value={description} onChange={e => setDescription(e.target.value)} />
                                </div>
                                <div className="flex items-end">
                                    <Button type="submit" disabled={saving} className="w-full">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Schedule'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : classes.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Video className="w-12 h-12 mx-auto mb-4 text-[hsl(var(--muted-foreground))]" />
                        <h3 className="text-lg font-semibold mb-2">No Online Classes</h3>
                        <p className="text-[hsl(var(--muted-foreground))]">No online classes have been scheduled yet.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map((cls, i) => {
                        const scheduledDate = new Date(cls.scheduledAt);
                        const endTime = new Date(scheduledDate.getTime() + cls.durationMinutes * 60000);
                        const isNow = new Date() >= scheduledDate && new Date() <= endTime && cls.status !== 'CANCELLED' && cls.status !== 'COMPLETED';
                        const isInApp = cls.platform === 'In-App';

                        return (
                            <motion.div key={cls.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                <Card className="hover:shadow-soft-lg transition-all relative overflow-hidden">
                                    {(isNow || cls.status === 'LIVE') && (
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse" />
                                    )}
                                    <CardContent className="p-5">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getPlatformGradient(cls.platform)} flex items-center justify-center shrink-0`}>
                                                <Video className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm truncate">{cls.title}</p>
                                                <p className="text-xs text-[hsl(var(--muted-foreground))]">{cls.createdBy?.name || 'Unknown'}</p>
                                            </div>
                                            <Badge className={`text-[10px] shrink-0 ${getStatusColor(cls.status)}`}>
                                                {cls.status}
                                            </Badge>
                                        </div>

                                        {cls.description && (
                                            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3 line-clamp-2">{cls.description}</p>
                                        )}

                                        <div className="space-y-1.5 text-xs mb-3">
                                            <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>{cls.durationMinutes} minutes</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
                                                <Monitor className="w-3.5 h-3.5" />
                                                <span>{cls.platform}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {cls.courseOffering?.subject?.code && <Badge variant="outline" className="text-[10px]">{cls.courseOffering.subject.code}</Badge>}
                                            {cls.courseOffering?.section?.name && <Badge variant="secondary" className="text-[10px]">{cls.courseOffering.section.name}</Badge>}
                                            {isInApp && <Badge className="text-[10px] bg-indigo-100 text-indigo-700 border-indigo-200">In-App Video</Badge>}
                                        </div>

                                        <div className="flex gap-2">
                                            {(cls.status === 'SCHEDULED' || cls.status === 'LIVE' || isNow) && (
                                                isInApp ? (
                                                    <Button
                                                        variant="gradient"
                                                        className="flex-1 text-xs h-8"
                                                        size="sm"
                                                        onClick={() => joinInApp(cls)}
                                                    >
                                                        <Video className="w-3 h-3 mr-1" /> Join In-App
                                                    </Button>
                                                ) : (
                                                    <a href={cls.meetingLink} target="_blank" rel="noopener noreferrer" className="flex-1">
                                                        <Button variant="gradient" className="w-full text-xs h-8" size="sm">
                                                            <Monitor className="w-3 h-3 mr-1" /> Join External
                                                        </Button>
                                                    </a>
                                                )
                                            )}
                                            {canCreate && cls.status === 'SCHEDULED' && (
                                                <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => updateStatus(cls.id, 'LIVE')}>
                                                    Go Live
                                                </Button>
                                            )}
                                            {canCreate && cls.status === 'LIVE' && (
                                                <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => updateStatus(cls.id, 'COMPLETED')}>
                                                    End
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
