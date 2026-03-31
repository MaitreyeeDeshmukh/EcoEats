export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-neutral-100 text-neutral-700',
    eco: 'bg-brand-100 text-brand-700',
    pending: 'bg-neutral-100 text-neutral-700',
    confirmed: 'bg-blue-100 text-blue-700',
    preparing: 'bg-yellow-100 text-yellow-700',
    out_for_delivery: 'bg-orange-100 text-orange-700',
    delivered: 'bg-brand-100 text-brand-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant] || variants.default} ${className}`}
    >
      {children}
    </span>
  )
}

export function VegDot({ isVeg, isVegan }) {
  if (isVegan) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-700">
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
        Vegan
      </span>
    )
  }
  if (isVeg) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-700">
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
        Veg
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-red-700">
      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
      Non-veg
    </span>
  )
}
