'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardCheck } from 'lucide-react';

export default function ExamEvaluationPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Blind Evaluation</h2>
                <p className="text-[hsl(var(--muted-foreground))]">Distribute scripts to faculty for blind evaluation</p>
            </div>

            <Card>
                <CardContent className="py-12 text-center text-[hsl(var(--muted-foreground))]">
                    <ClipboardCheck className="w-12 h-12 mx-auto mb-4 opacity-40" />
                    <p className="text-lg font-medium">No evaluations pending</p>
                    <p className="text-sm mt-1">Generate answer scripts first, then distribute for evaluation</p>
                </CardContent>
            </Card>
        </div>
    );
}
