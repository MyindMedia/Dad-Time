# Background Tracking Guide

This document explains how background GPS and timer tracking works in the Dad Tracker app, including browser capabilities and limitations.

## Features Implemented

### 1. **Wake Lock API** ✅
- **Purpose**: Keeps the screen active during tracking to prevent device sleep
- **When it activates**: Automatically when you start a visit timer or GPS trip tracking
- **Browser support**: Chrome/Edge on Android, Safari on iOS 16.4+
- **How it works**:
  - When timer or GPS starts, the app requests a wake lock
  - Screen stays on while tracking is active
  - Automatically releases when tracking stops
  - Re-acquires if released due to user interaction

**Status indicators**: The app shows active tracking status at the top of the screen:
- `Timing 00:15:23` - Active visit timer with elapsed time
- `GPS 2m ago` - GPS tracking with last update time

### 2. **Page Visibility API** ✅
- **Purpose**: Detects when app is backgrounded and continues tracking
- **How it works**:
  - JavaScript continues running when tab is in background
  - Timer keeps counting in background
  - GPS positions are buffered and saved
  - Notifications alert you that tracking continues

### 3. **Service Worker** ✅
- **Purpose**: Provides offline capability and background notifications
- **Features**:
  - Caches app for offline use
  - Shows notifications when tracking starts/stops
  - Handles share target for importing evidence
  - Persists tracking data

### 4. **LocalStorage Persistence** ✅
- **Purpose**: Saves tracking state even if app crashes or closes
- **What's saved**:
  - Active timer state and start time
  - Active trip ID and GPS data
  - Last GPS update timestamp
  - Position history for movement detection

## Browser Limitations

### Mobile Browsers

#### iOS Safari
- ✅ **Works**: Wake Lock API (iOS 16.4+)
- ✅ **Works**: Timer/GPS when app is in foreground
- ✅ **Works**: LocalStorage persistence
- ⚠️ **Limited**: JavaScript execution pauses after ~5 minutes in background
- ❌ **Doesn't work**: Screen lock stops all JavaScript

**Recommendation**: Keep screen on during tracking or install as PWA (Add to Home Screen)

#### iOS PWA (Installed App)
- ✅ **Better**: Longer background execution time
- ✅ **Works**: Wake Lock keeps screen active
- ✅ **Works**: Service Worker notifications
- ⚠️ **Limited**: Still pauses when screen locks

#### Android Chrome
- ✅ **Excellent**: Wake Lock API works perfectly
- ✅ **Good**: Background execution is more permissive
- ✅ **Works**: Continues tracking for 5-10 minutes when backgrounded
- ⚠️ **Limited**: Screen lock stops JavaScript after timeout

#### Desktop Browsers (Chrome, Edge, Firefox)
- ✅ **Excellent**: Full background support
- ✅ **Works**: Timer and GPS continue indefinitely in background
- ✅ **Works**: Wake Lock prevents screen sleep

## Best Practices for Users

### For Reliable Tracking:

1. **Keep Screen On** (Recommended)
   - The app will request wake lock automatically
   - This keeps your screen on but dims after timeout
   - Most reliable method across all devices

2. **Install as PWA** (Highly Recommended)
   - On iOS: Tap Share → "Add to Home Screen"
   - On Android: Tap menu → "Install App" or "Add to Home Screen"
   - Better background support than browser tab

3. **Check Status Indicator**
   - Top of screen shows `Timing X:XX:XX` or `GPS Xm ago`
   - If you don't see it, tracking may have stopped

4. **Use Automation Features**
   - Enable auto-start/stop in Settings
   - Set up location presets (Home, School, Work)
   - Reduces manual interaction needed

### What Happens When Screen Locks:

**iOS**:
- Timer tracking: Pauses after ~5 minutes
- GPS tracking: Stops immediately
- **Solution**: Use Wake Lock to prevent screen lock

**Android**:
- Timer tracking: Continues for ~5-10 minutes
- GPS tracking: Continues for ~5-10 minutes
- **Solution**: Use Wake Lock to prevent screen lock

**Desktop**:
- ✅ Everything continues indefinitely

## Technical Architecture

### Timer Tracking Flow
```
User starts visit →
  requestWakeLock() →
  startBackgroundTimer() →
  setInterval(1000ms) updates every second →
  LocalStorage persisted every 30s →
  Timer stops → releaseWakeLock()
```

### GPS Tracking Flow
```
User starts trip →
  requestWakeLock() →
  startBackgroundGPS() →
  navigator.geolocation.watchPosition() →
  Buffer GPS positions →
  Persist to storage every 5 positions →
  Calculate distance using Haversine formula →
  GPS stops → releaseWakeLock()
```

### Automation Flow
```
Location monitoring active →
  Check geofences every position update →
  Detect movement state (stationary/walking/driving) →
  Auto-start/stop based on settings →
  Show notifications
```

## API Support Table

| Feature | iOS Safari | iOS PWA | Android Chrome | Desktop |
|---------|-----------|---------|----------------|---------|
| Wake Lock API | ✅ 16.4+ | ✅ | ✅ | ✅ |
| Page Visibility | ✅ | ✅ | ✅ | ✅ |
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Background Execution | ⚠️ 5min | ⚠️ Better | ⚠️ 5-10min | ✅ Unlimited |
| GPS while locked | ❌ | ❌ | ❌ | N/A |
| LocalStorage | ✅ | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ | ✅ |

## Troubleshooting

### "GPS tracking stopped unexpectedly"
- Check if screen locked (iOS limitation)
- Ensure location permissions are granted
- Try enabling Wake Lock in browser settings

### "Timer is not accurate"
- App may have been killed by OS
- Check localStorage - timer state is persisted
- Install as PWA for better reliability

### "Wake Lock not working"
- Check browser compatibility (iOS 16.4+, Chrome 84+)
- Ensure HTTPS connection (required for Wake Lock)
- Try restarting browser

### "Background tracking stopped after 5 minutes"
- This is a browser limitation on mobile
- Use Wake Lock to prevent screen sleep
- Consider desktop version for longer tracking

## Future Enhancements

Potential improvements when browser APIs evolve:

- **Periodic Background Sync**: Automatic data sync even when app is closed
- **Background Fetch**: Download large files in background
- **Web Bluetooth**: Connect to external GPS devices
- **Geolocation Background Permission**: True background GPS on mobile

## Developer Notes

### Testing Background Tracking

1. Start timer or GPS tracking
2. Switch to another app (don't lock screen)
3. Wait 30 seconds
4. Return to app
5. Verify tracking continued

### Debugging

Check console logs:
- `🔆 Wake lock acquired` - Wake Lock active
- `📱 App hidden - continuing background tracking` - Page backgrounded
- `📍 GPS update:` - New position received
- `💾 Persisting timer state` - Data saved to storage

### Code Locations

- Wake Lock implementation: `src/services/backgroundTracking.ts` (lines 99-156)
- Timer tracking: `src/services/backgroundTracking.ts` (lines 158-240)
- GPS tracking: `src/services/backgroundTracking.ts` (lines 257-368)
- Service Worker: `public/sw.js`
- PWA Manifest: `public/manifest.json`

## Support

For issues or questions:
- Check browser console for errors
- Verify API support in your browser
- Try installing as PWA
- Test on desktop for full functionality
