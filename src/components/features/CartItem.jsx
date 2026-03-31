import { Minus, Plus, Trash } from '@phosphor-icons/react'
import { formatCurrency, formatCarbonGrams } from '../../utils/formatters'
import { useCart } from '../../context/CartContext'

export default function CartItem({ item }) {
  const { updateQuantity, removeItem } = useCart()

  return (
    <div className="flex gap-3 py-4 border-b border-neutral-100 last:border-0">
      {item.imageURL && (
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
          <img src={item.imageURL} alt={item.name} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium text-neutral-900 text-sm leading-tight">{item.name}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{formatCurrency(item.price)} each</p>
        {item.carbonFootprint && (
          <p className="text-xs text-brand-600 mt-0.5">{formatCarbonGrams(item.carbonFootprint * item.quantity)}</p>
        )}
      </div>

      <div className="flex flex-col items-end justify-between flex-shrink-0">
        <p className="font-semibold text-neutral-900 text-sm">{formatCurrency(item.price * item.quantity)}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (item.quantity === 1) removeItem(item.menuItemId)
              else updateQuantity(item.menuItemId, item.quantity - 1)
            }}
            className="w-7 h-7 rounded-lg border border-neutral-200 flex items-center justify-center hover:bg-neutral-100 text-neutral-600 transition-colors"
          >
            {item.quantity === 1 ? <Trash size={13} /> : <Minus size={13} />}
          </button>
          <span className="text-sm font-semibold text-neutral-900 w-4 text-center">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
            className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center hover:bg-brand-600 text-white transition-colors"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
