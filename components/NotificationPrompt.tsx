'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { useWebPush } from '@/hooks/useWebPush';
import { useAuth } from '@/context/AuthContext';

const SUPPRESSION_DAYS = 2;
const PROMPT_DELAY_MS = 10000; // 10 seconds

export function NotificationPrompt() {
    const { user } = useAuth();
    const { permission, requestPermission } = useWebPush();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // If not logged in, or already allowed/denied, don't show
        if (!user || permission !== 'default') return;

        // Check suppression
        const lastDismissed = localStorage.getItem('lastNotificationPromptDismissedAt');
        if (lastDismissed) {
            const lastDate = new Date(parseInt(lastDismissed));
            const now = new Date();
            const diffDays = (now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24);

            if (diffDays < SUPPRESSION_DAYS) return;
        }

        // Show after delay
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, PROMPT_DELAY_MS);

        return () => clearTimeout(timer);
    }, [user, permission]);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('lastNotificationPromptDismissedAt', Date.now().toString());
    };

    const handleEnable = async () => {
        const success = await requestPermission();
        if (success) {
            setIsVisible(false);
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed bottom-24 left-4 right-4 z-[100] md:left-auto md:right-8 md:bottom-8 md:w-[380px]"
                >
                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A]/90 p-5 shadow-2xl backdrop-blur-xl">
                        {/* Status Accent Line */}
                        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-emerald-400" />

                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                                <motion.div
                                    animate={{
                                        rotate: [0, 15, -15, 0],
                                        scale: [1, 1.1, 1.1, 1]
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 2,
                                        ease: "easeInOut"
                                    }}
                                >
                                    <Bell className="h-6 w-6" />
                                </motion.div>
                            </div>

                            <div className="flex-1 space-y-1">
                                <h3 className="text-lg font-semibold text-white">Never miss an event</h3>
                                <p className="text-sm text-zinc-400">
                                    Get instant alerts for new campus events, student notices, and club updates.
                                </p>
                            </div>

                            <button
                                onClick={handleDismiss}
                                className="rounded-full p-1 text-zinc-500 hover:bg-white/5 hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                            <button
                                onClick={handleEnable}
                                className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-center text-sm font-semibold text-black transition-all hover:bg-emerald-400 active:scale-95"
                            >
                                Enable Alerts
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="flex-1 rounded-xl bg-white/5 px-4 py-2.5 text-center text-sm font-semibold text-white transition-all hover:bg-white/10"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
