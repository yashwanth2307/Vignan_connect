'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { motion } from 'framer-motion';

export default function FacultyClassesPage() {
    const [offerings, setOfferings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<any[]>('/course-offerings/my').then(setOfferings).catch(() => { }).finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            <div><h2 className="text-2xl font-bold">My Classes</h2><p className="text-[hsl(var(--muted-foreground))]">Your assigned course offerings</p></div>
            {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {offerings.map((co, i) => (
                        <motion.div key={co.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <Card className="hover:shadow-soft-lg transition-all">
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"><BookOpen className="w-5 h-5 text-white" /></div>
                                        <div><p className="font-semibold">{co.subject?.title}</p><p className="text-xs text-[hsl(var(--muted-foreground))]">{co.subject?.code}</p></div>
                                    </div>
                                    <div className="flex gap-2"><Badge variant="secondary">{co.section?.name}</Badge><Badge variant="outline">{co.subject?.credits} credits</Badge></div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
