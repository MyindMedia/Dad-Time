import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Visit } from './pages/Visit';
import { Trips } from './pages/Trips';
import { Expenses } from './pages/Expenses';
import { Evidence } from './pages/Evidence';
import React, { useEffect } from 'react';
const SettingsLazy = React.lazy(async () => ({ default: (await import('./pages/Settings')).Settings }));
import { Reports } from './pages/Reports';
import { Conversations } from './pages/Conversations';
import { Timesheet } from './pages/Timesheet';
import { AnimatePresence, motion } from 'framer-motion';
import { ensureBuckets } from './services/buckets';
import { initBackgroundTracking } from './services/backgroundTracking';
import { pageTransitionSlide } from './lib/animations';
import { ToastContainer } from './components/Toast';
import { useToast } from './hooks/useToast';

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
 * Wraps each page with consistent transition animations
 */
function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageTransitionSlide}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
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
