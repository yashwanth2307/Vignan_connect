'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { motion } from 'framer-motion';

export default function StudentMarksPage() {
    const [marks, setMarks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<any[]>('/exam/marks/student').then(setMarks).catch(() => { }).finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            <div><h2 className="text-2xl font-bold">My Marks</h2><p className="text-[hsl(var(--muted-foreground))]">Released examination results</p></div>
            {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div> : marks.length === 0 ? (
                <Card><CardContent className="py-12 text-center"><BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-[hsl(var(--muted-foreground))]">No marks released yet</p></CardContent></Card>
            ) : (
                <div className="space-y-3">
                    {marks.map((m, i) => (
                        <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <Card>
                                <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                                    <div>
                                        <p className="font-semibold">{m.subject?.title}</p>
                                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{m.subject?.code}</p>
                                    </div>
                                    <div className="flex gap-3 text-sm">
                                        {m.mid1 != null && <Badge variant="outline">Mid1: {m.mid1}</Badge>}
                                        {m.mid2 != null && <Badge variant="outline">Mid2: {m.mid2}</Badge>}
                                        {m.internal != null && <Badge variant="secondary">Internal: {m.internal}</Badge>}
                                        {m.external != null && <Badge variant="secondary">External: {m.external}</Badge>}
                                        {m.final != null && <Badge variant="success">Final: {m.final}</Badge>}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
