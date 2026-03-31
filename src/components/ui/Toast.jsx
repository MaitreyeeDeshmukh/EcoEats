import { useEffect } from 'react'
import { X, CheckCircle, Warning, Info } from '@phosphor-icons/react'
import { useToast } from '../../context/ToastContext'

function ToastItem({ toast, onRemove }) {
  const icons = {
    success: <CheckCircle size={20} weight="fill" />,
    error: <Warning size={20} weight="fill" />,
    info: <Info size={20} weight="fill" />,
  }

  const colors = {
    success: 'bg-brand-500',
    error: 'bg-red-500',
    info: 'bg-neutral-800',
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm shadow-lg ${colors[toast.type] || colors.info} animate-in slide-in-from-right`}
      style={{ animation: 'slideInRight 0.3s ease' }}
    >
      {icons[toast.type]}
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="opacity-80 hover:opacity-100 transition-opacity ml-1"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={removeToast} />
        </div>
      ))}
    </div>
  )
}
