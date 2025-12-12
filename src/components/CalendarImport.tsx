import React, { useState, useRef } from 'react';
import { Upload, Calendar, Check, X, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Child, VisitSession } from '../types';
import { type ParsedCalendarEvent, parseICSFile, expandRecurringEvent, convertEventsToVisits } from '../services/calendar';
import { storage } from '../services/storage';
import { HapticFeedback } from '../utils/ios';
import { showToast } from '../hooks/useToast';
import { BottomSheet } from './animated/BottomSheet';
import { AnimatedCard } from './animated/AnimatedCard';
import { format, parseISO } from 'date-fns';

type CalendarImportProps = {
    children: Child[];
};

export const CalendarImport: React.FC<CalendarImportProps> = ({ children }) => {
    const [showPreview, setShowPreview] = useState(false);
    const [previewEvents, setPreviewEvents] = useState<ParsedCalendarEvent[]>([]);
    const [selectedChild, setSelectedChild] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.name.endsWith('.ics') && !file.name.endsWith('.ical')) {
            HapticFeedback.warning();
            showToast('Please select a valid .ics or .ical file', 'warning');
            return;
        }

        setIsProcessing(true);
        HapticFeedback.light();

        try {
            // Read and parse file
            const content = await file.text();
            let events = parseICSFile(content);

            // Expand recurring events for preview
            events = events.flatMap(event =>
                event.isRecurring ? expandRecurringEvent(event, 12) : [event]
            );

            // Filter to custody-related only
            const custodyEvents = events.filter(e => e.isCustodyRelated);

            if (custodyEvents.length === 0) {
                HapticFeedback.warning();
                showToast('No custody-related events found in calendar', 'warning');
                setIsProcessing(false);
                return;
            }

            setPreviewEvents(custodyEvents);
            setShowPreview(true);
            setIsProcessing(false);
            HapticFeedback.success();
        } catch (error) {
            console.error('Error parsing ICS file:', error);
            HapticFeedback.error();
            showToast('Failed to parse calendar file', 'error');
            setIsProcessing(false);
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleImport = () => {
        if (!selectedChild) {
            HapticFeedback.warning();
            showToast('Please select a child', 'warning');
            return;
        }

        const visits = convertEventsToVisits(previewEvents, selectedChild);

        // Check for duplicates
        const existingVisits = storage.get<VisitSession>('visits');
        let importedCount = 0;

        for (const visit of visits) {
            const exists = existingVisits.some(
                (v: VisitSession) => v.childId === visit.childId && v.startTime === visit.startTime
            );

            if (!exists) {
                storage.add('visits', visit);
                importedCount++;
            }
        }

        HapticFeedback.success();
        showToast(`Imported ${importedCount} visits (${visits.length - importedCount} duplicates skipped)`, 'success');

        setShowPreview(false);
        setPreviewEvents([]);
        setSelectedChild('');
    };

    const handleCancel = () => {
        setShowPreview(false);
        setPreviewEvents([]);
        setSelectedChild('');
        HapticFeedback.light();
    };

    const handleButtonClick = () => {
        HapticFeedback.light();
        fileInputRef.current?.click();
    };

    return (
        <>
            {/* Import Button */}
            <div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".ics,.ical"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleButtonClick}
                    disabled={isProcessing}
                    className="w-full py-3 px-4 bg-[#1A66FF] text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Upload size={18} />
                    {isProcessing ? 'Processing...' : 'Import Calendar (.ics)'}
                </motion.button>
                <p className="text-xs text-[#202020] opacity-70 mt-2 text-center">
                    Import custody schedule from court order or calendar app
                </p>
            </div>

            {/* Preview Modal */}
            <BottomSheet
                isOpen={showPreview}
                onClose={handleCancel}
                title="Preview Calendar Import"
            >
                <div className="space-y-4 p-4">
                    {/* Child Selection */}
                    <div className="input-group">
                        <label className="input-label">Select Child</label>
                        <div className="space-y-2">
                            {children.map(child => (
                                <motion.button
                                    key={child.id}
                                    whileTap={{ scale: 0.98 }}
                                    type="button"
                                    onClick={() => {
                                        setSelectedChild(child.id);
                                        HapticFeedback.light();
                                    }}
                                    className={`w-full py-2 px-3 rounded-lg text-sm text-left ${
                                        selectedChild === child.id
                                            ? 'bg-[#1A66FF]/10 border-2 border-[#1A66FF]'
                                            : 'bg-[#FAFAFA] border border-[#EFEFEF]'
                                    }`}
                                >
                                    {child.fullName}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Events Preview */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-[#00082D]">
                                Found {previewEvents.length} custody-related events
                            </h4>
                        </div>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {previewEvents.slice(0, 20).map((event, index) => (
                                <AnimatedCard
                                    key={index}
                                    variant="staggerItem"
                                    className="p-3 bg-[#FAFAFA] rounded-lg border border-[#EFEFEF]"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h5 className="font-medium text-sm text-[#00082D] truncate">
                                                {event.summary}
                                            </h5>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-[#202020] opacity-70">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={10} />
                                                    {format(parseISO(event.startTime), 'MMM d, yyyy')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={10} />
                                                    {format(parseISO(event.startTime), 'h:mm a')}
                                                    {event.endTime && ` - ${format(parseISO(event.endTime), 'h:mm a')}`}
                                                </span>
                                            </div>
                                            {event.location && (
                                                <div className="flex items-center gap-1 mt-1 text-xs text-[#202020] opacity-70">
                                                    <MapPin size={10} />
                                                    {event.location}
                                                </div>
                                            )}
                                            <div className="mt-1">
                                                <span className="inline-block px-2 py-0.5 bg-[#1A66FF]/10 text-[#1A66FF] rounded text-xs font-medium capitalize">
                                                    {event.suggestedVisitType?.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                        <Check size={16} className="text-green-500 flex-shrink-0 mt-1" />
                                    </div>
                                </AnimatedCard>
                            ))}
                            {previewEvents.length > 20 && (
                                <p className="text-center text-xs text-[#202020] opacity-70 py-2">
                                    + {previewEvents.length - 20} more events
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCancel}
                            className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-full font-semibold flex items-center justify-center gap-2"
                        >
                            <X size={18} />
                            Cancel
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleImport}
                            disabled={!selectedChild}
                            className="flex-1 py-3 bg-[#1A66FF] text-white rounded-full font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Check size={18} />
                            Import {previewEvents.length}
                        </motion.button>
                    </div>
                </div>
            </BottomSheet>
        </>
    );
};
