'use client';

import { useAuth } from '@/contexts/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[hsl(var(--primary))]" />
                    <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return <DashboardLayout>{children}</DashboardLayout>;
}
