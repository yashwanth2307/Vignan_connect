'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Plus, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/api';

export default function GalleryPage() {
    const [photos, setPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    const [title, setTitle] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [category, setCategory] = useState('General');

    const CATEGORIES = ['General', 'Sports', 'Cultural', 'Technical', 'Infrastructure'];

    const load = async () => {
        try {
            const data = await api.get<any[]>('/college-gallery');
            setPhotos(data);
        } catch { }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async () => {
        if (!imageUrl) return;
        setSaving(true);
        try {
            await api.post('/college-gallery', {
                title, imageUrl, category
            });
            setTitle(''); setImageUrl(''); setCategory('General');
            setShowForm(false);
            load();
        } catch (e: any) { alert(e.message); }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this photo from gallery?')) return;
        try {
            await api.delete(`/college-gallery/${id}`);
            load();
        } catch { }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">College Gallery</h2>
                    <p className="text-[hsl(var(--muted-foreground))]">Manage homepage images and gallery photos</p>
                </div>
                <Button variant="gradient" onClick={() => setShowForm(!showForm)}>
                    <Plus className="w-4 h-4 mr-1" /> Add Photo
                </Button>
            </div>

            {showForm && (
                <Card className="border-2 border-dashed border-blue-300 dark:border-blue-800">
                    <CardContent className="p-6 space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Upload Media (Photo/Video) *</label>
                                <input 
                                    type="file" 
                                    accept="image/*,video/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        if (file.size > 3.5 * 1024 * 1024) return alert("File is too large! Maximum limit is 3.5MB.");
                                        const reader = new FileReader();
                                        reader.onloadend = () => setImageUrl(reader.result as string);
                                        reader.readAsDataURL(file);
                                    }}
                                    className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold flex items-center file:bg-[hsl(var(--primary))] file:text-white"
                                />
                                {imageUrl && <p className="text-xs text-green-500 mt-1">✓ Media attached successfully</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Category</label>
                                <select value={category} onChange={e => setCategory(e.target.value)}
                                    className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm">
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Title / Caption (Optional)</label>
                            <input value={title} onChange={e => setTitle(e.target.value)}
                                className="flex h-10 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
                                placeholder="E.g., Sports Day 2026 Winner" />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="gradient" onClick={handleCreate} disabled={saving || !imageUrl}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload Photo'}
                            </Button>
                            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {photos.map(photo => (
                    <Card key={photo.id} className="overflow-hidden group relative">
                        {photo.imageUrl ? (
                            photo.imageUrl.startsWith('data:video') || photo.imageUrl.endsWith('.mp4') ? (
                                <video src={photo.imageUrl} autoPlay loop muted playsInline className="w-full aspect-square object-cover" />
                            ) : (
                                <img src={photo.imageUrl} alt={photo.title || 'Gallery'} className="w-full aspect-square object-cover" />
                            )
                        ) : (
                            <div className="w-full aspect-square bg-muted flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 opacity-20" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                            <div className="flex items-center justify-between text-white">
                                <div>
                                    <p className="text-xs font-semibold line-clamp-1">{photo.title || 'Untitled'}</p>
                                    <p className="text-[10px] opacity-80">{photo.category}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:bg-red-500/20" onClick={() => handleDelete(photo.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
            {photos.length === 0 && !showForm && (
                <div className="py-12 text-center text-[hsl(var(--muted-foreground))] flex flex-col items-center">
                    <Camera className="w-12 h-12 opacity-20 mb-3" />
                    <p>No photos added to the gallery yet.</p>
                </div>
            )}
        </div>
    );
}
