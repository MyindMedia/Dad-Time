# Background Tracking Guide

## Overview

The Dad Tracker app now includes **comprehensive background tracking** for both timer (visit tracking) and GPS (trip tracking). This ensures that tracking continues even when:

- The app tab is not visible
- The browser is minimized
- You switch to another tab
- The page is reloaded
- On mobile: the browser is in the background

## How It Works

### Technical Implementation

1. **Page Visibility API** - Detects when the app is hidden/visible
2. **LocalStorage Persistence** - Stores tracking state across page reloads
3. **Custom Event System** - Broadcasts updates between tabs
4. **Native Geolocation API** - Continuous GPS position watching
5. **Web Notifications** - Alerts when tracking continues in background

### Features

✅ **Timer Tracking**
- Continues running even when tab is hidden
- Persists across page reloads
- Syncs state every 30 seconds
- Resumes automatically if you reload the page

✅ **GPS Tracking**
- Continues tracking location in background
- Buffers GPS points for efficiency
- Persists to storage automatically
- High accuracy mode enabled

✅ **Notifications**
- Permission requested on first use
- Notifies when tracking continues in background
- Alerts for GPS permission errors

## How to Test

### Test 1: Timer Background Operation

1. **Start a Visit**
   ```
   - Navigate to /visit page
   - Select a child
   - Click "Start Visit"
   - Timer should start counting
   ```

2. **Test Background Operation**
   ```
   - Switch to another tab (timer keeps running)
   - Minimize browser (timer keeps running)
   - Reload the page (timer resumes from correct time)
   - Close and reopen tab (timer still active!)
   ```

3. **Verify Persistence**
   ```
   - Open browser console: localStorage.getItem('dadtime_background_state')
   - Should show: { timerActive: true, timerStartTime: "...", timerVisitId: "..." }
   ```

4. **Stop the Visit**
   ```
   - Click "Stop Visit"
   - Timer should stop and save to database
   - Background state should clear
   ```

### Test 2: GPS Background Tracking

1. **Start a Trip**
   ```
   - Navigate to /trips page
   - Click "Start Trip"
   - GPS should begin tracking
   - Map should show your current location
   ```

2. **Test Background Operation**
   ```
   - Switch to another tab (GPS keeps tracking)
   - Minimize browser (GPS keeps tracking)
   - Walk/drive around (path updates automatically)
   - Reload the page (GPS resumes tracking)
   ```

3. **Verify GPS Updates**
   ```
   - Open browser console
   - You should see: "📍 GPS update: { lat: ..., lng: ... }"
   - Every few seconds as you move
   ```

4. **Stop the Trip**
   ```
   - Click "Stop Trip"
   - Classify the trip (Child-related / Personal)
   - GPS tracking should stop
   - Path and distance saved to database
   ```

### Test 3: Page Reload Persistence

**For Timer:**
```bash
1. Start a visit timer
2. Wait 1 minute
3. Hard reload the page (Cmd+Shift+R or Ctrl+Shift+R)
4. Timer should resume from ~60 seconds
5. Check that visit data is still intact
```

**For GPS:**
```bash
1. Start a trip
2. Let it track for 1-2 minutes
3. Hard reload the page
4. GPS should resume tracking
5. Path should include all previously tracked points
```

### Test 4: Multi-Tab Sync

```bash
1. Open the app in Tab 1
2. Start a visit timer
3. Open the app in Tab 2 (same browser)
4. Both tabs should show the same timer
5. Stop the visit in Tab 2
6. Tab 1 should also update to stopped state
```

### Test 5: Notifications

**First Time:**
```bash
1. Start a visit or trip
2. Browser should request notification permission
3. Grant permission
```

**Subsequent Uses:**
```bash
1. Start a visit or trip
2. Switch to another tab
3. You should see notification:
   "Tracking in Background - Timer will continue while the app is in the background"
```

## Debugging

### Check Background State

Open browser console and run:

```javascript
// Check current background state
localStorage.getItem('dadtime_background_state')

// Expected when timer is active:
// {"timerActive":true,"timerStartTime":"2025-12-11T...","timerVisitId":"abc123"}

// Expected when GPS is active:
// {"gpsActive":true,"gpsTripId":"def456","lastGPSUpdate":"2025-12-11T..."}
```

### Check GPS Buffer

```javascript
// Check buffered GPS positions
localStorage.getItem('dadtime_gps_buffer')
```

### Console Logs

The background tracking service logs helpful messages:

```
🚀 Initializing background tracking service
🕐 Starting background timer for visit: abc123
📍 Starting background GPS tracking for trip: def456
💾 Persisting timer state: 30 seconds
💾 Persisting 5 GPS positions
📱 App hidden - continuing background tracking
📱 App visible - syncing state
✅ Background tracking initialized
```

### Force Stop All Tracking

If something goes wrong, you can manually stop all tracking:

```javascript
// In browser console:
import { stopAllBackgroundTracking } from './services/backgroundTracking';
stopAllBackgroundTracking();
```

Or clear localStorage:

```javascript
localStorage.removeItem('dadtime_background_state');
localStorage.removeItem('dadtime_gps_buffer');
```

## Known Limitations

### Browser Limitations

1. **iOS Safari (Non-PWA)**
   - GPS tracking may pause after ~3 minutes in background
   - Timer will continue but with reduced accuracy
   - Solution: Install as PWA (Add to Home Screen)

2. **Desktop Browsers**
   - GPS tracking works best in foreground
   - Background location may be throttled after 30 minutes
   - Timer has no limitations

3. **Battery Saver Mode**
   - GPS accuracy may be reduced
   - Update frequency may be lowered
   - This is a browser/OS optimization

### Data Persistence

- Background state stored in localStorage
- If you clear browser data, active tracking will stop
- GPS buffer persisted every 5 positions or 1 minute
- Timer state persisted every 30 seconds

## Best Practices

### For Visit Tracking

✅ **Do:**
- Start timer when visit begins
- Keep app tab open in background (doesn't need to be visible)
- Let timer run naturally
- Stop timer when visit ends

❌ **Don't:**
- Clear browser data while timer is running
- Use private/incognito mode (localStorage won't persist)
- Close all browser tabs (tracking will pause)

### For GPS Tracking

✅ **Do:**
- Grant location permission when prompted
- Use "High Accuracy" mode for best results
- Keep browser tab open (can be in background)
- Let GPS track for entire trip duration

❌ **Don't:**
- Disable location services mid-trip
- Clear browser data while tracking
- Use VPN (may affect GPS accuracy)
- Rapidly switch between tabs (let it stabilize)

## Troubleshooting

### Timer Not Persisting After Reload

**Problem:** Timer resets to 00:00:00 after page reload

**Solution:**
1. Check browser console for errors
2. Verify localStorage is enabled
3. Check: `localStorage.getItem('dadtime_background_state')`
4. If null, the visit wasn't started properly
5. Try starting a new visit

### GPS Not Tracking

**Problem:** Location not updating on map

**Solution:**
1. Check location permission (should be "Allow")
2. Verify GPS is enabled on device
3. Check browser console for GPS errors
4. Try refreshing the page
5. On mobile: ensure GPS accuracy is set to "High"

### Notifications Not Showing

**Problem:** No notification when app goes to background

**Solution:**
1. Check notification permission (should be "Granted")
2. Verify notifications are enabled in browser settings
3. Check: `Notification.permission` in console
4. Try manually requesting: `Notification.requestPermission()`

### Multiple Tabs Conflict

**Problem:** Different timers in different tabs

**Solution:**
1. Only start timers/trips in one tab at a time
2. Background state syncs via custom events
3. If conflict: close extra tabs and reload
4. Check which visit/trip ID is in background state

## Architecture

### Files

```
src/services/backgroundTracking.ts  - Main background service
src/pages/Visit.tsx                  - Integrated timer tracking
src/pages/Trips.tsx                  - Integrated GPS tracking
src/main.tsx                         - Service initialization
```

### State Flow

```
User Action (Start Visit/Trip)
    ↓
Update localStorage (background state)
    ↓
Start setInterval / watchPosition
    ↓
Broadcast Custom Events
    ↓
Update UI Components
    ↓
Persist to Database (storage.ts)
    ↓
Sync to Supabase
```

### Event System

```javascript
// Timer events
window.addEventListener('timer-tick', (event) => {
  console.log('Timer update:', event.detail.elapsed);
});

// GPS events
window.addEventListener('gps-update', (event) => {
  console.log('GPS update:', event.detail.lat, event.detail.lng);
});

// Background state changes
window.addEventListener('background-state-changed', (event) => {
  console.log('State changed:', event.detail);
});
```

## Future Enhancements

### Potential Improvements

1. **Service Worker Integration**
   - True background operation (even when all tabs closed)
   - Requires HTTPS and service worker support
   - Would enable offline sync

2. **Background Sync API**
   - Automatically sync data when online
   - Retry failed syncs
   - Better offline support

3. **Geolocation Geofencing**
   - Auto-start trip when leaving home
   - Auto-stop trip when arriving at destination
   - Smart visit detection

4. **Battery Optimization**
   - Adaptive GPS accuracy
   - Smart polling intervals
   - Pause tracking when stationary

## Support

If you encounter issues:

1. Check browser console for error messages
2. Verify localStorage and notification permissions
3. Test in latest Chrome/Safari
4. Try incognito mode (for permission issues)
5. Clear app data and restart

For GPS issues:
- Use Chrome for best GPS support
- Test on actual mobile device (not simulator)
- Check device GPS settings
- Verify location services are enabled

---

**Last Updated:** December 11, 2025
**Version:** 1.0.0
