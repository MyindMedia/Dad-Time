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
    }
};
