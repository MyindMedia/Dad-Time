# DadTime - Apple Mini App Setup Guide

## What is an Apple Mini App?

DadTime is optimized as a Progressive Web App (PWA) specifically designed for iOS devices. When installed from Safari, it functions as a native-like app with offline capabilities, home screen integration, and iOS-specific features.

## Features Implemented

### iOS-Specific Optimizations

✅ **Safe Area Support** - Respects iPhone notch and home indicator
✅ **Haptic Feedback** - Tactile responses for button taps and actions
✅ **Wake Lock API** - Keeps screen on during timer/GPS tracking
✅ **Offline Support** - Service Worker caching for offline functionality
✅ **Share Extension Support** - Add evidence from iOS Share Sheet
✅ **App Shortcuts** - Quick actions from home screen
✅ **Standalone Mode** - Runs fullscreen without Safari UI

### Core Features

- ⏱️ **Visit Timer** - Track time spent with children
- 🗺️ **GPS Trip Tracking** - Log mileage for reimbursement
- 💰 **Expense Logging** - Track shared expenses
- 📸 **Evidence Archive** - Store photos, notes, and communications
- 📊 **PDF Reports** - Generate court-ready documentation

## Installation Instructions

### For Users (Installing on iPhone/iPad)

1. **Open Safari** on your iPhone/iPad
2. **Navigate to** your deployed DadTime URL
3. **Tap the Share button** (square with arrow pointing up)
4. **Scroll down** and tap "Add to Home Screen"
5. **Tap "Add"** in the top right corner
6. **DadTime app** will now appear on your home screen

### For Developers (Building & Deploying)

#### Prerequisites

```bash
node >= 18.x
npm >= 9.x
```

#### Environment Setup

Create a `.env` file in the project root:

```env
# Optional: Supabase Backend (for sync)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: OpenAI for AI features
VITE_OPENAI_API_KEY=your_openai_api_key
```

#### Build Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

#### Deployment

The app can be deployed to any static hosting service:

**Recommended Hosts:**
- **Vercel** (easiest for React apps)
- **Netlify**
- **Cloudflare Pages**
- **GitHub Pages**

**Example: Deploy to Vercel**

```bash
npm install -g vercel
vercel --prod
```

#### Required Files for Apple Mini App

Make sure these files exist in your `public/` folder:

```
public/
├── manifest.json         ✅ Created
├── sw.js                 ✅ Created
├── icon-192.png          ⚠️ Need to create
├── icon-512.png          ⚠️ Need to create
├── icon-visit.png        ⚠️ Need to create (for shortcuts)
├── icon-trip.png         ⚠️ Need to create
├── icon-expense.png      ⚠️ Need to create
└── screenshot-mobile.png ⚠️ Need to create
```

#### Creating App Icons

Use a tool like [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator):

```bash
npx pwa-asset-generator logo.svg public --icon-only
```

Or create manually:
- **icon-192.png**: 192x192 pixels
- **icon-512.png**: 512x512 pixels
- Use your brand colors: Primary #1A66FF, Secondary #F79C21, Dark #00082D

## Testing on iOS

### Local Testing

1. **Build the app** for production
2. **Serve locally** with HTTPS (required for service workers):

```bash
npm run build
npx serve -s dist -l 443 --ssl-cert cert.pem --ssl-key key.pem
```

3. **Use ngrok** for testing on real device:

```bash
ngrok http 3000
# Use the HTTPS URL on your iPhone
```

### Testing Checklist

- [ ] App installs from Safari
- [ ] Runs in standalone mode (no Safari UI)
- [ ] Offline mode works (turn off wifi/data)
- [ ] Safe areas respected (notch area, home indicator)
- [ ] Haptic feedback works on button taps
- [ ] Timer prevents screen sleep
- [ ] GPS tracking works accurately
- [ ] Share extension receives files
- [ ] Home screen shortcuts work

## iOS-Specific APIs Used

### 1. Haptic Feedback
```typescript
import { HapticFeedback } from './utils/ios';

// Light tap
HapticFeedback.light();

// Success notification
HapticFeedback.success();
```

### 2. Wake Lock (Keep Screen On)
```typescript
import { requestWakeLock, releaseWakeLock } from './utils/ios';

const wakeLock = await requestWakeLock();
// ... do work ...
releaseWakeLock(wakeLock);
```

### 3. Safe Area Insets
```css
/* Automatically handled via CSS variables */
padding-bottom: calc(80px + var(--safe-area-bottom));
```

### 4. Share Target
```javascript
// Receives shared files from iOS Share Sheet
// Configured in manifest.json
```

## Troubleshooting

### Service Worker Not Registering

- Ensure you're using **HTTPS** (required for service workers)
- Check browser console for errors
- Clear Safari cache and reload

### App Not Installing

- Must use **Safari** (Chrome/Firefox won't work)
- Check that `manifest.json` is accessible
- Verify all icons exist

### Haptics Not Working

- Real device required (doesn't work in simulator)
- User must have haptics enabled in iOS settings
- Falls back silently if not supported

### GPS Tracking Inaccurate

- Ensure location permissions granted
- Test outdoors for better signal
- Battery saver mode may reduce accuracy

## Performance Optimizations

The app is optimized for mobile with:

- **Code Splitting** - Lazy loading of routes
- **Tree Shaking** - Unused code removed
- **Asset Optimization** - Images compressed
- **Service Worker Caching** - Instant loads after first visit
- **Local-First Architecture** - No network delays

## Privacy & Data Storage

### Local Storage
All data is stored locally in the browser's localStorage by default:
- No server required for basic functionality
- Data persists between sessions
- Completely private

### Optional Cloud Sync
If Supabase credentials are provided:
- Background sync to cloud
- Access data on multiple devices
- Row-Level Security (RLS) ensures data privacy

## Font & Icon Attribution

**Fonts:**
- Inter - [Google Fonts](https://fonts.google.com/specimen/Inter) (SIL Open Font License)

**Icons:**
- Lucide React - MIT License
- Optional: Font Awesome - [fontawesome.com](https://fontawesome.com) (Free tier)

## Next Steps

1. **Create app icons** (192x192, 512x512)
2. **Deploy to hosting** (Vercel/Netlify)
3. **Test on real iPhone/iPad**
4. **Submit for App Store** (optional - requires Apple Developer account)
   - Wrap in WKWebView using tools like Capacitor/Cordova
   - OR keep as PWA (no App Store needed!)

## Support

For issues or questions:
- Check browser console for errors
- Ensure all required files exist
- Test in Safari (not Chrome)
- Verify HTTPS is enabled

## License

Private project for co-parenting tracking.
