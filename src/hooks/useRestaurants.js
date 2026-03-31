import { useState, useEffect } from 'react'
import { getRestaurants, getFeaturedRestaurants } from '../services/restaurants'

export function useRestaurants(category = 'all') {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getRestaurants({ category })
      .then(data => { if (!cancelled) { setRestaurants(data); setLoading(false) } })
      .catch(err => { if (!cancelled) { setError(err.message); setLoading(false) } })
    return () => { cancelled = true }
  }, [category])

  return { restaurants, loading, error }
}

export function useFeaturedRestaurants() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getFeaturedRestaurants()
      .then(data => { setRestaurants(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  return { restaurants, loading, error }
}
