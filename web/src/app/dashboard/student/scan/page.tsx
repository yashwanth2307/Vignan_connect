'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function StudentScanPage() {
    return (
        <div className="max-w-lg mx-auto space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="text-center">
                    <CardContent className="py-12 space-y-4">
                        <ClipboardCheck className="w-16 h-16 mx-auto text-green-500" />
                        <h2 className="text-xl font-bold">Manual Attendance</h2>
                        <p className="text-[hsl(var(--muted-foreground))] text-sm">
                            Attendance is now managed by your faculty using manual marking.
                            <br />
                            No QR scanning required — your faculty will mark you present during class.
                        </p>
                        <Link href="/dashboard/student">
                            <Button variant="outline" className="mt-4">
                                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
