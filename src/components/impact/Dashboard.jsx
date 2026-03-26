import { useImpact, useLeaderboard } from '../../hooks/useImpact'
import { useAuth } from '../../contexts/AuthContext'
import CounterRoll from './CounterRoll'
import { Skeleton } from '../ui/Skeleton'
import { Leaf, Lightning, Users, Trophy, Star } from '@phosphor-icons/react'
import { WEEKLY_GOAL, weeklyProgress } from '../../utils/impact'

function StatCard({ icon, label, value, sub, color = 'forest' }) {
  const colors = {
    forest: 'bg-forest-50 text-forest-700',
    lime: 'bg-lime/10 text-forest-600',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
  }
  return (
    <div className="bg-white rounded-card shadow-card p-4 flex flex-col gap-2">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="font-display font-bold text-2xl text-gray-900">{value}</p>
        <p className="text-xs font-medium text-gray-500 font-body">{label}</p>
        {sub && <p className="text-xs text-gray-400 font-body mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function ProgressRing({ pct }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const dash = circ * (1 - pct / 100)
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#e8e4de" strokeWidth="10" />
      <circle
        cx="60" cy="60" r={r}
        fill="none"
        stroke="#1B4332"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={dash}
        className="progress-ring"
        style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
      />
    </svg>
  )
}

function LeaderboardRow({ user, rank }) {
  const medals = ['🥇', '🥈', '🥉']
  const initials = (user.name || 'U').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-lg w-8 text-center">{medals[rank - 1] || `${rank}.`}</span>
      <div className="w-9 h-9 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-forest-700 font-display">{initials}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 font-body truncate">{user.name || 'Anonymous'}</p>
        <p className="text-xs text-gray-400 font-body">{user.hostBuilding || ''}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-forest-700 font-display">
          {user.impactStats?.mealsRescued || 0}
        </p>
        <p className="text-xs text-gray-400 font-body">meals</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { mealsToday, mealsAllTime, co2Saved, activeListings, loading } = useImpact()
  const { leaders, loading: leadersLoading } = useLeaderboard()
  const { profile } = useAuth()
  const pct = weeklyProgress(mealsToday)

  return (
    <div className="flex flex-col bg-cream pt-safe pb-safe overflow-y-auto scroll-hide">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="font-display font-bold text-2xl text-forest-700">Impact</h1>
        <p className="text-sm text-gray-500 font-body mt-0.5">EcoEats platform stats</p>
      </div>

      {/* Platform stats grid */}
      <div className="grid grid-cols-2 gap-3 px-4 mb-4">
        <StatCard
          icon={<Leaf size={20} weight="fill" />}
          label="Meals rescued today"
          value={loading ? <Skeleton className="h-6 w-16" /> : <CounterRoll target={mealsToday} />}
          color="forest"
        />
        <StatCard
          icon={<Lightning size={20} weight="fill" />}
          label="All-time meals rescued"
          value={loading ? <Skeleton className="h-6 w-16" /> : <CounterRoll target={mealsAllTime} />}
          color="lime"
        />
        <StatCard
          icon={<span className="text-lg">🌿</span>}
          label="CO₂ saved (kg)"
          value={loading ? <Skeleton className="h-6 w-16" /> : <CounterRoll target={parseFloat(co2Saved)} suffix="kg" />}
          sub="0.5kg per meal"
          color="lime"
        />
        <StatCard
          icon={<Users size={20} weight="fill" />}
          label="Active listings now"
          value={loading ? <Skeleton className="h-6 w-16" /> : <CounterRoll target={activeListings} />}
          color="blue"
        />
      </div>

      {/* Weekly goal ring */}
      <div className="mx-4 bg-white rounded-card shadow-card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-display font-bold text-forest-700">Weekly Goal</p>
            <p className="text-xs text-gray-500 font-body">
              {mealsToday} / {WEEKLY_GOAL} meals this week
            </p>
          </div>
          <div className="relative">
            <ProgressRing pct={pct} />
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="font-display font-bold text-forest-700 text-sm">{Math.round(pct)}%</p>
            </div>
          </div>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-forest-700 rounded-full transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Personal impact card */}
      {profile?.impactStats && (
        <div className="mx-4 bg-forest-700 rounded-card p-4 mb-4">
          <p className="font-display font-bold text-white text-sm mb-3">Your Impact</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Meals', value: profile.impactStats.mealsRescued || 0 },
              { label: 'CO₂ kg', value: ((profile.impactStats.mealsRescued || 0) * 0.5).toFixed(1) },
              { label: 'Points', value: profile.impactStats.pointsEarned || 0 },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="font-display font-bold text-lime text-xl">{value}</p>
                <p className="text-xs text-white/60 font-body">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="mx-4 bg-white rounded-card shadow-card p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={18} weight="fill" className="text-amber-500" />
          <p className="font-display font-bold text-gray-900">Top Hosts This Week</p>
        </div>
        {leadersLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : leaders.length === 0 ? (
          <p className="text-sm text-gray-400 font-body text-center py-4">No data yet — be the first to post!</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {leaders.map((user, i) => (
              <LeaderboardRow key={user.uid} user={user} rank={i + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
