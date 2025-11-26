import type { Handler } from '@netlify/functions'

const DAV = 'DAV:'
const CALDAV = 'urn:ietf:params:xml:ns:caldav'

async function davRequest(url: string, method: string, body: string | undefined, auth: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/xml; charset=utf-8',
      ...headers,
    },
    body,
  })
  if (!res.ok && res.status !== 207) {
    throw new Error(`CalDAV ${method} ${url} failed: ${res.status} ${await res.text()}`)
  }
  const text = await res.text()
  return text
}

function b64(user: string, pass: string) {
  return Buffer.from(`${user}:${pass}`).toString('base64')
}

function extractHref(xml: string, tag: string) {
  const m = new RegExp(`<${tag}[^>]*>\\s*<D:href>([^<]+)</D:href>`, 'i').exec(xml)
  return m ? m[1] : undefined
}

function extractCalendarPaths(xml: string) {
  const re = /<D:response>[\s\S]*?<D:href>([^<]+)<\/D:href>[\s\S]*?<D:propstat>[\s\S]*?<D:prop>[\s\S]*?<D:displayname>([^<]*)<\/D:displayname>/g
  const out: { href: string; name: string }[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    out.push({ href: m[1], name: m[2] })
  }
  return out
}

function buildCalendarQuery(startIso: string, endIso: string) {
  // Convert to UTC format without milliseconds
  const toUtc = (iso: string) => new Date(iso).toISOString().replace(/\.\d{3}Z$/, 'Z')
  const s = toUtc(startIso)
  const e = toUtc(endIso)
  return `<?xml version="1.0" encoding="utf-8"?>
  <C:calendar-query xmlns:D="${DAV}" xmlns:C="${CALDAV}">
    <D:prop>
      <D:getetag/>
      <C:calendar-data/>
    </D:prop>
    <C:filter>
      <C:comp-filter name="VCALENDAR">
        <C:comp-filter name="VEVENT">
          <C:time-range start="${s.replace(/[-:]/g,'').replace('.000Z','Z').replace(':','')}" end="${e.replace(/[-:]/g,'').replace('.000Z','Z').replace(':','')}"/>
        </C:comp-filter>
      </C:comp-filter>
    </C:filter>
  </C:calendar-query>`
}

function parseEventsFromReport(xml: string) {
  const events: any[] = []
  const re = /<C:calendar-data>([\s\S]*?)<\/C:calendar-data>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    const ics = m[1]
    // Extract VEVENT fields
    const blockRe = /BEGIN:VEVENT[\s\S]*?END:VEVENT/g
    let bm: RegExpExecArray | null
    while ((bm = blockRe.exec(ics)) !== null) {
      const block = bm[0]
      const get = (key: string) => {
        const mm = new RegExp(`${key}:(.*)`).exec(block)
        return mm ? mm[1].trim() : undefined
      }
      const dtstart = get('DTSTART') || get('DTSTART;TZID=.*')
      const dtend = get('DTEND') || get('DTEND;TZID=.*')
      const summary = get('SUMMARY')
      const location = get('LOCATION')
      const uid = get('UID')
      const toIso = (v?: string) => {
        if (!v) return undefined
        const mm = /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)/.exec(v)
        if (!mm) return undefined
        return `${mm[1]}-${mm[2]}-${mm[3]}T${mm[4]}:${mm[5]}:${mm[6]}${mm[7] ? 'Z' : ''}`
      }
      if (summary && dtstart) {
        events.push({ title: summary, location, start_time: toIso(dtstart), end_time: toIso(dtend), external_id: uid })
      }
    }
  }
  return events
}

export const handler: Handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}')
    const { appleId, appPassword, start, end } = body
    if (!appleId || !appPassword) return { statusCode: 400, body: 'Missing appleId or appPassword' }
    const auth = b64(appleId, appPassword)

    // 1) Discover principal
    const principalXml = await davRequest('https://caldav.icloud.com/', 'PROPFIND', `<?xml version="1.0"?>
    <D:propfind xmlns:D="${DAV}">
      <D:prop><D:current-user-principal/></D:prop>
    </D:propfind>`, auth, { Depth: '0' })
    const principalHref = extractHref(principalXml, 'D:current-user-principal')
    if (!principalHref) throw new Error('Failed to discover principal')

    // 2) Discover calendar-home-set
    const homeXml = await davRequest(`https://caldav.icloud.com${principalHref}`, 'PROPFIND', `<?xml version="1.0"?>
    <D:propfind xmlns:D="${DAV}" xmlns:C="${CALDAV}">
      <D:prop><C:calendar-home-set/></D:prop>
    </D:propfind>`, auth, { Depth: '0' })
    const homeHref = extractHref(homeXml, 'C:calendar-home-set')
    if (!homeHref) throw new Error('Failed to find calendar home')

    // 3) List calendars
    const calsXml = await davRequest(`https://caldav.icloud.com${homeHref}`, 'PROPFIND', `<?xml version="1.0"?>
    <D:propfind xmlns:D="${DAV}">
      <D:prop><D:displayname/></D:prop>
    </D:propfind>`, auth, { Depth: '1' })
    const calendars = extractCalendarPaths(calsXml)
    if (calendars.length === 0) throw new Error('No calendars found')
    const primary = calendars[0]

    // 4) Query events for range
    const reportXml = await davRequest(`https://caldav.icloud.com${primary.href}`, 'REPORT', buildCalendarQuery(start, end), auth, { Depth: '1' })
    const events = parseEventsFromReport(reportXml)
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ calendar: primary.name, events }) }
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || 'Server error' }
  }
}
