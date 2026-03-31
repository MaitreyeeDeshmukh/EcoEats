import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Leaf, Package, ChartBar } from '@phosphor-icons/react'
import { useFeaturedRestaurants } from '../hooks/useRestaurants'
import { getPlatformStats } from '../services/orders'
import RestaurantCard from '../components/features/RestaurantCard'
import { RestaurantCardSkeleton } from '../components/ui/Skeleton'
import Footer from '../components/layout/Footer'
import { carbonToTrees, carbonToKmDriving } from '../utils/carbonCalculator'
import { searchLocations } from '../utils/geocode'

function useCountUp(target, duration = 1500, shouldStart = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!shouldStart || target === 0) return
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration, shouldStart])
  return count
}

function StatCard({ label, value, suffix = '', shouldStart }) {
  const count = useCountUp(value, 1800, shouldStart)
  return (
    <div className="text-center">
      <p className="text-3xl md:text-4xl font-bold text-brand-600">
        {count.toLocaleString('en-IN')}{suffix}
      </p>
      <p className="text-sm text-neutral-500 mt-1">{label}</p>
    </div>
  )
}

function LocationSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)

  function handleChange(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    if (val.length < 3) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await searchLocations(val)
        setResults(res.slice(0, 5))
      } catch {}
      setLoading(false)
    }, 500)
  }

  return (
    <div className="relative max-w-lg mx-auto">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={handleChange}
          placeholder="Enter your delivery location..."
          className="flex-1 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white shadow-sm"
        />
        <Link
          to="/explore"
          className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-5 py-3 rounded-xl transition-colors text-sm flex items-center gap-2"
        >
          Find food
          <ArrowRight size={16} />
        </Link>
      </div>
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg z-10 overflow-hidden">
          {results.map((r, i) => (
            <button
              key={i}
              className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 border-b border-neutral-100 last:border-0 truncate"
              onClick={() => { setQuery(r.label); setResults([]) }}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Find eco-certified restaurants near you',
    desc: 'Browse restaurants that use sustainable packaging, source locally, and minimise food waste.',
    icon: Leaf,
  },
  {
    step: '02',
    title: 'See the carbon footprint before you order',
    desc: 'Every dish shows its CO₂ impact. Choose plant-based and save up to 2.5kg CO₂ per meal.',
    icon: ChartBar,
  },
  {
    step: '03',
    title: 'Order arrives in eco-friendly packaging',
    desc: 'No single-use plastics. Your food comes in compostable or reusable containers.',
    icon: Package,
  },
]

export default function LandingPage() {
  const { restaurants, loading } = useFeaturedRestaurants()
  const [stats, setStats] = useState({ totalOrders: 0, totalCarbonSaved: 0 })
  const [statsVisible, setStatsVisible] = useState(false)
  const statsRef = useRef(null)

  useEffect(() => {
    getPlatformStats().then(setStats).catch(() => {})
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) setStatsVisible(true) },
      { threshold: 0.3 }
    )
    if (statsRef.current) observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white">
        <div className="max-w-6xl mx-auto px-4 pt-16 pb-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-xs font-medium px-3 py-1.5 rounded-full mb-6 backdrop-blur-sm">
              <Leaf size={13} weight="fill" />
              Sustainable food delivery in Pune
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Eat Well.<br />Tread Lightly.
            </h1>
            <p className="text-lg text-white/80 mb-8 leading-relaxed">
              Order from restaurants that actually give a damn about the planet.
              See the carbon footprint of every dish. Make every bite count.
            </p>
            <LocationSearch />
            <div className="flex items-center justify-center gap-6 mt-6">
              <Link
                to="/explore"
                className="text-white/80 hover:text-white text-sm underline underline-offset-2 transition-colors"
              >
                Browse all restaurants
              </Link>
              <Link
                to="/signup"
                className="bg-white text-brand-700 hover:bg-brand-50 font-medium text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-3">How EcoEats works</h2>
            <p className="text-neutral-500 max-w-md mx-auto">Three steps between you and a meal that doesn't cost the earth.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="flex flex-col items-start">
                <div className="flex items-center justify-center w-12 h-12 bg-brand-50 rounded-2xl mb-4">
                  <Icon size={24} className="text-brand-600" />
                </div>
                <span className="text-xs font-semibold text-brand-500 tracking-wide mb-2">Step {step}</span>
                <h3 className="font-semibold text-neutral-900 mb-2 leading-snug">{title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-1">Featured restaurants</h2>
              <p className="text-sm text-neutral-500">Eco-certified, locally loved</p>
            </div>
            <Link
              to="/explore"
              className="text-sm text-brand-600 font-medium hover:text-brand-700 flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-4 md:grid md:grid-cols-3 min-w-max md:min-w-0">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="w-72 md:w-auto flex-shrink-0 md:flex-shrink">
                      <RestaurantCardSkeleton />
                    </div>
                  ))
                : restaurants.slice(0, 6).map(r => (
                    <div key={r.id} className="w-72 md:w-auto flex-shrink-0 md:flex-shrink">
                      <RestaurantCard restaurant={r} />
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </section>

      {/* Impact counter */}
      <section ref={statsRef} className="py-16 bg-brand-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Our collective impact</h2>
            <p className="text-white/60">Every order on EcoEats contributes to this.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard
              label="Orders placed"
              value={stats.totalOrders}
              shouldStart={statsVisible}
            />
            <StatCard
              label="kg CO₂ saved"
              value={Math.round(stats.totalCarbonSaved / 1000)}
              shouldStart={statsVisible}
            />
            <StatCard
              label="Trees equivalent"
              value={Number(carbonToTrees(stats.totalCarbonSaved))}
              shouldStart={statsVisible}
            />
            <StatCard
              label="km driving avoided"
              value={Number(carbonToKmDriving(stats.totalCarbonSaved))}
              shouldStart={statsVisible}
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
