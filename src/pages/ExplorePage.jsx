import { useState, useMemo, useEffect } from 'react'
import { MagnifyingGlass, MapPin, Funnel, X, MapTrifold, List as ListIcon } from '@phosphor-icons/react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import { useRestaurants } from '../hooks/useRestaurants'
import RestaurantCard from '../components/features/RestaurantCard'
import { RestaurantCardSkeleton } from '../components/ui/Skeleton'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import PageWrapper from '../components/layout/PageWrapper'
import { CUISINE_CATEGORIES } from '../constants/categories'
import { restaurantPath } from '../constants/routes'

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? 'bg-brand-500 text-white'
          : 'bg-white text-neutral-600 border border-neutral-200 hover:border-brand-300'
      }`}
    >
      {label}
    </button>
  )
}

export default function ExplorePage() {
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [ecoOnly, setEcoOnly] = useState(false)
  const [openOnly, setOpenOnly] = useState(false)
  const [sortBy, setSortBy] = useState('default')
  const [view, setView] = useState('list')
  const { restaurants, loading, error } = useRestaurants(category)

  const filtered = useMemo(() => {
    let list = [...restaurants]

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.cuisineType?.toLowerCase().includes(q) ||
        r.tags?.some(t => t.toLowerCase().includes(q))
      )
    }

    if (ecoOnly) list = list.filter(r => r.isEcoCertified)
    if (openOnly) list = list.filter(r => r.isOpen)

    if (sortBy === 'eco') list = [...list].sort((a, b) => (b.ecoRating || 0) - (a.ecoRating || 0))
    if (sortBy === 'rating') list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0))
    if (sortBy === 'time') list = [...list].sort((a, b) => (a.deliveryTimeMin || 99) - (b.deliveryTimeMin || 99))

    return list
  }, [restaurants, search, ecoOnly, openOnly, sortBy])

  const hasFilters = search || ecoOnly || openOnly || sortBy !== 'default' || category !== 'all'

  function clearFilters() {
    setSearch('')
    setEcoOnly(false)
    setOpenOnly(false)
    setSortBy('default')
    setCategory('all')
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <div className="sticky top-14 z-30 bg-white border-b border-neutral-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 space-y-3">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search restaurants or cuisines..."
              className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-neutral-50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category + filter chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CUISINE_CATEGORIES.map(c => (
              <FilterChip
                key={c.id}
                label={c.label}
                active={category === c.id}
                onClick={() => setCategory(c.id)}
              />
            ))}
            <div className="w-px bg-neutral-200 flex-shrink-0 mx-1" />
            <FilterChip label="Eco certified" active={ecoOnly} onClick={() => setEcoOnly(v => !v)} />
            <FilterChip label="Open now" active={openOnly} onClick={() => setOpenOnly(v => !v)} />
          </div>

          {/* Sort + view toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="text-sm border border-neutral-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-500 text-neutral-700 bg-white"
              >
                <option value="default">Sort: Relevance</option>
                <option value="eco">Eco rating</option>
                <option value="rating">Rating</option>
                <option value="time">Delivery time</option>
              </select>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  <X size={12} />
                  Clear
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
              <button
                onClick={() => setView('list')}
                className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white shadow-sm text-neutral-800' : 'text-neutral-500'}`}
              >
                <ListIcon size={16} />
              </button>
              <button
                onClick={() => setView('map')}
                className={`p-1.5 rounded-md transition-colors ${view === 'map' ? 'bg-white shadow-sm text-neutral-800' : 'text-neutral-500'}`}
              >
                <MapTrifold size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {view === 'map' ? (
        <div className="h-[calc(100vh-14rem)]">
          <MapContainer
            center={[18.52, 73.85]}
            zoom={12}
            className="w-full h-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {filtered.filter(r => r.location).map(r => (
              <Marker
                key={r.id}
                position={[r.location.lat, r.location.lng]}
                icon={greenIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{r.name}</p>
                    <p className="text-neutral-500 text-xs">{r.cuisineType}</p>
                    <Link
                      to={restaurantPath(r.id)}
                      className="text-brand-600 font-medium text-xs mt-1 block"
                    >
                      View menu →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      ) : (
        <PageWrapper>
          {error ? (
            <div className="text-center py-16">
              <p className="text-neutral-500 mb-3">Failed to load restaurants.</p>
              <button onClick={() => window.location.reload()} className="text-brand-600 text-sm font-medium">
                Try again
              </button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => <RestaurantCardSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-4">🌿</div>
              <h3 className="font-semibold text-neutral-800 mb-2">No restaurants match your filters</h3>
              <p className="text-neutral-500 text-sm mb-4">Try adjusting your search or clearing filters.</p>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-brand-600 text-sm font-medium hover:text-brand-700"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-neutral-500 mb-5">
                {filtered.length} restaurant{filtered.length !== 1 ? 's' : ''} found
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map(r => <RestaurantCard key={r.id} restaurant={r} />)}
              </div>
            </>
          )}
        </PageWrapper>
      )}

      {view === 'list' && <Footer />}
    </div>
  )
}
