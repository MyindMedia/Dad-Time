/**
 * Background Automation Service
 *
 * Advanced features for automatic tracking:
 * - Geofencing (location-based triggers)
 * - Auto-start/stop trips based on movement
 * - Smart activity detection (driving, walking, stationary)
 * - Location presets (home, school, work, etc.)
 * - Auto-visit detection
 */

import { storage } from './storage';
import { startBackgroundTimer, startBackgroundGPS, stopBackgroundGPS, showNotification } from './backgroundTracking';
import type { VisitSession, Trip } from '../types';
import { showToast } from '../hooks/useToast';

// ============================================================================
// TYPES
// ============================================================================

export type LocationPreset = {
    id: string;
    name: string;
    type: 'home' | 'school' | 'work' | 'child_location' | 'custom';
    lat: number;
    lng: number;
    radius: number; // meters
    childId?: string;
    autoActions?: {
        enterTrigger?: 'start_visit' | 'stop_trip' | 'none';
        exitTrigger?: 'stop_visit' | 'start_trip' | 'none';
    };
};

export type MovementState = 'stationary' | 'walking' | 'driving' | 'unknown';

export type AutomationSettings = {
    enabled: boolean;
    autoStartTrips: boolean;
    autoStopTrips: boolean;
    autoStartVisits: boolean;
    autoStopVisits: boolean;
    minimumTripDistance: number; // miles
    minimumTripDuration: number; // minutes
    stationaryTimeout: number; // minutes
    geofencingEnabled: boolean;
};

type PositionHistory = {
    lat: number;
    lng: number;
    timestamp: number;
    accuracy: number;
};

// ============================================================================
// STATE
// ============================================================================

const LOCATION_PRESETS_KEY = 'dadtime_location_presets';
const AUTOMATION_SETTINGS_KEY = 'dadtime_automation_settings';
const POSITION_HISTORY_KEY = 'dadtime_position_history';

let positionHistory: PositionHistory[] = [];
let currentMovementState: MovementState = 'unknown';
let lastKnownPosition: { lat: number; lng: number } | null = null;
let geofenceCheckInterval: number | null = null;

// ============================================================================
// LOCATION PRESETS
// ============================================================================

/**
 * Get all location presets
 */
export const getLocationPresets = (): LocationPreset[] => {
    try {
        const stored = localStorage.getItem(LOCATION_PRESETS_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error reading location presets:', error);
    }
    return [];
};

/**
 * Save location preset
 */
export const saveLocationPreset = (preset: Omit<LocationPreset, 'id'>): LocationPreset => {
    const presets = getLocationPresets();
    const newPreset: LocationPreset = {
        ...preset,
        id: `preset_${Date.now()}`,
    };

    presets.push(newPreset);
    localStorage.setItem(LOCATION_PRESETS_KEY, JSON.stringify(presets));

    console.log('📍 Saved location preset:', newPreset.name);
    return newPreset;
};

/**
 * Delete location preset
 */
export const deleteLocationPreset = (id: string): void => {
    const presets = getLocationPresets();
    const filtered = presets.filter(p => p.id !== id);
    localStorage.setItem(LOCATION_PRESETS_KEY, JSON.stringify(filtered));
};

/**
 * Update location preset
 */
export const updateLocationPreset = (id: string, updates: Partial<LocationPreset>): void => {
    const presets = getLocationPresets();
    const updated = presets.map(p => p.id === id ? { ...p, ...updates } : p);
    localStorage.setItem(LOCATION_PRESETS_KEY, JSON.stringify(updated));
};

// ============================================================================
// AUTOMATION SETTINGS
// ============================================================================

/**
 * Get automation settings
 */
export const getAutomationSettings = (): AutomationSettings => {
    try {
        const stored = localStorage.getItem(AUTOMATION_SETTINGS_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error reading automation settings:', error);
    }

    // Default settings
    return {
        enabled: false,
        autoStartTrips: false,
        autoStopTrips: false,
        autoStartVisits: false,
        autoStopVisits: false,
        minimumTripDistance: 0.5, // 0.5 miles
        minimumTripDuration: 5, // 5 minutes
        stationaryTimeout: 10, // 10 minutes
        geofencingEnabled: false,
    };
};

/**
 * Update automation settings
 */
export const updateAutomationSettings = (updates: Partial<AutomationSettings>): void => {
    const current = getAutomationSettings();
    const updated = { ...current, ...updates };
    localStorage.setItem(AUTOMATION_SETTINGS_KEY, JSON.stringify(updated));

    console.log('⚙️ Updated automation settings:', updated);

    // Restart automation if enabled
    if (updated.enabled) {
        initBackgroundAutomation();
    } else {
        stopBackgroundAutomation();
    }
};

// ============================================================================
// GEOFENCING
// ============================================================================

/**
 * Calculate distance between two points (Haversine formula)
 */
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
};

/**
 * Check if position is within a geofence
 */
export const isInsideGeofence = (
    lat: number,
    lng: number,
    geofence: LocationPreset
): boolean => {
    const distance = calculateDistance(lat, lng, geofence.lat, geofence.lng);
    return distance <= geofence.radius;
};

/**
 * Check all geofences and trigger actions
 */
const checkGeofences = (currentLat: number, currentLng: number): void => {
    const settings = getAutomationSettings();
    if (!settings.geofencingEnabled) return;

    const presets = getLocationPresets();
    const previousPosition = lastKnownPosition;

    presets.forEach(preset => {
        if (!preset.autoActions) return;

        const isInside = isInsideGeofence(currentLat, currentLng, preset);
        const wasInside = previousPosition
            ? isInsideGeofence(previousPosition.lat, previousPosition.lng, preset)
            : false;

        // Enter geofence
        if (isInside && !wasInside) {
            console.log('✅ Entered geofence:', preset.name);
            handleGeofenceEnter(preset);
        }

        // Exit geofence
        if (!isInside && wasInside) {
            console.log('🚪 Exited geofence:', preset.name);
            handleGeofenceExit(preset);
        }
    });

    lastKnownPosition = { lat: currentLat, lng: currentLng };
};

/**
 * Handle entering a geofence
 */
const handleGeofenceEnter = (preset: LocationPreset): void => {
    const trigger = preset.autoActions?.enterTrigger;
    if (!trigger || trigger === 'none') return;

    switch (trigger) {
        case 'start_visit':
            // Auto-start visit
            const visits = storage.get<VisitSession>('visits');
            const activeVisit = visits.find((v) => !v.endTime);

            if (!activeVisit && preset.childId) {
                const newVisit: Omit<VisitSession, 'id'> = {
                    childId: preset.childId,
                    startTime: new Date().toISOString(),
                    type: 'physical_care',
                    source: 'auto_detected',
                    notes: `Auto-started at ${preset.name}`,
                };

                const createdVisit = storage.add('visits', newVisit);
                startBackgroundTimer(createdVisit.id, createdVisit.startTime);

                const message = `Arrived at ${preset.name} - Visit started automatically`;
                showNotification('Visit Started', message);
                showToast(message, 'success', 4000);
                console.log('🏠 Auto-started visit at:', preset.name);
            }
            break;

        case 'stop_trip':
            // Auto-stop trip
            const trips = storage.get<Trip>('trips');
            const activeTrip = trips.find((t) => !t.endTime);

            if (activeTrip) {
                stopBackgroundGPS();

                // Update trip with end location and time
                storage.update<Trip>('trips', activeTrip.id, {
                    endTime: new Date().toISOString(),
                    endLocation: { lat: preset.lat, lng: preset.lng },
                });

                const message = `Arrived at ${preset.name} - Trip stopped automatically`;
                showNotification('Trip Ended', message);
                showToast(message, 'success', 4000);
                console.log('🛑 Auto-stopped trip at:', preset.name);
            }
            break;
    }
};

/**
 * Handle exiting a geofence
 */
const handleGeofenceExit = (preset: LocationPreset): void => {
    const trigger = preset.autoActions?.exitTrigger;
    if (!trigger || trigger === 'none') return;

    switch (trigger) {
        case 'stop_visit':
            // Auto-stop visit
            const visits = storage.get<VisitSession>('visits');
            const activeVisit = visits.find((v) => !v.endTime);

            if (activeVisit) {
                storage.update<VisitSession>('visits', activeVisit.id, {
                    endTime: new Date().toISOString(),
                    notes: (activeVisit.notes || '') + `\nAuto-stopped when leaving ${preset.name}`,
                });

                showNotification(
                    'Visit Ended',
                    `Left ${preset.name}. Visit tracking stopped automatically.`
                );
                console.log('👋 Auto-stopped visit at:', preset.name);
            }
            break;

        case 'start_trip':
            // Auto-start trip
            const trips = storage.get<Trip>('trips');
            const activeTrip = trips.find((t) => !t.endTime);

            if (!activeTrip && lastKnownPosition) {
                const newTrip: Omit<Trip, 'id'> = {
                    childId: preset.childId || 'pending',
                    startTime: new Date().toISOString(),
                    purpose: 'pickup',
                    startLocation: lastKnownPosition,
                    path: [lastKnownPosition],
                    distanceMiles: 0,
                    autoDetected: true,
                };

                const createdTrip = storage.add('trips', newTrip);
                startBackgroundGPS(createdTrip.id);

                showNotification(
                    'Trip Started',
                    `Left ${preset.name}. Trip tracking started automatically.`
                );
                console.log('🚗 Auto-started trip from:', preset.name);
            }
            break;
    }
};

// ============================================================================
// MOVEMENT DETECTION
// ============================================================================

/**
 * Add position to history
 */
const addPositionToHistory = (lat: number, lng: number, accuracy: number): void => {
    positionHistory.push({
        lat,
        lng,
        timestamp: Date.now(),
        accuracy,
    });

    // Keep last 20 positions (about 2 minutes at 6-second intervals)
    if (positionHistory.length > 20) {
        positionHistory.shift();
    }

    // Save to localStorage
    localStorage.setItem(POSITION_HISTORY_KEY, JSON.stringify(positionHistory));
};

/**
 * Detect current movement state
 */
export const detectMovementState = (): MovementState => {
    if (positionHistory.length < 3) {
        return 'unknown';
    }

    // Calculate average speed over last positions
    const recentPositions = positionHistory.slice(-5);
    let totalDistance = 0;
    let totalTime = 0;

    for (let i = 1; i < recentPositions.length; i++) {
        const prev = recentPositions[i - 1];
        const curr = recentPositions[i];

        const distance = calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
        const time = (curr.timestamp - prev.timestamp) / 1000; // seconds

        totalDistance += distance;
        totalTime += time;
    }

    // Average speed in meters per second
    const avgSpeed = totalDistance / totalTime;

    // Convert to mph
    const avgSpeedMph = avgSpeed * 2.237;

    // Classify movement
    let state: MovementState = 'stationary';

    if (avgSpeedMph < 1) {
        state = 'stationary';
    } else if (avgSpeedMph < 10) {
        state = 'walking';
    } else {
        state = 'driving';
    }

    // Only update if changed
    if (state !== currentMovementState) {
        console.log(`🏃 Movement state changed: ${currentMovementState} → ${state} (${avgSpeedMph.toFixed(1)} mph)`);
        currentMovementState = state;

        // Trigger auto-actions
        handleMovementStateChange(state);
    }

    return state;
};

/**
 * Handle movement state changes
 */
const handleMovementStateChange = (newState: MovementState): void => {
    const settings = getAutomationSettings();
    if (!settings.enabled) return;

    const trips = storage.get<Trip>('trips');
    const activeTrip = trips.find((t) => !t.endTime);

    switch (newState) {
        case 'driving':
            // Auto-start trip if enabled and no active trip
            if (settings.autoStartTrips && !activeTrip && lastKnownPosition) {
                const newTrip: Omit<Trip, 'id'> = {
                    childId: 'pending',
                    startTime: new Date().toISOString(),
                    purpose: 'pickup',
                    startLocation: lastKnownPosition,
                    path: [lastKnownPosition],
                    distanceMiles: 0,
                    autoDetected: true,
                };

                const createdTrip = storage.add('trips', newTrip);
                startBackgroundGPS(createdTrip.id);

                const message = 'Driving detected - Trip started automatically';
                showNotification('Trip Started', message);
                showToast(message, 'success', 4000);
                console.log('🚗 Auto-started trip (driving detected)');
            }
            break;

        case 'stationary':
            // Auto-stop trip if enabled and trip is active
            if (settings.autoStopTrips && activeTrip && lastKnownPosition) {
                const tripDuration = (Date.now() - new Date(activeTrip.startTime).getTime()) / 60000; // minutes
                const tripDistance = activeTrip.distanceMiles || 0;

                // Check minimum duration and distance
                if (
                    tripDuration >= settings.minimumTripDuration &&
                    tripDistance >= settings.minimumTripDistance
                ) {
                    stopBackgroundGPS();

                    storage.update<Trip>('trips', activeTrip.id, {
                        endTime: new Date().toISOString(),
                        endLocation: lastKnownPosition,
                    });

                    const message = `Stationary for ${settings.stationaryTimeout} min - Trip stopped automatically`;
                    showNotification('Trip Ended', message);
                    showToast(message, 'success', 4000);
                    console.log('🛑 Auto-stopped trip (stationary detected)');
                }
            }
            break;

        case 'walking':
            // Could implement auto-visit detection here
            break;
    }
};

// ============================================================================
// BACKGROUND MONITORING
// ============================================================================

let monitoringWatchId: number | null = null;

/**
 * Start monitoring location for automation
 */
const startLocationMonitoring = (): void => {
    if (monitoringWatchId !== null) {
        console.log('⚠️ Location monitoring already active');
        return;
    }

    console.log('👀 Starting location monitoring for automation');

    monitoringWatchId = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, accuracy } = position.coords;

            // Add to position history
            addPositionToHistory(latitude, longitude, accuracy);

            // Check geofences
            checkGeofences(latitude, longitude);

            // Detect movement state
            detectMovementState();
        },
        (error) => {
            console.error('Location monitoring error:', error);
        },
        {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000,
        }
    );
};

/**
 * Stop monitoring location
 */
const stopLocationMonitoring = (): void => {
    if (monitoringWatchId !== null) {
        navigator.geolocation.clearWatch(monitoringWatchId);
        monitoringWatchId = null;
        console.log('⏹ Stopped location monitoring');
    }
};

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize background automation
 */
export const initBackgroundAutomation = (): void => {
    const settings = getAutomationSettings();

    if (!settings.enabled) {
        console.log('⚠️ Background automation is disabled');
        return;
    }

    console.log('🤖 Initializing background automation');

    // Load position history
    try {
        const stored = localStorage.getItem(POSITION_HISTORY_KEY);
        if (stored) {
            positionHistory = JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading position history:', error);
    }

    // Start location monitoring
    startLocationMonitoring();

    console.log('✅ Background automation initialized');
    console.log('  - Auto-start trips:', settings.autoStartTrips);
    console.log('  - Auto-stop trips:', settings.autoStopTrips);
    console.log('  - Geofencing:', settings.geofencingEnabled);
};

/**
 * Stop background automation
 */
export const stopBackgroundAutomation = (): void => {
    console.log('⏹ Stopping background automation');
    stopLocationMonitoring();

    if (geofenceCheckInterval) {
        clearInterval(geofenceCheckInterval);
        geofenceCheckInterval = null;
    }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get current movement state
 */
export const getCurrentMovementState = (): MovementState => {
    return currentMovementState;
};

/**
 * Get position history
 */
export const getPositionHistory = (): PositionHistory[] => {
    return positionHistory;
};

/**
 * Clear position history
 */
export const clearPositionHistory = (): void => {
    positionHistory = [];
    localStorage.removeItem(POSITION_HISTORY_KEY);
};

/**
 * Find nearest location preset
 */
export const findNearestPreset = (lat: number, lng: number): LocationPreset | null => {
    const presets = getLocationPresets();
    if (presets.length === 0) return null;

    let nearest: LocationPreset | null = null;
    let minDistance = Infinity;

    presets.forEach(preset => {
        const distance = calculateDistance(lat, lng, preset.lat, preset.lng);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = preset;
        }
    });

    return nearest;
};

/**
 * Check if currently inside any geofence
 */
export const getCurrentGeofence = (lat: number, lng: number): LocationPreset | null => {
    const presets = getLocationPresets();

    for (const preset of presets) {
        if (isInsideGeofence(lat, lng, preset)) {
            return preset;
        }
    }

    return null;
};
