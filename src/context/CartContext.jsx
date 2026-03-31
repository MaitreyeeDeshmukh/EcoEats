import { createContext, useContext, useEffect, useReducer } from 'react'

const CartContext = createContext(null)

const STORAGE_KEY = 'ecoeats_cart'

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { restaurantId: null, restaurantName: null, items: [] }
  } catch {
    return { restaurantId: null, restaurantName: null, items: [] }
  }
}

function saveCart(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { item, restaurantId, restaurantName } = action.payload
      if (state.restaurantId && state.restaurantId !== restaurantId) {
        return { ...state, _pendingConflict: { item, restaurantId, restaurantName } }
      }
      const existing = state.items.find(i => i.menuItemId === item.menuItemId)
      const newItems = existing
        ? state.items.map(i =>
            i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i
          )
        : [...state.items, { ...item, quantity: 1 }]
      return { restaurantId, restaurantName, items: newItems, _pendingConflict: null }
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(i => i.menuItemId !== action.payload),
        _pendingConflict: null,
      }
    case 'UPDATE_QUANTITY': {
      const { menuItemId, quantity } = action.payload
      if (quantity < 1) return state
      return {
        ...state,
        items: state.items.map(i =>
          i.menuItemId === menuItemId ? { ...i, quantity } : i
        ),
      }
    }
    case 'CLEAR_CART':
      return { restaurantId: null, restaurantName: null, items: [], _pendingConflict: null }
    case 'RESOLVE_CONFLICT': {
      const { item, restaurantId, restaurantName } = action.payload
      return {
        restaurantId,
        restaurantName,
        items: [{ ...item, quantity: 1 }],
        _pendingConflict: null,
      }
    }
    case 'DISMISS_CONFLICT':
      return { ...state, _pendingConflict: null }
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, loadCart)

  useEffect(() => {
    saveCart(state)
  }, [state])

  function addItem(item, restaurantId, restaurantName) {
    dispatch({ type: 'ADD_ITEM', payload: { item, restaurantId, restaurantName } })
  }

  function removeItem(menuItemId) {
    dispatch({ type: 'REMOVE_ITEM', payload: menuItemId })
  }

  function updateQuantity(menuItemId, quantity) {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { menuItemId, quantity } })
  }

  function clearCart() {
    dispatch({ type: 'CLEAR_CART' })
  }

  function resolveConflict() {
    if (!state._pendingConflict) return
    dispatch({ type: 'RESOLVE_CONFLICT', payload: state._pendingConflict })
  }

  function dismissConflict() {
    dispatch({ type: 'DISMISS_CONFLICT' })
  }

  function getTotal() {
    return state.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  }

  function getTotalCarbon() {
    return state.items.reduce((sum, i) => sum + (i.carbonFootprint || 0) * i.quantity, 0)
  }

  function getItemCount() {
    return state.items.reduce((sum, i) => sum + i.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        ...state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        resolveConflict,
        dismissConflict,
        getTotal,
        getTotalCarbon,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
