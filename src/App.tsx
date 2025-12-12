import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Visit } from './pages/Visit';
import { Trips } from './pages/Trips';
import { Expenses } from './pages/Expenses';
import { Evidence } from './pages/Evidence';
import React, { useEffect, useState } from 'react';
const SettingsLazy = React.lazy(async () => ({ default: (await import('./pages/Settings')).Settings }));
import { Reports } from './pages/Reports';
import { Conversations } from './pages/Conversations';
import { Timesheet } from './pages/Timesheet';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { ensureBuckets } from './services/buckets';
import { initBackgroundTracking } from './services/backgroundTracking';
import { pageTransitionSlide } from './lib/animations';
import { ToastContainer } from './components/Toast';
import { useToast } from './hooks/useToast';
import { HapticFeedback } from './utils/ios';
import type { PanInfo } from 'framer-motion';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/visit" element={<PageWrapper><Visit /></PageWrapper>} />
        <Route path="/trips" element={<PageWrapper><Trips /></PageWrapper>} />
        <Route path="/expenses" element={<PageWrapper><Expenses /></PageWrapper>} />
        <Route path="/evidence" element={<PageWrapper><Evidence /></PageWrapper>} />
        <Route path="/conversations" element={<PageWrapper><Conversations /></PageWrapper>} />
        <Route path="/timesheet" element={<PageWrapper><Timesheet /></PageWrapper>} />
        <Route path="/reports" element={<PageWrapper><Reports /></PageWrapper>} />
        <Route path="/settings" element={<PageWrapper><SettingsLazy /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}

/**
 * PageWrapper Component
 *
 * Wraps each page with consistent transition animations and swipe-back gesture
 */
function PageWrapper({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const x = useMotionValue(0);
  const [canGoBack, setCanGoBack] = useState(false);

  // Check if we can go back (not on home page)
  useEffect(() => {
    setCanGoBack(location.pathname !== '/');
  }, [location]);

  // Background opacity for iOS-style fade
  const backgroundOpacity = useTransform(x, [0, 150], [0, 0.15]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Only trigger swipe-back if user swipes from left edge (starting position matters)
    if (canGoBack && info.offset.x > 100 && info.velocity.x > 300) {
      HapticFeedback.medium();
      navigate(-1);
    } else {
      // Snap back if threshold not met
      x.set(0);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Previous page preview (iOS-style) */}
      {canGoBack && (
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#000',
            opacity: backgroundOpacity,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Current page with swipe gesture */}
      <motion.div
        drag={canGoBack ? "x" : false}
        dragConstraints={{ left: 0, right: 300 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x, width: '100%', height: '100%' }}
        variants={pageTransitionSlide}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </div>
  );
}

function App() {
  const { toasts, dismissToast } = useToast();
  useEffect(() => {
    ensureBuckets();
    initBackgroundTracking();
  }, []);

  return (
    <Router>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <Layout>
        <AnimatedRoutes />
      </Layout>
    </Router>
  );
}

export default App;
