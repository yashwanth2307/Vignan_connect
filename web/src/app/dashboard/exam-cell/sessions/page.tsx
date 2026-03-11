'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Clock, X, Loader2 } from 'lucide-react';

export default function ExamSessionsPage() {
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Exam Sessions</h2>
                    <p className="text-[hsl(var(--muted-foreground))]">Create and manage examination sessions</p>
                </div>
                <Button onClick={() => setShowForm(true)} variant="gradient">
                    <Plus className="w-4 h-4" /> New Session
                </Button>
            </div>

            {showForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle>Create Exam Session</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
                        </CardHeader>
                        <CardContent>
                            <form className="grid sm:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label>Session Name</Label>
                                    <Input placeholder="Mid-1 Exam 2026" />
                                </div>
                                <div className="space-y-1">
                                    <Label>Type</Label>
                                    <select className="w-full h-10 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm">
                                        <option>MID_1</option>
                                        <option>MID_2</option>
                                        <option>SEMESTER</option>
                                        <option>SUPPLEMENTARY</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Start Date</Label>
                                    <Input type="date" />
                                </div>
                                <div className="sm:col-span-3 flex justify-end">
                                    <Button type="submit" disabled={saving}>
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Session'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            <Card>
                <CardContent className="py-12 text-center text-[hsl(var(--muted-foreground))]">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-40" />
                    <p className="text-lg font-medium">No exam sessions yet</p>
                    <p className="text-sm mt-1">Create your first exam session to get started</p>
                </CardContent>
            </Card>
        </div>
    );
}
