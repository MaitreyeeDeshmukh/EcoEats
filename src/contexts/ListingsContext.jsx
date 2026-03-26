import { createContext, useContext, useEffect, useReducer, useCallback, useRef } from 'react'
import { subscribeToActiveListings, expireOldListings } from '../services/listings'
import { useAuth } from './AuthContext'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
const now = Date.now()
const DEMO_LISTINGS = [
  {
    id: 'demo-1', status: 'active', title: 'Leftover Catered Sandwiches', description: 'Assorted turkey and veggie sandwiches from today\'s CS department lunch.',
    imageUrl: null, quantity: 12, quantityRemaining: 7,
    location: { lat: 33.4255, lng: -111.9400, buildingName: 'Brickyard (BYENG)', roomNumber: '210' },
    dietaryTags: ['Vegetarian Option'], expiresAt: new Date(now + 55 * 60 * 1000),
    hostName: 'CS Department',
  },
  {
    id: 'demo-2', status: 'active', title: 'Pizza — 4 Boxes', description: 'Cheese and pepperoni pizza from student senate meeting. Still warm!',
    imageUrl: null, quantity: 4, quantityRemaining: 2,
    location: { lat: 33.4148, lng: -111.9295, buildingName: 'Memorial Union (MU)', roomNumber: null },
    dietaryTags: [], expiresAt: new Date(now + 12 * 60 * 1000),
    hostName: 'Student Senate',
  },
  {
    id: 'demo-3', status: 'active', title: 'Fruit & Veggie Platter', description: 'Fresh cut fruit and crudité from a morning orientation event.',
    imageUrl: null, quantity: 1, quantityRemaining: 1,
    location: { lat: 33.4189, lng: -111.9350, buildingName: 'Hayden Library', roomNumber: '101' },
    dietaryTags: ['Vegan', 'Gluten-Free'], expiresAt: new Date(now + 80 * 60 * 1000),
    hostName: 'ASU Orientation',
  },
]

const ListingsContext = createContext(null)

const initialState = {
  listings: [],
  loading: true,
  error: null,
  filters: {
    dietary: [],
    radiusMiles: 1,
    maxMinutes: 90,
  },
}

function listingsReducer(state, action) {
  switch (action.type) {
    case 'SET_LISTINGS':
      return { ...state, listings: action.listings, loading: false }
    case 'SET_LOADING':
      return { ...state, loading: action.loading }
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false }
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.filters } }
    case 'CLEAR_FILTERS':
      return { ...state, filters: initialState.filters }
    default:
      return state
  }
}

export function ListingsProvider({ children }) {
  const [state, dispatch] = useReducer(listingsReducer, initialState)
  const { user } = useAuth()
  const expireTimerRef = useRef(null)

  useEffect(() => {
    if (DEMO_MODE) {
      dispatch({ type: 'SET_LISTINGS', listings: DEMO_LISTINGS })
      return
    }

    if (!user) {
      dispatch({ type: 'SET_LISTINGS', listings: [] })
      return
    }

    const unsub = subscribeToActiveListings((listings) => {
      dispatch({ type: 'SET_LISTINGS', listings })
    })

    // Run expiry check every 60s
    expireOldListings().catch(() => {})
    expireTimerRef.current = setInterval(() => {
      expireOldListings().catch(() => {})
    }, 60_000)

    return () => {
      unsub()
      clearInterval(expireTimerRef.current)
    }
  }, [user])

  const setFilters = useCallback((filters) => {
    dispatch({ type: 'SET_FILTERS', filters })
  }, [])

  const clearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' })
  }, [])

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
