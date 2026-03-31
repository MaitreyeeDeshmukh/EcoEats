import { createContext, useContext, useEffect, useReducer, useCallback } from 'react'
import { onAuthChange, getUserProfile, updateLastSeen } from '../services/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'

const AuthContext = createContext(null)

const initialState = {
  user: null,          // Firebase Auth user
  profile: null,       // Firestore user doc
  loading: true,
  error: null,
}

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.user, loading: false, error: null }
    case 'SET_PROFILE':
      return { ...state, profile: action.profile }
    case 'CLEAR':
      return { ...initialState, loading: false }
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false }
    case 'SET_LOADING':
      return { ...state, loading: action.loading }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    let profileUnsub = null

    const authUnsub = onAuthChange(async (firebaseUser) => {
      if (profileUnsub) { profileUnsub(); profileUnsub = null }

      if (!firebaseUser) {
        dispatch({ type: 'CLEAR' })
        return
      }

      dispatch({ type: 'SET_USER', user: firebaseUser })

      // Live-listen to profile doc
      profileUnsub = onSnapshot(
        doc(db, 'users', firebaseUser.uid),
        (snap) => {
          if (snap.exists()) {
            dispatch({ type: 'SET_PROFILE', profile: { uid: firebaseUser.uid, ...snap.data() } })
          } else {
            // Profile not yet created (during onboarding)
            dispatch({ type: 'SET_PROFILE', profile: null })
          }
        },
        () => {
          dispatch({ type: 'SET_PROFILE', profile: null })
        }
      )

      // Silently update lastSeen
      updateLastSeen(firebaseUser.uid).catch(() => {})
    })

    return () => {
      authUnsub()
      if (profileUnsub) profileUnsub()
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
