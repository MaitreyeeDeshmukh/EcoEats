import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import { MapPin, X, Leaf } from '@phosphor-icons/react'
import { useListingsContext } from '../../contexts/ListingsContext'
import { useLocation } from '../../hooks/useLocation'
import { getTimeRemaining } from '../../utils/foodSafety'
import { createPinIcon, createUserIcon } from './ListingPin'
import Badge from '../ui/Badge'
import ClaimFlow from '../claim/ClaimFlow'
import 'leaflet/dist/leaflet.css'

function RecenterButton({ location }) {
  const map = useMap()
  return (
    <button
      onClick={() => map.flyTo([location.lat, location.lng], 15, { duration: 0.8 })}
      className="absolute bottom-32 right-4 z-[1000] bg-white rounded-full w-11 h-11 shadow-card flex items-center justify-center text-forest-700"
    >
      <MapPin size={20} weight="fill" />
    </button>
  )
}

function MapController({ location }) {
  const map = useMap()
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current && location) {
      map.setView([location.lat, location.lng], 15)
      initialized.current = true
    }
  }, [location, map])

  return null
}

function ListingMarker({ listing, onSelect }) {
  const icon = createPinIcon(listing)
  return (
    <Marker
      position={[listing.location.lat, listing.location.lng]}
      icon={icon}
      eventHandlers={{ click: () => onSelect(listing) }}
    />
  )
}

function ListingPreviewCard({ listing, onClose, onClaim }) {
  const remaining = getTimeRemaining(listing.expiresAt)

  return (
    <div className="absolute bottom-24 left-4 right-4 z-[1000] bg-white rounded-card shadow-card-hover animate-slide-up">
      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        <div className="w-20 h-20 rounded-xl bg-forest-50 flex-shrink-0 overflow-hidden">
          {listing.imageUrl ? (
            <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Leaf size={28} weight="fill" className="text-forest-200" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-display font-bold text-sm text-gray-900 line-clamp-1">
              {listing.title}
            </h3>
            <button onClick={onClose} className="flex-shrink-0 p-1 text-gray-400">
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-gray-500 font-body mb-1">
            {listing.location?.buildingName} · Rm {listing.location?.roomNumber}
          </p>
          <div className="flex items-center gap-1 flex-wrap mb-2">
            {listing.dietaryTags?.slice(0, 2).map((t) => (
              <Badge key={t} dietary={t}>{t}</Badge>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-body font-medium ${remaining?.minutes < 15 ? 'text-red-500' : 'text-gray-500'}`}>
              ⏱ {remaining?.display || 'Expired'}
            </span>
            <span className="text-xs font-body text-forest-700 font-medium">
              {listing.quantityRemaining} portion{listing.quantityRemaining !== 1 ? 's' : ''} left
            </span>
          </div>
        </div>
      </div>

      {listing.quantityRemaining > 0 && (
        <div className="px-3 pb-3">
          <button
            onClick={() => onClaim(listing)}
            className="w-full bg-forest-700 text-white text-sm font-medium font-body py-2.5 rounded-btn hover:bg-forest-600 transition-colors"
          >
            Claim This Food
          </button>
        </div>
      )}
    </div>
  )
}

export default function MapView() {
  const { listings } = useListingsContext()
  const { location, hasGps } = useLocation()
  const [selectedListing, setSelectedListing] = useState(null)
  const [claimTarget, setClaimTarget] = useState(null)

  const activeListings = listings.filter(
    (l) => l.status === 'active' && l.location?.lat
  )

  return (
    <div className="relative h-full w-full">
      {!hasGps && (
        <div className="absolute top-14 left-4 right-4 z-[1000] bg-amber-50 border border-amber-200 rounded-card px-3 py-2 text-xs text-amber-700 font-body">
          GPS unavailable — showing ASU Tempe campus
        </div>
      )}

      <MapContainer
        center={[location.lat, location.lng]}
        zoom={15}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© OpenStreetMap'
          maxZoom={19}
        />

        <MapController location={location} />

        {/* User dot */}
        {hasGps && (
          <Marker
            position={[location.lat, location.lng]}
            icon={createUserIcon()}
          />
        )}

        {/* Listing pins */}
        {activeListings.map((listing) => (
          <ListingMarker
            key={listing.id}
            listing={listing}
            onSelect={setSelectedListing}
          />
        ))}
      </MapContainer>

      {/* Recenter button (rendered outside MapContainer for easier z-index) */}
      <button
        onClick={() => {}}
        className="absolute bottom-32 right-4 z-[1000] bg-white rounded-full w-11 h-11 shadow-card flex items-center justify-center text-forest-700"
      >
        <MapPin size={20} weight="fill" />
      </button>

      {/* Preview card */}
      {selectedListing && !claimTarget && (
        <ListingPreviewCard
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onClaim={(l) => { setClaimTarget(l); setSelectedListing(null) }}
        />
      )}

      {/* Claim sheet */}
      {claimTarget && (
        <ClaimFlow
          listing={claimTarget}
          onClose={() => setClaimTarget(null)}
        />
      )}
    </div>
  )
}
