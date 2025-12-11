import React, { useState, useEffect, useMemo } from 'react';
import { Navigation, StopCircle, MapPin } from 'lucide-react';
import { useEntity } from '../hooks/useEntity';
import type { Trip, Child, TripPurpose, LocationPoint } from '../types';
import { differenceInSeconds, differenceInMinutes } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
    startBackgroundGPS,
    stopBackgroundGPS,
    getBackgroundState,
} from '../services/backgroundTracking';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper function removed - distance calculation handled by backgroundTracking service

// Component to recenter map
const RecenterMap = ({ lat, lng }: { lat: number, lng: number }) => {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], map.getZoom());
    }, [lat, lng, map]);
    return null;
};

export const Trips: React.FC = () => {
    const { items: trips, add: addTrip, update: updateTrip } = useEntity<Trip>('trips');
    const { items: children } = useEntity<Child>('children');

    const activeTrip = useMemo(() => trips.find(t => !t.endTime), [trips]);

    const [elapsed, setElapsed] = useState(0);
    const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [pendingTripData, setPendingTripData] = useState<{ endTime: string, endLocation: LocationPoint, distance: number } | null>(null);
    const [classification, setClassification] = useState<'child' | 'personal'>('child');
    const [selectedChildId, setSelectedChildId] = useState<string>('');
    const [purpose, setPurpose] = useState<TripPurpose>('pickup');

    // Timer effect
    useEffect(() => {
        if (!activeTrip) {
            setElapsed(0);
            return;
        }

        const interval = setInterval(() => {
            const seconds = differenceInSeconds(new Date(), new Date(activeTrip.startTime));
            setElapsed(seconds);
        }, 1000);

        return () => clearInterval(interval);
    }, [activeTrip]);

    // Geolocation Tracking with background support
    useEffect(() => {
        if (activeTrip) {
            // Check if background GPS is already running for this trip
            const bgState = getBackgroundState();
            if (!bgState.gpsActive || bgState.gpsTripId !== activeTrip.id) {
                // Start background GPS
                startBackgroundGPS(activeTrip.id);
            }

            // Listen for GPS updates
            const handleGPSUpdate = (event: CustomEvent) => {
                const gpsPos = event.detail;
                setCurrentLocation({ lat: gpsPos.lat, lng: gpsPos.lng });
            };

            window.addEventListener('gps-update' as any, handleGPSUpdate);

            return () => {
                window.removeEventListener('gps-update' as any, handleGPSUpdate);
                // Note: We don't stop background GPS here - it continues running
                // User must explicitly stop the trip to stop background GPS
            };
        } else {
            // Get initial location if not tracking
            navigator.geolocation.getCurrentPosition(
                (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.error(err)
            );
        }
    }, [activeTrip?.id]); // Only re-run if active trip ID changes (start/stop)

    const handleStart = () => {
        if (!currentLocation) {
            alert('Waiting for GPS location...');
            return;
        }

        addTrip({
            childId: 'pending', // Will be set on completion
            startTime: new Date().toISOString(),
            purpose: 'pickup', // Default, will be set on completion
            startLocation: currentLocation,
            path: [currentLocation],
            distanceMiles: 0,
            autoDetected: false
        });
    };

    const handleStop = () => {
        if (activeTrip && currentLocation) {
            setPendingTripData({
                endTime: new Date().toISOString(),
                endLocation: currentLocation,
                distance: activeTrip.distanceMiles || 0
            });
            setShowModal(true);
        }
    };

    const confirmClassification = () => {
        if (!activeTrip || !pendingTripData) return;

        // Stop background GPS tracking
        stopBackgroundGPS();

        // Standard IRS mileage rate (2025)
        const mileageRatePerMile = 0.70; // $0.70 per mile

        if (classification === 'personal') {
            updateTrip(activeTrip.id, {
                ...pendingTripData,
                purpose: 'other_child_related',
                notes: 'Classified as Personal Trip',
                mileageRatePerMile: 0, // No reimbursement for personal
                reimbursableAmount: 0
            });
        } else {
            // Child related - calculate reimbursement
            if (!selectedChildId && children.length > 0) {
                alert('Please select a child');
                return;
            }

            const reimbursableAmount = pendingTripData.distance * mileageRatePerMile;

            updateTrip(activeTrip.id, {
                ...pendingTripData,
                childId: selectedChildId || (children[0]?.id ?? 'default'),
                purpose: purpose,
                mileageRatePerMile,
                reimbursableAmount
            });
        }

        setShowModal(false);
        setPendingTripData(null);
        setClassification('child');
    };

    const formatDuration = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const recentTrips = useMemo(() => {
        return [...trips]
            .filter(t => t.endTime)
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
            .slice(0, 5);
    }, [trips]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-white p-6 space-y-6"
        >
            <motion.div layout className="border border-[#EFEFEF] rounded-2xl p-6 bg-white relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-[#00082D]">
                        <Navigation className="text-[#1A66FF]" />
                        Trip Tracker
                    </h2>
                    {activeTrip && (
                        <span className="px-3 py-1 bg-[#10B981]/10 text-[#10B981] text-xs rounded-full font-semibold animate-pulse">
                            Tracking
                        </span>
                    )}
                </div>

                {/* Leaflet Map View */}
                <div className="bg-slate-100 rounded-xl h-48 mb-4 overflow-hidden border border-slate-200 relative z-0">
                    {currentLocation ? (
                        <MapContainer center={[currentLocation.lat, currentLocation.lng]} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <RecenterMap lat={currentLocation.lat} lng={currentLocation.lng} />
                            <Marker position={[currentLocation.lat, currentLocation.lng]} />
                            {activeTrip?.path && activeTrip.path.length > 1 && (
                                <Polyline positions={activeTrip.path.map(p => [p.lat, p.lng])} color="blue" />
                            )}
                        </MapContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted">
                            Locating...
                        </div>
                    )}
                </div>

                <div className="text-center mb-6">
                    <span className="text-3xl font-mono font-bold text-slate-700">
                        {activeTrip ? formatDuration(elapsed) : '00:00:00'}
                    </span>
                    <div className="flex justify-center gap-4 mt-2 text-xs text-muted">
                        <span>Duration</span>
                        <span>•</span>
                        <span>{activeTrip?.distanceMiles?.toFixed(2) || '0.00'} mi</span>
                    </div>
                </div>

                {activeTrip ? (
                    <motion.button whileTap={{ scale: 0.95 }} onClick={handleStop} className="w-full bg-[#F14040] text-white py-4 px-6 rounded-full font-semibold text-base flex items-center justify-center gap-2">
                        <StopCircle size={20} /> End Trip
                    </motion.button>
                ) : (
                    <motion.button whileTap={{ scale: 0.95 }} onClick={handleStart} className="w-full bg-[#1A66FF] text-white py-4 px-6 rounded-full font-semibold text-base flex items-center justify-center gap-2">
                        <Navigation size={20} /> Start Trip
                    </motion.button>
                )}
            </motion.div>

            {/* Classification Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                        >
                            <h3 className="text-lg font-bold mb-4 text-center">Trip Complete!</h3>
                            <p className="text-center text-muted mb-6">
                                You traveled <span className="font-bold text-indigo-600">{pendingTripData?.distance.toFixed(2)} miles</span>.
                                <br />Was this trip child-related?
                            </p>

                            <div className="flex gap-3 mb-6">
                                <button
                                    onClick={() => setClassification('child')}
                                    className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-colors ${classification === 'child' ? 'border-[#1A66FF] bg-[#1A66FF1A] text-[#1A66FF]' : 'border-[#EFEFEF] text-[#202020] opacity-60'}`}
                                >
                                    Yes, Child
                                </button>
                                <button
                                    onClick={() => setClassification('personal')}
                                    className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-colors ${classification === 'personal' ? 'border-[#1A66FF] bg-[#1A66FF1A] text-[#1A66FF]' : 'border-[#EFEFEF] text-[#202020] opacity-60'}`}
                                >
                                    No, Personal
                                </button>
                            </div>

                            {classification === 'child' && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 mb-6">
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
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label text-sm font-semibold text-[#00082D]">Purpose</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(['pickup', 'dropoff', 'medical', 'activity'] as TripPurpose[]).map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => setPurpose(p)}
                                                    className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize transition-colors ${purpose === p ? 'bg-[#1A66FF] text-white' : 'bg-white border border-[#EFEFEF] text-[#202020]'}`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => setShowModal(false)} className="flex-1 py-3 px-4 rounded-full border border-[#EFEFEF] text-[#202020] font-semibold">Cancel</button>
                                <button onClick={confirmClassification} className="flex-1 py-3 px-4 rounded-full bg-[#1A66FF] text-white font-semibold">Save Trip</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[#00082D] uppercase tracking-wider">Recent Trips</h3>
                {recentTrips.map(trip => (
                    <motion.div
                        key={trip.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-[#EFEFEF] rounded-xl p-4 flex justify-between items-center bg-white"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#1A66FF1A] flex items-center justify-center text-[#1A66FF] border border-[#1A66FF33]">
                                <MapPin size={18} />
                            </div>
                            <div>
                                <p className="font-semibold text-sm capitalize text-[#00082D]">{trip.purpose.replace(/_/g, ' ')}</p>
                                <p className="text-xs text-[#202020] opacity-70">{new Date(trip.startTime).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-sm text-[#00082D]">{trip.distanceMiles?.toFixed(1)} mi</p>
                            {trip.reimbursableAmount && trip.reimbursableAmount > 0 ? (
                                <p className="text-xs text-[#10B981] font-semibold">
                                    ${trip.reimbursableAmount.toFixed(2)}
                                </p>
                            ) : (
                                <p className="text-xs text-[#202020] opacity-70">
                                    {trip.endTime ? differenceInMinutes(new Date(trip.endTime), new Date(trip.startTime)) + ' min' : '...'}
                                </p>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};
