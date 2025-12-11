# Automation Features Guide

## Overview

The Dad Tracker app now includes **advanced automation features** that use geofencing, movement detection, and smart triggers to automatically start and stop visits and trips. This eliminates manual tracking and ensures you never miss logging important time with your children.

## Features

### 1. Geofencing (Location-Based Triggers)
Automatically trigger actions when entering or exiting specific locations.

### 2. Movement Detection
Detect when you're driving, walking, or stationary to automatically start/stop trips.

### 3. Location Presets
Save frequently visited locations (home, school, work) with custom automation rules.

### 4. Auto-Start/Stop
Automatically start and stop visits and trips based on your location and movement.

---

## Setup Guide

### Step 1: Enable Automation

1. Navigate to **Settings** page
2. Scroll to **Automation Settings** section
3. Toggle **Enable Automation** to ON
4. This activates all automation features

### Step 2: Configure Automation Preferences

In the Automation Settings section, you can toggle:

- **Auto-start Trips**: Automatically start tracking when driving is detected
- **Auto-stop Trips**: Automatically stop tracking when you've been stationary
- **Auto-start Visits**: Automatically start visit timer when entering a location
- **Auto-stop Visits**: Automatically stop visit timer when leaving a location
- **Geofencing**: Enable location-based triggers (required for location presets)

### Step 3: Adjust Advanced Settings

Fine-tune automation behavior:

- **Minimum Trip Distance** (default: 0.5 miles)
  - Trips shorter than this won't be auto-stopped
  - Prevents stopping during brief stops (traffic lights, etc.)

- **Minimum Trip Duration** (default: 5 minutes)
  - Trips shorter than this won't be auto-stopped
  - Prevents stopping during quick errands

- **Stationary Timeout** (default: 10 minutes)
  - How long you must be stationary before trips auto-stop
  - Gives time for parking, running into store, etc.

### Step 4: Create Location Presets

1. Scroll to **Location Presets** section
2. Tap **Add Location** button
3. Fill in details:
   - **Name**: e.g., "Home", "School", "Mom's House"
   - **Type**: Select category (home, school, work, child location, custom)
   - **Location**: Tap "Use Current Location" (must be at the location)
   - **Radius**: How close you need to be (default: 100 meters)
   - **Child**: (Optional) Associate with specific child
   - **When Entering**: Choose action (start visit, stop trip, do nothing)
   - **When Exiting**: Choose action (stop visit, start trip, do nothing)

4. Tap **Save**

---

## How It Works

### Geofencing Flow

```
You arrive at "Home" location
    ↓
App detects you're within 100m radius
    ↓
Trigger: "When Entering" → Start Visit
    ↓
Visit timer starts automatically
    ↓
You receive notification: "Visit Started - Arrived at Home"
    ↓
You leave the location
    ↓
App detects you've exited the geofence
    ↓
Trigger: "When Exiting" → Stop Visit
    ↓
Visit ends and saves to database
```

### Movement Detection Flow

```
You start driving
    ↓
App detects movement > 10 mph
    ↓
Movement State: Stationary → Driving
    ↓
Auto-start Trips enabled?
    ↓
New trip created automatically
    ↓
GPS tracking begins
    ↓
You arrive and park
    ↓
App detects no movement for 10 minutes
    ↓
Movement State: Driving → Stationary
    ↓
Trip meets minimum distance & duration?
    ↓
Trip ends automatically
```

---

## Example Use Cases

### Use Case 1: Weekend with Children

**Setup:**
- Location: "My House" (type: home)
  - When Entering: Start Visit
  - When Exiting: Stop Visit
  - Child: "Emma"
  - Radius: 100m

**What Happens:**
- Friday 5:00 PM: You pick up Emma and arrive home
- App detects entry into "My House" geofence
- Visit automatically starts
- You spend the weekend together
- Sunday 5:00 PM: You leave to drop Emma off
- App detects exit from geofence
- Visit automatically ends
- Total time logged: ~48 hours

### Use Case 2: School Pickup/Dropoff

**Setup:**
- Location: "Emma's School" (type: school)
  - When Entering: Stop Trip
  - When Exiting: Start Trip
  - Child: "Emma"
  - Radius: 150m

**What Happens:**
- Morning: You leave home to drop Emma at school
- Auto-start Trips enabled → Trip starts when driving detected
- You arrive at school
- App detects entry into "Emma's School" geofence
- Trip automatically stops
- Distance: 3.2 miles (logged for reimbursement)
- Evening: You leave school after pickup
- App detects exit from geofence
- Trip automatically starts for return journey

### Use Case 3: Automatic Trip Tracking

**Setup:**
- Auto-start Trips: ON
- Auto-stop Trips: ON
- Minimum Trip Distance: 0.5 miles
- Stationary Timeout: 10 minutes

**What Happens:**
- You start driving to pick up your child
- Movement detected → Trip auto-starts
- GPS tracks your route
- You arrive at destination
- After 10 minutes stationary → Trip auto-stops
- Trip distance: 2.1 miles
- You're prompted to classify: Child-related or Personal

---

## Movement States

The app detects 3 movement states:

1. **Stationary** (< 1 mph)
   - Not moving or moving very slowly
   - Can trigger auto-stop for trips

2. **Walking** (1-10 mph)
   - Walking, jogging, or slow cycling
   - Currently no automatic actions

3. **Driving** (> 10 mph)
   - In a vehicle
   - Can trigger auto-start for trips

Movement detection uses your last 5 GPS positions to calculate average speed.

---

## Location Preset Examples

### Home Location
```
Name: Home
Type: Home
Radius: 100m
Child: All
When Entering: Start Visit
When Exiting: Stop Visit
```

### Other Parent's House
```
Name: Mom's House
Type: Child Location
Radius: 100m
Child: Emma
When Entering: Do Nothing
When Exiting: Start Trip (for tracking return mileage)
```

### Child's School
```
Name: Oakwood Elementary
Type: School
Radius: 150m
Child: Emma
When Entering: Stop Trip
When Exiting: Start Trip
```

### Your Work
```
Name: My Office
Type: Work
Radius: 100m
When Entering: Stop Trip
When Exiting: Start Trip (if going to pick up child)
```

---

## Notifications

You'll receive notifications for:

- **Visit Started**: When a visit is auto-started
- **Visit Ended**: When a visit is auto-stopped
- **Trip Started**: When a trip is auto-started (driving detected)
- **Trip Ended**: When a trip is auto-stopped (stationary detected)
- **Geofence Enter**: When you enter a preset location
- **Geofence Exit**: When you exit a preset location

Make sure notifications are enabled in your browser/device settings.

---

## Best Practices

### For Geofencing

✅ **Do:**
- Set radius to 100-150m for accuracy
- Use "Home" type for your primary residence
- Create presets for frequently visited child-related locations
- Test geofences by visiting the location and checking logs

❌ **Don't:**
- Set radius too small (< 50m) - GPS accuracy varies
- Set radius too large (> 500m) - May trigger too early
- Create overlapping geofences with conflicting actions
- Rely solely on geofencing - always verify logs

### For Movement Detection

✅ **Do:**
- Keep Auto-start Trips ON for automatic mileage tracking
- Set Minimum Trip Distance to filter out very short trips
- Set Stationary Timeout to 10+ minutes to avoid premature stops
- Review and classify auto-started trips promptly

❌ **Don't:**
- Set Stationary Timeout too low (< 5 min) - will stop at traffic lights
- Disable location services mid-trip
- Ignore unclassified trips - they won't count for reimbursement

### For Visit Tracking

✅ **Do:**
- Create location presets for all custody exchange locations
- Associate presets with specific children
- Review auto-started visits to add notes
- Keep automation enabled during custody time

❌ **Don't:**
- Forget to enable "Auto-start Visits" if relying on geofencing
- Create presets for locations you visit for non-child reasons
- Disable automation without manually tracking

---

## Troubleshooting

### Geofencing Not Triggering

**Problem:** You enter a location but nothing happens

**Solutions:**
1. Check **Settings** → Ensure "Geofencing" is enabled
2. Check location preset → Verify "Use Current Location" was at correct spot
3. Check browser location permission → Should be "Allow"
4. Check radius → May need to increase to 150-200m
5. Open browser console → Look for "✅ Entered geofence: [Name]" log

### Trips Not Auto-Starting

**Problem:** You start driving but trip doesn't start

**Solutions:**
1. Check **Settings** → Ensure "Auto-start Trips" is enabled
2. Check **Settings** → Ensure "Enable Automation" is ON
3. Check location permission → Must be "Allow" and High Accuracy
4. Wait 30 seconds → Movement detection needs multiple GPS positions
5. Check console → Look for "🏃 Movement state changed: ... → driving" log

### Trips Auto-Stopping Too Soon

**Problem:** Trip stops while you're still driving

**Solutions:**
1. Increase **Stationary Timeout** to 15-20 minutes
2. Check **Minimum Trip Distance** → May be too low
3. Ensure you're actually moving → GPS may have lost signal
4. Check for conflicting geofences → May be triggering "Stop Trip"

### Visits Not Auto-Starting

**Problem:** You arrive at home but visit doesn't start

**Solutions:**
1. Check **Settings** → Ensure "Auto-start Visits" is enabled
2. Check location preset → Must have "When Entering: Start Visit"
3. Check location preset → Must have child assigned
4. Verify no active visit → Can't start new visit if one is running
5. Check geofencing is enabled

---

## Privacy & Battery

### Location Privacy
- Location data is stored **locally on your device**
- GPS positions are only collected during active tracking
- No location data is sent to third parties
- You can view all stored positions in browser console

### Battery Impact
- **Low Impact** when automation is idle
- **Moderate Impact** when location monitoring is active
- **Higher Impact** during active trip tracking (continuous GPS)

**Tips to Minimize Battery Drain:**
- Only enable automation when needed
- Disable "Auto-start Trips" if you manually start trips
- Use Wi-Fi when possible (more accurate, less battery)
- Close app tabs when not in use (background tracking continues)

---

## Debugging

### Check Automation Status

Open browser console and run:

```javascript
// Check if automation is enabled
localStorage.getItem('dadtime_automation_settings')

// Expected output:
// {"enabled":true,"autoStartTrips":true,"autoStopTrips":true,...}
```

### Check Location Presets

```javascript
// View all location presets
localStorage.getItem('dadtime_location_presets')

// Expected output:
// [{"id":"preset_123","name":"Home","lat":37.123,"lng":-122.456,...}]
```

### Check Current Movement State

```javascript
// Check position history
localStorage.getItem('dadtime_position_history')

// Expected output:
// [{"lat":37.123,"lng":-122.456,"timestamp":"2025-12-11T...","accuracy":10}]
```

### Console Logs to Watch For

```
✅ Background automation initialized
📍 Saved location preset: Home
👀 Starting location monitoring for automation
✅ Entered geofence: Home
🏠 Auto-started visit at: Home
🏃 Movement state changed: stationary → driving (12.3 mph)
🚗 Auto-started trip (driving detected)
🛑 Auto-stopped trip (stationary detected)
```

---

## Advanced Configuration

### Custom Movement Thresholds

The app uses these speed thresholds (in mph):
- Stationary: < 1 mph
- Walking: 1-10 mph
- Driving: > 10 mph

These are not user-configurable but are optimized for accuracy.

### Geofence Radius Guidelines

- **Home/Work**: 100m (tight accuracy)
- **School**: 150m (parking lot coverage)
- **Large venues**: 200-300m (shopping centers, parks)
- **Rural areas**: 300-500m (GPS less accurate)

### Position History

The app keeps the last 20 GPS positions (about 2 minutes of tracking) to calculate movement state. This is automatically cleaned up and not stored long-term.

---

## Future Enhancements

Planned features for automation:

1. **Smart Visit Detection**
   - Detect when you're at a child's location based on time of day
   - Auto-suggest visit type based on duration

2. **Recurring Schedule Integration**
   - Import custody schedule from calendar
   - Auto-start visits at scheduled times

3. **Activity Recognition**
   - Detect specific activities (at park, at restaurant)
   - Tag visits with activity types

4. **Multi-Child Support**
   - Handle multiple children at different locations
   - Smart detection of which child you're with

---

## Support

If automation features aren't working:

1. Check all settings are enabled
2. Verify location permissions
3. Review browser console for errors
4. Test with a single location preset first
5. Report issues with console logs

For GPS issues:
- Use Chrome for best GPS support
- Test on actual device (not simulator)
- Ensure location services enabled
- Try disabling battery saver mode

---

**Last Updated:** December 11, 2025
**Version:** 1.0.0
