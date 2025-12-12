import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, MapPin, DollarSign, ChevronRight, Calendar, Clock, CheckCircle2, Circle, Coffee, Briefcase, RefreshCw } from 'lucide-react';
import { useEntity } from '../hooks/useEntity';
import type { VisitSession, Expense, Trip } from '../types';
import { startOfDay, isAfter, differenceInMinutes, format, addDays, subDays } from 'date-fns';
import { HapticFeedback } from '../utils/ios';
import { motion } from 'framer-motion';
import { AnimatedCard } from '../components/animated/AnimatedCard';
import { AnimatedList } from '../components/animated/AnimatedList';
import { springConfig } from '../lib/animations';
import { CalendarWidget } from '../components/CalendarWidget';

export const Home: React.FC = () => {
    const navigate = useNavigate();
    const { items: visits } = useEntity<VisitSession>('visits');
    const { items: expenses } = useEntity<Expense>('expenses');
    const { items: trips } = useEntity<Trip>('trips');

    const stats = useMemo(() => {
        const now = new Date();
        const todayStart = startOfDay(now);

        const todayVisits = visits.filter(v => isAfter(new Date(v.startTime), todayStart));
        const todayMinutes = todayVisits.reduce((acc, v) => {
            const end = v.endTime ? new Date(v.endTime) : now;
            return acc + differenceInMinutes(end, new Date(v.startTime));
        }, 0);
        const todayHours = Math.floor(todayMinutes / 60);
        const todayMins = todayMinutes % 60;
        const progress = Math.min((todayMinutes / (8 * 60)) * 100, 100);

        return { todayHours, todayMins, progress };
    }, [visits]);

    const weekDates = useMemo(() => {
        const today = new Date();
        return Array.from({ length: 7 }, (_, i) => {
            const date = addDays(subDays(today, 3), i);
            return {
                day: format(date, 'EEE'),
                date: format(date, 'd'),
                isToday: i === 3,
                fullDate: date
            };
        });
    }, []);

    const tasks = [
        { id: 1, text: 'Log today\'s visit time', icon: RefreshCw, done: visits.length > 0, path: '/visit' },
        { id: 2, text: 'Track a trip with GPS', icon: MapPin, done: trips.length > 0, path: '/trips' },
        { id: 3, text: 'Add an expense receipt', icon: DollarSign, done: expenses.length > 0, path: '/expenses' },
    ];

    const quickActions = [
        { icon: Play, label: 'Start Time', sublabel: 'Set start time manually', path: '/visit', actionIcon: 'play' },
        { icon: Coffee, label: 'Break', sublabel: '10 minutes', path: '/visit', actionIcon: 'edit' },
        { icon: Briefcase, label: 'Office Work', sublabel: '3 Hours 30 Minutes', path: '/visit', actionIcon: 'play' },
    ];

    const handleActionClick = (path: string) => {
        HapticFeedback.medium();
        navigate(path);
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Status Bar Spacer */}
            <div className="h-12 w-full"></div>

            {/* Header */}
            <header className="flex justify-between items-center px-6 py-3">
                <div className="flex items-center gap-2">
                    {/* Logo Icon */}
                    <div className="w-8 h-8 bg-[#1A66FF] rounded-full flex items-center justify-center">
                        <Clock size={18} className="text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-[#202020] capitalize">Tempo Track</h1>
                </div>
                <button className="w-10 h-10 flex items-center justify-center bg-[#FAFAFA] rounded-full">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="5" cy="10" r="1.5" fill="#202020"/>
                        <circle cx="10" cy="10" r="1.5" fill="#202020"/>
                        <circle cx="15" cy="10" r="1.5" fill="#202020"/>
                    </svg>
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-6 pb-32 overflow-y-auto">
                {/* Date Section */}
                <div className="flex flex-col gap-2 mb-6">
                    <div className="flex items-center gap-2 opacity-70">
                        <Calendar className="w-3.5 h-3.5 text-[#202020]" />
                        <p className="text-sm text-[#202020]">{format(new Date(), 'MMMM d, yyyy, EEEE')}</p>
                    </div>
                    <h2 className="text-[22px] font-bold text-[#170A21] leading-7">
                        Today Working Hours
                    </h2>
                </div>

                {/* Working Hours Card */}
                <div className="border border-[#EFEFEF] rounded-xl overflow-hidden mb-6">
                    {/* Progress Section */}
                    <div className="bg-[#1A66FF1A] p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <h3 className="text-base font-semibold text-[#00082D] capitalize">
                                Working hours
                            </h3>
                            <span className="text-sm font-semibold text-[#00082D]">
                                {stats.todayHours}hr {stats.todayMins}min
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="h-6 flex items-center">
                                <div className="flex-1 h-1.5 bg-[#1A66FF33] rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-[#1A66FF] rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stats.progress}%` }}
                                        transition={springConfig.smooth}
                                    />
                                </div>
                            </div>
                            <motion.p
                                className="text-xs text-[#202020] opacity-70 leading-[18px]"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.7 }}
                                transition={{ delay: 0.3 }}
                            >
                                {stats.progress.toFixed(0)}% task complete for today - You can do this!
                            </motion.p>
                        </div>
                    </div>

                    {/* Checklist Section */}
                    <div className="bg-white border-t border-[#EFEFEF] p-4 flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-[#00082D]">
                                Getting started first!
                            </h3>
                            <svg width="11" height="7" viewBox="0 0 11 7" fill="none">
                                <path d="M5.24316 0C5.48926 0 5.70801 0.0820312 5.87207 0.246094L10.2471 4.62109C10.6025 4.94922 10.6025 5.52344 10.2471 5.85156C9.91895 6.20703 9.34473 6.20703 9.0166 5.85156L5.24316 2.10547L1.49707 5.85156C1.16895 6.20703 0.594727 6.20703 0.266602 5.85156C-0.0888672 5.52344 -0.0888672 4.94922 0.266602 4.62109L4.6416 0.246094C4.80566 0.0820312 5.02441 0 5.24316 0Z" fill="#202020"/>
                            </svg>
                        </div>

                        <hr className="border-[#EFEFEF]" />

                        <AnimatedList staggerDelay={0.1} className="flex flex-col gap-3">
                            {tasks.map((task) => (
                                <AnimatedCard
                                    key={task.id}
                                    variant="staggerItem"
                                    tap
                                    className="flex justify-between items-center cursor-pointer"
                                    onClick={() => handleActionClick(task.path)}
                                >
                                    <div className="flex items-center gap-2">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.3 + task.id * 0.1, ...springConfig.bouncy }}
                                        >
                                            {task.done ? (
                                                <CheckCircle2 size={12} className="text-[#1A66FF]" />
                                            ) : (
                                                <Circle size={12} className="text-[#20202080]" />
                                            )}
                                        </motion.div>
                                        <p className="text-xs text-[#202020] opacity-70 leading-[18px]">
                                            {task.text}
                                        </p>
                                    </div>
                                    <ChevronRight size={12} className="text-[#1A66FF]" />
                                </AnimatedCard>
                            ))}
                        </AnimatedList>

                        {/* Primary CTA */}
                        <button
                            onClick={() => handleActionClick('/visit')}
                            className="w-full bg-[#1A66FF] text-white text-sm font-semibold py-4 px-6 rounded-full"
                        >
                            Set your first working task
                        </button>
                    </div>
                </div>

                {/* Week Calendar - horizontal scroll with two dots */}
                <div className="flex gap-0 overflow-x-auto mb-6">
                    {weekDates.map((d, i) => (
                        <button
                            key={i}
                            className={`flex-1 min-w-[57.5px] flex flex-col items-center gap-2 p-3 rounded-xl transition-colors ${
                                d.isToday ? 'bg-[#00082D]' : 'bg-white border border-[#EFEFEF]'
                            }`}
                        >
                            <span
                                className={`text-xs font-medium ${
                                    d.isToday ? 'text-[#FAFAFA] opacity-70' : 'text-[#202020] opacity-70'
                                }`}
                            >
                                {d.day}
                            </span>
                            <span
                                className={`text-base font-semibold ${
                                    d.isToday ? 'text-[#FAFAFA]' : 'text-[#202020]'
                                }`}
                            >
                                {d.date}
                            </span>
                            <div className="flex gap-0.5">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.isToday ? '#1A66FF' : '#7CACE2' }}></div>
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.isToday ? '#FAFAFA' : '#20202033' }}></div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Calendar Widget */}
                <div className="mb-6">
                    <CalendarWidget />
                </div>

                {/* Task Today */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold text-[#00082D]">Task Today</h3>
                        <button className="text-xs text-[#202020] opacity-70 font-medium">See All</button>
                    </div>

                    <AnimatedList staggerDelay={0.08} className="flex flex-col gap-3">
                        {quickActions.map((action, index) => (
                            <AnimatedCard
                                key={index}
                                variant="staggerItem"
                                hover
                                tap
                                className="w-full bg-white rounded-2xl p-4 border border-[#EFEFEF] flex items-center justify-between cursor-pointer"
                                onClick={() => handleActionClick(action.path)}
                            >
                                <div className="flex items-center gap-3">
                                    <motion.div
                                        className="w-12 h-12 bg-[#1A66FF1A] rounded-full flex items-center justify-center border border-[#1A66FF33]"
                                        whileHover={{ rotate: 360 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <action.icon size={20} className="text-[#1A66FF]" />
                                    </motion.div>
                                    <div className="text-left">
                                        <p className="font-semibold text-[#00082D] text-sm">{action.label}</p>
                                        <p className="text-xs text-[#1A66FF]">{action.sublabel}</p>
                                    </div>
                                </div>
                                <motion.div
                                    className="w-8 h-8 bg-[#F79C21] rounded-full flex items-center justify-center"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    {action.actionIcon === 'play' ? (
                                        <Play size={14} className="text-white" fill="white" />
                                    ) : (
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                            <path d="M10 4L4 10M4 4L10 10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                                        </svg>
                                    )}
                                </motion.div>
                            </AnimatedCard>
                        ))}
                    </AnimatedList>
        </div>
            </main>

            {/* Bottom Input (Home screen only) */}
            <div className="fixed bottom-[107px] left-0 right-0 flex items-center justify-between px-6 py-3 border-t border-[#EFEFEF] bg-[#FAFAFA]">
                <input
                    type="text"
                    placeholder="I'm working on..."
                    className="flex-1 bg-transparent text-sm text-[#202020] opacity-70 outline-none"
                />
                <button
                    onClick={() => handleActionClick('/visit')}
                    className="w-[49px] h-[45px] flex items-center justify-center bg-[#1A66FF] rounded-full"
                >
                    <svg width="49" height="45" viewBox="0 0 49 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="49" height="44.2473" rx="22.1236" fill="#1A66FF" />
                        <path d="M29.1211 20.9938C29.5039 21.2399 29.75 21.6774 29.75 22.1149C29.75 22.5797 29.5039 23.0172 29.1211 23.236L21.2461 28.0485C20.8359 28.2946 20.3164 28.3219 19.9062 28.0758C19.4961 27.8571 19.25 27.4196 19.25 26.9274V17.3024C19.25 16.8375 19.4961 16.4 19.9062 16.1813C20.3164 15.9352 20.8359 15.9352 21.2461 16.2086L29.1211 20.9938Z" fill="#FAFAFA" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
