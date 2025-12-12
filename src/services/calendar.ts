import type { VisitSession, VisitType } from '../types';
import { add, parseISO, startOfDay, isBefore, isAfter } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

export type ParsedCalendarEvent = {
    summary: string;
    description?: string;
    location?: string;
    startTime: string; // ISO datetime
    endTime?: string; // ISO datetime
    rrule?: string;
    isRecurring: boolean;
    isCustodyRelated: boolean; // Auto-detected
    suggestedVisitType?: VisitType;
};

// ============================================================================
// ICS PARSING
// ============================================================================

/**
 * Parse ICS file content into calendar events
 */
export const parseICSFile = (icsContent: string): ParsedCalendarEvent[] => {
    const events: ParsedCalendarEvent[] = [];
    const lines = icsContent.split(/\r?\n/);

    let inEvent = false;
    let currentEvent: Partial<ParsedCalendarEvent> = {};

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line === 'BEGIN:VEVENT') {
            inEvent = true;
            currentEvent = {};
            continue;
        }

        if (line === 'END:VEVENT') {
            inEvent = false;

            if (currentEvent.summary && currentEvent.startTime) {
                // Auto-detect custody-related events
                const isCustodyRelated = detectCustodyEvent(currentEvent.summary, currentEvent.description);

                events.push({
                    summary: currentEvent.summary,
                    description: currentEvent.description,
                    location: currentEvent.location,
                    startTime: currentEvent.startTime,
                    endTime: currentEvent.endTime,
                    rrule: currentEvent.rrule,
                    isRecurring: !!currentEvent.rrule,
                    isCustodyRelated,
                    suggestedVisitType: isCustodyRelated ? suggestVisitType(currentEvent.summary) : undefined,
                });
            }
            continue;
        }

        if (!inEvent) continue;

        // Parse event properties
        if (line.startsWith('SUMMARY:')) {
            currentEvent.summary = line.substring(8);
        } else if (line.startsWith('DESCRIPTION:')) {
            currentEvent.description = line.substring(12);
        } else if (line.startsWith('LOCATION:')) {
            currentEvent.location = line.substring(9);
        } else if (line.startsWith('DTSTART')) {
            const dateStr = line.split(':')[1];
            currentEvent.startTime = parseICSDate(dateStr);
        } else if (line.startsWith('DTEND')) {
            const dateStr = line.split(':')[1];
            currentEvent.endTime = parseICSDate(dateStr);
        } else if (line.startsWith('RRULE:')) {
            currentEvent.rrule = line.substring(6);
        }
    }

    return events;
};

/**
 * Parse ICS date format to ISO string
 * Handles: 20241225T090000Z, 20241225T090000, 20241225
 */
const parseICSDate = (icsDate: string): string => {
    // Remove timezone indicator
    const cleaned = icsDate.replace(/Z$/, '');

    // Parse different formats
    if (cleaned.length === 8) {
        // YYYYMMDD
        const year = cleaned.substring(0, 4);
        const month = cleaned.substring(4, 6);
        const day = cleaned.substring(6, 8);
        return `${year}-${month}-${day}T00:00:00`;
    } else if (cleaned.length === 15) {
        // YYYYMMDDTHHMMSS
        const year = cleaned.substring(0, 4);
        const month = cleaned.substring(4, 6);
        const day = cleaned.substring(6, 8);
        const hour = cleaned.substring(9, 11);
        const minute = cleaned.substring(11, 13);
        const second = cleaned.substring(13, 15);
        return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    }

    return new Date().toISOString();
};

/**
 * Detect if event is custody-related based on keywords
 */
const detectCustodyEvent = (summary: string, description?: string): boolean => {
    const text = `${summary} ${description || ''}`.toLowerCase();

    const keywords = [
        'custody',
        'visitation',
        'visit',
        'pickup',
        'drop off',
        'dropoff',
        'parenting time',
        'dad time',
        'mom time',
        'weekend',
        'overnight',
        'school pickup',
        'school drop',
    ];

    return keywords.some(keyword => text.includes(keyword));
};

/**
 * Suggest visit type based on event summary
 */
const suggestVisitType = (summary: string): VisitType => {
    const lower = summary.toLowerCase();

    if (lower.includes('overnight') || lower.includes('weekend')) {
        return 'overnight';
    } else if (lower.includes('school') || lower.includes('pickup') || lower.includes('drop')) {
        return 'school_transport_only';
    } else if (lower.includes('virtual') || lower.includes('video') || lower.includes('call')) {
        return 'virtual_call';
    }

    return 'physical_care';
};

/**
 * Expand recurring event with RRULE into multiple instances
 * @param event Parsed calendar event with RRULE
 * @param weeksAhead How many weeks to expand (default: 12)
 */
export const expandRecurringEvent = (
    event: ParsedCalendarEvent,
    weeksAhead = 12
): ParsedCalendarEvent[] => {
    if (!event.rrule || !event.isRecurring) {
        return [event];
    }

    const instances: ParsedCalendarEvent[] = [];
    const today = startOfDay(new Date());
    const endDate = add(today, { weeks: weeksAhead });
    const startDate = parseISO(event.startTime);

    // Parse RRULE
    const rruleParts = event.rrule.split(';');
    const rruleMap: Record<string, string> = {};
    rruleParts.forEach(part => {
        const [key, value] = part.split('=');
        if (key && value) rruleMap[key] = value;
    });

    const freq = rruleMap['FREQ'];
    const interval = parseInt(rruleMap['INTERVAL'] || '1');
    const byday = rruleMap['BYDAY']?.split(',') || [];

    // Weekly recurrence
    if (freq === 'WEEKLY') {
        const dayMap: Record<string, number> = {
            SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6
        };

        const targetDays = byday.map(d => dayMap[d]).filter(d => d !== undefined);

        let currentDate = startDate;
        let weekCounter = 0;

        while (isBefore(currentDate, endDate) && weekCounter < weeksAhead * 2) {
            for (const targetDay of targetDays) {
                const instanceDate = add(currentDate, {
                    days: targetDay - currentDate.getDay()
                });

                if (isAfter(instanceDate, today) && isBefore(instanceDate, endDate)) {
                    // Calculate duration from original event
                    const duration = event.endTime
                        ? new Date(event.endTime).getTime() - new Date(event.startTime).getTime()
                        : 3600000; // 1 hour default

                    instances.push({
                        ...event,
                        startTime: instanceDate.toISOString(),
                        endTime: new Date(instanceDate.getTime() + duration).toISOString(),
                        isRecurring: false, // Mark as instance, not recurring
                    });
                }
            }

            currentDate = add(currentDate, { weeks: interval });
            weekCounter++;
        }
    }

    return instances.length > 0 ? instances : [event];
};

/**
 * Convert parsed calendar events to VisitSessions
 */
export const convertEventsToVisits = (
    events: ParsedCalendarEvent[],
    childId: string
): Omit<VisitSession, 'id'>[] => {
    return events.map(event => ({
        childId,
        startTime: event.startTime,
        endTime: event.endTime,
        type: event.suggestedVisitType || 'physical_care',
        source: 'imported_from_calendar' as const,
        locationTag: event.location,
        notes: `Imported: ${event.summary}${event.description ? '\n\n' + event.description : ''}`,
    }));
};

/**
 * Import ICS file and return visit sessions
 */
export const importICSFile = async (
    file: File,
    childId: string,
    expandRecurring = true,
    weeksAhead = 12
): Promise<Omit<VisitSession, 'id'>[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                let events = parseICSFile(content);

                // Expand recurring events
                if (expandRecurring) {
                    events = events.flatMap(event =>
                        event.isRecurring ? expandRecurringEvent(event, weeksAhead) : [event]
                    );
                }

                // Filter to custody-related events only
                const custodyEvents = events.filter(e => e.isCustodyRelated);

                // Convert to visits
                const visits = convertEventsToVisits(custodyEvents, childId);

                resolve(visits);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
};

// ============================================================================
// EXPORT (existing functions + enhancements)
// ============================================================================

export const CalendarService = {
    generateGoogleCalendarLink: (title: string, startTime: string, endTime?: string, details?: string, location?: string) => {
        const start = new Date(startTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
        const end = endTime
            ? new Date(endTime).toISOString().replace(/-|:|\.\d\d\d/g, '')
            : new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');

        const url = new URL('https://calendar.google.com/calendar/render');
        url.searchParams.append('action', 'TEMPLATE');
        url.searchParams.append('text', title);
        url.searchParams.append('dates', `${start}/${end}`);
        if (details) url.searchParams.append('details', details);
        if (location) url.searchParams.append('location', location);

        return url.toString();
    },

    downloadICS: (title: string, startTime: string, endTime?: string, details?: string, location?: string) => {
        const start = new Date(startTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
        const end = endTime
            ? new Date(endTime).toISOString().replace(/-|:|\.\d\d\d/g, '')
            : new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');

        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
URL:${document.location.href}
DTSTART:${start}
DTEND:${end}
SUMMARY:${title}
DESCRIPTION:${details || ''}
LOCATION:${location || ''}
END:VEVENT
END:VCALENDAR`;

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `${title.replace(/\s+/g, '_')}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    /**
     * Download multiple events as a single ICS file
     */
    downloadMultiEventICS: (events: Array<{
        title: string;
        startTime: string;
        endTime?: string;
        details?: string;
        location?: string;
    }>, filename: string) => {
        const eventBlocks = events.map(event => {
            const start = new Date(event.startTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
            const end = event.endTime
                ? new Date(event.endTime).toISOString().replace(/-|:|\.\d\d\d/g, '')
                : new Date(new Date(event.startTime).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');

            return `BEGIN:VEVENT
UID:${Date.now()}-${Math.random()}@dadtime.app
DTSTART:${start}
DTEND:${end}
SUMMARY:${event.title}
DESCRIPTION:${event.details || ''}
LOCATION:${event.location || ''}
END:VEVENT`;
        }).join('\n');

        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//DadTime//Calendar Export//EN
${eventBlocks}
END:VCALENDAR`;

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `${filename}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
