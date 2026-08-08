'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, X, Monitor, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function useInstallApp() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const triggerInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
            return;
        }
        setShowModal(true);
    };

    return { triggerInstall, isIOS, showModal, setShowModal };
}

export function InstallAppButton({ className }: { className?: string }) {
    const { triggerInstall, isIOS, showModal, setShowModal } = useInstallApp();

    return (
        <>
            <Button
                type="button"
                onClick={triggerInstall}
                className={className || "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold shadow-md gap-2 rounded-xl text-sm transition-all"}
            >
                <Download className="w-4 h-4" /> Install V-Connect App
            </Button>

            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-md w-full space-y-4 text-gray-900 dark:text-white shadow-2xl relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto">
                            <Smartphone className="w-6 h-6" />
                        </div>

                        <h3 className="text-xl font-bold text-center">Install V-Connect Application</h3>

                        {isIOS ? (
                            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                                <p className="font-semibold text-gray-800 dark:text-gray-100">To install on iPhone or iPad:</p>
                                <ol className="list-decimal list-inside space-y-2 text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl">
                                    <li>Tap the <Share2 className="w-4 h-4 inline text-blue-500 mx-1" /> <strong>Share button</strong> in Safari navigation bar.</li>
                                    <li>Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>.</li>
                                    <li>Tap <strong>Add</strong> in top right corner.</li>
                                </ol>
                            </div>
                        ) : (
                            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                                <p className="font-semibold text-gray-800 dark:text-gray-100">To install on Android or Desktop:</p>
                                <div className="space-y-2.5 text-xs">
                                    <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-3 rounded-2xl">
                                        <p className="font-bold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1.5">
                                            <Smartphone className="w-4 h-4" /> Android (Chrome / Edge):
                                        </p>
                                        <p>Tap the <strong>3 dots menu (⋮)</strong> in top-right → tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.</p>
                                    </div>
                                    <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 p-3 rounded-2xl">
                                        <p className="font-bold text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1.5">
                                            <Monitor className="w-4 h-4" /> Desktop (Chrome / Edge / Brave):
                                        </p>
                                        <p>Click the <strong>Install icon (💻/⊕)</strong> at the right end of your browser address bar!</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button onClick={() => setShowModal(false)} className="w-full font-bold">Got it, thanks!</Button>
                    </div>
                </div>
            )}
        </>
    );
}

export function InstallAppBanner() {
    const { triggerInstall, isIOS, showModal, setShowModal } = useInstallApp();
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-between shadow-md relative z-50 shrink-0"
            >
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                        <Smartphone className="w-4 h-4 text-white" />
                    </div>
                    <span>Install <strong>V-Connect Mobile App</strong> for fast access!</span>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        onClick={triggerInstall}
                        className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-3 py-1 h-7 rounded-xl shadow text-xs"
                    >
                        <Download className="w-3.5 h-3.5 mr-1" /> Install App
                    </Button>
                    <button
                        onClick={() => setDismissed(true)}
                        className="p-1 rounded-full hover:bg-white/20 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>

            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-md w-full space-y-4 text-gray-900 dark:text-white shadow-2xl relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto">
                            <Smartphone className="w-6 h-6" />
                        </div>

                        <h3 className="text-xl font-bold text-center">Install V-Connect Application</h3>

                        {isIOS ? (
                            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                                <p className="font-semibold text-gray-800 dark:text-gray-100">To install on iPhone or iPad:</p>
                                <ol className="list-decimal list-inside space-y-2 text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl">
                                    <li>Tap the <Share2 className="w-4 h-4 inline text-blue-500 mx-1" /> <strong>Share button</strong> in Safari.</li>
                                    <li>Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>.</li>
                                    <li>Tap <strong>Add</strong> in top right corner.</li>
                                </ol>
                            </div>
                        ) : (
                            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                                <p className="font-semibold text-gray-800 dark:text-gray-100">To install on Android or Desktop:</p>
                                <div className="space-y-2.5 text-xs">
                                    <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-3 rounded-2xl">
                                        <p className="font-bold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1.5">
                                            <Smartphone className="w-4 h-4" /> Android (Chrome / Edge):
                                        </p>
                                        <p>Tap the <strong>3 dots menu (⋮)</strong> in top-right → tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.</p>
                                    </div>
                                    <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 p-3 rounded-2xl">
                                        <p className="font-bold text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1.5">
                                            <Monitor className="w-4 h-4" /> Desktop (Chrome / Edge / Brave):
                                        </p>
                                        <p>Click the <strong>Install icon (💻/⊕)</strong> at the right end of your browser address bar!</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button onClick={() => setShowModal(false)} className="w-full font-bold">Got it, thanks!</Button>
                    </div>
                </div>
            )}
        </>
    );
}
