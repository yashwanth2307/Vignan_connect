'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Award } from 'lucide-react';

export default function EvaluationPage() {
    return (
        <div className="space-y-6">
            <div><h2 className="text-2xl font-bold">Evaluation Tasks</h2><p className="text-[hsl(var(--muted-foreground))]">Answer script evaluation assigned by Exam Cell</p></div>
            <Card><CardContent className="py-12 text-center"><Award className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-sm text-[hsl(var(--muted-foreground))]">Evaluation tasks module</p></CardContent></Card>
        </div>
    );
}
