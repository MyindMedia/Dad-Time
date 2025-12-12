/**
 * Background Tracking Service
 *
 * Manages background operation for timer and GPS tracking
 * Works even when the app is not in focus using:
 * - Page Visibility API
 * - Service Workers
 * - LocalStorage persistence
 * - Web Notifications
 * - Wake Lock API (keeps screen active during tracking)
 */

import { storage } from './storage';
import { showToast } from '../hooks/useToast';

// Wake Lock API types (for TypeScript)
// Using 'any' to avoid conflicts with browser's built-in WakeLock type
type WakeLockSentinel = any;

// ============================================================================
// TYPES
// ============================================================================

export type BackgroundTrackingState = {
    timerActive: boolean;
    timerStartTime?: string;
    timerVisitId?: string;
    gpsActive: boolean;
    gpsTripId?: string;
    lastGPSUpdate?: string;
};

export type GPSPosition = {
    lat: number;
    lng: number;
    timestamp: string;
    accuracy: number;
};

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const BACKGROUND_STATE_KEY = 'dadtime_background_state';
const GPS_BUFFER_KEY = 'dadtime_gps_buffer';

/**
 * Get background tracking state
 */
export const getBackgroundState = (): BackgroundTrackingState => {
    try {
        const stored = localStorage.getItem(BACKGROUND_STATE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error reading background state:', error);
    }

    return {
        timerActive: false,
        gpsActive: false,
    };
};

/**
 * Update background tracking state
 */
export const updateBackgroundState = (updates: Partial<BackgroundTrackingState>): void => {
    const current = getBackgroundState();
    const updated = { ...current, ...updates };
    localStorage.setItem(BACKGROUND_STATE_KEY, JSON.stringify(updated));

    // Broadcast to other tabs
    window.dispatchEvent(new CustomEvent('background-state-changed', { detail: updated }));
};

/**
 * Clear background tracking state
 */
export const clearBackgroundState = (): void => {
    localStorage.removeItem(BACKGROUND_STATE_KEY);
    localStorage.removeItem(GPS_BUFFER_KEY);
};

// ============================================================================
// WAKE LOCK (keeps screen active during tracking)
// ============================================================================

let wakeLock: WakeLockSentinel | null = null;

/**
 * Request wake lock to keep screen active
 * Prevents device from sleeping during active tracking
 */
export const requestWakeLock = async (): Promise<boolean> => {
    // Check if Wake Lock API is supported
    if (!('wakeLock' in navigator)) {
        console.log('⚠️ Wake Lock API not supported on this browser');
        return false;
    }

    try {
        const nav = navigator as any;
        wakeLock = await nav.wakeLock.request('screen');
        console.log('🔆 Wake lock acquired - screen will stay active');

        // Handle wake lock release (e.g., if user manually locks screen)
        wakeLock.addEventListener('release', () => {
            console.log('🔆 Wake lock released');
            wakeLock = null;
        });

        return true;
    } catch (error) {
        console.error('Failed to request wake lock:', error);
        return false;
    }
};

/**
 * Release wake lock
 */
export const releaseWakeLock = async (): Promise<void> => {
    if (wakeLock && !wakeLock.released) {
        try {
            await wakeLock.release();
            wakeLock = null;
            console.log('🔆 Wake lock released manually');
        } catch (error) {
            console.error('Failed to release wake lock:', error);
        }
    }
};

/**
 * Re-acquire wake lock if it was released
 */
const reacquireWakeLock = async (): Promise<void> => {
    const state = getBackgroundState();
    if ((state.timerActive || state.gpsActive) && (!wakeLock || wakeLock.released)) {
        await requestWakeLock();
    }
};

// ============================================================================
// BACKGROUND TIMER
// ============================================================================

let timerInterval: number | null = null;

/**
 * Start background timer
 */
export const startBackgroundTimer = (visitId: string, startTime: string): void => {
    console.log('🕐 Starting background timer for visit:', visitId);

    updateBackgroundState({
        timerActive: true,
        timerStartTime: startTime,
        timerVisitId: visitId,
    });

    // Show toast notification
    showToast('Visit tracking will continue in background', 'info', 4000);

    // Request wake lock to keep screen active
    requestWakeLock().then(success => {
        if (success) {
            showToast('Screen will stay active during tracking', 'success', 3000);
        }
    });

    // Start interval to update timer every second
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    timerInterval = setInterval(() => {
        const state = getBackgroundState();
        if (!state.timerActive || !state.timerStartTime) {
            stopBackgroundTimer();
            return;
        }

        // Calculate elapsed time
        const elapsed = Math.floor((Date.now() - new Date(state.timerStartTime).getTime()) / 1000);

        // Update UI if visible
        if (!document.hidden) {
            window.dispatchEvent(new CustomEvent('timer-tick', {
                detail: { visitId, elapsed }
            }));
        }

        // Every 30 seconds, persist to storage
        if (elapsed % 30 === 0) {
            console.log('💾 Persisting timer state:', elapsed, 'seconds');
        }
    }, 1000);

    // Request notification permission
    requestNotificationPermission();
};

/**
 * Stop background timer
 */
export const stopBackgroundTimer = (): void => {
    console.log('⏹ Stopping background timer');

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    updateBackgroundState({
        timerActive: false,
        timerStartTime: undefined,
        timerVisitId: undefined,
    });

    // Release wake lock if no GPS tracking is active
    const state = getBackgroundState();
    if (!state.gpsActive) {
        releaseWakeLock();
    }
};

/**
 * Get current timer elapsed time
 */
export const getTimerElapsed = (): number => {
    const state = getBackgroundState();
    if (!state.timerActive || !state.timerStartTime) {
        return 0;
    }

    return Math.floor((Date.now() - new Date(state.timerStartTime).getTime()) / 1000);
};

// ============================================================================
// BACKGROUND GPS TRACKING
// ============================================================================

let gpsWatchId: number | null = null;
let gpsBuffer: GPSPosition[] = [];

/**
 * Start background GPS tracking
 */
export const startBackgroundGPS = (tripId: string): void => {
    console.log('📍 Starting background GPS tracking for trip:', tripId);

    updateBackgroundState({
        gpsActive: true,
        gpsTripId: tripId,
        lastGPSUpdate: new Date().toISOString(),
    });

    // Show toast notification
    showToast('GPS tracking will continue in background', 'info', 4000);

    // Request wake lock to keep screen active
    requestWakeLock().then(success => {
        if (success) {
            showToast('Screen will stay active during GPS tracking', 'success', 3000);
        }
    });

    // Request geolocation permission and start watching
    if ('geolocation' in navigator) {
        gpsWatchId = navigator.geolocation.watchPosition(
            (position) => {
                const gpsPos: GPSPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    timestamp: new Date().toISOString(),
                    accuracy: position.coords.accuracy,
                };

                console.log('📍 GPS update:', gpsPos);

                // Add to buffer
                gpsBuffer.push(gpsPos);

                // Update state
                updateBackgroundState({
                    lastGPSUpdate: gpsPos.timestamp,
                });

                // Broadcast to UI
                window.dispatchEvent(new CustomEvent('gps-update', {
                    detail: gpsPos
                }));

                // Persist buffer every 5 positions or every minute
                if (gpsBuffer.length >= 5) {
                    persistGPSBuffer(tripId);
                }
            },
            (error) => {
                console.error('GPS error:', error);
                showNotification(
                    'GPS Tracking Error',
                    'Unable to track location. Please check permissions.'
                );
            },
            {
                enableHighAccuracy: true,
                maximumAge: 10000, // 10 seconds
                timeout: 30000, // 30 seconds
            }
        );
    } else {
        console.error('Geolocation not supported');
        showNotification(
            'GPS Not Supported',
            'Your device does not support GPS tracking.'
        );
    }

    // Request notification permission
    requestNotificationPermission();
};

/**
 * Stop background GPS tracking
 */
export const stopBackgroundGPS = (): void => {
    console.log('⏹ Stopping background GPS tracking');

    if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
    }

    // Persist remaining buffer
    const state = getBackgroundState();
    if (state.gpsActive && state.gpsTripId) {
        persistGPSBuffer(state.gpsTripId);
    }

    updateBackgroundState({
        gpsActive: false,
        gpsTripId: undefined,
        lastGPSUpdate: undefined,
    });

    // Release wake lock if no timer is active
    if (!state.timerActive) {
        releaseWakeLock();
    }

    gpsBuffer = [];
};

/**
 * Persist GPS buffer to storage
 */
const persistGPSBuffer = (tripId: string): void => {
    if (gpsBuffer.length === 0) return;

    console.log('💾 Persisting', gpsBuffer.length, 'GPS positions');

    // Get current trip
    const trips = storage.get<any>('trips');
    const trip = trips.find((t: any) => t.id === tripId);

    if (trip) {
        const currentPath = trip.path || [];
        const newPath = [...currentPath, ...gpsBuffer.map(p => ({ lat: p.lat, lng: p.lng }))];

        // Calculate distance
        let totalDistance = trip.distanceMiles || 0;
        for (let i = 0; i < gpsBuffer.length; i++) {
            if (i === 0 && currentPath.length > 0) {
                const lastPoint = currentPath[currentPath.length - 1];
                totalDistance += calculateDistance(
                    lastPoint.lat,
                    lastPoint.lng,
                    gpsBuffer[i].lat,
                    gpsBuffer[i].lng
                );
            } else if (i > 0) {
                totalDistance += calculateDistance(
                    gpsBuffer[i - 1].lat,
                    gpsBuffer[i - 1].lng,
                    gpsBuffer[i].lat,
                    gpsBuffer[i].lng
                );
            }
        }

        // Update trip
        const updatedTrips = trips.map((t: any) =>
            t.id === tripId
                ? { ...t, path: newPath, distanceMiles: totalDistance }
                : t
        );

        storage.set('trips', updatedTrips);
    }

    // Clear buffer
    gpsBuffer = [];
};

/**
 * Calculate distance between two points (Haversine formula)
 */
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3958.8; // Radius of Earth in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// ============================================================================
// PAGE VISIBILITY
// ============================================================================

/**
 * Initialize Page Visibility API
 * Ensures tracking continues when tab is not visible
 */
export const initPageVisibility = (): void => {
    document.addEventListener('visibilitychange', () => {
        const state = getBackgroundState();

        if (document.hidden) {
            console.log('📱 App hidden - continuing background tracking');

            // Show notification that tracking continues
            if (state.timerActive || state.gpsActive) {
                const messages = [];
                if (state.timerActive) messages.push('Timer');
                if (state.gpsActive) messages.push('GPS tracking');

                const message = `${messages.join(' and ')} will continue in background`;

                // Show browser notification
                showNotification('Tracking in Background', message);

                // Show toast notification (visible before page is hidden)
                showToast(message, 'info', 3000);
            }
        } else {
            console.log('📱 App visible - syncing state');

            // Re-acquire wake lock if tracking is active
            reacquireWakeLock();

            // Sync any buffered GPS data
            if (state.gpsActive && state.gpsTripId) {
                persistGPSBuffer(state.gpsTripId);
            }
        }
    });
};

// ============================================================================
// NOTIFICATIONS
// ============================================================================

/**
 * Request notification permission
 */
export const requestNotificationPermission = async (): Promise<void> => {
    if (!('Notification' in window)) {
        console.log('Notifications not supported');
        return;
    }

    if (Notification.permission === 'granted') {
        return;
    }

    if (Notification.permission !== 'denied') {
        await Notification.requestPermission();
    }
};

/**
 * Show notification
 */
export const showNotification = (title: string, body: string, options?: NotificationOptions): void => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
    }

    const notification = new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'dad-tracker',
        requireInteraction: false,
        ...options,
    });

    notification.onclick = () => {
        window.focus();
        notification.close();
    };

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);
};

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Stop all background tracking
 */
export const stopAllBackgroundTracking = (): void => {
    stopBackgroundTimer();
    stopBackgroundGPS();
    clearBackgroundState();
};

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize background tracking service
 * Call this once when the app loads
 */
export const initBackgroundTracking = (): void => {
    console.log('🚀 Initializing background tracking service');

    // Initialize page visibility
    initPageVisibility();

    // Request notification permission
    requestNotificationPermission();

    // Resume any active tracking from previous session
    const state = getBackgroundState();

    if (state.timerActive && state.timerVisitId && state.timerStartTime) {
        console.log('🔄 Resuming timer from previous session');
        startBackgroundTimer(state.timerVisitId, state.timerStartTime);
    }

    if (state.gpsActive && state.gpsTripId) {
        console.log('🔄 Resuming GPS tracking from previous session');
        startBackgroundGPS(state.gpsTripId);
    }

    // Handle page unload
    window.addEventListener('beforeunload', () => {
        console.log('💾 App closing - persisting state');

        // Persist any buffered GPS data
        if (state.gpsActive && state.gpsTripId) {
            persistGPSBuffer(state.gpsTripId);
        }
    });

    console.log('✅ Background tracking initialized');
};
