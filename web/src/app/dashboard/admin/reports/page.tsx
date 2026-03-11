'use client';

import { Card, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Reports</h2>
                <p className="text-[hsl(var(--muted-foreground))]">Attendance and academic reports</p>
            </div>
            <Card>
                <CardContent className="py-16 text-center">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">Reports Module</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Advanced reports with filters will be available here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
