'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Eye, EyeOff, Loader2, ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotStep, setForgotStep] = useState(1);
    const [forgotEmail, setForgotEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async () => {
        try {
            setForgotLoading(true);
            await api.post('/auth/forgot-password', { email: forgotEmail });
            setForgotStep(2);
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Failed to send OTP');
        } finally {
            setForgotLoading(false);
        }
    };

    const handleResetPassword = async () => {
        try {
            setForgotLoading(true);
            await api.post('/auth/reset-password', { email: forgotEmail, token: otp, newPassword });
            alert('Password reset successfully! Please login with your new password.');
            setShowForgotModal(false);
            setForgotStep(1);
            setOtp('');
            setNewPassword('');
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Failed to reset password');
        } finally {
            setForgotLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex">
            {/* Left: Campus Photo Background */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="hidden lg:flex flex-col justify-center items-center w-1/2 relative overflow-hidden p-12"
            >
                {/* Real campus photo background */}
                <img src="/images/campus2.jpg" alt="Vignan Campus" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-950/90 via-indigo-950/85 to-purple-950/80" />
                <div className="absolute top-20 left-10 w-64 h-64 bg-blue-400/15 rounded-full blur-[80px] animate-float" />
                <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-400/15 rounded-full blur-[100px] animate-float" style={{ animationDelay: '1.5s' }} />

                <div className="relative text-center text-white z-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.3 }}
                        className="w-24 h-24 rounded-full bg-white shadow-2xl flex items-center justify-center mx-auto mb-8 p-2"
                    >
                        <Image src="/images/logo.png" alt="V-Connect Logo" width={72} height={72} className="rounded-full object-contain" />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-4xl font-black mb-4"
                    >
                        V-Connect
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="text-blue-100/80 text-lg max-w-sm"
                    >
                        Vignan Institute of Technology and Science
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-8 flex gap-3 justify-center flex-wrap"
                    >
                        {['ERP', 'LMS', 'Attendance', 'Exams'].map((tag) => (
                            <span key={tag} className="px-3 py-1 bg-white/10 rounded-full text-xs border border-white/20 backdrop-blur-sm">
                                {tag}
                            </span>
                        ))}
                    </motion.div>
                </div>
            </motion.div>

            {/* Right: Login Form */}
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="flex-1 flex items-center justify-center p-6 bg-[hsl(var(--background))]"
            >
                <div className="w-full max-w-md">
                    <Link href="/" className="inline-flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to home
                    </Link>

                    <Card className="border-0 shadow-soft-lg">
                        <CardHeader className="space-y-1 pb-4">
                            <div className="flex items-center gap-3 mb-2 lg:hidden">
                                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                                    <GraduationCap className="w-6 h-6 text-white" />
                                </div>
                                <span className="font-bold text-lg">V-Connect</span>
                            </div>
                            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                            <CardDescription>Enter your credentials to access your dashboard</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl p-3"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="your.email@vignan.edu"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Password</Label>
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotModal(true)}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Forgot password?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            required={!showForgotModal}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Forgot Password Modal */}
                    <AnimatePresence>
                        {showForgotModal && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                            >
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl w-full max-w-md p-6 shadow-2xl"
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-bold">Reset Password</h3>
                                        <button onClick={() => { setShowForgotModal(false); setForgotStep(1); }} className="p-1 rounded-full hover:bg-[hsl(var(--accent))]">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {forgotStep === 1 && (
                                        <div className="space-y-4">
                                            <p className="text-sm text-[hsl(var(--muted-foreground))]">Enter your registered email address and we will send you a 6-digit OTP securely via Gmail.</p>
                                            <Input
                                                type="email"
                                                placeholder="Email Address"
                                                value={forgotEmail}
                                                onChange={e => setForgotEmail(e.target.value)}
                                            />
                                            <Button className="w-full" disabled={forgotLoading} onClick={handleSendOtp}>
                                                {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send OTP'}
                                            </Button>
                                        </div>
                                    )}

                                    {forgotStep === 2 && (
                                        <div className="space-y-4">
                                            <p className="text-sm text-[hsl(var(--muted-foreground))]">Enter the 6-digit OTP sent to your email, along with your new password.</p>
                                            <Input
                                                placeholder="6-Digit OTP"
                                                value={otp}
                                                maxLength={6}
                                                onChange={e => setOtp(e.target.value)}
                                            />
                                            <Input
                                                type="password"
                                                placeholder="New Password"
                                                value={newPassword}
                                                onChange={e => setNewPassword(e.target.value)}
                                            />
                                            <Button className="w-full" disabled={forgotLoading} onClick={handleResetPassword}>
                                                {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Password'}
                                            </Button>
                                        </div>
                                    )}
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
