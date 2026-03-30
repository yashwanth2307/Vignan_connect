'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Loader2, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { motion } from 'framer-motion';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function FacultyTimetablePage() {
    const [slots, setSlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<any[]>('/timetable/faculty/my').then(setSlots).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const grouped = DAYS.reduce((acc, day) => {
        acc[day] = slots.filter(s => s.dayOfWeek === day).sort((a: any, b: any) => a.hourIndex - b.hourIndex);
        return acc;
    }, {} as Record<string, any[]>);

    const handlePrint = () => window.print();

    const handleDownload = () => {
        let csv = 'Day,Period,Subject,Section,Time\n';
        DAYS.forEach(day => {
            if (grouped[day]) {
                grouped[day].forEach((slot: any) => {
                    csv += `${day},${slot.hourIndex},"${slot.courseOffering?.subject?.title}","${slot.courseOffering?.section?.name}","${slot.startTime}-${slot.endTime}"\n`;
                });
            }
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Faculty_Timetable.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div><h2 className="text-2xl font-bold">My Timetable</h2><p className="text-[hsl(var(--muted-foreground))]">Your weekly schedule</p></div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="w-4 h-4 mr-1" /> Print</Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}><Download className="w-4 h-4 mr-1" /> Download</Button>
                </div>
            </div>
            {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
                <div className="space-y-4">
                    {DAYS.map(day => (
                        <Card key={day}>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Calendar className="w-4 h-4" /> {day}</CardTitle></CardHeader>
                            <CardContent>
                                {grouped[day]?.length > 0 ? (
                                    <div className="flex gap-3 flex-wrap">
                                        {grouped[day].map((slot: any) => (
                                            <motion.div key={slot.id} whileHover={{ scale: 1.02 }} className="bg-[hsl(var(--secondary))] rounded-xl p-3 min-w-[160px] cursor-pointer">
                                                <p className="font-medium text-sm">{slot.courseOffering?.subject?.title}</p>
                                                <p className="text-xs text-[hsl(var(--muted-foreground))]">{slot.courseOffering?.section?.name}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <Badge variant="outline" className="text-[10px]">Period {slot.hourIndex}</Badge>
                                                    <Badge variant="secondary" className="text-[10px]">{slot.startTime}-{slot.endTime}</Badge>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : <p className="text-xs text-[hsl(var(--muted-foreground))]">No classes</p>}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
