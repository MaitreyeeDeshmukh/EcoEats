import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Leaf, ArrowClockwise } from '@phosphor-icons/react'
import ListingCard from './ListingCard'
import FilterBar from './FilterBar'
import { ListingCardSkeleton } from '../ui/Skeleton'
import { useListings } from '../../hooks/useListings'
import ClaimFlow from '../claim/ClaimFlow'

export default function FeedView() {
  const { listings, loading, filters, setFilters, clearFilters } = useListings()
  const [claimTarget, setClaimTarget] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const navigate = useNavigate()

  // Pull-to-refresh simulation (real-time listener auto-refreshes)
  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 800)
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Fixed header */}
      <div className="bg-cream/90 backdrop-blur-sm sticky top-0 z-10 pt-safe">
        <div className="flex items-end justify-between px-4 pt-4 pb-2">
          <div>
            <p className="font-body text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-0.5">Nearby</p>
            <h1 className="font-display font-extrabold text-3xl text-forest-700 leading-none">What's free</h1>
          </div>
          <button
            onClick={handleRefresh}
            className={`p-2 rounded-full hover:bg-forest-50 transition-all min-h-touch min-w-[44px] flex items-center justify-center ${refreshing ? 'animate-spin' : ''}`}
          >
            <ArrowClockwise size={20} className="text-forest-700" />
          </button>
        </div>
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          onClear={clearFilters}
        />
      </div>

      {/* Scrollable feed */}
      <div className="flex-1 overflow-y-auto scroll-hide pb-safe">
        {loading ? (
          <div className="px-4 pt-4 space-y-4">
            {[...Array(3)].map((_, i) => <ListingCardSkeleton key={i} />)}
          </div>
        ) : listings.length === 0 ? (
          <EmptyState hasFilters={filters.dietary.length > 0} onClear={clearFilters} />
        ) : (
          <div className="px-4 pt-4 space-y-4">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onClaim={setClaimTarget}
                onView={(l) => navigate(`/listing/${l.id}`)}
              />
            ))}
            <div className="text-center py-4 text-xs text-gray-400 font-body">
              {listings.length} listing{listings.length !== 1 ? 's' : ''} near you
            </div>
          </div>
        )}
      </div>

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

function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 pt-20 text-center">
      <div className="w-24 h-24 bg-forest-50 rounded-full flex items-center justify-center mb-6">
        <Leaf size={48} weight="fill" className="text-forest-200" />
      </div>
      <h2 className="font-display font-bold text-xl text-gray-800 mb-2">
        {hasFilters ? 'No matches for your filters' : 'No food nearby right now'}
      </h2>
      <p className="text-gray-500 font-body text-sm leading-relaxed max-w-xs">
        {hasFilters
          ? 'Try adjusting your filters to see more listings.'
          : 'Check back soon — food gets posted right before and after campus events.'}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="mt-4 text-forest-700 font-medium font-body text-sm underline"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
