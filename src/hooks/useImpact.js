import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { calcCo2Saved } from '../utils/impact'

export function useImpact() {
  const [stats, setStats] = useState({
    mealsToday: 0,
    mealsAllTime: 0,
    co2Saved: '0',
    activeListings: 0,
    loading: true,
  })

  useEffect(() => {
    async function fetchStats() {
      const [activeRes, allTimeRes, todayRes] = await Promise.all([
        supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('claims').select('id', { count: 'exact', head: true }).eq('status', 'picked_up'),
        supabase.from('claims').select('id', { count: 'exact', head: true })
          .eq('status', 'picked_up')
          .gte('picked_up_at', new Date().toISOString().split('T')[0]),
      ])

      const mealsAllTime = allTimeRes.count || 0
      setStats({
        mealsToday: todayRes.count || 0,
        mealsAllTime,
        co2Saved: calcCo2Saved(mealsAllTime),
        activeListings: activeRes.count || 0,
        loading: false,
      })
    }

    fetchStats()

    // Re-fetch when listings or claims change
    const channel = supabase
      .channel('impact-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'claims' }, fetchStats)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return stats
}

export function useLeaderboard() {
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLeaders() {
      const { data } = await supabase
        .from('users')
        .select('id, name, avatar_url, impact_stats, role')
        .eq('role', 'organizer')
        .order('impact_stats->mealsRescued', { ascending: false })
        .limit(10)

      setLeaders((data || []).map((u) => ({
        uid: u.id,
        name: u.name,
        avatar: u.avatar_url,
        impactStats: u.impact_stats || { mealsRescued: 0 },
      })))
      setLoading(false)
    }
    fetchLeaders()
  }, [])

  return { leaders, loading }
}
