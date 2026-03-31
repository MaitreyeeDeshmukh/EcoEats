import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthChange, getUserDocument } from '../services/auth'
import { normalizeProfile } from '../utils/normalize'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthChange(async (supabaseUser) => {
      if (supabaseUser) {
        setUser(supabaseUser)
        const doc = await getUserDocument(supabaseUser.id)
        setProfile(normalizeProfile(doc))
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  function refreshProfile() {
    if (!user) return
    getUserDocument(user.id).then(doc => setProfile(normalizeProfile(doc)))
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
