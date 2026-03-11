'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export type UserRole = 'ADMIN' | 'HOD' | 'FACULTY' | 'STUDENT' | 'EXAM_CELL' | 'TPO';

export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    isActive: boolean;
    student?: {
        id: string;
        rollNo: string;
        sectionId: string;
        departmentId: string;
        section: { id: string; name: string };
        department: { id: string; name: string };
    };
    faculty?: {
        id: string;
        empId: string;
        departmentId: string;
        department: { id: string; name: string };
    };
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const refreshUser = useCallback(async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setUser(null);
                setLoading(false);
                return;
            }
            const userData = await api.get<User>('/auth/me');
            setUser(userData);
        } catch {
            setUser(null);
            api.clearTokens();
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const login = async (email: string, password: string) => {
        const data = await api.post<{ user: User; tokens: { accessToken: string; refreshToken: string } }>(
            '/auth/login',
            { email, password },
            { skipAuth: true }
        );
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        setUser(data.user);

        // Route based on role
        const roleRoutes: Record<UserRole, string> = {
            ADMIN: '/dashboard/admin',
            HOD: '/dashboard/hod',
            FACULTY: '/dashboard/faculty',
            STUDENT: '/dashboard/student',
            EXAM_CELL: '/dashboard/exam-cell',
            TPO: '/dashboard/tpo',
        };
        router.push(roleRoutes[data.user.role] || '/dashboard');
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch { /* ignore */ }
        api.clearTokens();
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
