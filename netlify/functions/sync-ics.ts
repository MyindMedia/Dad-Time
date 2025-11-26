import type { Handler } from '@netlify/functions'

function parseIcs(ics: string) {
  const events: any[] = []
  const blocks = ics.split(/BEGIN:VEVENT[\s\S]*?END:VEVENT/gm)
  // Alternative regex-based extraction per event
  const regex = /BEGIN:VEVENT[\s\S]*?END:VEVENT/gm
  let match: RegExpExecArray | null
  while ((match = regex.exec(ics)) !== null) {
    const block = match[0]
    const get = (key: string) => {
      const m = new RegExp(`${key}:(.*)`).exec(block)
      return m ? m[1].trim() : undefined
    }
    const dtstart = get('DTSTART') || get('DTSTART;TZID=.*')
    const dtend = get('DTEND') || get('DTEND;TZID=.*')
    const summary = get('SUMMARY')
    const location = get('LOCATION')
    const uid = get('UID')
    // Basic ISO conversion: handle UTC Z or local-like
    const toIso = (v?: string) => {
      if (!v) return undefined
      // e.g., 20250101T130000Z or 20250101T130000
      const m = /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)/.exec(v)
      if (!m) return undefined
      const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${m[7] ? 'Z' : ''}`
      return iso
    }
    events.push({
      external_id: uid,
      title: summary,
      location,
      start_time: toIso(dtstart),
      end_time: toIso(dtend)
    })
  }
  return events.filter(e => e.start_time && e.title)
}

export const handler: Handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}')
    const { url } = body
    if (!url) return { statusCode: 400, body: 'Missing url' }
    const resp = await fetch(url)
    if (!resp.ok) return { statusCode: resp.status, body: 'Failed to fetch ICS' }
    const text = await resp.text()
    const events = parseIcs(text)
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ events }) }
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || 'Server error' }
  }
}
