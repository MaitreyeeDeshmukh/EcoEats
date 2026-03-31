import { Plus, Minus } from '@phosphor-icons/react'
import { VegDot } from '../ui/Badge'
import { formatCurrency, formatCarbonGrams } from '../../utils/formatters'
import { useCart } from '../../context/CartContext'

export default function MenuItemCard({ item, restaurantId, restaurantName }) {
  const { items, addItem, updateQuantity, removeItem } = useCart()
  const cartItem = items.find(i => i.menuItemId === item.id)
  const qty = cartItem?.quantity || 0

  function handleAdd() {
    addItem(
      {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        carbonFootprint: item.carbonFootprint,
        imageURL: item.imageURL,
      },
      restaurantId,
      restaurantName
    )
  }

  function handleIncrease() {
    updateQuantity(item.id, qty + 1)
  }

  function handleDecrease() {
    if (qty === 1) removeItem(item.id)
    else updateQuantity(item.id, qty - 1)
  }

  return (
    <div className="flex gap-4 py-4 border-b border-neutral-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-medium text-neutral-900 text-sm leading-tight">{item.name}</h4>
          {item.isBestSeller && (
            <span className="flex-shrink-0 text-xs bg-earth-100 text-earth-600 px-2 py-0.5 rounded-full font-medium">
              Bestseller
            </span>
          )}
        </div>
        <VegDot isVeg={item.isVegetarian} isVegan={item.isVegan} />
        {item.description && (
          <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{item.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <span className="font-semibold text-neutral-900 text-sm">{formatCurrency(item.price)}</span>
          {item.carbonFootprint && (
            <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
              {formatCarbonGrams(item.carbonFootprint)}
            </span>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 flex flex-col items-end gap-2">
        {item.imageURL && (
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-100">
            <img
              src={item.imageURL}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {qty === 0 ? (
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={14} weight="bold" />
            Add
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-brand-50 rounded-lg px-2 py-1">
            <button onClick={handleDecrease} className="text-brand-600 hover:text-brand-700">
              <Minus size={16} weight="bold" />
            </button>
            <span className="text-brand-700 font-semibold text-sm w-4 text-center">{qty}</span>
            <button onClick={handleIncrease} className="text-brand-600 hover:text-brand-700">
              <Plus size={16} weight="bold" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
