import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Edit2, Clock, Users, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CustodySchedule, Child, DayOfWeek, RecurrencePattern, VisitType } from '../types';
import {
    getCustodySchedules,
    createCustodySchedule,
    updateCustodySchedule,
    deleteCustodySchedule,
    toggleScheduleActive,
    getScheduleDescription,
    validateSchedule,
    downloadScheduleAsICS,
    generateVisitsFromSchedule,
} from '../services/custodySchedule';
import { storage } from '../services/storage';
import { HapticFeedback } from '../utils/ios';
import { AnimatedCard } from './animated/AnimatedCard';
import { BottomSheet } from './animated/BottomSheet';
import { showToast } from '../hooks/useToast';

type CustodyScheduleManagerProps = {
    children: Child[];
};

const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
    { value: 'sunday', label: 'Sun' },
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' },
    { value: 'saturday', label: 'Sat' },
];

export const CustodyScheduleManager: React.FC<CustodyScheduleManagerProps> = ({ children }) => {
    const [schedules, setSchedules] = useState<CustodySchedule[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<CustodySchedule | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [pattern, setPattern] = useState<RecurrencePattern>('weekly');
    const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
    const [visitType, setVisitType] = useState<VisitType>('physical_care');
    const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>([]);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [notes, setNotes] = useState('');
    const [active, setActive] = useState(true);

    useEffect(() => {
        loadSchedules();
    }, []);

    const loadSchedules = () => {
        const loaded = getCustodySchedules();
        setSchedules(loaded);
    };

    const handleSave = () => {
        const scheduleData: Omit<CustodySchedule, 'id' | 'createdAt' | 'updatedAt'> = {
            name,
            pattern,
            childIds: selectedChildren,
            visitType,
            daysOfWeek: pattern !== 'once' ? daysOfWeek : undefined,
            startDate,
            endDate: endDate || undefined,
            startTime,
            endTime,
            notes: notes || undefined,
            active,
        };

        // Validate
        const errors = validateSchedule(scheduleData);
        if (errors.length > 0) {
            HapticFeedback.warning();
            alert('Please fix the following errors:\n\n' + errors.join('\n'));
            return;
        }

        if (editingSchedule) {
            updateCustodySchedule(editingSchedule.id, scheduleData);
            showToast('Schedule updated successfully', 'success');
        } else {
            createCustodySchedule(scheduleData);
            showToast('Schedule created successfully', 'success');
        }

        HapticFeedback.success();
        resetForm();
        loadSchedules();
        setShowAddModal(false);
    };

    const handleEdit = (schedule: CustodySchedule) => {
        setEditingSchedule(schedule);
        setName(schedule.name);
        setPattern(schedule.pattern);
        setSelectedChildren(schedule.childIds);
        setVisitType(schedule.visitType);
        setDaysOfWeek(schedule.daysOfWeek || []);
        setStartDate(schedule.startDate);
        setEndDate(schedule.endDate || '');
        setStartTime(schedule.startTime || '09:00');
        setEndTime(schedule.endTime || '17:00');
        setNotes(schedule.notes || '');
        setActive(schedule.active);
        setShowAddModal(true);
        HapticFeedback.light();
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this schedule?')) {
            deleteCustodySchedule(id);
            HapticFeedback.success();
            showToast('Schedule deleted', 'info');
            loadSchedules();
        }
    };

    const handleToggleActive = (id: string) => {
        toggleScheduleActive(id);
        HapticFeedback.light();
        loadSchedules();
    };

    const handleExportICS = (schedule: CustodySchedule) => {
        downloadScheduleAsICS(schedule);
        HapticFeedback.success();
        showToast('Schedule exported as ICS', 'success');
    };

    const handleGenerateVisits = (schedule: CustodySchedule) => {
        const visits = generateVisitsFromSchedule(schedule, 12);

        if (visits.length === 0) {
            showToast('No visits to generate', 'warning');
            return;
        }

        // Add visits to storage
        let addedCount = 0;
        for (const visit of visits) {
            storage.add('visits', visit);
            addedCount++;
        }

        HapticFeedback.success();
        showToast(`Generated ${addedCount} visits for the next 12 weeks`, 'success');
    };

    const resetForm = () => {
        setEditingSchedule(null);
        setName('');
        setPattern('weekly');
        setSelectedChildren([]);
        setVisitType('physical_care');
        setDaysOfWeek([]);
        setStartDate(new Date().toISOString().split('T')[0]);
        setEndDate('');
        setStartTime('09:00');
        setEndTime('17:00');
        setNotes('');
        setActive(true);
    };

    const handleToggleDay = (day: DayOfWeek) => {
        if (daysOfWeek.includes(day)) {
            setDaysOfWeek(daysOfWeek.filter(d => d !== day));
        } else {
            setDaysOfWeek([...daysOfWeek, day]);
        }
        HapticFeedback.light();
    };

    const handleToggleChild = (childId: string) => {
        if (selectedChildren.includes(childId)) {
            setSelectedChildren(selectedChildren.filter(id => id !== childId));
        } else {
            setSelectedChildren([...selectedChildren, childId]);
        }
        HapticFeedback.light();
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Calendar size={20} className="text-[#1A66FF]" />
                    <h3 className="font-semibold text-[#00082D]">Custody Schedules</h3>
                </div>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        HapticFeedback.light();
                        resetForm();
                        setShowAddModal(true);
                    }}
                    className="px-3 py-2 bg-[#1A66FF] text-white rounded-xl text-sm font-semibold flex items-center gap-1"
                >
                    <Plus size={16} /> Add Schedule
                </motion.button>
            </div>

            {/* Schedules List */}
            <div className="space-y-3">
                {schedules.length === 0 ? (
                    <div className="text-center py-8 text-[#202020] opacity-70">
                        <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No custody schedules yet</p>
                        <p className="text-xs mt-1">Create recurring schedules to auto-generate visits</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {schedules.map(schedule => (
                            <AnimatedCard
                                key={schedule.id}
                                variant="staggerItem"
                                className="p-3 bg-[#FAFAFA] rounded-xl border border-[#EFEFEF]"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-sm text-[#00082D]">{schedule.name}</h4>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                schedule.active
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {schedule.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-[#202020] opacity-70 mb-2">
                                            {getScheduleDescription(schedule)}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-[#202020] opacity-70">
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {schedule.startTime} - {schedule.endTime}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users size={12} />
                                                {schedule.childIds.length} child{schedule.childIds.length !== 1 ? 'ren' : ''}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleExportICS(schedule)}
                                            className="p-2 rounded-lg hover:bg-[#1A66FF]/10 text-[#1A66FF]"
                                            title="Export as ICS"
                                        >
                                            <Download size={16} />
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleEdit(schedule)}
                                            className="p-2 rounded-lg hover:bg-[#1A66FF]/10 text-[#1A66FF]"
                                        >
                                            <Edit2 size={16} />
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleDelete(schedule.id)}
                                            className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                                        >
                                            <Trash2 size={16} />
                                        </motion.button>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleToggleActive(schedule.id)}
                                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium ${
                                            schedule.active
                                                ? 'bg-gray-200 text-gray-700'
                                                : 'bg-green-500 text-white'
                                        }`}
                                    >
                                        {schedule.active ? 'Deactivate' : 'Activate'}
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleGenerateVisits(schedule)}
                                        className="flex-1 py-2 px-3 bg-[#1A66FF] text-white rounded-lg text-xs font-medium"
                                    >
                                        Generate Visits
                                    </motion.button>
                                </div>
                            </AnimatedCard>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Add/Edit Modal */}
            <BottomSheet
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false);
                    resetForm();
                }}
                title={editingSchedule ? 'Edit Schedule' : 'New Custody Schedule'}
            >
                <div className="space-y-4 p-4">
                    {/* Schedule Name */}
                    <div className="input-group">
                        <label className="input-label">Schedule Name</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="e.g., Standard Custody Schedule"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>

                    {/* Pattern */}
                    <div className="input-group">
                        <label className="input-label">Recurrence</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['weekly', 'biweekly', 'custom', 'once'] as RecurrencePattern[]).map(p => (
                                <motion.button
                                    key={p}
                                    whileTap={{ scale: 0.95 }}
                                    type="button"
                                    onClick={() => {
                                        setPattern(p);
                                        HapticFeedback.light();
                                    }}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium capitalize ${
                                        pattern === p
                                            ? 'bg-[#1A66FF] text-white'
                                            : 'bg-[#FAFAFA] text-[#202020] border border-[#EFEFEF]'
                                    }`}
                                >
                                    {p}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Children Selection */}
                    <div className="input-group">
                        <label className="input-label">Children</label>
                        <div className="space-y-2">
                            {children.map(child => (
                                <motion.button
                                    key={child.id}
                                    whileTap={{ scale: 0.98 }}
                                    type="button"
                                    onClick={() => handleToggleChild(child.id)}
                                    className={`w-full py-2 px-3 rounded-lg text-sm text-left ${
                                        selectedChildren.includes(child.id)
                                            ? 'bg-[#1A66FF]/10 border-2 border-[#1A66FF]'
                                            : 'bg-[#FAFAFA] border border-[#EFEFEF]'
                                    }`}
                                >
                                    {child.fullName}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Days of Week (if not one-time) */}
                    {pattern !== 'once' && (
                        <div className="input-group">
                            <label className="input-label">Days of Week</label>
                            <div className="grid grid-cols-7 gap-1">
                                {DAYS_OF_WEEK.map(day => (
                                    <motion.button
                                        key={day.value}
                                        whileTap={{ scale: 0.9 }}
                                        type="button"
                                        onClick={() => handleToggleDay(day.value)}
                                        className={`py-2 px-1 rounded-lg text-xs font-medium ${
                                            daysOfWeek.includes(day.value)
                                                ? 'bg-[#1A66FF] text-white'
                                                : 'bg-[#FAFAFA] text-[#202020] border border-[#EFEFEF]'
                                        }`}
                                    >
                                        {day.label}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Visit Type */}
                    <div className="input-group">
                        <label className="input-label">Visit Type</label>
                        <select
                            className="input-field"
                            value={visitType}
                            onChange={e => setVisitType(e.target.value as VisitType)}
                        >
                            <option value="physical_care">Physical Care</option>
                            <option value="overnight">Overnight</option>
                            <option value="virtual_call">Virtual Call</option>
                            <option value="school_transport_only">School Transport Only</option>
                        </select>
                    </div>

                    {/* Times */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="input-group">
                            <label className="input-label">Start Time</label>
                            <input
                                type="time"
                                className="input-field"
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">End Time</label>
                            <input
                                type="time"
                                className="input-field"
                                value={endTime}
                                onChange={e => setEndTime(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="input-group">
                            <label className="input-label">Start Date</label>
                            <input
                                type="date"
                                className="input-field"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label">End Date (Optional)</label>
                            <input
                                type="date"
                                className="input-field"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="input-group">
                        <label className="input-label">Notes (Optional)</label>
                        <textarea
                            className="input-field"
                            rows={2}
                            placeholder="Additional schedule details..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-xl">
                        <span className="text-sm font-medium text-[#00082D]">Active</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={active}
                                onChange={e => setActive(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A66FF]"></div>
                        </label>
                    </div>

                    {/* Save Button */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSave}
                        className="w-full py-4 bg-[#1A66FF] text-white rounded-full font-semibold"
                    >
                        {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                    </motion.button>
                </div>
            </BottomSheet>
        </div>
    );
};
