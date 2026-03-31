import { createContext, useContext, useReducer, useCallback } from 'react'

const ToastContext = createContext(null)

let nextId = 1

function toastReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return [...state, action.toast]
    case 'REMOVE':
      return state.filter((t) => t.id !== action.id)
    default:
      return state
  }
}

export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(toastReducer, [])

  const toast = useCallback((message, type = 'info', duration = 4000) => {
    const id = nextId++
    dispatch({ type: 'ADD', toast: { id, message, type, duration } })
    if (duration > 0) {
      setTimeout(() => dispatch({ type: 'REMOVE', id }), duration)
    }
    return id
  }, [])

  const dismiss = useCallback((id) => {
    dispatch({ type: 'REMOVE', id })
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
