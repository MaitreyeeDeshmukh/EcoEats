import { useMemo } from 'react'
import { useListingsContext } from '../contexts/ListingsContext'
import { useAuth } from '../contexts/AuthContext'
import { useLocation } from './useLocation'
import { haversineDistance } from '../utils/distance'
import { getTimeRemaining } from '../utils/foodSafety'

export function useListings() {
  const { listings, loading, error, filters, setFilters, clearFilters } = useListingsContext()
  const { profile } = useAuth()
  const { location } = useLocation()

  const filtered = useMemo(() => {
    let result = listings.filter((l) => {
      // Status check
      if (l.status !== 'active') return false

      // Expiry check
      const remaining = getTimeRemaining(l.expiresAt)
      if (remaining?.expired) return false

      // Dietary filter
      if (filters.dietary.length > 0) {
        const hasTag = filters.dietary.some((tag) => l.dietaryTags?.includes(tag))
        if (!hasTag) return false
      }

      // Distance filter
      if (location && l.location) {
        const dist = haversineDistance(location.lat, location.lng, l.location.lat, l.location.lng)
        if (dist > filters.radiusMiles) return false
      }

      // Time window filter
      if (filters.maxMinutes && l.expiresAt) {
        const remaining = getTimeRemaining(l.expiresAt)
        if (remaining && remaining.minutes > filters.maxMinutes) return false
      }

      return true
    })

    // Personalized: sort matching dietary prefs first
    if (profile?.dietaryPrefs?.length > 0) {
      result.sort((a, b) => {
        const aMatch = profile.dietaryPrefs.some((p) => a.dietaryTags?.includes(p))
        const bMatch = profile.dietaryPrefs.some((p) => b.dietaryTags?.includes(p))
        if (aMatch && !bMatch) return -1
        if (!aMatch && bMatch) return 1

        // Then by distance
        if (location && a.location && b.location) {
          const da = haversineDistance(location.lat, location.lng, a.location.lat, a.location.lng)
          const db2 = haversineDistance(location.lat, location.lng, b.location.lat, b.location.lng)
          return da - db2
        }
        return 0
      })
    }

    return result
  }, [listings, filters, location, profile])

  return { listings: filtered, allListings: listings, loading, error, filters, setFilters, clearFilters }
}
