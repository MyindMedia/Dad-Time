import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { ClockIcon, MapPinIcon, CurrencyDollarIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline'

interface CustodySession {
  id: string
  start_time: string
  end_time: string | null
  child_name: string
  notes: string | null
  is_active: boolean
}

interface TodayStats {
  total_hours: number
  active_session: CustodySession | null
  recent_sessions: CustodySession[]
}

export default function Home() {
  const [stats, setStats] = useState<TodayStats>({
    total_hours: 0,
    active_session: null,
    recent_sessions: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTodayStats()
  }, [])

  const fetchTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const startOfDay = new Date(today + 'T00:00:00Z').toISOString()
      const endOfDay = new Date(today + 'T23:59:59Z').toISOString()

      // Fetch today's sessions
      const { data: sessions, error } = await supabase
        .from('custody_sessions')
        .select('*')
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .order('start_time', { ascending: false })

      if (error) throw error

      // Calculate total hours
      let totalHours = 0
      let activeSession = null
      const recentSessions: CustodySession[] = []

      sessions?.forEach((session: CustodySession) => {
        if (session.is_active) {
          activeSession = session
        }

        if (session.end_time) {
          const start = new Date(session.start_time)
          const end = new Date(session.end_time)
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
          totalHours += hours
        }

        recentSessions.push(session)
      })

      setStats({
        total_hours: totalHours,
        active_session: activeSession,
        recent_sessions: recentSessions.slice(0, 5)
      })
    } catch (error) {
      console.error('Error fetching today stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (startTime: string, endTime: string | null) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const duration = end.getTime() - start.getTime()
    const hours = Math.floor(duration / (1000 * 60 * 60))
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}hr ${minutes}min`
  }

  const quickActions = [
    {
      name: 'Start Timer',
      href: '/timer',
      icon: ClockIcon,
      description: 'Begin custody time tracking',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      name: 'Track Location',
      href: '/gps-tracking',
      icon: MapPinIcon,
      description: 'Record GPS trip data',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      name: 'Add Expense',
      href: '/expenses',
      icon: CurrencyDollarIcon,
      description: 'Upload receipt and track expense',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      name: 'Upload Evidence',
      href: '/evidence',
      icon: DocumentDuplicateIcon,
      description: 'Store photos and documents',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Today's Summary</h1>
        <p className="text-blue-100">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Active Session Card */}
      {stats.active_session && (
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Active Custody Session</h3>
              <p className="text-sm text-gray-600 mt-1">
                With {stats.active_session.child_name}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Started: {new Date(stats.active_session.start_time).toLocaleTimeString()}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {formatDuration(stats.active_session.start_time, null)}
              </div>
              <Link
                to="/timer"
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 mt-2"
              >
                View Timer
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Total Hours Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Total Custody Time Today</h3>
            <p className="text-sm text-gray-600 mt-1">
              {stats.recent_sessions.length} sessions completed
            </p>
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {stats.total_hours.toFixed(1)} hours
          </div>
        </div>
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(stats.total_hours / 12 * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {stats.total_hours >= 12 ? 'Daily goal achieved! 🎉' : `${(12 - stats.total_hours).toFixed(1)} hours remaining for daily goal`}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.name}
            to={action.href}
            className={`${action.color} rounded-lg p-4 text-white hover:shadow-lg transition-all duration-200`}
          >
            <div className="flex items-center space-x-3">
              <action.icon className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">{action.name}</h3>
                <p className="text-xs opacity-90">{action.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Sessions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sessions</h3>
        {stats.recent_sessions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No custody sessions recorded today</p>
        ) : (
          <div className="space-y-3">
            {stats.recent_sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <p className="font-medium text-gray-900">{session.child_name}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(session.start_time).toLocaleTimeString()} - 
                    {session.end_time ? new Date(session.end_time).toLocaleTimeString() : 'Ongoing'}
                  </p>
                  {session.notes && (
                    <p className="text-xs text-gray-500 mt-1">{session.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  {session.end_time && (
                    <p className="font-medium text-gray-900">
                      {formatDuration(session.start_time, session.end_time)}
                    </p>
                  )}
                  {session.is_active && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}