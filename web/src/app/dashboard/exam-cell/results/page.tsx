'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function ExamResultsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Results & Publishing</h2>
                <p className="text-[hsl(var(--muted-foreground))]">Verify marks and publish exam results</p>
            </div>

            <Card>
                <CardContent className="py-12 text-center text-[hsl(var(--muted-foreground))]">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-40" />
                    <p className="text-lg font-medium">No results to publish</p>
                    <p className="text-sm mt-1">Complete evaluation process to verify and release results</p>
                </CardContent>
            </Card>
        </div>
    );
}
