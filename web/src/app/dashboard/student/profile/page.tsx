'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { UserCircle, Mail, Phone, BookOpen, Building2, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentProfilePage() {
    const { user } = useAuth();
    if (!user) return null;

    const student = user.student;

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center">
                <h2 className="text-2xl font-bold">My Profile</h2>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="overflow-hidden">
                    <div className="h-32 gradient-primary relative">
                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                            <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-800 flex items-center justify-center shadow-lg">
                                <UserCircle className="w-16 h-16 text-[hsl(var(--muted-foreground))]" />
                            </div>
                        </div>
                    </div>
                    <CardContent className="pt-16 text-center">
                        <h3 className="text-xl font-bold">{user.name}</h3>
                        <Badge variant="secondary" className="mt-2">{user.role}</Badge>

                        <div className="mt-6 grid grid-cols-2 gap-4 text-left">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--secondary))]">
                                <Mail className="w-5 h-5 text-[hsl(var(--primary))]" />
                                <div>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Email</p>
                                    <p className="text-sm font-medium">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--secondary))]">
                                <Phone className="w-5 h-5 text-[hsl(var(--primary))]" />
                                <div>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Phone</p>
                                    <p className="text-sm font-medium">{user.phone || 'N/A'}</p>
                                </div>
                            </div>
                            {student && (
                                <>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--secondary))]">
                                        <BookOpen className="w-5 h-5 text-[hsl(var(--primary))]" />
                                        <div>
                                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Roll No</p>
                                            <p className="text-sm font-medium">{student.rollNo}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--secondary))]">
                                        <Building2 className="w-5 h-5 text-[hsl(var(--primary))]" />
                                        <div>
                                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Department</p>
                                            <p className="text-sm font-medium">{student.department?.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--secondary))]">
                                        <Calendar className="w-5 h-5 text-[hsl(var(--primary))]" />
                                        <div>
                                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Section</p>
                                            <p className="text-sm font-medium">{student.section?.name}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
