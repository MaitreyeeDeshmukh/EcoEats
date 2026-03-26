import { useState, useEffect } from 'react'
import { MapPin, Clock, ArrowRight, Leaf } from '@phosphor-icons/react'
import { getTimeRemaining, isUrgent } from '../../utils/foodSafety'
import { haversineDistance, formatDistance } from '../../utils/distance'
import { useLocation } from '../../hooks/useLocation'

function CountdownTimer({ expiresAt }) {
  const [remaining, setRemaining] = useState(() => getTimeRemaining(expiresAt))

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(getTimeRemaining(expiresAt))
    }, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  if (!remaining || remaining.expired) {
    return <span className="text-gray-300 text-xs font-body">Expired</span>
  }

  const urgent = remaining.minutes < 15
  return (
    <span className={`text-xs font-medium font-body flex items-center gap-1 ${urgent ? 'text-red-500' : 'text-gray-400'}`}>
      <Clock size={11} />
      {remaining.display}
    </span>
  )
}

export default function ListingCard({ listing, onClaim, onView }) {
  const { location } = useLocation()
  const urgent = isUrgent(listing.expiresAt)
  const claimed = listing.quantityRemaining <= 0
  const almostGone = listing.quantityRemaining > 0 && listing.quantityRemaining <= Math.ceil(listing.quantity * 0.25)

  const distance = location && listing.location
    ? formatDistance(haversineDistance(location.lat, location.lng, listing.location.lat, listing.location.lng))
    : null

  return (
    <div
      className="bg-white rounded-[20px] overflow-hidden active:scale-[0.98] transition-transform cursor-pointer"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
      onClick={() => onView?.(listing)}
    >
      {/* Image or placeholder */}
      <div className="relative w-full h-40 bg-forest-50 overflow-hidden">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-forest-50 to-forest-100">
            <Leaf size={40} weight="fill" className="text-forest-200" />
          </div>
        )}

        {/* Status badges */}
        {urgent && !claimed && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-[11px] font-bold font-body px-2.5 py-1 rounded-full tracking-wide">
            ENDING SOON
          </div>
        )}
        {claimed && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-700 text-sm font-semibold font-body px-4 py-2 rounded-full">
              Fully Claimed
            </span>
          </div>
        )}

        {/* Quantity pill — top right */}
        {!claimed && (
          <div className={`absolute top-3 right-3 text-xs font-bold font-body px-2.5 py-1 rounded-full ${almostGone ? 'bg-amber-400 text-white' : 'bg-white/90 text-forest-700'}`}>
            {listing.quantityRemaining} left
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display font-extrabold text-gray-900 text-lg leading-tight flex-1">
            {listing.title}
          </h3>
        </div>

        {/* Description */}
        {listing.description && (
          <p className="text-gray-400 text-sm font-body line-clamp-1 mb-3">
            {listing.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 mb-3">
          <span className="flex items-center gap-1 text-xs text-gray-400 font-body">
            <MapPin size={11} weight="fill" />
            <span className="truncate max-w-[120px]">{listing.location?.buildingName}</span>
          </span>
          {listing.location?.roomNumber && (
            <span className="text-xs text-gray-300 font-body">Rm {listing.location.roomNumber}</span>
          )}
          {distance && (
            <span className="text-xs text-gray-400 font-body ml-auto">{distance}</span>
          )}
        </div>

        {/* Dietary tags */}
        {listing.dietaryTags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {listing.dietaryTags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[11px] font-medium font-body px-2.5 py-1 rounded-full bg-forest-50 text-forest-700 border border-forest-100">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-50">
          <CountdownTimer expiresAt={listing.expiresAt} />
          {!claimed && (
            <button
              onClick={(e) => { e.stopPropagation(); onClaim?.(listing) }}
              className="flex items-center gap-1.5 bg-forest-700 text-white text-sm font-semibold font-body px-4 py-2 rounded-full hover:bg-forest-600 active:bg-forest-800 transition-colors"
            >
              Claim
              <ArrowRight size={13} weight="bold" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
