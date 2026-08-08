'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, X } from 'lucide-react';
import { motion } from 'framer-motion';

export function useInstallApp() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSModal, setShowIOSModal] = useState(false);

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
        if (isIOS) {
            setShowIOSModal(true);
            return;
        }

        if (deferredPrompt) {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            setDeferredPrompt(null);
        } else {
            alert(
                'To install V-Connect as a Mobile App:\n\n' +
                '• Chrome / Edge (Android): Tap menu (3 dots) → "Install app" or "Add to Home screen"\n' +
                '• Safari (iPhone): Tap Share icon → "Add to Home Screen"'
            );
        }
    };

    return { triggerInstall, isIOS, showIOSModal, setShowIOSModal };
}

export function InstallAppButton({ className }: { className?: string }) {
    const { triggerInstall, showIOSModal, setShowIOSModal } = useInstallApp();

    return (
        <>
            <Button
                type="button"
                onClick={triggerInstall}
                className={className || "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-md gap-2 rounded-xl text-sm"}
            >
                <Download className="w-4 h-4" /> Install V-Connect App
            </Button>

            {showIOSModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center text-gray-900 dark:text-white">
                        <Smartphone className="w-12 h-12 text-blue-600 mx-auto" />
                        <h3 className="text-lg font-bold">Install V-Connect on iPhone</h3>
                        <ol className="text-left text-xs space-y-2 text-gray-600 dark:text-gray-300">
                            <li>1. Tap the <strong>Share button</strong> (square with arrow up) in Safari.</li>
                            <li>2. Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>.</li>
                            <li>3. Tap <strong>Add</strong> in top right corner.</li>
                        </ol>
                        <Button onClick={() => setShowIOSModal(false)} className="w-full">Got it!</Button>
                    </div>
                </div>
            )}
        </>
    );
}

export function InstallAppBanner() {
    const { triggerInstall, showIOSModal, setShowIOSModal } = useInstallApp();
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

            {showIOSModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center">
                        <Smartphone className="w-12 h-12 text-blue-600 mx-auto" />
                        <h3 className="text-lg font-bold">Install V-Connect on iPhone</h3>
                        <ol className="text-left text-xs space-y-2 text-gray-600 dark:text-gray-300">
                            <li>1. Tap the <strong>Share button</strong> (square with arrow up) in Safari.</li>
                            <li>2. Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>.</li>
                            <li>3. Tap <strong>Add</strong> in top right corner.</li>
                        </ol>
                        <Button onClick={() => setShowIOSModal(false)} className="w-full">Got it!</Button>
                    </div>
                </div>
            )}
        </>
    );
}
