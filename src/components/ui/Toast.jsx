import { useEffect, useRef } from 'react'
import { X, CheckCircle, Warning, Info, XCircle } from '@phosphor-icons/react'
import { useToast } from '../../contexts/ToastContext'

const ICONS = {
  success: <CheckCircle size={20} weight="fill" className="text-green-500" />,
  error: <XCircle size={20} weight="fill" className="text-red-500" />,
  warning: <Warning size={20} weight="fill" className="text-amber-500" />,
  info: <Info size={20} weight="fill" className="text-blue-500" />,
}

function ToastItem({ toast }) {
  const { dismiss } = useToast()
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Swipe-to-dismiss
    let startX = 0
    const onTouchStart = (e) => { startX = e.touches[0].clientX }
    const onTouchEnd = (e) => {
      if (Math.abs(e.changedTouches[0].clientX - startX) > 80) dismiss(toast.id)
    }
    el.addEventListener('touchstart', onTouchStart)
    el.addEventListener('touchend', onTouchEnd)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [toast.id, dismiss])

  return (
    <div
      ref={ref}
      className="flex items-start gap-3 bg-white rounded-card shadow-card-hover px-4 py-3 min-w-[280px] max-w-[360px] animate-slide-up"
    >
      <div className="flex-shrink-0 mt-0.5">{ICONS[toast.type] || ICONS.info}</div>
      <p className="flex-1 text-sm font-body text-gray-800 leading-snug">{toast.message}</p>
      <button
        onClick={() => dismiss(toast.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 min-h-touch min-w-[24px] flex items-center justify-center"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const { toasts } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center w-full px-4 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  )
}
