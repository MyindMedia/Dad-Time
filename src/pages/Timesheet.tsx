import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useEntity } from '../hooks/useEntity';
import type { VisitSession, Trip } from '../types';
import { differenceInMinutes, format } from 'date-fns';
import { MapPin, Clock } from 'lucide-react';
import { springConfig } from '../lib/animations';
import { HapticFeedback } from '../utils/ios';

export const Timesheet: React.FC = () => {
  const { items: visits } = useEntity<VisitSession>('visits');
  const { items: trips } = useEntity<Trip>('trips');

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

  const visitDuration = (v: VisitSession) => {
    if (!v.endTime) return '—';
    const mins = differenceInMinutes(new Date(v.endTime), new Date(v.startTime));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-white p-6 space-y-6"
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
          {sortedVisits.map((v) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springConfig.smooth}
              className="border border-[#EFEFEF] rounded-xl p-4 flex items-center justify-between bg-white"
              onClick={() => HapticFeedback.light()}
            >
              <div>
                <p className="font-semibold text-sm text-[#00082D]">{format(new Date(v.startTime), 'PP')}</p>
                <p className="text-xs text-[#202020] opacity-70 capitalize">{v.type.replace(/_/g, ' ')}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-[#00082D]">{visitDuration(v)}</p>
                <p className="text-xs text-[#202020] opacity-70">
                  {format(new Date(v.startTime), 'p')} - {v.endTime ? format(new Date(v.endTime), 'p') : '—'}
                </p>
              </div>
            </motion.div>
          ))}
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
          {sortedTrips.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springConfig.smooth}
              className="border border-[#EFEFEF] rounded-xl p-4 flex items-center justify-between bg-white"
              onClick={() => HapticFeedback.light()}
            >
              <div>
                <p className="font-semibold text-sm text-[#00082D]">{format(new Date(t.startTime), 'PP')}</p>
                <p className="text-xs text-[#202020] opacity-70 capitalize">{t.purpose.replace(/_/g, ' ')}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-[#00082D]">{(t.distanceMiles || 0).toFixed(2)} mi</p>
                <p className="text-xs text-[#202020] opacity-70">
                  {format(new Date(t.startTime), 'p')} - {t.endTime ? format(new Date(t.endTime), 'p') : '—'}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
