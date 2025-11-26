import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import ChildSelector from '../components/ChildSelector'

interface ActiveVisit {
  id: string
  start_time: string
  end_time: string | null
  notes: string | null
}

interface VisitRow {
  id: string
  start_time: string
  end_time: string | null
  notes: string | null
  child_id: string | null
}

export default function Timer() {
  const [isActive, setIsActive] = useState(false)
  const [currentSession, setCurrentSession] = useState<ActiveVisit | null>(null)
  const [childName, setChildName] = useState('')
  const [notes, setNotes] = useState('')
  const [manualChildName, setManualChildName] = useState('')
  const [manualNotes, setManualNotes] = useState('')
  const [manualStart, setManualStart] = useState('')
  const [manualEnd, setManualEnd] = useState('')
  const [childId, setChildId] = useState<string | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [loading, setLoading] = useState(false)
  const wakeLockRef = useRef<any>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [monthlyVisits, setMonthlyVisits] = useState<VisitRow[]>([])
  const [monthlyTotalMs, setMonthlyTotalMs] = useState(0)
  const [visitsLoading, setVisitsLoading] = useState(false)

  useEffect(() => {
    checkActiveSession()
    loadMonthlyVisits()
  }, [])

  useEffect(() => {
    if (isActive && currentSession) {
      intervalRef.current = setInterval(() => {
        const startTime = new Date(currentSession.start_time).getTime()
        const now = new Date().getTime()
        setElapsedTime(now - startTime)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, currentSession])

  const checkActiveSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: visit, error } = await supabase
        .from('visits')
        .select('*')
        .eq('user_id', user.id)
        .is('end_time', null)
        .single()

      if (visit && !error) {
        setCurrentSession({
          id: visit.id,
          start_time: visit.start_time,
          end_time: visit.end_time,
          notes: visit.notes
        })
        setIsActive(true)
        const startTime = new Date(visit.start_time).getTime()
        const now = new Date().getTime()
        setElapsedTime(now - startTime)
      }
    } catch (error) {
      console.error('Error checking active session:', error)
    }
  }

  const loadMonthlyVisits = async () => {
    try {
      setVisitsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const { data, error } = await supabase
        .from('visits')
        .select('id,start_time,end_time,notes,child_id')
        .eq('user_id', user.id)
        .gte('start_time', monthStart.toISOString())
        .lte('start_time', new Date(monthEnd.getTime() + 24*60*60*1000).toISOString())
        .order('start_time', { ascending: false })
      if (error) throw error
      const rows = data || []
      setMonthlyVisits(rows)
      let total = 0
      rows.forEach(r => {
        const s = new Date(r.start_time).getTime()
        const e = r.end_time ? new Date(r.end_time).getTime() : Date.now()
        if (e > s) total += (e - s)
      })
      setMonthlyTotalMs(total)
    } catch (e) {
      console.error('Error loading monthly visits:', e)
    } finally {
      setVisitsLoading(false)
    }
  }

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        // @ts-ignore
        wakeLockRef.current = await navigator.wakeLock.request('screen')
        console.log('Wake lock activated')
      }
    } catch (error) {
      console.error('Wake lock request failed:', error)
    }
  }

  const releaseWakeLock = async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release()
        wakeLockRef.current = null
        console.log('Wake lock released')
      }
    } catch (error) {
      console.error('Wake lock release failed:', error)
    }
  }

  const startTimer = async () => {
    if (!childName.trim()) {
      alert('Please enter child name')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('visits')
        .insert({
          user_id: user.id,
          start_time: new Date().toISOString(),
          end_time: null,
          type: 'physical_care',
          source: 'manual_start_stop',
          child_id: childId,
          notes: notes.trim() || `Child: ${childName.trim()}`
        })
        .select()
        .single()

      if (error) throw error

      setCurrentSession(data)
      setIsActive(true)
      setElapsedTime(0)
      await requestWakeLock()
      await loadMonthlyVisits()
    } catch (error) {
      console.error('Error starting timer:', error)
      alert('Failed to start timer')
    } finally {
      setLoading(false)
    }
  }

  const stopTimer = async () => {
    if (!currentSession) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('visits')
        .update({ end_time: new Date().toISOString() })
        .eq('id', currentSession.id)

      if (error) throw error

      setCurrentSession(null)
      setIsActive(false)
      setElapsedTime(0)
      setChildName('')
      setNotes('')
      await releaseWakeLock()
      await loadMonthlyVisits()
    } catch (error) {
      console.error('Error stopping timer:', error)
      alert('Failed to stop timer')
    } finally {
      setLoading(false)
    }
  }

  const addManualEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualChildName.trim()) {
      alert('Please enter child name')
      return
    }
    if (!manualStart || !manualEnd) {
      alert('Please set both start and end times')
      return
    }
    const start = new Date(manualStart)
    const end = new Date(manualEnd)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      alert('Invalid date/time values')
      return
    }
    if (end <= start) {
      alert('End time must be after start time')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('custody_sessions')
        .insert({
          user_id: user.id,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          child_name: manualChildName.trim(),
          notes: manualNotes.trim() || null,
          is_active: false,
        })

      if (error) throw error

      setManualChildName('')
      setManualNotes('')
      setManualStart('')
      setManualEnd('')
      alert('Manual custody session added')
      await loadMonthlyVisits()
    } catch (error) {
      console.error('Error adding manual entry:', error)
      alert('Failed to add manual entry')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Custody Timer</h1>
          <p className="text-gray-600">Track time spent with your children</p>
        </div>

        {!isActive ? (
          <div className="space-y-6">
            <div>
              <label htmlFor="childName" className="block text-sm font-medium text-gray-700 mb-2">
                Child Name *
              </label>
              <input
                id="childName"
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter child's name"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any notes about this custody session..."
              />
            </div>

            <button
              onClick={startTimer}
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Starting...' : 'Start Timer'}
            </button>

            <ChildSelector value={childId} onChange={setChildId} />

            <div className="mt-10 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Entry</h3>
              <form onSubmit={addManualEntry} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Child Name *</label>
                    <input
                      type="text"
                      value={manualChildName}
                      onChange={(e) => setManualChildName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter child's name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <input
                      type="text"
                      value={manualNotes}
                      onChange={(e) => setManualNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Optional notes"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                    <input
                      type="datetime-local"
                      value={manualStart}
                      onChange={(e) => setManualStart(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
                    <input
                      type="datetime-local"
                      value={manualEnd}
                      onChange={(e) => setManualEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Add Manual Custody Session'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Time with {childName || 'child'}
              </h2>
              {currentSession?.notes && (
                <p className="text-gray-600">{currentSession.notes}</p>
              )}
            </div>

            <div className="mb-8">
              <div className="text-6xl font-mono font-bold text-blue-600 mb-4">
                {formatTime(elapsedTime)}
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 mb-2">
                  Session started at {currentSession && new Date(currentSession.start_time).toLocaleTimeString()}
                </p>
                <p className="text-xs text-blue-500">
                  Timer is running with wake lock active to prevent screen sleep
                </p>
              </div>
            </div>

            <button
              onClick={stopTimer}
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Stopping...' : 'Stop Timer'}
            </button>
          </div>
        )}
      </div>

      {/* Wake Lock Info */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Wake Lock Feature</h3>
        <p className="text-sm text-blue-700">
          This app uses wake lock to keep your screen awake during custody sessions. 
          This prevents accidental timer closure and ensures accurate time tracking.
        </p>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Time Log (This Month)</h2>
          <div className="text-sm">
            <span className="font-medium text-blue-600">Total:</span>{' '}
            <span className="font-mono text-gray-900">
              {formatTime(monthlyTotalMs)}
            </span>
          </div>
        </div>

        {visitsLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : monthlyVisits.length === 0 ? (
          <p className="text-sm text-gray-600">No visits recorded this month.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {monthlyVisits.map(v => {
              const s = new Date(v.start_time)
              const e = v.end_time ? new Date(v.end_time) : new Date()
              const d = e.getTime() - s.getTime()
              return (
                <li key={v.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {s.toLocaleDateString()} • {s.toLocaleTimeString()} – {v.end_time ? new Date(v.end_time).toLocaleTimeString() : 'running'}
                    </div>
                    {v.notes && <div className="text-xs text-gray-600">{v.notes}</div>}
                  </div>
                  <div className="text-sm font-mono text-blue-700">{formatTime(d)}</div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
