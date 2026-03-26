import { useState } from 'react'
import {
  SignOut, PencilSimple, Check, X, Star, Plus,
} from '@phosphor-icons/react'
import Badge from '../ui/Badge'
import { Skeleton } from '../ui/Skeleton'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useClaims } from '../../hooks/useClaims'
import { logOut } from '../../services/auth'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useNavigate } from 'react-router-dom'
import { useState as useLocalState, useEffect } from 'react'

const DIETARY_OPTIONS = ['vegan', 'vegetarian', 'halal', 'gluten-free', 'nut-free', 'dairy-free']

function Avatar({ profile, user }) {
  const initials = (profile?.name || user?.displayName || 'U')
    .split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="w-16 h-16 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
      {profile?.avatar ? (
        <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
      ) : (
        <span className="font-display font-bold text-xl text-forest-700">{initials}</span>
      )}
    </div>
  )
}

function DietaryEditor({ prefs, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(prefs)
  const { toast } = useToast()

  function toggle(tag) {
    setDraft((prev) => prev.includes(tag) ? prev.filter((d) => d !== tag) : [...prev, tag])
  }

  async function save() {
    await onSave(draft)
    toast('Dietary preferences updated', 'success')
    setEditing(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-700 font-body">Dietary Preferences</p>
        {!editing ? (
          <button onClick={() => { setDraft(prefs); setEditing(true) }} className="p-1 text-forest-700">
            <PencilSimple size={16} />
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={save} className="p-1 text-forest-700"><Check size={16} /></button>
            <button onClick={() => setEditing(false)} className="p-1 text-gray-400"><X size={16} /></button>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {editing ? (
          DIETARY_OPTIONS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggle(tag)}
              className={[
                'px-3 py-1.5 rounded-full border-2 text-xs font-medium font-body transition-all',
                draft.includes(tag)
                  ? 'border-forest-700 bg-forest-700 text-white'
                  : 'border-gray-200 bg-white text-gray-600',
              ].join(' ')}
            >
              {tag}
            </button>
          ))
        ) : prefs.length > 0 ? (
          prefs.map((tag) => <Badge key={tag} dietary={tag}>{tag}</Badge>)
        ) : (
          <p className="text-xs text-gray-400 font-body">None set — tap edit to add</p>
        )}
      </div>
    </div>
  )
}

function HistoryItem({ item, isHost }) {
  if (isHost) {
    const statusColors = {
      active: 'text-forest-700 bg-forest-100',
      claimed: 'text-amber-700 bg-amber-100',
      expired: 'text-gray-500 bg-gray-100',
      cancelled: 'text-red-500 bg-red-100',
    }
    return (
      <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 font-body truncate">{item.title}</p>
          <p className="text-xs text-gray-400 font-body">{item.location?.buildingName}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium font-body ${statusColors[item.status] || statusColors.expired}`}>
          {item.status}
        </span>
      </div>
    )
  }

  const statusColors = {
    pending: 'text-amber-700 bg-amber-100',
    picked_up: 'text-forest-700 bg-forest-100',
    no_show: 'text-red-500 bg-red-100',
  }

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 font-body truncate">{item.listingId}</p>
        <p className="text-xs text-gray-400 font-body flex items-center gap-1">
          {item.rating > 0 && (
            <>
              <Star size={10} weight="fill" className="text-amber-400" />
              {item.rating} stars given
            </>
          )}
        </p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium font-body ${statusColors[item.status]}`}>
        {item.status.replace('_', ' ')}
      </span>
    </div>
  )
}

export default function ProfileView() {
  const { user, profile, loading } = useAuth()
  const { toast } = useToast()
  const { claims } = useClaims()
  const [signingOut, setSigningOut] = useState(false)
  const navigate = useNavigate()

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await logOut()
    } catch {
      toast('Sign out failed', 'error')
      setSigningOut(false)
    }
  }

  async function saveDietaryPrefs(prefs) {
    await setDoc(doc(db, 'users', user.uid), { dietaryPrefs: prefs }, { merge: true })
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4 pt-safe">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-cream pt-safe pb-safe overflow-y-auto scroll-hide">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="font-display font-bold text-2xl text-forest-700">Profile</h1>
      </div>

      {/* User card */}
      <div className="mx-4 bg-white rounded-card shadow-card p-4 mb-4 flex items-center gap-4">
        <Avatar profile={profile} user={user} />
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-gray-900 text-lg truncate">
            {profile?.name || user?.displayName || 'EcoEats User'}
          </p>
          <p className="text-sm text-gray-500 font-body truncate">{user?.email}</p>
        </div>
      </div>

      {/* Post Food CTA */}
      <button
        onClick={() => navigate('/post')}
        className="mx-4 mb-4 h-[52px] flex items-center justify-center gap-2 bg-forest-700 text-white rounded-card font-body font-semibold text-base shadow-card active:scale-[0.98] transition-transform"
      >
        <Plus size={20} weight="bold" />
        Post Food to Share
      </button>

      {/* Impact stats */}
      {profile?.impactStats && (
        <div className="mx-4 bg-forest-700 rounded-card p-4 mb-4">
          <p className="font-display font-bold text-white text-sm mb-3">Your Impact</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Meals', value: profile.impactStats.mealsRescued || 0 },
              { label: 'CO₂ (kg)', value: ((profile.impactStats.mealsRescued || 0) * 0.5).toFixed(1) },
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

      {/* Dietary preferences */}
      <div className="mx-4 bg-white rounded-card shadow-card p-4 mb-4">
        <DietaryEditor
          prefs={profile?.dietaryPrefs || []}
          onSave={saveDietaryPrefs}
        />
      </div>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="mx-4 mb-4 h-[52px] flex items-center justify-center gap-2 bg-white border-2 border-red-200 text-red-500 rounded-card font-body font-semibold text-base active:scale-[0.98] transition-transform disabled:opacity-60"
      >
        <SignOut size={20} />
        {signingOut ? 'Signing out…' : 'Sign Out'}
      </button>

      {/* Claim History */}
      <div className="mx-4 bg-white rounded-card shadow-card p-4 mb-4">
        <p className="font-display font-bold text-gray-900 mb-3">Claim History</p>
        {claims.length === 0 ? (
          <p className="text-sm text-gray-400 font-body text-center py-3">No claims yet</p>
        ) : (
          claims.slice(0, 10).map((c) => <HistoryItem key={c.id} item={c} isHost={false} />)
        )}
      </div>
    </div>
  )
}
