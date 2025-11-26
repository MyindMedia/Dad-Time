import { useEffect, useState } from 'react'
import { getAccessToken, listPrimaryEvents, insertPrimaryEvent, isGoogleReady, revokeAccessToken, hasClientId, waitForGoogle } from '../lib/googleCalendar'

interface GEvent {
  id: string
  summary: string
  start?: { dateTime?: string }
  end?: { dateTime?: string }
}

export default function Calendar() {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState<GEvent[]>([])
  const [title, setTitle] = useState('Visit with child')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [errMsg, setErrMsg] = useState('')

  const connect = async () => {
    setLoading(true)
    setErrMsg('')
    try {
      if (!hasClientId()) throw new Error('Missing Google Client ID. Set VITE_GOOGLE_CLIENT_ID in .env.local')
      const loaded = await waitForGoogle()
      if (!loaded) throw new Error('Google script not loaded yet')
      await getAccessToken()
      setConnected(true)
      await refreshEvents()
    } catch (e) {
      console.error(e)
      setErrMsg(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const disconnect = () => {
    revokeAccessToken()
    setConnected(false)
    setEvents([])
  }

  const refreshEvents = async () => {
    setLoading(true)
    setErrMsg('')
    try {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const res = await listPrimaryEvents(monthStart.toISOString(), new Date(monthEnd.getTime() + 24*60*60*1000).toISOString())
      setEvents(res.items || [])
    } catch (e) {
      console.error(e)
      setErrMsg('Failed to load events. Check Google configuration.')
    } finally {
      setLoading(false)
    }
  }

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!start || !end) return
    setLoading(true)
    setErrMsg('')
    try {
      await insertPrimaryEvent({
        summary: title,
        start: { dateTime: new Date(start).toISOString() },
        end: { dateTime: new Date(end).toISOString() },
      })
      setTitle('Visit with child')
      setStart('')
      setEnd('')
      await refreshEvents()
    } catch (e) {
      console.error(e)
      setErrMsg('Failed to add event. Ensure consent granted.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Auto-connect if GIS is ready and client id exists
  }, [])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Calendar</h1>
        <p className="text-gray-600 mb-8">Google Calendar integration for custody scheduling</p>

        <div className="flex gap-3 mb-2">
          {!connected ? (
            <button onClick={connect} disabled={loading} className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50">
              {loading ? 'Connecting…' : 'Connect Google Calendar'}
            </button>
          ) : (
            <>
              <button onClick={refreshEvents} disabled={loading} className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50">Refresh Events</button>
              <button onClick={disconnect} className="px-4 py-2 rounded-md bg-gray-200 text-gray-900">Disconnect</button>
            </>
          )}
        </div>
        {errMsg && <div className="mb-6 text-sm text-red-600">{errMsg}</div>}

        {connected && (
          <form onSubmit={addEvent} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 rounded-lg p-4 mb-6">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" className="md:col-span-2 px-3 py-2 border rounded-md" />
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="px-3 py-2 border rounded-md" />
            <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="px-3 py-2 border rounded-md" />
            <div className="md:col-span-4">
              <button type="submit" disabled={loading} className="mt-2 px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50">Add Event</button>
            </div>
          </form>
        )}

        <div className="bg-blue-50 rounded-lg p-6">
          {loading && <p className="text-blue-600 font-medium">Loading…</p>}
          {!connected && (
            <p className="text-gray-600">Connect to Google Calendar to view and add events.</p>
          )}
          {connected && (
            <div className="space-y-3">
              {events.length === 0 ? (
                <p className="text-gray-600">No events found for this month.</p>
              ) : (
                events.map((ev) => (
                  <div key={ev.id} className="bg-white rounded-md p-4 shadow-sm">
                    <div className="font-semibold text-gray-900">{ev.summary}</div>
                    <div className="text-sm text-gray-600">
                      {ev.start?.dateTime ? new Date(ev.start.dateTime).toLocaleString() : ''} → {ev.end?.dateTime ? new Date(ev.end.dateTime).toLocaleString() : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
