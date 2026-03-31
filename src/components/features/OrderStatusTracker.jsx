import { CheckCircle, Circle } from '@phosphor-icons/react'

const STEPS = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'out_for_delivery', label: 'On the Way' },
  { key: 'delivered', label: 'Delivered' },
]

const STATUS_INDEX = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  out_for_delivery: 3,
  delivered: 4,
  cancelled: -1,
}

export default function OrderStatusTracker({ status }) {
  const currentIndex = STATUS_INDEX[status] ?? 0

  if (status === 'cancelled') {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
        <p className="text-red-700 font-medium">This order was cancelled.</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex items-start justify-between gap-0">
        {STEPS.map((step, i) => {
          const done = i < currentIndex
          const active = i === currentIndex

          return (
            <div key={step.key} className="flex-1 flex flex-col items-center gap-2 relative">
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="absolute top-3.5 left-1/2 w-full h-0.5 z-0">
                  <div
                    className={`h-full transition-colors duration-500 ${done ? 'bg-brand-500' : 'bg-neutral-200'}`}
                  />
                </div>
              )}

              {/* Icon */}
              <div className="relative z-10">
                {done ? (
                  <CheckCircle size={28} weight="fill" className="text-brand-500" />
                ) : active ? (
                  <div className="w-7 h-7 rounded-full border-2 border-brand-500 bg-brand-50 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full border-2 border-neutral-300 bg-white" />
                )}
              </div>

              <p className={`text-xs text-center leading-tight ${
                done || active ? 'text-neutral-800 font-medium' : 'text-neutral-400'
              }`}>
                {step.label}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
