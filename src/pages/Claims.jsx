import { Bookmark, Clock, CheckCircle, XCircle } from '@phosphor-icons/react'
import { useClaims } from '../hooks/useClaims'
import { Skeleton } from '../components/ui/Skeleton'
import Badge from '../components/ui/Badge'
import { getTimeRemaining } from '../utils/foodSafety'

function ClaimCard({ claim }) {
  const remaining = claim.status === 'pending' && claim.reservationExpiresAt
    ? getTimeRemaining(claim.reservationExpiresAt)
    : null

  const statusConfig = {
    pending: { color: 'amber', label: 'Reserved', icon: <Clock size={14} className="text-amber-600" /> },
    picked_up: { color: 'green', label: 'Picked Up', icon: <CheckCircle size={14} className="text-forest-700" /> },
    no_show: { color: 'red', label: 'No Show', icon: <XCircle size={14} className="text-red-500" /> },
  }

  const cfg = statusConfig[claim.status] || statusConfig.pending

  return (
    <div className="bg-white rounded-card shadow-card p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-gray-900 font-body flex-1 line-clamp-1">
          Listing #{claim.listingId.slice(-6)}
        </p>
        <Badge variant={cfg.color}>{cfg.label}</Badge>
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-500 font-body mb-1">
        <span>{claim.quantity} portion{claim.quantity !== 1 ? 's' : ''}</span>
        <span className="text-gray-300">·</span>
        <span>{claim.claimedAt?.toDate
          ? claim.claimedAt.toDate().toLocaleDateString()
          : 'Recently'}</span>
      </div>

      {remaining && !remaining.expired && (
        <div className="mt-2 flex items-center gap-1 text-xs font-medium font-body text-amber-600">
          <Clock size={12} />
          {remaining.display} left to pick up
        </div>
      )}

      {claim.rating > 0 && (
        <div className="mt-2 text-xs text-gray-400 font-body">
          {'★'.repeat(claim.rating)}{'☆'.repeat(5 - claim.rating)} rated
        </div>
      )}
    </div>
  )
}

export default function Claims() {
  const { claims, loading } = useClaims()

  return (
    <div className="flex flex-col bg-cream pt-safe pb-safe overflow-y-auto scroll-hide h-full">
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <Bookmark size={22} weight="fill" className="text-forest-700" />
        <h1 className="font-display font-bold text-2xl text-forest-700">My Claims</h1>
      </div>

      {loading ? (
        <div className="px-4 space-y-3 pt-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-card" />)}
        </div>
      ) : claims.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-8 pt-20 text-center">
          <div className="w-20 h-20 bg-forest-50 rounded-full flex items-center justify-center mb-4">
            <Bookmark size={36} className="text-forest-200" />
          </div>
          <h2 className="font-display font-bold text-lg text-gray-800 mb-1">No claims yet</h2>
          <p className="text-gray-500 font-body text-sm">Find food on the Feed or Map tab and claim your first portion!</p>
        </div>
      ) : (
        <div className="px-4 pt-2 space-y-3">
          {claims.map((c) => <ClaimCard key={c.id} claim={c} />)}
        </div>
      )}
    </div>
  )
}
