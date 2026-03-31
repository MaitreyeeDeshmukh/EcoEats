const variants = {
  green: 'bg-forest-100 text-forest-700',
  lime: 'bg-lime/20 text-forest-600',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-600',
  gray: 'bg-gray-100 text-gray-600',
  blue: 'bg-blue-100 text-blue-600',
}

const DIETARY_COLORS = {
  vegan: 'bg-emerald-100 text-emerald-700',
  vegetarian: 'bg-green-100 text-green-700',
  halal: 'bg-teal-100 text-teal-700',
  'gluten-free': 'bg-orange-100 text-orange-700',
  'nut-free': 'bg-yellow-100 text-yellow-700',
  'dairy-free': 'bg-sky-100 text-sky-700',
}

export default function Badge({ children, variant = 'green', dietary, className = '' }) {
  const colorClass = dietary ? (DIETARY_COLORS[dietary] || variants.green) : variants[variant]
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-body',
        colorClass,
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
