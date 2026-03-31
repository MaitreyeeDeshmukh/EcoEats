import { useEffect, useCallback } from 'react'
import { X } from '@phosphor-icons/react'

export default function Modal({ open, onClose, title, children, className = '' }) {
  const handleEscape = useCallback(
    e => { if (e.key === 'Escape') onClose() },
    [onClose]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, handleEscape])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`bg-white rounded-2xl p-6 w-full max-w-md shadow-xl ${className}`}>
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
