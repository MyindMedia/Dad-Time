/**
 * iOS-specific utilities for Apple Mini App
 * Includes haptic feedback, safe area detection, and iOS feature checks
 */

// Check if running as Apple Mini App / iOS PWA
export const isIOSPWA = (): boolean => {
  return (
    (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches
  );
};

// Check if running on iOS device
export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

// Haptic Feedback API wrapper
export class HapticFeedback {
  private static isSupported = 'vibrate' in navigator;

  // Light impact (subtle feedback)
  static light() {
    if (this.isSupported) {
      navigator.vibrate(10);
    }
  }

  // Medium impact (standard button press)
  static medium() {
    if (this.isSupported) {
      navigator.vibrate(20);
    }
  }

  // Heavy impact (important action)
  static heavy() {
    if (this.isSupported) {
      navigator.vibrate(40);
    }
  }

  // Success feedback
  static success() {
    if (this.isSupported) {
      navigator.vibrate([10, 50, 10]);
    }
  }

  // Warning feedback
  static warning() {
    if (this.isSupported) {
      navigator.vibrate([20, 100, 20]);
    }
  }

  // Error feedback
  static error() {
    if (this.isSupported) {
      navigator.vibrate([50, 100, 50, 100, 50]);
    }
  }

  // Selection change (light tap)
  static selection() {
    if (this.isSupported) {
      navigator.vibrate(5);
    }
  }
}

// Helper function for triggering haptic feedback
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection' = 'light') => {
  switch (type) {
    case 'light':
      HapticFeedback.light();
      break;
    case 'medium':
      HapticFeedback.medium();
      break;
    case 'heavy':
      HapticFeedback.heavy();
      break;
    case 'success':
      HapticFeedback.success();
      break;
    case 'warning':
      HapticFeedback.warning();
      break;
    case 'error':
      HapticFeedback.error();
      break;
    case 'selection':
      HapticFeedback.selection();
      break;
  }
};

// Get safe area insets
export const getSafeAreaInsets = () => {
  const getComputedValue = (property: string) => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(property);
    return parseInt(value) || 0;
  };

  return {
    top: getComputedValue('--safe-area-top'),
    bottom: getComputedValue('--safe-area-bottom'),
    left: getComputedValue('--safe-area-left'),
    right: getComputedValue('--safe-area-right'),
  };
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Show local notification
export const showNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options,
    });
  }
};

// Check if app needs update (version check)
export const checkForUpdate = async (): Promise<boolean> => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return true;
  }
  return false;
};

// Add to home screen prompt (for iOS Safari)
export const showIOSInstallPrompt = () => {
  if (isIOS() && !isIOSPWA()) {
    return {
      canInstall: true,
      message: 'To install DadTime: Tap the Share button, then "Add to Home Screen"',
    };
  }
  return { canInstall: false, message: '' };
};

// Prevent zoom on input focus (iOS Safari)
export const preventInputZoom = () => {
  const addMaximumScaleToMetaViewport = () => {
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport instanceof HTMLMetaElement) {
      viewport.content = viewport.content + ', maximum-scale=1.0';
    }
  };

  const removeMaximumScaleFromMetaViewport = () => {
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport instanceof HTMLMetaElement) {
      viewport.content = viewport.content.replace(', maximum-scale=1.0', '');
    }
  };

  document.addEventListener('touchstart', (e) => {
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
      addMaximumScaleToMetaViewport();
    }
  });

  document.addEventListener('touchend', () => {
    setTimeout(removeMaximumScaleFromMetaViewport, 500);
  });
};

// Get device orientation
export const getOrientation = (): 'portrait' | 'landscape' => {
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
};

// Lock orientation to portrait (best effort)
export const lockOrientation = async (orientation: 'portrait' | 'landscape' = 'portrait') => {
  try {
    if ('orientation' in screen && 'lock' in screen.orientation) {
      await (screen.orientation.lock as any)(orientation);
    }
  } catch (error) {
    console.warn('Orientation lock not supported', error);
  }
};

// Share API wrapper
export const shareContent = async (data: ShareData): Promise<boolean> => {
  if (!navigator.share) {
    console.warn('Share API not supported');
    return false;
  }

  try {
    await navigator.share(data);
    return true;
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('Share failed:', error);
    }
    return false;
  }
};

// Background fetch for GPS tracking (experimental)
export const requestBackgroundFetch = async (tag: string, requests: Request[]): Promise<boolean> => {
  if (!('BackgroundFetchManager' in window)) {
    console.warn('Background Fetch API not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // @ts-ignore - BackgroundFetchManager not fully typed
    await registration.backgroundFetch.fetch(tag, requests, {
      title: 'Syncing DadTime data',
      icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
    });
    return true;
  } catch (error) {
    console.error('Background fetch failed:', error);
    return false;
  }
};

// Keep screen awake during timer/GPS tracking
export const requestWakeLock = async (): Promise<WakeLockSentinel | null> => {
  if (!('wakeLock' in navigator)) {
    console.warn('Wake Lock API not supported');
    return null;
  }

  try {
    // @ts-ignore - wakeLock might not be in all TS versions
    const wakeLock = await navigator.wakeLock.request('screen');
    console.log('Screen wake lock activated');
    return wakeLock;
  } catch (error) {
    console.error('Wake lock request failed:', error);
    return null;
  }
};

// Release wake lock
export const releaseWakeLock = (wakeLock: WakeLockSentinel | null) => {
  if (wakeLock) {
    wakeLock.release().then(() => {
      console.log('Screen wake lock released');
    });
  }
};

// Get battery status (to warn user about GPS tracking)
export const getBatteryStatus = async (): Promise<{ level: number; charging: boolean } | null> => {
  if (!('getBattery' in navigator)) {
    return null;
  }

  try {
    // @ts-ignore - Battery API not in all browsers
    const battery = await navigator.getBattery();
    return {
      level: battery.level * 100,
      charging: battery.charging,
    };
  } catch (error) {
    console.error('Battery API failed:', error);
    return null;
  }
};
