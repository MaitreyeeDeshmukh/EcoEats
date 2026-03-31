import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Leaf, Tree, Car, Drop } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'
import { getUserOrdersByMonth } from '../services/orders'
import Navbar from '../components/layout/Navbar'
import PageWrapper from '../components/layout/PageWrapper'
import { formatCarbonGrams } from '../utils/formatters'
import {
  calculateEcoScore,
  carbonToTrees,
  carbonToKmDriving,
  AVERAGE_ORDER_CARBON,
} from '../utils/carbonCalculator'

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.carbon), 1)

  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex items-end" style={{ height: '120px' }}>
            <div
              className="w-full bg-brand-400 rounded-t-md transition-all duration-700"
              style={{
                height: `${(d.carbon / max) * 100}%`,
                minHeight: d.carbon > 0 ? '4px' : '0',
              }}
            />
          </div>
          <p className="text-xs text-neutral-500 truncate w-full text-center">{d.month}</p>
        </div>
      ))}
    </div>
  )
}

function ShareCard({ profile, ecoScore, trees, km }) {
  const cardRef = useRef(null)
  const [copying, setCopying] = useState(false)

  async function handleDownload() {
    if (!cardRef.current) return
    setCopying(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, { scale: 2 })
      const link = document.createElement('a')
      link.download = 'ecoeats-impact.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch {
      // fallback: prompt user to screenshot
    } finally {
      setCopying(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={cardRef}
        className="bg-gradient-to-br from-brand-700 to-brand-500 rounded-2xl p-8 text-white"
        style={{ width: '360px', minHeight: '240px' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Leaf size={20} weight="fill" />
          <span className="font-bold text-lg">EcoEats</span>
        </div>
        <p className="font-bold text-xl mb-1">{profile?.name || 'EcoEater'}</p>
        <p className="text-white/70 text-sm mb-5">Eco Score: {ecoScore}/100</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="font-bold text-lg">{profile?.totalOrdersCount || 0}</p>
            <p className="text-white/70 text-xs">orders</p>
          </div>
          <div>
            <p className="font-bold text-lg">{trees}</p>
            <p className="text-white/70 text-xs">trees equiv.</p>
          </div>
          <div>
            <p className="font-bold text-lg">{km}km</p>
            <p className="text-white/70 text-xs">driving saved</p>
          </div>
        </div>
      </div>
      <button
        onClick={handleDownload}
        disabled={copying}
        className="w-full max-w-sm text-sm font-medium bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
      >
        {copying ? 'Generating…' : 'Download impact card'}
      </button>
    </div>
  )
}

export default function ImpactPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [monthlyData, setMonthlyData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login', { state: { from: '/impact' } }); return }
    getUserOrdersByMonth(user.id)
      .then(raw => {
        const now = new Date()
        const months = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          return {
            month: d.toLocaleDateString('en-IN', { month: 'short' }),
            carbon: Math.round(((raw[key]?.carbon || 0) / 1000) * 10) / 10,
          }
        })
        setMonthlyData(months)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, navigate])

  if (!user || !profile) return null

  const totalCarbonSaved = profile.totalCarbonSaved || 0
  const totalOrders = profile.totalOrdersCount || 0
  const ecoScore = calculateEcoScore(totalCarbonSaved, totalOrders)
  const trees = carbonToTrees(totalCarbonSaved)
  const km = carbonToKmDriving(totalCarbonSaved)
  const bottles = Math.round(totalOrders * 0.3)
  const avgPersonCarbon = AVERAGE_ORDER_CARBON * totalOrders
  const yourCarbon = Math.max(0, avgPersonCarbon - totalCarbonSaved)
  const pctBetter = avgPersonCarbon > 0
    ? Math.round((totalCarbonSaved / avgPersonCarbon) * 100)
    : 0

  const STATS = [
    { icon: Leaf, label: 'CO₂ saved', value: formatCarbonGrams(totalCarbonSaved), color: 'text-brand-600' },
    { icon: Tree, label: 'Trees equivalent', value: `${trees} trees`, color: 'text-green-600' },
    { icon: Car, label: 'Driving avoided', value: `${km} km`, color: 'text-blue-600' },
    { icon: Drop, label: 'Plastic bottles', value: `${bottles} bottles`, color: 'text-purple-600' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <PageWrapper className="max-w-3xl">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">My impact</h1>
        <p className="text-neutral-500 text-sm mb-8">Here's what your food choices have achieved.</p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {STATS.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-neutral-100 p-4">
              <Icon size={22} className={`${color} mb-2`} />
              <p className="text-xl font-bold text-neutral-900">{value}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Monthly bar chart */}
        <div className="bg-white rounded-xl border border-neutral-100 p-5 mb-6">
          <h2 className="font-semibold text-neutral-900 mb-4">
            Carbon saved — last 6 months (kg CO₂)
          </h2>
          {loading ? (
            <div className="h-40 bg-neutral-100 rounded-xl animate-pulse" />
          ) : (
            <BarChart data={monthlyData} />
          )}
        </div>

        {/* You vs average */}
        <div className="bg-white rounded-xl border border-neutral-100 p-5 mb-6">
          <h2 className="font-semibold text-neutral-900 mb-4">You vs. average delivery user</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-600 font-medium">Average user</span>
                <span className="text-neutral-500">{formatCarbonGrams(avgPersonCarbon)}</span>
              </div>
              <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-neutral-400 rounded-full w-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-brand-700 font-medium">You</span>
                <span className="text-brand-600">{formatCarbonGrams(yourCarbon)}</span>
              </div>
              <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(5, 100 - pctBetter)}%` }}
                />
              </div>
            </div>
          </div>
          {pctBetter > 0 && (
            <p className="text-sm text-brand-600 font-medium mt-3">
              You emit {pctBetter}% less CO₂ than the average delivery user. 🌿
            </p>
          )}
          {totalOrders === 0 && (
            <p className="text-sm text-neutral-500 mt-3">
              Place your first order to see how you compare.{' '}
              <Link to="/explore" className="text-brand-600 font-medium">Explore →</Link>
            </p>
          )}
        </div>

        {/* Shareable card */}
        <div className="bg-white rounded-xl border border-neutral-100 p-5">
          <h2 className="font-semibold text-neutral-900 mb-5">Share your impact</h2>
          <ShareCard profile={profile} ecoScore={ecoScore} trees={trees} km={km} />
        </div>
      </PageWrapper>
    </div>
  )
}
