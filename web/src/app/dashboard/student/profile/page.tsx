'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Camera, Loader2, CheckCircle2, User, Upload } from 'lucide-react';
import api from '@/lib/api';

export default function StudentProfilePage() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [photoUrl, setPhotoUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [hallTickets, setHallTickets] = useState<any[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const p = await api.get<any>('/users/students/me');
                setProfile(p);
                if (p.photoUrl) setPhotoUrl(p.photoUrl);
            } catch {}
            try {
                const ht = await api.get<any[]>('/exam/hall-tickets/my');
                setHallTickets(ht);
            } catch {}
            setLoading(false);
        })();
    }, []);

    const handlePhotoSave = async () => {
        if (!photoUrl.trim()) return;
        setSaving(true);
        setSaved(false);
        try {
            await api.patch('/users/students/photo', { photoUrl });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e: any) { alert(e.message); }
        setSaving(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Convert to base64 data URL
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div>
                <h2 className="text-2xl font-bold">👤 My Profile</h2>
                <p className="text-[hsl(var(--muted-foreground))]">View your profile and upload passport photo</p>
            </div>

            {/* Photo Upload */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Camera className="w-5 h-5" /> Passport Photo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-6">
                        <div className="w-32 h-40 rounded-xl border-2 border-dashed border-[hsl(var(--border))] flex items-center justify-center overflow-hidden bg-[hsl(var(--muted))]">
                            {photoUrl ? (
                                <img src={photoUrl} alt="Passport Photo" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <User className="w-12 h-12 opacity-30" />
                            )}
                        </div>
                        <div className="space-y-3 flex-1">
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">Upload a recent passport-size photo. Accepted: JPG, PNG. Max 2MB.</p>
                            <div className="flex gap-2">
                                <label className="cursor-pointer">
                                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                    <div className="flex items-center gap-1 h-9 px-4 rounded-xl border border-[hsl(var(--input))] bg-transparent text-sm hover:bg-[hsl(var(--muted))] transition-colors">
                                        <Upload className="w-3 h-3" /> Choose File
                                    </div>
                                </label>
                            </div>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Or paste a direct image URL:</p>
                            <Input placeholder="https://..." value={photoUrl.startsWith('data:') ? '' : photoUrl} onChange={e => setPhotoUrl(e.target.value)} />
                            <div className="flex gap-2 items-center">
                                <Button onClick={handlePhotoSave} disabled={saving || !photoUrl}>
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Photo'}
                                </Button>
                                {saved && (
                                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-600 text-sm flex items-center gap-1">
                                        <CheckCircle2 className="w-4 h-4" /> Saved!
                                    </motion.span>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Profile Details */}
            {profile && (
                <Card>
                    <CardHeader>
                        <CardTitle>📋 Academic Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid sm:grid-cols-2 gap-4 text-sm">
                            <div><span className="text-[hsl(var(--muted-foreground))]">Name:</span> <strong>{profile.user?.name}</strong></div>
                            <div><span className="text-[hsl(var(--muted-foreground))]">Email:</span> <strong>{profile.user?.email}</strong></div>
                            <div><span className="text-[hsl(var(--muted-foreground))]">Roll No:</span> <strong className="font-mono">{profile.rollNo}</strong></div>
                            <div><span className="text-[hsl(var(--muted-foreground))]">Department:</span> <strong>{profile.department?.name}</strong></div>
                            <div><span className="text-[hsl(var(--muted-foreground))]">Section:</span> <strong>{profile.section?.name}</strong></div>
                            <div><span className="text-[hsl(var(--muted-foreground))]">Regulation:</span> <Badge variant="outline">{profile.regulation?.code}</Badge></div>
                            <div><span className="text-[hsl(var(--muted-foreground))]">Batch:</span> <strong>{profile.batchStartYear}–{profile.batchEndYear}</strong></div>
                            <div><span className="text-[hsl(var(--muted-foreground))]">Year / Semester:</span> <strong>Year {profile.currentYear} / Sem {profile.currentSemester}</strong></div>
                            {profile.gender && <div><span className="text-[hsl(var(--muted-foreground))]">Gender:</span> <strong>{profile.gender}</strong></div>}
                            {profile.fatherName && <div><span className="text-[hsl(var(--muted-foreground))]">Father:</span> <strong>{profile.fatherName}</strong></div>}
                            {profile.motherName && <div><span className="text-[hsl(var(--muted-foreground))]">Mother:</span> <strong>{profile.motherName}</strong></div>}
                            {profile.studentPhone && <div><span className="text-[hsl(var(--muted-foreground))]">Phone:</span> <strong>{profile.studentPhone}</strong></div>}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Hall Tickets */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">🎫 My Hall Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                    {hallTickets.length === 0 ? (
                        <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-6">No hall tickets released yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {hallTickets.map(ht => (
                                <div key={ht.id} className="flex items-center justify-between p-3 rounded-xl border bg-[hsl(var(--secondary))]">
                                    <div>
                                        <p className="font-medium text-sm">Semester {ht.semester?.number}</p>
                                        <p className="text-xs text-[hsl(var(--muted-foreground))]">Generated: {new Date(ht.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => window.open(ht.fileUrl, '_blank')}>
                                        Download
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
