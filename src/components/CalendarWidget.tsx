import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useEntity } from '../hooks/useEntity';
import type { VisitSession, Trip } from '../types';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isSameMonth
} from 'date-fns';
import { HapticFeedback } from '../utils/ios';
import { springConfig } from '../lib/animations';

export const CalendarWidget: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { items: visits } = useEntity<VisitSession>('visits');
  const { items: trips } = useEntity<Trip>('trips');

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Check if a day has visits or trips
  const getDayEvents = (day: Date) => {
    const hasVisit = visits.some(v =>
      v.startTime && isSameDay(new Date(v.startTime), day)
    );
    const hasTrip = trips.some(t =>
      t.startTime && isSameDay(new Date(t.startTime), day)
    );
    return { hasVisit, hasTrip };
  };

  const handlePrevMonth = () => {
    HapticFeedback.light();
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    HapticFeedback.light();
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const handleDayClick = (day: Date) => {
    HapticFeedback.light();
    // TODO: Navigate to timesheet filtered by this date
    console.log('Selected date:', format(day, 'PP'));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springConfig.smooth}
      className="border border-[#EFEFEF] rounded-2xl p-4 bg-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon size={18} className="text-[#1A66FF]" />
          <h3 className="font-semibold text-[#00082D]">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handlePrevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FAFAFA] transition-colors"
          >
            <ChevronLeft size={18} className="text-[#202020]" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleNextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FAFAFA] transition-colors"
          >
            <ChevronRight size={18} className="text-[#202020]" />
          </motion.button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-xs font-medium text-[#202020] opacity-50 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          const { hasVisit, hasTrip } = getDayEvents(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);

          return (
            <motion.button
              key={i}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleDayClick(day)}
              className={`
                relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm
                ${isTodayDate ? 'bg-[#1A66FF] text-white font-bold' : ''}
                ${!isTodayDate && isCurrentMonth ? 'text-[#00082D] hover:bg-[#FAFAFA]' : ''}
                ${!isCurrentMonth ? 'text-[#202020] opacity-30' : ''}
                transition-colors
              `}
            >
              <span>{format(day, 'd')}</span>

              {/* Event indicators */}
              {isCurrentMonth && (hasVisit || hasTrip) && (
                <div className="absolute bottom-1 flex gap-0.5">
                  {hasVisit && (
                    <div className={`w-1 h-1 rounded-full ${isTodayDate ? 'bg-white' : 'bg-[#1A66FF]'}`} />
                  )}
                  {hasTrip && (
                    <div className={`w-1 h-1 rounded-full ${isTodayDate ? 'bg-white' : 'bg-[#F79C21]'}`} />
                  )}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-[#202020] opacity-70">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[#1A66FF]" />
          <span>Visits</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[#F79C21]" />
          <span>Trips</span>
        </div>
      </div>
    </motion.div>
  );
};
