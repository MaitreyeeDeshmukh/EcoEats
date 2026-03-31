import { Link } from 'react-router-dom'
import { Star, Clock, CurrencyInr, Leaf } from '@phosphor-icons/react'
import { restaurantPath } from '../../constants/routes'
import { formatCurrency, formatCarbonGrams } from '../../utils/formatters'

export default function RestaurantCard({ restaurant }) {
  const {
    id, name, cuisineType, imageURL, rating, reviewCount,
    deliveryTimeMin, deliveryFee, isEcoCertified, ecoRating,
    carbonFootprintPerOrder, isOpen,
  } = restaurant

  return (
    <Link to={restaurantPath(id)} className="block group">
      <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="relative h-44 overflow-hidden bg-neutral-100">
          <img
            src={imageURL || 'https://source.unsplash.com/featured/?restaurant,food'}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {!isOpen && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-neutral-800 text-xs font-semibold px-3 py-1 rounded-full">
                Currently Closed
              </span>
            </div>
          )}
          {isEcoCertified && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-brand-500 text-white text-xs font-medium px-2 py-1 rounded-full">
              <Leaf size={11} weight="fill" />
              Eco Certified
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-neutral-900 text-base leading-tight mb-1">{name}</h3>
          <p className="text-xs text-neutral-500 mb-3">{cuisineType}</p>

          <div className="flex items-center gap-3 text-xs text-neutral-600">
            <span className="flex items-center gap-1">
              <Star size={13} weight="fill" className="text-yellow-400" />
              {rating?.toFixed(1) || '—'} ({reviewCount || 0})
            </span>
            <span className="text-neutral-300">·</span>
            <span className="flex items-center gap-1">
              <Clock size={13} />
              {deliveryTimeMin}–{deliveryTimeMin + 10} min
            </span>
            <span className="text-neutral-300">·</span>
            <span>{deliveryFee === 0 ? 'Free delivery' : formatCurrency(deliveryFee)}</span>
          </div>

          {carbonFootprintPerOrder && (
            <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center gap-1 text-xs text-brand-600">
              <Leaf size={12} />
              {formatCarbonGrams(carbonFootprintPerOrder)} per order avg
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
