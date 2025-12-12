import React, { useState, useEffect } from 'react';
import { User, Plus, Trash2, Save, Zap, LogIn, LogOut } from 'lucide-react';
import { useEntity } from '../hooks/useEntity';
import type { ParentProfile, Child } from '../types';
import { motion } from 'framer-motion';
import { LocationPresetManager } from '../components/LocationPresetManager';
import { CustodyScheduleManager } from '../components/CustodyScheduleManager';
import { CalendarImport } from '../components/CalendarImport';
import {
    getAutomationSettings,
    updateAutomationSettings,
    type AutomationSettings,
} from '../services/backgroundAutomation';

export const Settings: React.FC = () => {
    const { items: profiles, add: addProfile, update: updateProfile } = useEntity<ParentProfile>('parent_profile');
    const { items: children, add: addChild, remove: removeChild } = useEntity<Child>('children');

    const [name, setName] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [newChildName, setNewChildName] = useState('');
    const [automationSettings, setAutomationSettings] = useState<AutomationSettings>(
        getAutomationSettings()
    );

    useEffect(() => {
        if (profiles.length > 0) {
            setName(profiles[0].fullName);
            setCurrency(profiles[0].defaultCurrency);
        }
    }, [profiles]);

    useEffect(() => {
        const settings = getAutomationSettings();
        setAutomationSettings(settings);
    }, []);

    useEffect(() => {
        AuthService.getUser().then((u) => setAuthUserEmail(u?.email || ''));
        const unsub = AuthService.onAuthStateChange(() => {
            AuthService.getUser().then((u) => setAuthUserEmail(u?.email || ''));
        });
        return unsub;
    }, []);

    const handleSaveProfile = () => {
        if (profiles.length > 0) {
            updateProfile(profiles[0].id, { fullName: name, defaultCurrency: currency });
        } else {
            addProfile({
                fullName: name,
                defaultCurrency: currency,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });
        }
        alert('Profile saved!');
    };

    const handleAddChild = () => {
        if (!newChildName) return;
        addChild({
            parentId: profiles[0]?.id || 'unknown',
            fullName: newChildName
        });
        setNewChildName('');
    };

    const handleAutomationToggle = (key: keyof AutomationSettings, value: boolean | number) => {
        const updated = { ...automationSettings, [key]: value };
        setAutomationSettings(updated);
        updateAutomationSettings(updated);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-white p-6 space-y-6"
        >
            <h2 className="text-xl font-bold text-[#00082D]">Settings</h2>

            <motion.div layout className="border border-[#EFEFEF] rounded-2xl p-4 bg-white">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-[#00082D]">
                    <User size={20} className="text-[#1A66FF]" /> Account
                </h3>
                <div className="space-y-4">
                    <div className="p-3 rounded-xl border border-[#EFEFEF] bg-[#FAFAFA]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-[#00082D]">Signed in</p>
                                <p className="text-xs text-[#202020] opacity-70">{authUserEmail || 'Not signed in'}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleSignOut} className="px-3 py-2 rounded-full bg-[#EFEFEF] text-[#202020] text-xs font-semibold flex items-center gap-1">
                                    <LogOut size={14} /> Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        <input
                            type="email"
                            className="input-field"
                            placeholder="Email"
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            className="input-field"
                            placeholder="Password"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <button onClick={handleSignIn} className="flex-1 px-4 py-3 bg-[#1A66FF] text-white rounded-full font-semibold text-sm flex items-center justify-center gap-2">
                                <LogIn size={16} /> Sign In
                            </button>
                            <button onClick={handleSignUp} className="flex-1 px-4 py-3 bg-[#00082D] text-white rounded-full font-semibold text-sm">Create Account</button>
                        </div>
                    </div>
                    <div className="input-group">
                        <label className="input-label text-sm font-semibold text-[#00082D]">Full Name</label>
                        <input
                            type="text"
                            className="input-field"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label text-sm font-semibold text-[#00082D]">Currency</label>
                        <select
                            className="input-field"
                            value={currency}
                            onChange={e => setCurrency(e.target.value)}
                        >
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                        </select>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={handleSaveProfile} className="w-full bg-[#1A66FF] text-white py-4 px-6 rounded-full font-semibold flex items-center justify-center gap-2">
                        <Save size={18} /> Save Profile
                    </motion.button>
                </div>
            </motion.div>

            <motion.div layout className="border border-[#EFEFEF] rounded-2xl p-4 bg-white">
                <h3 className="font-semibold mb-4 text-[#00082D]">Children</h3>
                <div className="space-y-3 mb-4">
                    {children.map(child => (
                        <motion.div
                            key={child.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex justify-between items-center p-3 bg-[#1A66FF1A] rounded-xl border border-[#1A66FF33]"
                        >
                            <span className="font-semibold text-[#00082D]">{child.fullName}</span>
                            <button onClick={() => removeChild(child.id)} className="text-[#F14040] hover:opacity-80">
                                <Trash2 size={18} />
                            </button>
                        </motion.div>
                    ))}
                    {children.length === 0 && <p className="text-sm text-[#202020] opacity-70 italic">No children added yet.</p>}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        className="input-field flex-1"
                        placeholder="Child's Name"
                        value={newChildName}
                        onChange={e => setNewChildName(e.target.value)}
                    />
                    <motion.button whileTap={{ scale: 0.95 }} onClick={handleAddChild} className="px-4 py-3 bg-[#1A66FF] text-white rounded-xl">
                        <Plus size={20} />
                    </motion.button>
                </div>
            </motion.div>

            {/* Automation Settings */}
            <motion.div layout className="border border-[#EFEFEF] rounded-2xl p-4 bg-white">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-[#00082D]">
                    <Zap size={20} className="text-[#1A66FF]" /> Automation Settings
                </h3>
                <div className="space-y-4">
                    {/* Master Toggle */}
                    <div className="flex items-center justify-between p-3 bg-[#1A66FF0D] rounded-xl">
                        <div>
                            <p className="font-semibold text-sm text-[#00082D]">Enable Automation</p>
                            <p className="text-xs text-[#202020] opacity-70">
                                Master switch for all automation features
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={automationSettings.enabled}
                                onChange={(e) =>
                                    handleAutomationToggle('enabled', e.target.checked)
                                }
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A66FF]"></div>
                        </label>
                    </div>

                    {/* Auto-start Trips */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-sm text-[#00082D]">
                                Auto-start Trips
                            </p>
                            <p className="text-xs text-[#202020] opacity-70">
                                Start tracking when driving detected
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={automationSettings.autoStartTrips}
                                onChange={(e) =>
                                    handleAutomationToggle('autoStartTrips', e.target.checked)
                                }
                                disabled={!automationSettings.enabled}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A66FF] disabled:opacity-50"></div>
                        </label>
                    </div>

                    {/* Auto-stop Trips */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-sm text-[#00082D]">
                                Auto-stop Trips
                            </p>
                            <p className="text-xs text-[#202020] opacity-70">
                                Stop tracking when stationary
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={automationSettings.autoStopTrips}
                                onChange={(e) =>
                                    handleAutomationToggle('autoStopTrips', e.target.checked)
                                }
                                disabled={!automationSettings.enabled}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A66FF] disabled:opacity-50"></div>
                        </label>
                    </div>

                    {/* Auto-start Visits */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-sm text-[#00082D]">
                                Auto-start Visits
                            </p>
                            <p className="text-xs text-[#202020] opacity-70">
                                Start visits when entering locations
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={automationSettings.autoStartVisits}
                                onChange={(e) =>
                                    handleAutomationToggle('autoStartVisits', e.target.checked)
                                }
                                disabled={!automationSettings.enabled}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A66FF] disabled:opacity-50"></div>
                        </label>
                    </div>

                    {/* Auto-stop Visits */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-sm text-[#00082D]">
                                Auto-stop Visits
                            </p>
                            <p className="text-xs text-[#202020] opacity-70">
                                Stop visits when leaving locations
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={automationSettings.autoStopVisits}
                                onChange={(e) =>
                                    handleAutomationToggle('autoStopVisits', e.target.checked)
                                }
                                disabled={!automationSettings.enabled}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A66FF] disabled:opacity-50"></div>
                        </label>
                    </div>

                    {/* Geofencing */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-sm text-[#00082D]">Geofencing</p>
                            <p className="text-xs text-[#202020] opacity-70">
                                Use location-based triggers
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={automationSettings.geofencingEnabled}
                                onChange={(e) =>
                                    handleAutomationToggle('geofencingEnabled', e.target.checked)
                                }
                                disabled={!automationSettings.enabled}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A66FF] disabled:opacity-50"></div>
                        </label>
                    </div>

                    {/* Advanced Settings */}
                    <div className="pt-3 border-t border-[#EFEFEF] space-y-3">
                        <div className="input-group">
                            <label className="input-label text-xs">
                                Minimum Trip Distance (miles)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                className="input-field text-sm"
                                value={automationSettings.minimumTripDistance}
                                onChange={(e) =>
                                    handleAutomationToggle(
                                        'minimumTripDistance',
                                        parseFloat(e.target.value) || 0.5
                                    )
                                }
                                disabled={!automationSettings.enabled}
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label text-xs">
                                Minimum Trip Duration (minutes)
                            </label>
                            <input
                                type="number"
                                className="input-field text-sm"
                                value={automationSettings.minimumTripDuration}
                                onChange={(e) =>
                                    handleAutomationToggle(
                                        'minimumTripDuration',
                                        parseInt(e.target.value) || 5
                                    )
                                }
                                disabled={!automationSettings.enabled}
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label text-xs">
                                Stationary Timeout (minutes)
                            </label>
                            <input
                                type="number"
                                className="input-field text-sm"
                                value={automationSettings.stationaryTimeout}
                                onChange={(e) =>
                                    handleAutomationToggle(
                                        'stationaryTimeout',
                                        parseInt(e.target.value) || 10
                                    )
                                }
                                disabled={!automationSettings.enabled}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Custody Schedules */}
            <motion.div layout className="border border-[#EFEFEF] rounded-2xl p-4 bg-white">
                <CustodyScheduleManager children={children} />
            </motion.div>

            {/* Calendar Import */}
            <motion.div layout className="border border-[#EFEFEF] rounded-2xl p-4 bg-white">
                <h3 className="font-semibold mb-4 text-[#00082D]">Import Calendar</h3>
                <CalendarImport children={children} />
            </motion.div>

            {/* Location Presets */}
            <motion.div layout className="border border-[#EFEFEF] rounded-2xl p-4 bg-white">
                <LocationPresetManager children={children} />
            </motion.div>

            <div className="text-center text-xs text-[#202020] opacity-70 pt-4">
                <p>Tempo Track v0.1.0</p>
                <p>Data stored locally on device.</p>
            </div>
        </motion.div>
    );
};
import { AuthService } from '../services/auth';
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authUserEmail, setAuthUserEmail] = useState<string>('');
    const handleSignIn = async () => {
        const res = await AuthService.signIn(authEmail, authPassword);
        if (res.error) {
            alert('Sign in failed');
            return;
        }
        setAuthEmail('');
        setAuthPassword('');
        alert('Signed in');
    };

    const handleSignUp = async () => {
        const res = await AuthService.signUp(authEmail, authPassword);
        if (res.error) {
            alert('Sign up failed');
            return;
        }
        alert('Account created. Please verify email and sign in.');
    };

    const handleSignOut = async () => {
        const res = await AuthService.signOut();
        if (res.error) {
            alert('Sign out failed');
            return;
        }
        alert('Signed out');
    };
