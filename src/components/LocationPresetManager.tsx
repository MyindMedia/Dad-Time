import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Edit2, Home, School, Briefcase, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LocationPreset } from '../services/backgroundAutomation';
import {
    getLocationPresets,
    saveLocationPreset,
    deleteLocationPreset,
    updateLocationPreset,
} from '../services/backgroundAutomation';
import { HapticFeedback } from '../utils/ios';
import { fadeInUp } from '../lib/animations';
import { AnimatedCard } from './animated/AnimatedCard';
import { BottomSheet } from './animated/BottomSheet';
import type { Child } from '../types';

type LocationPresetManagerProps = {
    children: Child[];
};

export const LocationPresetManager: React.FC<LocationPresetManagerProps> = ({ children }) => {
    const [presets, setPresets] = useState<LocationPreset[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingPreset, setEditingPreset] = useState<LocationPreset | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [type, setType] = useState<LocationPreset['type']>('home');
    const [radius, setRadius] = useState(100); // meters
    const [selectedChildId, setSelectedChildId] = useState<string>('');
    const [enterTrigger, setEnterTrigger] = useState<'start_visit' | 'stop_trip' | 'none'>('none');
    const [exitTrigger, setExitTrigger] = useState<'stop_visit' | 'start_trip' | 'none'>('none');
    const [currentLat, setCurrentLat] = useState<number | null>(null);
    const [currentLng, setCurrentLng] = useState<number | null>(null);
    const [gettingLocation, setGettingLocation] = useState(false);

    useEffect(() => {
        loadPresets();
    }, []);

    const loadPresets = () => {
        const loaded = getLocationPresets();
        setPresets(loaded);
    };

    const handleGetCurrentLocation = () => {
        setGettingLocation(true);
        HapticFeedback.light();

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCurrentLat(position.coords.latitude);
                setCurrentLng(position.coords.longitude);
                setGettingLocation(false);
                HapticFeedback.success();
            },
            (error) => {
                console.error('Error getting location:', error);
                alert('Could not get your location. Please enable location services.');
                setGettingLocation(false);
                HapticFeedback.error();
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSave = () => {
        if (!name || currentLat === null || currentLng === null) {
            HapticFeedback.warning();
            alert('Please enter a name and get your current location');
            return;
        }

        const presetData: Omit<LocationPreset, 'id'> = {
            name,
            type,
            lat: currentLat,
            lng: currentLng,
            radius,
            childId: selectedChildId || undefined,
            autoActions: {
                enterTrigger,
                exitTrigger,
            },
        };

        if (editingPreset) {
            updateLocationPreset(editingPreset.id, presetData);
        } else {
            saveLocationPreset(presetData);
        }

        HapticFeedback.success();
        resetForm();
        loadPresets();
        setShowAddModal(false);
    };

    const handleEdit = (preset: LocationPreset) => {
        setEditingPreset(preset);
        setName(preset.name);
        setType(preset.type);
        setRadius(preset.radius);
        setCurrentLat(preset.lat);
        setCurrentLng(preset.lng);
        setSelectedChildId(preset.childId || '');
        setEnterTrigger(preset.autoActions?.enterTrigger || 'none');
        setExitTrigger(preset.autoActions?.exitTrigger || 'none');
        setShowAddModal(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Delete this location preset?')) {
            deleteLocationPreset(id);
            HapticFeedback.success();
            loadPresets();
        }
    };

    const resetForm = () => {
        setName('');
        setType('home');
        setRadius(100);
        setSelectedChildId('');
        setEnterTrigger('none');
        setExitTrigger('none');
        setCurrentLat(null);
        setCurrentLng(null);
        setEditingPreset(null);
    };

    const getTypeIcon = (type: LocationPreset['type']) => {
        switch (type) {
            case 'home':
                return <Home size={20} />;
            case 'school':
                return <School size={20} />;
            case 'work':
                return <Briefcase size={20} />;
            case 'child_location':
                return <User size={20} />;
            default:
                return <MapPin size={20} />;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#00082D] uppercase tracking-wider">
                    Location Presets
                </h3>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        resetForm();
                        setShowAddModal(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-[#1A66FF] text-white rounded-full text-xs font-semibold"
                >
                    <Plus size={16} /> Add Location
                </motion.button>
            </div>

            <AnimatePresence>
                {presets.length === 0 ? (
                    <motion.div
                        variants={fadeInUp}
                        initial="initial"
                        animate="animate"
                        className="text-center py-8 text-[#202020] opacity-70 text-sm"
                    >
                        No location presets yet. Add one to enable geofencing.
                    </motion.div>
                ) : (
                    <motion.div className="space-y-3">
                        {presets.map((preset) => (
                            <AnimatedCard
                                key={preset.id}
                                variant="staggerItem"
                                className="border border-[#EFEFEF] rounded-xl p-4 bg-white"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#1A66FF1A] flex items-center justify-center text-[#1A66FF]">
                                            {getTypeIcon(preset.type)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-[#00082D]">
                                                {preset.name}
                                            </p>
                                            <p className="text-xs text-[#202020] opacity-70">
                                                {preset.radius}m radius • {preset.type.replace(/_/g, ' ')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleEdit(preset)}
                                            className="w-8 h-8 rounded-full bg-[#1A66FF1A] flex items-center justify-center text-[#1A66FF]"
                                        >
                                            <Edit2 size={14} />
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleDelete(preset.id)}
                                            className="w-8 h-8 rounded-full bg-[#F140401A] flex items-center justify-center text-[#F14040]"
                                        >
                                            <Trash2 size={14} />
                                        </motion.button>
                                    </div>
                                </div>

                                {(preset.autoActions?.enterTrigger !== 'none' ||
                                    preset.autoActions?.exitTrigger !== 'none') && (
                                    <div className="mt-3 pt-3 border-t border-[#EFEFEF] space-y-1">
                                        {preset.autoActions?.enterTrigger !== 'none' && (
                                            <p className="text-xs text-[#10B981]">
                                                ✓ On enter:{' '}
                                                {preset.autoActions?.enterTrigger?.replace(/_/g, ' ')}
                                            </p>
                                        )}
                                        {preset.autoActions?.exitTrigger !== 'none' && (
                                            <p className="text-xs text-[#F14040]">
                                                ✓ On exit:{' '}
                                                {preset.autoActions?.exitTrigger?.replace(/_/g, ' ')}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </AnimatedCard>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add/Edit Modal */}
            <BottomSheet isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
                <div className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-[#00082D]">
                        {editingPreset ? 'Edit Location' : 'Add Location'}
                    </h3>

                    <div className="input-group">
                        <label className="input-label">Name</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="e.g., Home, School, Work"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['home', 'school', 'work', 'child_location', 'custom'] as const).map((t) => (
                                <motion.button
                                    key={t}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setType(t)}
                                    className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize transition-colors ${
                                        type === t
                                            ? 'bg-[#1A66FF] text-white'
                                            : 'bg-white border border-[#EFEFEF] text-[#202020]'
                                    }`}
                                >
                                    {t.replace(/_/g, ' ')}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Location</label>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleGetCurrentLocation}
                            disabled={gettingLocation}
                            className="w-full py-3 px-4 rounded-xl border border-[#EFEFEF] text-sm font-semibold flex items-center justify-center gap-2 bg-white"
                        >
                            <MapPin size={16} />
                            {gettingLocation
                                ? 'Getting location...'
                                : currentLat
                                ? `${currentLat.toFixed(6)}, ${currentLng?.toFixed(6)}`
                                : 'Use Current Location'}
                        </motion.button>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Radius (meters)</label>
                        <input
                            type="number"
                            className="input-field"
                            placeholder="100"
                            value={radius}
                            onChange={(e) => setRadius(parseInt(e.target.value) || 100)}
                        />
                    </div>

                    {type === 'child_location' && children.length > 0 && (
                        <div className="input-group">
                            <label className="input-label">Child</label>
                            <select
                                className="input-field"
                                value={selectedChildId}
                                onChange={(e) => setSelectedChildId(e.target.value)}
                            >
                                <option value="">Select Child...</option>
                                {children.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.fullName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="input-group">
                        <label className="input-label">When Entering</label>
                        <select
                            className="input-field"
                            value={enterTrigger}
                            onChange={(e) =>
                                setEnterTrigger(e.target.value as typeof enterTrigger)
                            }
                        >
                            <option value="none">Do Nothing</option>
                            <option value="start_visit">Start Visit</option>
                            <option value="stop_trip">Stop Trip</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">When Exiting</label>
                        <select
                            className="input-field"
                            value={exitTrigger}
                            onChange={(e) =>
                                setExitTrigger(e.target.value as typeof exitTrigger)
                            }
                        >
                            <option value="none">Do Nothing</option>
                            <option value="stop_visit">Stop Visit</option>
                            <option value="start_trip">Start Trip</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                resetForm();
                                setShowAddModal(false);
                            }}
                            className="flex-1 py-3 px-4 rounded-full border border-[#EFEFEF] text-[#202020] font-semibold"
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSave}
                            className="flex-1 py-3 px-4 rounded-full bg-[#1A66FF] text-white font-semibold"
                        >
                            {editingPreset ? 'Update' : 'Save'}
                        </motion.button>
                    </div>
                </div>
            </BottomSheet>
        </div>
    );
};
