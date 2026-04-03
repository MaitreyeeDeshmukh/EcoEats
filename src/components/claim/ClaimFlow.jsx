import { useState } from 'react'
import { Star, CheckCircle, MapPin, Clock } from '@phosphor-icons/react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import ReservationTimer from './ReservationTimer'
import { createClaim, confirmPickup, submitRating } from '../../services/claims'
import { transactionalClaim } from '../../services/listings'
import { incrementHostImpactStats } from '../../services/auth'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { POINTS_PER_MEAL } from '../../utils/impact'

const PHASES = {
  CONFIRM: 'confirm',
  RESERVED: 'reserved',
  PICKED_UP: 'picked_up',
  RATE: 'rate',
}

export default function ClaimFlow({ listing, onClose }) {
  const [phase, setPhase] = useState(PHASES.CONFIRM)
  const [quantity, setQuantity] = useState(1)
  const [claimId, setClaimId] = useState(null)
  const [reservationExpiry, setReservationExpiry] = useState(null)
  const [rating, setRating] = useState(0)
  const [loading, setLoading] = useState(false)
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const isOnline = useOnlineStatus()

  async function handleClaim() {
    if (!isOnline) {
      toast("You're offline — can't claim right now", 'warning')
      return
    }
    setLoading(true)
    try {
      await transactionalClaim(listing.id, user.id)

      const expiry = new Date(Date.now() + 20 * 60 * 1000)
      const id = await createClaim(
        listing.id,
        user.id,
        profile?.name || user?.user_metadata?.full_name || 'Student',
        quantity
      )

      setClaimId(id)
      setReservationExpiry(expiry)
      setPhase(PHASES.RESERVED)
      toast('🎉 Reserved! You have 20 minutes to pick it up.', 'success')
    } catch (err) {
      const msg = err.message.includes('No portions remaining') || err.message.includes('no longer active')
        ? 'Just claimed by someone else — try another listing!'
        : err.message.includes('Already claimed')
        ? 'You already claimed this listing.'
        : 'Claim failed. Please try again.'
      toast(msg, 'error')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  async function handlePickup() {
    if (!claimId) return
    setLoading(true)
    try {
      await confirmPickup(claimId)
      await incrementHostImpactStats(listing.hostId, quantity)
      setPhase(PHASES.PICKED_UP)
    } catch {
      toast('Could not confirm pickup. Try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleRate() {
    if (claimId && rating > 0) {
      try {
        await submitRating(claimId, rating)
      } catch {}
    }
    toast('Thanks for helping reduce food waste! 🌱', 'success')
    onClose()
  }

  function handleExpired() {
    toast('Your reservation expired. The portion was released.', 'warning')
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={
        phase === PHASES.CONFIRM ? 'Claim Food' :
        phase === PHASES.RESERVED ? 'Reservation Active' :
        phase === PHASES.PICKED_UP ? 'Picked Up!' :
        'Rate Your Experience'
      }
    >
      {phase === PHASES.CONFIRM && (
        <div className="space-y-5">
          <div className="bg-forest-50 rounded-card p-4 space-y-2">
            <h3 className="font-display font-bold text-forest-700">{listing.title}</h3>
            <div className="flex items-center gap-1 text-sm text-gray-600 font-body">
              <MapPin size={14} className="text-forest-600" />
              {listing.location?.buildingName}
              {listing.location?.roomNumber && ` · Rm ${listing.location.roomNumber}`}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600 font-body">
              <Clock size={14} className="text-forest-600" />
              Pick up within 20 min of claiming
            </div>
          </div>

          {listing.quantityRemaining > 1 && (
            <div>
              <label className="text-sm font-medium text-gray-700 font-body block mb-2">
                How many portions?
              </label>
              <div className="flex items-center gap-4">
                {[...Array(Math.min(listing.quantityRemaining, 3))].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setQuantity(i + 1)}
                    className={[
                      'w-12 h-12 rounded-full border-2 font-display font-bold text-lg transition-all',
                      quantity === i + 1
                        ? 'border-forest-700 bg-forest-700 text-white'
                        : 'border-gray-200 text-gray-600',
                    ].join(' ')}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button fullWidth loading={loading} onClick={handleClaim}>
            Claim {quantity > 1 ? `${quantity} Portions` : 'Portion'}
          </Button>
          <p className="text-xs text-gray-400 font-body text-center">
            Your spot is held for 20 minutes — please pick up promptly.
          </p>
        </div>
      )}

      {phase === PHASES.RESERVED && (
        <div className="space-y-5 text-center">
          <ReservationTimer expiresAt={reservationExpiry} onExpired={handleExpired} />

          <div className="bg-forest-50 rounded-card p-4 text-left space-y-2">
            <p className="font-display font-bold text-forest-700 text-sm">Where to go</p>
            <p className="text-sm text-gray-700 font-body">
              <strong>{listing.location?.buildingName}</strong>
              {listing.location?.roomNumber && ` · Room ${listing.location.roomNumber}`}
            </p>
            <p className="text-xs text-gray-500 font-body">
              Tell the host your name: <strong>{profile?.name || user?.user_metadata?.full_name}</strong>
            </p>
          </div>

          <Button fullWidth loading={loading} onClick={handlePickup}>
            ✓ I Picked It Up!
          </Button>
          <p className="text-xs text-gray-400 font-body">
            Only tap when you actually have the food.
          </p>
        </div>
      )}

      {phase === PHASES.PICKED_UP && (
        <div className="space-y-4 text-center">
          <div className="w-20 h-20 bg-forest-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={44} weight="fill" className="text-forest-700" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl text-gray-900">You got it! 🎉</h3>
            <p className="text-gray-500 font-body text-sm mt-1">
              You helped rescue food that would have been wasted.
            </p>
          </div>
          <div className="bg-lime/10 rounded-card p-3 text-sm font-body text-forest-700 font-medium">
            +{quantity * POINTS_PER_MEAL} impact points earned
          </div>
          <Button fullWidth variant="secondary" onClick={() => setPhase(PHASES.RATE)}>
            Rate This Host
          </Button>
          <button onClick={onClose} className="text-sm text-gray-400 font-body w-full py-2">
            Skip
          </button>
        </div>
      )}

      {phase === PHASES.RATE && (
        <div className="space-y-5 text-center">
          <div>
            <h3 className="font-display font-bold text-lg text-gray-900 mb-1">
              How was it?
            </h3>
            <p className="text-gray-500 font-body text-sm">
              Rate your experience with {listing.hostName}
            </p>
          </div>

          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setRating(s)}
                className={`text-3xl transition-transform ${s <= rating ? 'scale-110' : 'scale-100 opacity-30'}`}
              >
                <Star size={36} weight={s <= rating ? 'fill' : 'regular'} className={s <= rating ? 'text-amber-400' : 'text-gray-300'} />
              </button>
            ))}
          </div>

          <Button fullWidth onClick={handleRate} disabled={rating === 0}>
            Submit Rating
          </Button>
          <button onClick={onClose} className="text-sm text-gray-400 font-body w-full py-2">
            Skip
          </button>
        </div>
      )}
    </Modal>
  )
}
