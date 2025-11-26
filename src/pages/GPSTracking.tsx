import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { haversineMiles, formatDuration } from '../lib/geo'
import ChildSelector from '../components/ChildSelector'

export default function GPSTracking() {
  const [tracking, setTracking] = useState(false)
  const [distance, setDistance] = useState(0)
  const [duration, setDuration] = useState(0)
  const [cost, setCost] = useState(0)
  const [route, setRoute] = useState<{ lat: number; lon: number; t: number }[]>([])
  const [error, setError] = useState('')
  const [childId, setChildId] = useState<string | null>(null)
  const startRef = useRef<number | null>(null)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (tracking) {
      const interval = setInterval(() => {
        if (startRef.current) setDuration(Date.now() - startRef.current)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [tracking])

  const start = async () => {
    setError('')
    if (!('geolocation' in navigator)) {
      setError('Geolocation not supported')
      return
    }
    setTracking(true)
    startRef.current = Date.now()
    setRoute([])
    setDistance(0)
    setCost(0)
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coord = { lat: pos.coords.latitude, lon: pos.coords.longitude, t: Date.now() }
        setRoute((prev) => {
          const next = [...prev, coord]
          if (prev.length > 0) {
            const miles = haversineMiles(prev[prev.length - 1], coord)
            setDistance((d) => {
              const nd = d + miles
              setCost(parseFloat((nd * 0.70).toFixed(2)))
              return nd
            })
          }
          return next
        })
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 }
    )
  }

  const stop = async () => {
    setTracking(false)
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      if (route.length < 2) return
      const startLoc = { lat: route[0].lat, lon: route[0].lon, t: route[0].t }
      const endLoc = { lat: route[route.length - 1].lat, lon: route[route.length - 1].lon, t: route[route.length - 1].t }
      const miles = parseFloat(distance.toFixed(2))
      const rate = 0.70
      const reimbursable = parseFloat((miles * rate).toFixed(2))

      const { error } = await supabase.from('trips').insert({
        user_id: user.id,
        child_id: childId,
        purpose: 'visit_activity',
        start_time: new Date(route[0].t).toISOString(),
        end_time: new Date(route[route.length - 1].t).toISOString(),
        start_location: startLoc,
        end_location: endLoc,
        distance_miles: miles,
        mileage_rate_per_mile: rate,
        reimbursable_amount: reimbursable,
        auto_detected: true,
        notes: 'Auto-tracked trip'
      })
      if (error) throw error
    } catch (e) {
      console.error(e)
      setError('Failed to sync trip. Ensure database tables/policies are set.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">GPS Tracking</h1>
        <p className="text-gray-600 mb-8">Real-time location tracking and trip logging</p>

        <div className="mb-6">
          <ChildSelector value={childId} onChange={setChildId} />
        </div>

        <div className="flex gap-3 mb-6">
          {!tracking ? (
            <button onClick={start} className="px-4 py-2 rounded-md bg-green-600 text-white">Start Tracking</button>
          ) : (
            <button onClick={stop} className="px-4 py-2 rounded-md bg-red-600 text-white">Stop & Save</button>
          )}
        </div>

        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Trip Distance</h3>
            <p className="text-2xl font-bold text-blue-600">{distance.toFixed(2)} miles</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Trip Duration</h3>
            <p className="text-2xl font-bold text-green-600">{formatDuration(duration)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Mileage Cost</h3>
            <p className="text-2xl font-bold text-purple-600">${(distance * 0.70).toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
