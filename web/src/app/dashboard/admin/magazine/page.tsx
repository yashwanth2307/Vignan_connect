'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Trash2, Loader2, Link as LinkIcon, Download } from 'lucide-react';
import api from '@/lib/api';

export default function MagazinePage() {
    const [magazines, setMagazines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState('');

    const load = async () => {
        try {
            const data = await api.get<any[]>('/college-magazines');
            setMagazines(data);
        } catch { }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async () => {
        if (!title || !fileUrl) return;
        setSaving(true);
        try {
            await api.post('/college-magazines', {
                title, description, fileUrl, thumbnailUrl
            });
            setTitle(''); setDescription(''); setFileUrl(''); setThumbnailUrl('');
            setShowForm(false);
            load();
        } catch (e: any) { alert(e.message); }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this magazine issue?')) return;
        try {
            await api.delete(`/college-magazines/${id}`);
            load();
        } catch { }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">College Magazine</h2>
                    <p className="text-[hsl(var(--muted-foreground))]">Manage and publish college newsletter and magazines</p>
                </div>
                <Button variant="gradient" onClick={() => setShowForm(!showForm)}>
                    <Plus className="w-4 h-4 mr-1" /> Add Magazine
                </Button>
            </div>

            {showForm && (
                <Card className="border-2 border-dashed border-blue-300 dark:border-blue-800">
                    <CardContent className="p-6 space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Issue Title *</label>
                                <input value={title} onChange={e => setTitle(e.target.value)}
                                    className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
                                    placeholder="e.g. Vignan Voice - Jan 2026" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">PDF File URL *</label>
                                <input value={fileUrl} onChange={e => setFileUrl(e.target.value)}
                                    className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
                                    placeholder="https://link-to-pdf.com/file.pdf" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Thumbnail URL (Cover Image)</label>
                            <input value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)}
                                className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
                                placeholder="https://link-to-image.com/cover.jpg" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Description</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)}
                                className="flex w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm min-h-[60px]"
                                placeholder="Short description of this issue..." />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="gradient" onClick={handleCreate} disabled={saving || !title || !fileUrl}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Issue'}
                            </Button>
                            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {magazines.map(mag => (
                    <Card key={mag.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        {mag.thumbnailUrl ? (
                            <img src={mag.thumbnailUrl} alt="Cover" className="w-full h-48 object-cover border-b border-[hsl(var(--border))]" />
                        ) : (
                            <div className="w-full h-48 bg-[hsl(var(--accent))] flex items-center justify-center border-b border-[hsl(var(--border))]">
                                <FileText className="w-12 h-12 text-[hsl(var(--muted-foreground))]" />
                            </div>
                        )}
                        <CardContent className="p-4">
                            <h3 className="font-bold mb-1">{mag.title}</h3>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3 line-clamp-2">
                                {mag.description || 'No description provided.'}
                            </p>
                            <div className="flex items-center justify-between mt-4">
                                <Button variant="outline" size="sm" asChild>
                                    <a href={mag.fileUrl} target="_blank" rel="noreferrer">
                                        <Download className="w-4 h-4 mr-1" /> View PDF
                                    </a>
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(mag.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {magazines.length === 0 && !showForm && (
                    <div className="col-span-full py-12 text-center text-[hsl(var(--muted-foreground))]">
                        No magazines published yet.
                    </div>
                )}
            </div>
        </div>
    );
}
