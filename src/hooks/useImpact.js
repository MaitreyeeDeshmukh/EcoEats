import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, getCountFromServer } from 'firebase/firestore'
import { db } from '../services/firebase'
import { calcCo2Saved } from '../utils/impact'

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
    // Live active listings count
    const activeQ = query(collection(db, 'listings'), where('status', '==', 'active'))
    const unsubActive = onSnapshot(activeQ, (snap) => {
      setStats((prev) => ({ ...prev, activeListings: snap.size }))
    })

    // Live picked-up claims = meals rescued
    const pickedQ = query(collection(db, 'claims'), where('status', '==', 'picked_up'))
    const unsubPickup = onSnapshot(pickedQ, (snap) => {
      const total = snap.size
      setStats((prev) => ({
        ...prev,
        mealsAllTime: total,
        co2Saved: calcCo2Saved(total),
        loading: false,
      }))
    })

    // Today's meals
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayQ = query(
      collection(db, 'claims'),
      where('status', '==', 'picked_up'),
      where('pickedUpAt', '>=', todayStart)
    )
    const unsubToday = onSnapshot(todayQ, (snap) => {
      setStats((prev) => ({ ...prev, mealsToday: snap.size }))
    })

    return () => {
      unsubActive()
      unsubPickup()
      unsubToday()
    }
  }, [])

  return stats
}

export function useLeaderboard() {
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Top hosts: users with highest mealsRescued in impactStats
    // We listen to users collection ordered by impactStats.mealsRescued
    const q = query(collection(db, 'users'), where('role', '==', 'host'))
    const unsub = onSnapshot(q, (snap) => {
      const users = snap.docs
        .map((d) => ({ uid: d.id, ...d.data() }))
        .sort((a, b) => (b.impactStats?.mealsRescued || 0) - (a.impactStats?.mealsRescued || 0))
        .slice(0, 10)
      setLeaders(users)
      setLoading(false)
    })
    return unsub
  }, [])

  return { leaders, loading }
}
