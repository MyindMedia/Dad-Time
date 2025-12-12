/**
 * Custody Schedule Service
 *
 * Handles recurring custody schedules:
 * - Generate future visits from schedule templates
 * - Parse iCalendar RRULE from imported schedules
 * - Export schedules as ICS files
 * - Auto-create visits based on active schedules
 */

import type { CustodySchedule, VisitSession, DayOfWeek } from '../types';
import { storage } from './storage';
import { add, startOfDay, format, parseISO, isAfter, isBefore, set } from 'date-fns';

// ============================================================================
// RRULE PARSING (Simple implementation)
// ============================================================================

/**
 * Parse iCalendar RRULE string into schedule parameters
 * Example: "FREQ=WEEKLY;BYDAY=MO,WE,FR" → { freq: 'weekly', daysOfWeek: ['monday', 'wednesday', 'friday'] }
 */
export const parseRRule = (rrule: string): Partial<CustodySchedule> => {
    const parts = rrule.split(';');
    const result: Partial<CustodySchedule> = {};

    for (const part of parts) {
        const [key, value] = part.split('=');

        switch (key) {
            case 'FREQ':
                if (value === 'WEEKLY') result.pattern = 'weekly';
                else if (value === 'DAILY') result.pattern = 'custom';
                break;

            case 'INTERVAL':
                // Interval=2 for biweekly
                if (value === '2') result.pattern = 'biweekly';
                break;

            case 'BYDAY':
                // MO,WE,FR → ['monday', 'wednesday', 'friday']
                const dayMap: Record<string, DayOfWeek> = {
                    SU: 'sunday',
                    MO: 'monday',
                    TU: 'tuesday',
                    WE: 'wednesday',
                    TH: 'thursday',
                    FR: 'friday',
                    SA: 'saturday'
                };
                result.daysOfWeek = value.split(',').map(d => dayMap[d]).filter(Boolean) as DayOfWeek[];
                break;

            case 'UNTIL':
                // UNTIL=20241231T235959Z → endDate
                const untilDate = value.replace(/T.*/, ''); // Strip time
                result.endDate = untilDate;
                break;
        }
    }

    return result;
};

/**
 * Generate RRULE string from schedule
 */
export const generateRRule = (schedule: CustodySchedule): string => {
    const parts: string[] = [];

    // Frequency
    if (schedule.pattern === 'weekly' || schedule.pattern === 'biweekly') {
        parts.push('FREQ=WEEKLY');
    }

    // Interval for biweekly
    if (schedule.pattern === 'biweekly') {
        parts.push('INTERVAL=2');
    }

    // Days of week
    if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
        const dayMap: Record<DayOfWeek, string> = {
            sunday: 'SU',
            monday: 'MO',
            tuesday: 'TU',
            wednesday: 'WE',
            thursday: 'TH',
            friday: 'FR',
            saturday: 'SA'
        };
        const days = schedule.daysOfWeek.map(d => dayMap[d]).join(',');
        parts.push(`BYDAY=${days}`);
    }

    // End date
    if (schedule.endDate) {
        const endDateStr = schedule.endDate.replace(/-/g, '') + 'T235959Z';
        parts.push(`UNTIL=${endDateStr}`);
    }

    return parts.join(';');
};

// ============================================================================
// VISIT GENERATION
// ============================================================================

/**
 * Generate future visits from a custody schedule
 * @param schedule The custody schedule
 * @param weeksAhead How many weeks ahead to generate (default: 12)
 * @returns Array of visit sessions to create
 */
export const generateVisitsFromSchedule = (
    schedule: CustodySchedule,
    weeksAhead = 12
): Omit<VisitSession, 'id'>[] => {
    if (!schedule.active) {
        return [];
    }

    const visits: Omit<VisitSession, 'id'>[] = [];
    const today = startOfDay(new Date());
    const startDate = startOfDay(parseISO(schedule.startDate));
    const endDate = schedule.endDate ? startOfDay(parseISO(schedule.endDate)) : add(today, { weeks: weeksAhead });

    // Determine which days to generate visits
    const targetDays = schedule.daysOfWeek || [];
    if (targetDays.length === 0) {
        console.warn('Schedule has no days of week specified:', schedule.name);
        return [];
    }

    // Map day of week to number (0 = Sunday, 6 = Saturday)
    const dayMap: Record<DayOfWeek, number> = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6
    };

    const targetDayNumbers = targetDays.map(d => dayMap[d]);

    // Generate visits for each week
    let currentDate = startDate;
    let weekCounter = 0;

    while (isBefore(currentDate, endDate) && weekCounter < weeksAhead * 2) {
        const weekStart = currentDate;

        // For each target day in the week
        for (const targetDay of targetDayNumbers) {
            const visitDate = add(weekStart, { days: targetDay - weekStart.getDay() });

            // Skip if before start date or after end date
            if (isBefore(visitDate, startDate) || isAfter(visitDate, endDate)) {
                continue;
            }

            // Skip if in the past
            if (isBefore(visitDate, today)) {
                continue;
            }

            // Create visit for each child
            for (const childId of schedule.childIds) {
                // Set start and end times
                const startTime = schedule.startTime
                    ? set(visitDate, {
                        hours: parseInt(schedule.startTime.split(':')[0]),
                        minutes: parseInt(schedule.startTime.split(':')[1]),
                        seconds: 0,
                        milliseconds: 0
                    })
                    : set(visitDate, { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });

                const endTime = schedule.endTime
                    ? set(visitDate, {
                        hours: parseInt(schedule.endTime.split(':')[0]),
                        minutes: parseInt(schedule.endTime.split(':')[1]),
                        seconds: 0,
                        milliseconds: 0
                    })
                    : set(visitDate, { hours: 17, minutes: 0, seconds: 0, milliseconds: 0 });

                visits.push({
                    childId,
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                    type: schedule.visitType,
                    source: 'imported_from_calendar',
                    notes: `Auto-generated from schedule: ${schedule.name}`
                });
            }
        }

        // Move to next week (or 2 weeks for biweekly)
        const weeksToAdd = schedule.pattern === 'biweekly' ? 2 : 1;
        currentDate = add(currentDate, { weeks: weeksToAdd });
        weekCounter++;
    }

    return visits;
};

/**
 * Auto-create visits from all active schedules
 * This should be called periodically (e.g., weekly) to generate upcoming visits
 */
export const autoCreateVisitsFromSchedules = (): void => {
    const schedules = storage.get<CustodySchedule>('custody_schedules');
    const activeSchedules = schedules.filter(s => s.active);

    console.log(`Found ${activeSchedules.length} active custody schedules`);

    for (const schedule of activeSchedules) {
        const visits = generateVisitsFromSchedule(schedule, 12); // 12 weeks ahead

        console.log(`Generated ${visits.length} visits from schedule: ${schedule.name}`);

        // Check if visits already exist (avoid duplicates)
        const existingVisits = storage.get<VisitSession>('visits');

        for (const visit of visits) {
            // Check if visit already exists (same child, same start time)
            const exists = existingVisits.some(
                v =>
                    v.childId === visit.childId &&
                    v.startTime === visit.startTime
            );

            if (!exists) {
                storage.add('visits', visit);
            }
        }
    }
};

// ============================================================================
// ICS EXPORT
// ============================================================================

/**
 * Export custody schedule as ICS file
 * @param schedule The schedule to export
 * @returns ICS file content as string
 */
export const exportScheduleAsICS = (schedule: CustodySchedule): string => {
    const rrule = schedule.rrule || generateRRule(schedule);

    // Generate ICS header
    const ics: string[] = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//DadTime//Custody Schedule//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:' + schedule.name,
        'X-WR-TIMEZONE:' + Intl.DateTimeFormat().resolvedOptions().timeZone,
    ];

    // Create recurring event
    const startDateTime = schedule.startDate + 'T' + (schedule.startTime || '09:00:00');
    const endDateTime = schedule.startDate + 'T' + (schedule.endTime || '17:00:00');

    ics.push('BEGIN:VEVENT');
    ics.push(`UID:${schedule.id}@dadtime.app`);
    ics.push(`DTSTART:${startDateTime.replace(/[-:]/g, '')}`);
    ics.push(`DTEND:${endDateTime.replace(/[-:]/g, '')}`);
    ics.push(`RRULE:${rrule}`);
    ics.push(`SUMMARY:${schedule.name}`);
    ics.push(`DESCRIPTION:Custody visit - ${schedule.visitType}`);
    if (schedule.notes) {
        ics.push(`NOTES:${schedule.notes}`);
    }
    ics.push('STATUS:CONFIRMED');
    ics.push('SEQUENCE:0');
    ics.push('END:VEVENT');

    ics.push('END:VCALENDAR');

    return ics.join('\r\n');
};

/**
 * Export schedule and trigger download
 */
export const downloadScheduleAsICS = (schedule: CustodySchedule): void => {
    const icsContent = exportScheduleAsICS(schedule);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${schedule.name.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// ============================================================================
// SCHEDULE MANAGEMENT
// ============================================================================

/**
 * Get all custody schedules
 */
export const getCustodySchedules = (): CustodySchedule[] => {
    return storage.get<CustodySchedule>('custody_schedules');
};

/**
 * Get active schedules only
 */
export const getActiveSchedules = (): CustodySchedule[] => {
    return getCustodySchedules().filter(s => s.active);
};

/**
 * Create a new custody schedule
 */
export const createCustodySchedule = (
    schedule: Omit<CustodySchedule, 'id' | 'createdAt' | 'updatedAt'>
): CustodySchedule => {
    const newSchedule: CustodySchedule = {
        ...schedule,
        id: `schedule_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    return storage.add('custody_schedules', newSchedule);
};

/**
 * Update a custody schedule
 */
export const updateCustodySchedule = (
    id: string,
    updates: Partial<CustodySchedule>
): void => {
    storage.update('custody_schedules', id, {
        ...updates,
        updatedAt: new Date().toISOString()
    });
};

/**
 * Delete a custody schedule
 */
export const deleteCustodySchedule = (id: string): void => {
    storage.remove('custody_schedules', id);
};

/**
 * Toggle schedule active status
 */
export const toggleScheduleActive = (id: string): void => {
    const schedules = getCustodySchedules();
    const schedule = schedules.find(s => s.id === id);

    if (schedule) {
        updateCustodySchedule(id, { active: !schedule.active });
    }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get human-readable description of schedule recurrence
 */
export const getScheduleDescription = (schedule: CustodySchedule): string => {
    const { pattern, daysOfWeek } = schedule;

    if (pattern === 'once') {
        return `One-time visit on ${format(parseISO(schedule.startDate), 'MMM d, yyyy')}`;
    }

    if (!daysOfWeek || daysOfWeek.length === 0) {
        return 'No days specified';
    }

    const dayNames = daysOfWeek.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');

    if (pattern === 'weekly') {
        return `Every ${dayNames}`;
    }

    if (pattern === 'biweekly') {
        return `Every other week on ${dayNames}`;
    }

    return `Custom schedule`;
};

/**
 * Validate schedule before creating
 */
export const validateSchedule = (schedule: Partial<CustodySchedule>): string[] => {
    const errors: string[] = [];

    if (!schedule.name || schedule.name.trim() === '') {
        errors.push('Schedule name is required');
    }

    if (!schedule.childIds || schedule.childIds.length === 0) {
        errors.push('At least one child must be selected');
    }

    if (!schedule.pattern) {
        errors.push('Recurrence pattern is required');
    }

    if (!schedule.startDate) {
        errors.push('Start date is required');
    }

    if (schedule.pattern !== 'once' && (!schedule.daysOfWeek || schedule.daysOfWeek.length === 0)) {
        errors.push('At least one day of week must be selected for recurring schedules');
    }

    return errors;
};
