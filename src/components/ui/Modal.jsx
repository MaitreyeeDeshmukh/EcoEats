import { useEffect } from 'react'
import { X } from '@phosphor-icons/react'

export default function Modal({ open, onClose, title, children, className = '' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className={[
          'relative bg-white w-full max-w-[480px] rounded-t-[24px] shadow-card-hover',
          'animate-slide-up pb-safe max-h-[90dvh] overflow-y-auto',
          className,
        ].join(' ')}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {(title || onClose) && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            {title && <h2 className="font-display font-bold text-lg text-forest-700">{title}</h2>}
            <button
              onClick={onClose}
              className="ml-auto p-2 rounded-full hover:bg-gray-100 min-h-touch min-w-[44px] flex items-center justify-center"
            >
              <X size={20} />
            </button>
          </div>
        )}

        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
