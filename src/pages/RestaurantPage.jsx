import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Heart, Star, Clock, Leaf, Warning } from '@phosphor-icons/react'
import { getRestaurantById } from '../services/restaurants'
import { getMenuItemsByRestaurant } from '../services/menuItems'
import { getReviewsByRestaurant } from '../services/reviews'
import { useAuth } from '../context/AuthContext'
import { updateFavourites } from '../services/users'
import { useToast } from '../context/ToastContext'
import { useCart } from '../context/CartContext'
import MenuItemCard from '../components/features/MenuItemCard'
import EcoBadge from '../components/features/EcoBadge'
import ReviewCard from '../components/features/ReviewCard'
import { MenuItemSkeleton } from '../components/ui/Skeleton'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Navbar from '../components/layout/Navbar'
import { formatCurrency } from '../utils/formatters'

function RatingBreakdown({ reviews }) {
  const counts = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => Math.round(r.rating) === stars).length,
  }))
  const max = Math.max(...counts.map(c => c.count), 1)

  return (
    <div className="space-y-1.5">
      {counts.map(({ stars, count }) => (
        <div key={stars} className="flex items-center gap-2 text-xs">
          <span className="text-neutral-500 w-4 text-right">{stars}</span>
          <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="text-neutral-400 w-4">{count}</span>
        </div>
      ))}
    </div>
  )
}

export default function RestaurantPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const { addToast } = useToast()
  const { _pendingConflict, resolveConflict, dismissConflict } = useCart()

  const [restaurant, setRestaurant] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isFav, setIsFav] = useState(false)
  const [activeTab, setActiveTab] = useState(null)
  const sectionRefs = useRef({})
  const tabBarRef = useRef(null)

  useEffect(() => {
    async function load() {
      try {
        const [r, items, revs] = await Promise.all([
          getRestaurantById(id),
          getMenuItemsByRestaurant(id),
          getReviewsByRestaurant(id),
        ])
        if (!r) { setError('Restaurant not found.'); return }
        setRestaurant(r)
        setMenuItems(items)
        setReviews(revs)
        if (r.menuCategories?.length > 0) setActiveTab(r.menuCategories[0])
      } catch {
        setError('Failed to load restaurant.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    if (profile && restaurant) {
      setIsFav((profile.favouriteRestaurants || []).includes(id))
    }
  }, [profile, restaurant, id])

  async function toggleFav() {
    if (!user) { navigate('/login'); return }
    const next = !isFav
    setIsFav(next)
    try {
      await updateFavourites(user.uid, id, next)
      refreshProfile()
      addToast(next ? 'Added to favourites' : 'Removed from favourites', 'success')
    } catch {
      setIsFav(!next)
      addToast('Could not update favourites', 'error')
    }
  }

  function scrollToSection(cat) {
    setActiveTab(cat)
    const el = sectionRefs.current[cat]
    if (el) {
      const offset = (tabBarRef.current?.offsetHeight || 0) + 56
      const top = el.getBoundingClientRect().top + window.scrollY - offset - 8
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  const categories = restaurant?.menuCategories || [...new Set(menuItems.map(i => i.category))]

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navbar />
        <div className="h-64 bg-neutral-200 animate-pulse" />
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <MenuItemSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Warning size={40} className="text-neutral-400" />
          <p className="text-neutral-600">{error}</p>
          <Link to="/explore" className="text-brand-600 font-medium text-sm">← Back to explore</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      {/* Hero */}
      <div className="relative h-64 md:h-80 bg-neutral-200">
        <img
          src={restaurant.imageURL || 'https://source.unsplash.com/featured/?restaurant,indian-food'}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Fav button */}
        <button
          onClick={toggleFav}
          className="absolute top-4 right-4 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
        >
          <Heart size={18} weight={isFav ? 'fill' : 'regular'} className={isFav ? 'text-red-500' : 'text-neutral-700'} />
        </button>

        {/* Info overlay */}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h1 className="text-2xl font-bold mb-1">{restaurant.name}</h1>
          <div className="flex items-center gap-3 text-sm text-white/80">
            <span>{restaurant.cuisineType}</span>
            {restaurant.rating && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Star size={13} weight="fill" className="text-yellow-400" />
                  {restaurant.rating.toFixed(1)} ({restaurant.reviewCount || 0})
                </span>
              </>
            )}
            <span>·</span>
            <span className={restaurant.isOpen ? 'text-brand-300' : 'text-red-400'}>
              {restaurant.isOpen ? 'Open' : 'Closed'}
            </span>
          </div>
        </div>
      </div>

      {/* Sticky tab bar */}
      {categories.length > 0 && (
        <div ref={tabBarRef} className="sticky top-14 z-20 bg-white border-b border-neutral-100 shadow-sm">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex gap-0 overflow-x-auto scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => scrollToSection(cat)}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === cat
                      ? 'border-brand-500 text-brand-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Delivery info strip */}
        <div className="flex items-center gap-4 text-sm text-neutral-600 mb-6 pb-6 border-b border-neutral-100">
          <span className="flex items-center gap-1.5">
            <Clock size={15} className="text-neutral-400" />
            {restaurant.deliveryTimeMin}–{restaurant.deliveryTimeMin + 10} min
          </span>
          <span>·</span>
          <span>
            {restaurant.deliveryFee === 0 ? 'Free delivery' : `${formatCurrency(restaurant.deliveryFee)} delivery`}
          </span>
          <span>·</span>
          <span>Min. order {formatCurrency(restaurant.minimumOrder || 0)}</span>
        </div>

        {/* Eco badge */}
        {(restaurant.isEcoCertified || restaurant.ecoRating) && (
          <div className="mb-6">
            <EcoBadge
              ecoRating={restaurant.ecoRating}
              packagingType={restaurant.packagingType}
              isEcoCertified={restaurant.isEcoCertified}
            />
          </div>
        )}

        {/* Menu sections */}
        {categories.map(cat => {
          const items = menuItems.filter(i => i.category === cat)
          if (items.length === 0) return null
          return (
            <div key={cat} ref={el => sectionRefs.current[cat] = el} className="mb-8">
              <h2 className="text-lg font-bold text-neutral-900 mb-2">{cat}</h2>
              <div className="bg-white rounded-xl border border-neutral-100 px-4">
                {items.map(item => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    restaurantId={id}
                    restaurantName={restaurant.name}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="mt-4">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Reviews</h2>
            <div className="bg-white rounded-xl border border-neutral-100 p-4 mb-4">
              <div className="flex items-start gap-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-neutral-900">{avgRating}</p>
                  <div className="flex items-center justify-center gap-0.5 mt-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        size={13}
                        weight={i < Math.round(avgRating) ? 'fill' : 'regular'}
                        className={i < Math.round(avgRating) ? 'text-yellow-400' : 'text-neutral-300'}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">{reviews.length} reviews</p>
                </div>
                <div className="flex-1">
                  <RatingBreakdown reviews={reviews} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-neutral-100 px-4">
              {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
            </div>
          </div>
        )}
      </div>

      {/* Cart conflict modal */}
      <Modal
        open={!!_pendingConflict}
        onClose={dismissConflict}
        title="Start a new cart?"
      >
        <p className="text-sm text-neutral-600 mb-5">
          Your cart has items from <strong>{_pendingConflict?.restaurantName || 'another restaurant'}</strong>.
          Adding this item will clear your current cart.
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={dismissConflict} className="flex-1">
            Keep current cart
          </Button>
          <Button variant="primary" onClick={resolveConflict} className="flex-1">
            Clear and add
          </Button>
        </div>
      </Modal>
    </div>
  )
}
