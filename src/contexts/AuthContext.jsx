import { createContext, useContext, useEffect, useReducer, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getUserProfile, updateLastSeen } from '../services/auth'

const AuthContext = createContext(null)

const initialState = {
  user: null,     // normalized auth user (with .uid, .displayName, .photoURL)
  profile: null,  // users table row (normalized)
  loading: true,
  error: null,
}

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_USER': return { ...state, user: action.user, loading: false, error: null }
    case 'SET_PROFILE': return { ...state, profile: action.profile }
    case 'CLEAR': return { ...initialState, loading: false }
    case 'SET_ERROR': return { ...state, error: action.error, loading: false }
    default: return state
  }
}

function normalizeUser(supabaseUser) {
  if (!supabaseUser) return null
  return {
    ...supabaseUser,
    uid: supabaseUser.id,
    displayName:
      supabaseUser.user_metadata?.full_name ||
      supabaseUser.email?.split('@')[0] ||
      'User',
    photoURL: supabaseUser.user_metadata?.avatar_url || null,
    email: supabaseUser.email,
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    let profileChannel = null

    async function handleSession(supabaseUser) {
      if (!supabaseUser) {
        if (profileChannel) { supabase.removeChannel(profileChannel); profileChannel = null }
        dispatch({ type: 'CLEAR' })
        return
      }

      const user = normalizeUser(supabaseUser)
      dispatch({ type: 'SET_USER', user })

      const profile = await getUserProfile(supabaseUser.id)
      dispatch({ type: 'SET_PROFILE', profile })

      if (profileChannel) { supabase.removeChannel(profileChannel) }
      profileChannel = supabase
        .channel(`profile-${supabaseUser.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${supabaseUser.id}`,
        }, async () => {
          const updated = await getUserProfile(supabaseUser.id)
          dispatch({ type: 'SET_PROFILE', profile: updated })
        })
        .subscribe()

      updateLastSeen(supabaseUser.id).catch(() => {})
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session?.user || null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session?.user || null)
    })

    return () => {
      subscription.unsubscribe()
      if (profileChannel) supabase.removeChannel(profileChannel)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!state.user) return
    const p = await getUserProfile(state.user.uid)
    dispatch({ type: 'SET_PROFILE', profile: p })
  }, [state.user])

  return (
    <AuthContext.Provider value={{ ...state, refreshProfile, dispatch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
