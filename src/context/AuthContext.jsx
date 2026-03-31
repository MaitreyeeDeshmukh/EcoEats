import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthChange, getUserDocument } from '../services/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthChange(async firebaseUser => {
      if (firebaseUser) {
        setUser(firebaseUser)
        const doc = await getUserDocument(firebaseUser.uid)
        setProfile(doc)
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
    getUserDocument(user.uid).then(setProfile)
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
