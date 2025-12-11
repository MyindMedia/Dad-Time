import React, { useState, useEffect, useMemo } from 'react';
import { Play, Square, Calendar } from 'lucide-react';
import { useEntity } from '../hooks/useEntity';
import { CalendarService } from '../services/calendar';
import type { VisitSession, Child, VisitType } from '../types';
import { differenceInSeconds } from 'date-fns';
import { motion } from 'framer-motion';
import { HapticFeedback, requestWakeLock, releaseWakeLock } from '../utils/ios';
import { pulse, bounceIn } from '../lib/animations';
import {
    startBackgroundTimer,
    stopBackgroundTimer,
    getTimerElapsed,
    getBackgroundState,
} from '../services/backgroundTracking';

export const Visit: React.FC = () => {
    const { items: visits, add: addVisit, update: updateVisit } = useEntity<VisitSession>('visits');
    const { items: children } = useEntity<Child>('children');

    // Find active visit (no end time)
    const activeVisit = useMemo(() =>
        visits.find(v => !v.endTime),
        [visits]
    );

    const [elapsed, setElapsed] = useState(0);
    const [selectedChildId, setSelectedChildId] = useState<string>('');
    const [visitType, setVisitType] = useState<VisitType>('physical_care');
    const [notes, setNotes] = useState('');
    const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);

    // Timer effect with background support
    useEffect(() => {
        if (!activeVisit) {
            setElapsed(0);
            return;
        }

        // Check if background timer is running
        const bgState = getBackgroundState();
        if (bgState.timerActive && bgState.timerVisitId === activeVisit.id) {
            // Resume from background state
            setElapsed(getTimerElapsed());
        }

        const interval = setInterval(() => {
            // Use background timer if available, otherwise calculate locally
            const bgElapsed = getTimerElapsed();
            if (bgElapsed > 0) {
                setElapsed(bgElapsed);
            } else {
                const seconds = differenceInSeconds(new Date(), new Date(activeVisit.startTime));
                setElapsed(seconds);
            }
        }, 1000);

        // Listen for background timer ticks
        const handleTimerTick = (event: CustomEvent) => {
            if (event.detail.visitId === activeVisit.id) {
                setElapsed(event.detail.elapsed);
            }
        };

        window.addEventListener('timer-tick' as any, handleTimerTick);

        return () => {
            clearInterval(interval);
            window.removeEventListener('timer-tick' as any, handleTimerTick);
        };
    }, [activeVisit]);

    const formatDuration = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleStart = async () => {
        if (!selectedChildId && children.length > 0) {
            if (children.length > 0 && !selectedChildId) {
                HapticFeedback.warning();
                alert('Please select a child');
                return;
            }
        }

        const childIdToUse = selectedChildId || (children[0]?.id ?? 'default-child');
        const startTime = new Date().toISOString();

        // Haptic feedback for start
        HapticFeedback.success();

        // Request wake lock to keep screen on during visit
        const lock = await requestWakeLock();
        setWakeLock(lock);

        const newVisit = addVisit({
            childId: childIdToUse,
            startTime,
            type: visitType,
            source: 'manual_start_stop',
            notes: notes
        });

        // Start background timer
        startBackgroundTimer(newVisit.id, startTime);

        setNotes('');
    };

    const handleStop = () => {
        if (activeVisit) {
            // Haptic feedback for stop
            HapticFeedback.success();

            // Stop background timer
            stopBackgroundTimer();

            // Release wake lock
            if (wakeLock) {
                releaseWakeLock(wakeLock);
                setWakeLock(null);
            }

            updateVisit(activeVisit.id, {
                endTime: new Date().toISOString(),
                notes: notes || activeVisit.notes
            });
        }
    };

    // Cleanup on unmount (but keep background timer running)
    useEffect(() => {
        return () => {
            if (wakeLock) {
                releaseWakeLock(wakeLock);
            }
            // Note: We don't stop background timer here - it continues running
            // User must explicitly stop the visit to stop the background timer
        };
    }, [wakeLock]);

    const handleExportCalendar = () => {
        if (!activeVisit) return;

        const startTime = activeVisit.startTime;
        const endTime = new Date().toISOString();
        const title = `Visit with ${children.find(c => c.id === activeVisit.childId)?.fullName || 'Child'}`;

        // Open Google Calendar
        const url = CalendarService.generateGoogleCalendarLink(title, startTime, endTime, activeVisit.notes);
        window.open(url, '_blank');
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-white p-6 space-y-6"
        >
            <motion.div
                layout
                className="border border-[#EFEFEF] rounded-2xl p-8 flex flex-col items-center justify-center space-y-4 bg-white"
            >
                <motion.div
                    className={`w-40 h-40 rounded-full flex items-center justify-center border-4 transition-colors duration-500 ${activeVisit ? 'border-[#1A66FF] text-[#1A66FF]' : 'border-[#EFEFEF] text-[#202020] opacity-40'}`}
                    variants={activeVisit ? pulse : undefined}
                    animate={activeVisit ? 'animate' : 'initial'}
                    style={{
                        boxShadow: activeVisit ? '0 0 20px rgba(26, 102, 255, 0.3)' : 'none'
                    }}
                >
                    <motion.span
                        className="text-4xl font-mono font-bold"
                        key={activeVisit ? 'active' : 'inactive'}
                        variants={bounceIn}
                        initial="initial"
                        animate="animate"
                    >
                        {activeVisit ? formatDuration(elapsed) : '00:00:00'}
                    </motion.span>
                </motion.div>
                <motion.p
                    className="text-sm text-[#202020] opacity-70 font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    transition={{ delay: 0.2 }}
                >
                    {activeVisit ? 'Visit in Progress' : 'Ready to Start'}
                </motion.p>
            </motion.div>

            {!activeVisit && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                >
                    <div className="input-group">
                        <label className="input-label">Child</label>
                        <select
                            className="input-field"
                            value={selectedChildId}
                            onChange={(e) => setSelectedChildId(e.target.value)}
                        >
                            <option value="">Select Child...</option>
                            {children.map(c => (
                                <option key={c.id} value={c.id}>{c.fullName}</option>
                            ))}
                            {children.length === 0 && <option value="default">My Child (Default)</option>}
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label text-sm font-semibold text-[#00082D]">Visit Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['physical_care', 'overnight', 'virtual_call', 'school_transport_only'] as VisitType[]).map(type => (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    key={type}
                                    onClick={() => setVisitType(type)}
                                    className={`py-3 px-4 rounded-xl text-xs font-semibold capitalize transition-colors ${visitType === type ? 'bg-[#1A66FF] text-white' : 'bg-white border border-[#EFEFEF] text-[#202020]'}`}
                                >
                                    {type.replace(/_/g, ' ')}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="input-group">
                <label className="input-label">Notes</label>
                <textarea
                    className="input-field"
                    rows={3}
                    placeholder="Add notes about this visit..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </div>

            <div className="pt-4">
                {activeVisit ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleStop}
                            className="flex-1 bg-[#F14040] text-white py-4 px-6 rounded-full font-semibold text-base flex items-center justify-center gap-2"
                        >
                            <Square size={20} /> Stop Visit
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleExportCalendar}
                            className="w-14 h-14 bg-white border border-[#EFEFEF] rounded-full flex items-center justify-center"
                            title="Add to Google Calendar"
                        >
                            <Calendar size={22} className="text-[#1A66FF]" />
                        </motion.button>
                    </motion.div>
                ) : (
                    <motion.button whileTap={{ scale: 0.95 }} onClick={handleStart} className="w-full bg-[#1A66FF] text-white py-4 px-6 rounded-full font-semibold text-base flex items-center justify-center gap-2">
                        <Play size={20} /> Start Visit
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
};
