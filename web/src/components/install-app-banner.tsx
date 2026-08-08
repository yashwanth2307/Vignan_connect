'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, X } from 'lucide-react';
import { motion } from 'framer-motion';

export function InstallAppBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSModal, setShowIOSModal] = useState(false);

    useEffect(() => {
        // Check if already running in standalone mode (installed app)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
        if (isStandalone) return;

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(ios);

        if (ios) {
            setShowBanner(true);
        }

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Always show banner after 2 seconds if not standalone
        const timer = setTimeout(() => {
            setShowBanner(true);
        }, 2000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            clearTimeout(timer);
        };
    }, []);

    const handleInstallClick = async () => {
        if (isIOS) {
            setShowIOSModal(true);
            return;
        }

        if (!deferredPrompt) {
            alert('To install V-Connect on your phone:\n\n• Android (Chrome/Edge): Tap menu (3 dots) → "Install app" or "Add to Home screen"\n• iPhone (Safari): Tap Share icon → "Add to Home Screen"');
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowBanner(false);
        }
        setDeferredPrompt(null);
    };

    if (!showBanner) return null;

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
                        onClick={handleInstallClick}
                        className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-3 py-1 h-7 rounded-xl shadow text-xs"
                    >
                        <Download className="w-3.5 h-3.5 mr-1" /> Install App
                    </Button>
                    <button
                        onClick={() => setShowBanner(false)}
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
