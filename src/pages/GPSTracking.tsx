import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { PlayIcon, StopIcon, MapPinIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'

interface Trip {
  id: string
  start_time: string
  end_time: string | null
  start_location: { lat: number; lng: number; address?: string }
  end_location: { lat: number; lng: number; address?: string } | null
  distance_miles: number
  mileage_rate_per_mile: number
  reimbursable_amount: number
  purpose: string
  notes: string | null
  is_active: boolean
}

interface LocationPoint {
  lat: number
  lng: number
  timestamp: number
  accuracy: number
}

export default function GPSTracking() {
  const [isTracking, setIsTracking] = useState(false)
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null)
  const [recentTrips, setRecentTrips] = useState<Trip[]>([])
  const [locationPoints, setLocationPoints] = useState<LocationPoint[]>([])
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [distance, setDistance] = useState(0)
  const [duration, setDuration] = useState(0)
  const [purpose, setPurpose] = useState('visit_activity')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const watchIdRef = useRef<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null)

  const purposes = [
    { value: 'pickup', label: 'Child Pickup' },
    { value: 'dropoff', label: 'Child Dropoff' },
    { value: 'visit_activity', label: 'Visit Activity' },
    { value: 'other_child_related', label: 'Other Child Related' }
  ]

  useEffect(() => {
    fetchRecentTrips()
    checkActiveTrip()
  }, [])

  useEffect(() => {
    if (isTracking && currentTrip) {
      intervalRef.current = setInterval(() => {
        const startTime = new Date(currentTrip.start_time).getTime()
        const now = new Date().getTime()
        setDuration(now - startTime)
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
  }, [isTracking, currentTrip])

  const fetchRecentTrips = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setRecentTrips(data || [])
    } catch (error) {
      console.error('Error fetching trips:', error)
    }
  }

  const checkActiveTrip = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .is('end_time', null)
        .single()

      if (data && !error) {
        setCurrentTrip(data)
        setIsTracking(true)
        setPurpose(data.purpose)
        setNotes(data.notes || '')
        setDistance(data.distance_miles || 0)
      }
    } catch (error) {
      console.error('Error checking active trip:', error)
    }
  }

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3959 // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const getCurrentPosition = (): Promise<{ lat: number; lng: number; accuracy: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          })
        },
        (error) => {
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  }

  const startTracking = async () => {
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const position = await getCurrentPosition()
      const currentTime = new Date().toISOString()

      const { data, error } = await supabase
        .from('trips')
        .insert([
          {
            user_id: user.id,
            start_time: currentTime,
            start_location: { lat: position.lat, lng: position.lng },
            distance_miles: 0,
            mileage_rate_per_mile: 0.70,
            reimbursable_amount: 0,
            purpose: purpose,
            notes: notes.trim() || null
          }
        ])
        .select()
        .single()

      if (error) throw error

      setCurrentTrip(data)
      setIsTracking(true)
      setLocationPoints([{ ...position, timestamp: Date.now() }])
      setCurrentLocation({ lat: position.lat, lng: position.lng })
      setDistance(0)
      setDuration(0)
      lastPositionRef.current = { lat: position.lat, lng: position.lng }

      // Start watching position
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now(),
            accuracy: position.coords.accuracy
          }

          setCurrentLocation({ lat: newPosition.lat, lng: newPosition.lng })
          setLocationPoints(prev => [...prev, newPosition])

          if (lastPositionRef.current) {
            const additionalDistance = calculateDistance(
              lastPositionRef.current.lat,
              lastPositionRef.current.lng,
              newPosition.lat,
              newPosition.lng
            )
            setDistance(prev => prev + additionalDistance)
          }

          lastPositionRef.current = { lat: newPosition.lat, lng: newPosition.lng }
        },
        (error) => {
          console.error('Geolocation error:', error)
          setError('Failed to get location updates')
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      )
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const stopTracking = async () => {
    if (!currentTrip) return

    setLoading(true)
    setError('')

    try {
      const position = await getCurrentPosition()
      const currentTime = new Date().toISOString()
      const reimbursableAmount = distance * 0.70

      const { error } = await supabase
        .from('trips')
        .update({
          end_time: currentTime,
          end_location: { lat: position.lat, lng: position.lng },
          distance_miles: parseFloat(distance.toFixed(2)),
          reimbursable_amount: parseFloat(reimbursableAmount.toFixed(2))
        })
        .eq('id', currentTrip.id)

      if (error) throw error

      // Stop geolocation watch
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }

      setCurrentTrip(null)
      setIsTracking(false)
      setCurrentLocation(null)
      setLocationPoints([])
      fetchRecentTrips()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (loading && !isTracking) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">GPS Trip Tracking</h1>
        <p className="text-green-100">Record mileage for custody-related travel</p>
      </div>

      {/* Active Trip Card */}
      {isTracking && currentTrip && (
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <ClockIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Duration</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(duration)}</p>
            </div>
            <div className="text-center">
              <MapPinIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Distance</p>
              <p className="text-2xl font-bold text-gray-900">{distance.toFixed(1)} miles</p>
            </div>
            <div className="text-center">
              <CurrencyDollarIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Reimbursable</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(distance * 0.70)}</p>
            </div>
          </div>

          {currentLocation && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                Current location: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                GPS tracking active - location updates every 5 seconds
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <button
              onClick={stopTracking}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md font-medium flex items-center space-x-2 disabled:opacity-50"
            >
              <StopIcon className="h-5 w-5" />
              <span>{loading ? 'Stopping...' : 'Stop Trip'}</span>
            </button>
          </div>
        </div>
      )}

      {/* New Trip Form */}
      {!isTracking && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Start New Trip</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
                Trip Purpose
              </label>
              <select
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                {purposes.map((purpose) => (
                  <option key={purpose.value} value={purpose.value}>
                    {purpose.label}
                  </option>
                ))}
              </select>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Any notes about this trip..."
              />
            </div>

            <div className="bg-green-50 rounded-md p-4">
              <p className="text-sm text-green-700">
                <strong>Rate:</strong> $0.70 per mile for custody-related travel
              </p>
              <p className="text-xs text-green-600 mt-1">
                GPS tracking will record your route and calculate distance automatically
              </p>
            </div>

            <button
              onClick={startTracking}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <PlayIcon className="h-5 w-5" />
              <span>{loading ? 'Starting...' : 'Start GPS Tracking'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Recent Trips */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Trips</h2>
        
        {recentTrips.length === 0 ? (
          <div className="text-center py-8">
            <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No trips recorded</h3>
            <p className="text-gray-600">Start GPS tracking to record your first trip</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentTrips.map((trip) => (
              <div key={trip.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {purposes.find(p => p.value === trip.purpose)?.label || trip.purpose}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(trip.start_time).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(trip.reimbursable_amount)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {trip.distance_miles} miles
                    </p>
                  </div>
                </div>
                
                {trip.notes && (
                  <p className="text-sm text-gray-600 mb-2">{trip.notes}</p>
                )}
                
                {trip.end_time && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>
                      Duration: {formatDuration(new Date(trip.end_time).getTime() - new Date(trip.start_time).getTime())}
                    </span>
                    <span>
                      Rate: {formatCurrency(trip.mileage_rate_per_mile)}/mile
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}