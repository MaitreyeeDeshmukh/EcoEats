import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { calcCo2Saved } from '../utils/impact'
import { normalizeProfile } from '../services/auth'

export function useImpact() {
  const [stats, setStats] = useState({
    mealsToday: 0,
    mealsAllTime: 0,
    co2Saved: '0',
    activeListings: 0,
    totalUsers: 0,
    loading: true,
  })

  useEffect(() => {
    async function loadStats() {
      const [activeRes, allTimeRes, todayRes] = await Promise.all([
        supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('is_available', true)
          .eq('status', 'active'),

        supabase
          .from('claims')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'picked_up'),

        supabase
          .from('claims')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'picked_up')
          .gte('resolved_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      ])

      const activeListings = activeRes.count || 0
      const mealsAllTime = allTimeRes.count || 0
      const mealsToday = todayRes.count || 0

      setStats({
        activeListings,
        mealsAllTime,
        mealsToday,
        co2Saved: calcCo2Saved(mealsAllTime),
        loading: false,
      })
    }

    loadStats()

    const channel = supabase
      .channel('impact-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'claims' }, loadStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, loadStats)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return stats
}

export function useLeaderboard() {
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('users')
      .select('*')
      .then(({ data }) => {
        const sorted = (data || [])
          .map(normalizeProfile)
          .filter((u) => u !== null)
          .sort((a, b) => (b.impactStats?.mealsRescued || 0) - (a.impactStats?.mealsRescued || 0))
          .slice(0, 10)
        setLeaders(sorted)
        setLoading(false)
      })
  }, [])

  return { leaders, loading }
}
