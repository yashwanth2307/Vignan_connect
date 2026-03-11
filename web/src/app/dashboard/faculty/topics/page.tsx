'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';

export default function TopicsPage() {
    return (
        <div className="space-y-6">
            <div><h2 className="text-2xl font-bold">Topics Taught</h2><p className="text-[hsl(var(--muted-foreground))]">Track topics covered per class</p></div>
            <Card><CardContent className="py-12 text-center"><ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-sm text-[hsl(var(--muted-foreground))]">Topics tracking module</p></CardContent></Card>
        </div>
    );
}
