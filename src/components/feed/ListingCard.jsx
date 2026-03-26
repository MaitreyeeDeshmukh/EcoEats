import { useState, useEffect } from 'react'
import { MapPin, Clock, Users, Leaf } from '@phosphor-icons/react'
import Badge from '../ui/Badge'
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
    return <span className="text-gray-400 text-xs font-body">Expired</span>
  }

  const urgent = remaining.minutes < 15
  return (
    <span className={`text-xs font-medium font-body ${urgent ? 'text-red-500 animate-pulse-soft' : 'text-gray-500'}`}>
      <Clock size={12} className="inline mr-0.5" />
      {remaining.display}
    </span>
  )
}

export default function ListingCard({ listing, onClaim, onView, compact = false }) {
  const { location } = useLocation()
  const urgent = isUrgent(listing.expiresAt)
  const pctLeft = listing.quantity > 0 ? (listing.quantityRemaining / listing.quantity) : 0
  const almostGone = pctLeft > 0 && pctLeft <= 0.25

  const distance = location && listing.location
    ? formatDistance(haversineDistance(location.lat, location.lng, listing.location.lat, listing.location.lng))
    : null

  const statusColor = listing.quantityRemaining <= 0
    ? 'bg-gray-100 text-gray-500'
    : almostGone
    ? 'bg-amber-100 text-amber-700'
    : 'bg-forest-100 text-forest-700'

  return (
    <div
      className="bg-white rounded-card shadow-card overflow-hidden animate-scale-in cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => onView?.(listing)}
    >
      {/* Food image */}
      <div className="relative w-full h-44 bg-forest-50">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Leaf size={48} weight="fill" className="text-forest-200" />
          </div>
        )}
        {/* Urgency overlay */}
        {urgent && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-medium font-body px-2 py-1 rounded-full animate-pulse-soft">
            Expiring Soon!
          </div>
        )}
        {listing.quantityRemaining <= 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-700 text-sm font-semibold font-body px-4 py-2 rounded-full">
              Fully Claimed
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display font-bold text-gray-900 text-base leading-tight line-clamp-1">
            {listing.title}
          </h3>
          <div className={`text-xs font-medium font-body px-2 py-0.5 rounded-full whitespace-nowrap ${statusColor}`}>
            {listing.quantityRemaining <= 0 ? 'Claimed' : `${listing.quantityRemaining} left`}
          </div>
        </div>

        <p className="text-gray-500 text-sm font-body line-clamp-1 mb-2">
          {listing.description}
        </p>

        {/* Location + distance */}
        <div className="flex items-center gap-1 text-xs text-gray-400 font-body mb-2">
          <MapPin size={12} weight="fill" />
          <span className="truncate">{listing.location?.buildingName}</span>
          {listing.location?.roomNumber && (
            <span className="text-gray-300">· Rm {listing.location.roomNumber}</span>
          )}
          {distance && <span className="ml-auto text-gray-400 font-medium">{distance}</span>}
        </div>

        {/* Dietary tags */}
        {listing.dietaryTags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {listing.dietaryTags.slice(0, 3).map((tag) => (
              <Badge key={tag} dietary={tag}>{tag}</Badge>
            ))}
            {listing.dietaryTags.length > 3 && (
              <Badge variant="gray">+{listing.dietaryTags.length - 3}</Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <CountdownTimer expiresAt={listing.expiresAt} />
          {listing.quantityRemaining > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onClaim?.(listing) }}
              className="bg-forest-700 text-white text-sm font-medium font-body px-4 py-2 rounded-btn hover:bg-forest-600 active:bg-forest-800 transition-colors min-h-touch"
            >
              Claim
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
