import { useState, useEffect } from 'react'

// ASU Tempe campus center as default
const ASU_TEMPE = { lat: 33.4192, lng: -111.9340 }

export function useLocation() {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      setLocation(ASU_TEMPE)
      setLoading(false)
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err.message)
        // Fallback to ASU Tempe — no crash
        if (!location) setLocation(ASU_TEMPE)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return { location: location || ASU_TEMPE, error, loading, hasGps: !error }
}
