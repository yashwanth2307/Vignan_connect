'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Loader2, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { motion } from 'framer-motion';

export default function StudentMarksPage() {
    const [marks, setMarks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<any[]>('/exam/marks/student').then(setMarks).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const handlePrint = () => window.print();

    const handleDownload = () => {
        let csv = 'Subject Title,Subject Code,Mid 1,Mid 2,Internal,External,Final\n';
        marks.forEach(m => {
            csv += `"${m.subject?.title}","${m.subject?.code}",${m.mid1 ?? ''},${m.mid2 ?? ''},${m.internal ?? ''},${m.external ?? ''},${m.final ?? ''}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'My_Marks.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div><h2 className="text-2xl font-bold">My Marks</h2><p className="text-[hsl(var(--muted-foreground))]">Released examination results</p></div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="w-4 h-4 mr-1" /> Print</Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}><Download className="w-4 h-4 mr-1" /> Download</Button>
                </div>
            </div>
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
