'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Flame, Loader2, Users, Building2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

export default function LeaderboardPage() {
    const { user } = useAuth();
    const [campusLeaderboard, setCampusLeaderboard] = useState<any[]>([]);
    const [sectionLeaderboard, setSectionLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'campus' | 'section'>('campus');
    const [myStats, setMyStats] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const campus = await api.get<any[]>('/code-arena/leaderboard/campus?limit=100');
            setCampusLeaderboard(campus);

            if (user?.role === 'STUDENT') {
                try {
                    const stats = await api.get<any>('/code-arena/stats/my');
                    setMyStats(stats);
                } catch { }
            }
        } catch { }
        setLoading(false);
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                        🏆 V-Connect Leaderboard
                    </h2>
                    <p className="text-[hsl(var(--muted-foreground))]">Top coders across the campus</p>
                </div>
                {myStats && (
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-200 dark:border-violet-800">
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">Your V-Points: </span>
                            <span className="font-bold text-violet-600 dark:text-violet-400">{myStats.totalVPoints}</span>
                        </div>
                        <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-200 dark:border-orange-800">
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">Streak: </span>
                            <span className="font-bold text-orange-600 dark:text-orange-400">{myStats.currentStreak} 🔥</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Top 3 Podium */}
            {campusLeaderboard.length >= 3 && (
                <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                    {[1, 0, 2].map((idx) => {
                        const s = campusLeaderboard[idx];
                        if (!s) return null;
                        const heights = ['h-32', 'h-24', 'h-20'];
                        const medals = ['🥇', '🥈', '🥉'];
                        const gradients = [
                            'from-yellow-400 to-amber-500',
                            'from-gray-300 to-gray-400',
                            'from-orange-400 to-orange-500',
                        ];
                        const order = idx === 1 ? 0 : idx === 0 ? 1 : 2;
                        return (
                            <motion.div
                                key={s.studentId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: order * 0.15 }}
                                className="text-center"
                            >
                                <div className={`w-14 h-14 mx-auto rounded-full bg-gradient-to-br ${gradients[idx]} flex items-center justify-center text-2xl mb-2 shadow-lg`}>
                                    {medals[idx]}
                                </div>
                                <p className="font-bold text-sm truncate">{s.name}</p>
                                <p className="text-xs text-[hsl(var(--muted-foreground))]">{s.rollNo}</p>
                                <p className="text-violet-600 dark:text-violet-400 font-bold text-lg">{s.totalVPoints}</p>
                                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">V-Points</p>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Full Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="w-5 h-5" /> Full Rankings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[hsl(var(--border))]">
                                    <th className="text-left py-3 px-2 font-semibold">Rank</th>
                                    <th className="text-left py-3 px-2 font-semibold">Name</th>
                                    <th className="text-left py-3 px-2 font-semibold">Roll No</th>
                                    <th className="text-left py-3 px-2 font-semibold">Section</th>
                                    <th className="text-left py-3 px-2 font-semibold">Dept</th>
                                    <th className="text-right py-3 px-2 font-semibold">V-Points</th>
                                    <th className="text-right py-3 px-2 font-semibold">Solved</th>
                                    <th className="text-right py-3 px-2 font-semibold">Streak</th>
                                    <th className="text-right py-3 px-2 font-semibold">Best</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campusLeaderboard.map((s, i) => (
                                    <tr key={s.studentId} className={`border-b border-[hsl(var(--border)/0.3)] hover:bg-[hsl(var(--accent)/0.3)] transition-colors ${i < 3 ? 'bg-yellow-50/30 dark:bg-yellow-950/10' : ''}`}>
                                        <td className="py-3 px-2 font-semibold">
                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                        </td>
                                        <td className="py-3 px-2 font-medium">{s.name}</td>
                                        <td className="py-3 px-2 text-[hsl(var(--muted-foreground))] text-xs">{s.rollNo}</td>
                                        <td className="py-3 px-2"><Badge variant="outline" className="text-[10px]">{s.section}</Badge></td>
                                        <td className="py-3 px-2 text-xs text-[hsl(var(--muted-foreground))]">{s.department}</td>
                                        <td className="py-3 px-2 text-right text-violet-600 dark:text-violet-400 font-bold">{s.totalVPoints}</td>
                                        <td className="py-3 px-2 text-right">{s.problemsSolved}</td>
                                        <td className="py-3 px-2 text-right">
                                            <span className="inline-flex items-center gap-1">
                                                <Flame className="w-3 h-3 text-orange-500" />{s.currentStreak}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-right text-[hsl(var(--muted-foreground))]">{s.longestStreak}d</td>
                                    </tr>
                                ))}
                                {campusLeaderboard.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="text-center py-12 text-[hsl(var(--muted-foreground))]">
                                            No data yet. Be the first to solve problems and earn V-Points!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
