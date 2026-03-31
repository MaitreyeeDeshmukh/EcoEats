import { createContext, useContext, useEffect, useReducer, useCallback, useRef } from 'react'
import { subscribeToActiveListings, expireOldListings } from '../services/listings'
import { useAuth } from './AuthContext'

const ListingsContext = createContext(null)

const initialState = {
  listings: [],
  loading: true,
  error: null,
  filters: { dietary: [], radiusMiles: 1, maxMinutes: 90 },
}

function listingsReducer(state, action) {
  switch (action.type) {
    case 'SET_LISTINGS': return { ...state, listings: action.listings, loading: false }
    case 'SET_LOADING': return { ...state, loading: action.loading }
    case 'SET_ERROR': return { ...state, error: action.error, loading: false }
    case 'SET_FILTERS': return { ...state, filters: { ...state.filters, ...action.filters } }
    case 'CLEAR_FILTERS': return { ...state, filters: initialState.filters }
    default: return state
  }
}

export function ListingsProvider({ children }) {
  const [state, dispatch] = useReducer(listingsReducer, initialState)
  const { user } = useAuth()
  const expireTimerRef = useRef(null)

  useEffect(() => {
    if (!user) {
      dispatch({ type: 'SET_LISTINGS', listings: [] })
      return
    }

    const unsub = subscribeToActiveListings((listings) => {
      dispatch({ type: 'SET_LISTINGS', listings })
    })

    expireOldListings().catch(() => {})
    expireTimerRef.current = setInterval(() => expireOldListings().catch(() => {}), 60_000)

    return () => {
      unsub()
      clearInterval(expireTimerRef.current)
    }
  }, [user])

  const setFilters = useCallback((filters) => dispatch({ type: 'SET_FILTERS', filters }), [])
  const clearFilters = useCallback(() => dispatch({ type: 'CLEAR_FILTERS' }), [])

  return (
    <ListingsContext.Provider value={{ ...state, setFilters, clearFilters, dispatch }}>
      {children}
    </ListingsContext.Provider>
  )
}

export function useListingsContext() {
  const ctx = useContext(ListingsContext)
  if (!ctx) throw new Error('useListingsContext must be used inside ListingsProvider')
  return ctx
}
