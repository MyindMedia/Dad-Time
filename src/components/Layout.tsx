import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Clock, BarChart3, Settings, MessageSquare } from 'lucide-react';
import { HapticFeedback } from '../utils/ios';
import { motion } from 'framer-motion';
import { pulse, springConfig } from '../lib/animations';
import { useEntity } from '../hooks/useEntity';
import type { VisitSession, Trip } from '../types';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();
    const { items: visits } = useEntity<VisitSession>('visits');
    const { items: trips } = useEntity<Trip>('trips');

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker registered:', registration);
                })
                .catch((error) => {
                    console.error('Service Worker registration failed:', error);
                });
        }
    }, []);

    const isActive = (path: string) => location.pathname === path;

    const handleNavClick = () => {
        HapticFeedback.light();
    };

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/conversations', icon: MessageSquare, label: 'Timesheet' },
        { path: '/visit', icon: Clock, label: 'Timer' },
        { path: '/reports', icon: BarChart3, label: 'Reports' },
        { path: '/settings', icon: Settings, label: 'Setting' },
    ];

    const hasActiveVisit = visits.some(v => !v.endTime);
    const hasActiveTrip = trips.some(t => !t.endTime);

    return (
        <div className="min-h-screen bg-[#FAFAFA]" style={{ paddingBottom: 'calc(96px + var(--safe-area-bottom))' }}>
            <main className="w-full max-w-lg mx-auto min-h-screen relative">
                {children}
            </main>

            {(hasActiveVisit || hasActiveTrip) && (
                <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50">
                    <span className="px-3 py-1 bg-[#10B981]/10 text-[#10B981] text-xs rounded-full font-semibold shadow-sm">
                        {hasActiveVisit && hasActiveTrip ? 'Timing • Tracking' : hasActiveVisit ? 'Timing' : 'Tracking'}
                    </span>
                </div>
            )}

            {/* Glass Bottom Navigation with central CTA */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md rounded-t-2xl pt-4 pb-6 border-t border-white/40"
                style={{ paddingBottom: 'var(--safe-area-bottom)' }}
            >
                <div className="max-w-lg mx-auto flex items-center justify-center gap-3 px-6">
                    {navItems.map((item, idx) => {
                        const active = isActive(item.path);
                        const Icon = item.icon;

                        // Insert central CTA between Timesheet and Timer positions
                        const isCenterSlot = idx === 2;

                        return (
                            <React.Fragment key={`nav-${item.path}`}>
                                <Link
                                    to={item.path}
                                    onClick={handleNavClick}
                                    className={`flex flex-col items-center gap-0 min-w-[65px] relative`}
                                >
                                    <motion.div
                                        className="w-10 h-10 flex items-center justify-center"
                                        animate={{
                                            scale: active ? 1.1 : 1,
                                            opacity: active ? 1 : 0.6,
                                        }}
                                        transition={springConfig.smooth}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <Icon size={22} className="text-[#00082D]" />
                                    </motion.div>
                                    <motion.span
                                        className="text-[12px] text-[#00082D]"
                                        animate={{
                                            fontWeight: active ? 600 : 400,
                                            opacity: active ? 1 : 0.6,
                                        }}
                                        transition={springConfig.smooth}
                                    >
                                        {item.label}
                                    </motion.span>
                                    {item.path === '/visit' && hasActiveVisit && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#10B981] rounded-full animate-pulse" />
                                    )}
                                    {item.path === '/conversations' && hasActiveTrip && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#1A66FF] rounded-full animate-pulse" />
                                    )}
                                </Link>

                                {isCenterSlot && (
                                    <Link to="/visit" onClick={handleNavClick}>
                                        <motion.div
                                            className={`w-[58px] h-[58px] flex items-center justify-center bg-[#1A66FF] rounded-full -mt-2 shadow-lg ${hasActiveVisit ? 'ring-4 ring-[#1A66FF]/30 animate-pulse' : ''}`}
                                            variants={pulse}
                                            animate="animate"
                                            whileTap={{ scale: 0.9 }}
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            <svg width="58" height="58" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <rect width="58" height="58" rx="29" fill="#1A66FF" />
                                                <path d="M20 18.125C20 17.5156 20.4688 17 21.125 17H36.875C37.4844 17 38 17.5156 38 18.125C38 18.7812 37.4844 19.25 36.875 19.25H36.5V20.1406C36.5 22.0625 35.7031 23.8438 34.3906 25.2031L30.5469 29L34.3906 32.8438C35.7031 34.1562 36.5 35.9844 36.5 37.8594V38.75H36.875C37.4844 38.75 38 39.2656 38 39.875C38 40.5312 37.4844 41 36.875 41H21.125C20.4688 41 20 40.5312 20 39.875C20 39.2656 20.4688 38.75 21.125 38.75H21.5V37.8594C21.5 35.9844 22.25 34.1562 23.5625 32.8438L27.4062 29L23.5625 25.2031C22.25 23.8438 21.5 22.0625 21.5 20.1406V19.25H21.125C20.4688 19.25 20 18.7812 20 18.125ZM24.6406 35H33.3125C33.1719 34.8125 32.9844 34.625 32.7969 34.4375L29 30.5938L25.1562 34.4375C24.9688 34.625 24.7812 34.8125 24.6406 35ZM33.3125 23C33.875 22.2031 34.25 21.2188 34.25 20.1406V19.25H23.75V20.1406C23.75 21.2188 24.0781 22.2031 24.6406 23H33.3125Z" fill="#FAFAFA" />
                                            </svg>
                                        </motion.div>
                                    </Link>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Home Indicator */}
                <div className="flex justify-center mt-2">
                    <div className="w-[139px] h-[5px] bg-black rounded-full" />
                </div>
            </nav>
        </div>
    );
};
