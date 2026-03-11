'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function ExamScriptsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Answer Scripts</h2>
                <p className="text-[hsl(var(--muted-foreground))]">Generate barcoded answer scripts for examinations</p>
            </div>

            <Card>
                <CardContent className="py-12 text-center text-[hsl(var(--muted-foreground))]">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-40" />
                    <p className="text-lg font-medium">No scripts generated yet</p>
                    <p className="text-sm mt-1">Create an exam session first, then generate answer scripts</p>
                </CardContent>
            </Card>
        </div>
    );
}
