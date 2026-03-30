'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth, UserRole } from '@/contexts/auth-context';
import { useTheme } from 'next-themes';
import {
    LayoutDashboard, Users, Building2, BookOpen, Calendar, ClipboardCheck,
    GraduationCap, FileText, BarChart3, LogOut,
    ChevronLeft, ChevronRight, Sun, Moon, Menu,
    UserCircle, Layers, Award, ClipboardList, Video, Code2, Trophy, Upload, MessageCircle, Briefcase,
    CalendarDays, ArrowUpCircle, Ticket, FileSpreadsheet, Camera, Send, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
}

const adminNav: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    { label: 'Departments', href: '/dashboard/admin/departments', icon: Building2 },
    { label: 'Sections', href: '/dashboard/admin/sections', icon: Layers },
    { label: 'Regulations', href: '/dashboard/admin/regulations', icon: FileText },
    { label: 'Subjects', href: '/dashboard/admin/subjects', icon: BookOpen },
    { label: 'Users', href: '/dashboard/admin/users', icon: Users },
    { label: 'Course Offerings', href: '/dashboard/admin/course-offerings', icon: GraduationCap },
    { label: 'Timetable', href: '/dashboard/admin/timetable', icon: Calendar },
    { label: 'Attendance', href: '/dashboard/admin/attendance', icon: ClipboardCheck },
    { label: 'Online Classes', href: '/dashboard/admin/online-classes', icon: Video },
    { label: 'Academic Calendar', href: '/dashboard/admin/academic-calendar', icon: CalendarDays },
    { label: 'Semester Promotion', href: '/dashboard/admin/semester-promotion', icon: ArrowUpCircle },
    { label: 'Groups', href: '/dashboard/faculty/groups', icon: MessageCircle },
    { label: 'Code Arena', href: '/dashboard/code-arena', icon: Code2 },
    { label: 'Clubs', href: '/dashboard/admin/clubs', icon: Sparkles },
    { label: 'Requests', href: '/dashboard/requests', icon: Send },
    { label: 'Reports', href: '/dashboard/admin/reports', icon: BarChart3 },
];

const hodNav: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard/hod', icon: LayoutDashboard },
    { label: 'Sections', href: '/dashboard/admin/sections', icon: Layers },
    { label: 'Faculty', href: '/dashboard/admin/users', icon: Users },
    { label: 'Subjects', href: '/dashboard/admin/subjects', icon: BookOpen },
    { label: 'Course Offerings', href: '/dashboard/admin/course-offerings', icon: GraduationCap },
    { label: 'Timetable', href: '/dashboard/admin/timetable', icon: Calendar },
    { label: 'Attendance', href: '/dashboard/admin/attendance', icon: ClipboardCheck },
    { label: 'Online Classes', href: '/dashboard/admin/online-classes', icon: Video },
    { label: 'Academic Calendar', href: '/dashboard/admin/academic-calendar', icon: CalendarDays },
    { label: 'Semester Promotion', href: '/dashboard/admin/semester-promotion', icon: ArrowUpCircle },
    { label: 'Groups', href: '/dashboard/faculty/groups', icon: MessageCircle },
    { label: 'Code Arena', href: '/dashboard/code-arena', icon: Code2 },
    { label: 'Clubs', href: '/dashboard/admin/clubs', icon: Sparkles },
    { label: 'Requests', href: '/dashboard/requests', icon: Send },
    { label: 'Marks Upload', href: '/dashboard/faculty/marks', icon: FileSpreadsheet },
    { label: 'Reports', href: '/dashboard/admin/reports', icon: BarChart3 },
];

const examCellNav: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard/exam-cell', icon: LayoutDashboard },
    { label: 'Reports', href: '/dashboard/admin/reports', icon: BarChart3 },
    { label: 'Subjects', href: '/dashboard/admin/subjects', icon: BookOpen },
];

const facultyNav: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard/faculty', icon: LayoutDashboard },
    { label: 'My Classes', href: '/dashboard/faculty/classes', icon: BookOpen },
    { label: 'Timetable', href: '/dashboard/faculty/timetable', icon: Calendar },
    { label: 'Attendance', href: '/dashboard/faculty/attendance', icon: ClipboardCheck },
    { label: 'Marks Upload', href: '/dashboard/faculty/marks', icon: FileSpreadsheet },
    { label: 'Topics Taught', href: '/dashboard/faculty/topics', icon: ClipboardList },
    { label: 'Online Classes', href: '/dashboard/admin/online-classes', icon: Video },
    { label: 'Academic Calendar', href: '/dashboard/admin/academic-calendar', icon: CalendarDays },
    { label: 'Groups', href: '/dashboard/faculty/groups', icon: MessageCircle },
    { label: 'Code Arena', href: '/dashboard/code-arena', icon: Code2 },
    { label: 'Clubs', href: '/dashboard/faculty/clubs', icon: Sparkles },
    { label: 'Evaluation', href: '/dashboard/faculty/evaluation', icon: Award },
    { label: 'Requests', href: '/dashboard/requests', icon: Send },
];

const studentNav: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard/student', icon: LayoutDashboard },
    { label: 'Timetable', href: '/dashboard/student/timetable', icon: Calendar },
    { label: 'Attendance', href: '/dashboard/student/attendance', icon: ClipboardCheck },
    { label: 'Marks', href: '/dashboard/student/marks', icon: BarChart3 },
    { label: 'Academic Calendar', href: '/dashboard/admin/academic-calendar', icon: CalendarDays },
    { label: 'Online Classes', href: '/dashboard/admin/online-classes', icon: Video },
    { label: 'Groups', href: '/dashboard/student/groups', icon: MessageCircle },
    { label: 'Code Arena', href: '/dashboard/code-arena', icon: Code2 },
    { label: 'Leaderboard', href: '/dashboard/code-arena/leaderboard', icon: Trophy },
    { label: 'Profile & Photo', href: '/dashboard/student/profile', icon: Camera },
    { label: 'Clubs', href: '/dashboard/student/clubs', icon: Sparkles },
    { label: 'Requests', href: '/dashboard/requests', icon: Send },
];

const tpoNav: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard/tpo', icon: LayoutDashboard },
    { label: 'Placement Drives', href: '/dashboard/tpo/drives', icon: Briefcase },
    { label: 'Applications', href: '/dashboard/tpo/applications', icon: ClipboardList },
    { label: 'Announcements', href: '/dashboard/admin/announcements', icon: FileText },
    { label: 'Reports', href: '/dashboard/tpo/reports', icon: BarChart3 },
];

function getNavItems(role: UserRole): NavItem[] {
    switch (role) {
        case 'ADMIN': return adminNav;
        case 'HOD': return hodNav;
        case 'EXAM_CELL': return examCellNav;
        case 'FACULTY': return facultyNav;
        case 'STUDENT': return studentNav;
        case 'TPO': return tpoNav;
        default: return [];
    }
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();

    if (!user) return null;

    const navItems = getNavItems(user.role);

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-4 flex items-center gap-3 border-b border-[hsl(var(--border)/0.5)]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                    <span className="text-white font-black text-xl tracking-tighter">V</span>
                </div>
                <AnimatePresence>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="overflow-hidden whitespace-nowrap"
                        >
                            <p className="font-bold text-sm tracking-widest text-blue-700 dark:text-blue-400">VIGNAN</p>
                            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">CONNECT</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item, i) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard/admin' && item.href !== '/dashboard/faculty' && item.href !== '/dashboard/student' && pathname.startsWith(item.href));
                    return (
                        <motion.div
                            key={item.href}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Link
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                                    isActive
                                        ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-md"
                                        : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "" : "group-hover:scale-110 transition-transform")} />
                                <AnimatePresence>
                                    {!collapsed && (
                                        <motion.span
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: 'auto' }}
                                            exit={{ opacity: 0, width: 0 }}
                                            className="overflow-hidden whitespace-nowrap"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </Link>
                        </motion.div>
                    );
                })}
            </nav>

            {/* Bottom */}
            <div className="p-3 border-t border-[hsl(var(--border)/0.5)] space-y-2">
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] w-full transition-all"
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
                </button>
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {getInitials(user.name)}
                    </div>
                    {!collapsed && (
                        <div className="overflow-hidden flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">{user.role}</p>
                        </div>
                    )}
                </div>
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 w-full transition-all"
                >
                    <LogOut className="w-5 h-5" />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))]">
            {/* Desktop Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: collapsed ? 72 : 260 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="hidden lg:flex flex-col border-r border-[hsl(var(--border)/0.5)] bg-[hsl(var(--card))] relative z-20"
            >
                {sidebarContent}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[hsl(var(--primary))] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-30"
                >
                    {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                </button>
            </motion.aside>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black z-40 lg:hidden"
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="fixed left-0 top-0 bottom-0 w-[260px] bg-[hsl(var(--card))] z-50 lg:hidden shadow-2xl"
                        >
                            {sidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <header className="h-16 border-b border-[hsl(var(--border)/0.5)] bg-[hsl(var(--card)/0.8)] backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 z-10">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setMobileOpen(true)} className="lg:hidden">
                            <Menu className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold">
                                {navItems.find(i => pathname === i.href || (i.href !== '/dashboard/admin' && i.href !== '/dashboard/faculty' && i.href !== '/dashboard/student' && pathname.startsWith(i.href)))?.label || 'Dashboard'}
                            </h1>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">Vignan Institute of Technology and Science</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-6 relative">
                    {/* Subtle logo watermark */}
                    <div className="pointer-events-none fixed bottom-4 right-4 opacity-[0.04] z-0">
                        <img src="/images/logo.png" alt="" className="w-40 h-40" />
                    </div>
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="relative z-[1]"
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
