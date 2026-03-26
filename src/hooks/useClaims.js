import { useState, useEffect } from 'react'
import { subscribeToStudentClaims } from '../services/claims'
import { useAuth } from '../contexts/AuthContext'

export function useClaims() {
  const { user } = useAuth()
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setClaims([])
      setLoading(false)
      return
    }

    const unsub = subscribeToStudentClaims(user.uid, (data) => {
      setClaims(data)
      setLoading(false)
    })

    return unsub
  }, [user])

  const activeClaim = claims.find((c) => c.status === 'pending')
  return { claims, activeClaim, loading }
}
