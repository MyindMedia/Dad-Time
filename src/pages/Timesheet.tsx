import React, { useMemo, useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { useEntity } from '../hooks/useEntity';
import type { VisitSession, Trip } from '../types';
import { differenceInMinutes, format } from 'date-fns';
import { MapPin, Clock, Trash2, RefreshCw } from 'lucide-react';
import { springConfig } from '../lib/animations';
import { HapticFeedback } from '../utils/ios';
import { usePullToRefresh } from '../hooks/useGesture';

/**
 * SwipeableVisitCard Component
 * Displays a visit with swipe-to-delete functionality
 */
const SwipeableVisitCard: React.FC<{
  visit: VisitSession;
  onDelete: () => void;
}> = ({ visit, onDelete }) => {
  const x = useMotionValue(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);
  const deleteScale = useTransform(x, [-100, 0], [1, 0.8]);

  const visitDuration = () => {
    if (!visit.endTime) return '—';
    const mins = differenceInMinutes(new Date(visit.endTime), new Date(visit.startTime));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = -100;

    if (info.offset.x < threshold) {
      HapticFeedback.heavy();
      setIsDeleting(true);
      setTimeout(() => {
        onDelete();
      }, 300);
    } else {
      x.set(0);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Delete background */}
      <motion.div
        className="absolute inset-0 bg-[#F14040] flex items-center justify-end px-6 rounded-xl"
        style={{ opacity: deleteOpacity }}
      >
        <motion.div style={{ scale: deleteScale }}>
          <Trash2 size={24} className="text-white" />
        </motion.div>
      </motion.div>

      {/* Swipeable card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x }}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={isDeleting ? { opacity: 0, x: -300, scale: 0.8 } : { opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={springConfig.smooth}
        className="border border-[#EFEFEF] rounded-xl p-4 flex items-center justify-between bg-white cursor-grab active:cursor-grabbing"
      >
        <div>
          <p className="font-semibold text-sm text-[#00082D]">{format(new Date(visit.startTime), 'PP')}</p>
          <p className="text-xs text-[#202020] opacity-70 capitalize">{visit.type.replace(/_/g, ' ')}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-sm text-[#00082D]">{visitDuration()}</p>
          <p className="text-xs text-[#202020] opacity-70">
            {format(new Date(visit.startTime), 'p')} - {visit.endTime ? format(new Date(visit.endTime), 'p') : '—'}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * SwipeableTripCard Component
 * Displays a trip with swipe-to-delete functionality
 */
const SwipeableTripCard: React.FC<{
  trip: Trip;
  onDelete: () => void;
}> = ({ trip, onDelete }) => {
  const x = useMotionValue(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);
  const deleteScale = useTransform(x, [-100, 0], [1, 0.8]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = -100;

    if (info.offset.x < threshold) {
      HapticFeedback.heavy();
      setIsDeleting(true);
      setTimeout(() => {
        onDelete();
      }, 300);
    } else {
      x.set(0);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Delete background */}
      <motion.div
        className="absolute inset-0 bg-[#F14040] flex items-center justify-end px-6 rounded-xl"
        style={{ opacity: deleteOpacity }}
      >
        <motion.div style={{ scale: deleteScale }}>
          <Trash2 size={24} className="text-white" />
        </motion.div>
      </motion.div>

      {/* Swipeable card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x }}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={isDeleting ? { opacity: 0, x: -300, scale: 0.8 } : { opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={springConfig.smooth}
        className="border border-[#EFEFEF] rounded-xl p-4 flex items-center justify-between bg-white cursor-grab active:cursor-grabbing"
      >
        <div>
          <p className="font-semibold text-sm text-[#00082D]">{format(new Date(trip.startTime), 'PP')}</p>
          <p className="text-xs text-[#202020] opacity-70 capitalize">{trip.purpose.replace(/_/g, ' ')}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-sm text-[#00082D]">{(trip.distanceMiles || 0).toFixed(2)} mi</p>
          <p className="text-xs text-[#202020] opacity-70">
            {format(new Date(trip.startTime), 'p')} - {trip.endTime ? format(new Date(trip.endTime), 'p') : '—'}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export const Timesheet: React.FC = () => {
  const { items: visits, remove: removeVisit, refresh: refreshVisits } = useEntity<VisitSession>('visits');
  const { items: trips, remove: removeTrip, refresh: refreshTrips } = useEntity<Trip>('trips');

  const sortedVisits = useMemo(() => {
    return [...visits]
      .filter(v => v.endTime) // show completed visits
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [visits]);

  const sortedTrips = useMemo(() => {
    return [...trips]
      .filter(t => t.endTime) // show completed trips
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [trips]);

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    await Promise.all([
      refreshVisits?.(),
      refreshTrips?.()
    ]);
  };

  const { pullToRefreshHandlers, isRefreshing, pullProgress } = usePullToRefresh({
    onRefresh: handleRefresh
  });

  return (
    <div
      ref={pullToRefreshHandlers.ref as any}
      className="min-h-screen bg-white overflow-y-auto relative"
      style={{ paddingTop: isRefreshing ? '60px' : '24px' }}
    >
      {/* Pull-to-refresh indicator */}
      {(isRefreshing || pullProgress > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: pullProgress > 0.5 ? 1 : pullProgress * 2, y: 0 }}
          className="fixed top-2 left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-50"
        >
          <RefreshCw
            size={20}
            className={`text-[#1A66FF] ${isRefreshing ? 'animate-spin' : ''}`}
            style={{ transform: isRefreshing ? 'rotate(0deg)' : `rotate(${pullProgress * 360}deg)` }}
          />
          {isRefreshing && <span className="text-sm text-[#1A66FF] font-medium">Refreshing...</span>}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="p-6 space-y-6"
      >
        <h2 className="text-xl font-bold text-[#00082D]">Timesheet</h2>
        <p className="text-xs text-[#202020] opacity-70">History of completed visits and trips</p>

      <motion.div layout className="border border-[#EFEFEF] rounded-2xl p-4 bg-white">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-[#00082D]">
          <Clock size={18} className="text-[#1A66FF]" /> Visits
        </h3>
        <div className="space-y-3">
          {sortedVisits.length === 0 && (
            <p className="text-sm text-[#202020] opacity-70">No completed visits yet.</p>
          )}
          <AnimatePresence>
            {sortedVisits.map((v) => (
              <SwipeableVisitCard
                key={v.id}
                visit={v}
                onDelete={() => removeVisit(v.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.div layout className="border border-[#EFEFEF] rounded-2xl p-4 bg-white">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-[#00082D]">
          <MapPin size={18} className="text-[#F79C21]" /> Trips
        </h3>
        <div className="space-y-3">
          {sortedTrips.length === 0 && (
            <p className="text-sm text-[#202020] opacity-70">No completed trips yet.</p>
          )}
          <AnimatePresence>
            {sortedTrips.map((t) => (
              <SwipeableTripCard
                key={t.id}
                trip={t}
                onDelete={() => removeTrip(t.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
      </motion.div>
    </div>
  );
}
