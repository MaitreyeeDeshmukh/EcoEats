import { useState } from 'react'
import { Check } from '@phosphor-icons/react'
import Button from '../ui/Button'
import { createUserProfile } from '../../services/auth'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { ASU_BUILDINGS } from '../../utils/asuBuildings'

const DIETARY_OPTIONS = [
  { id: 'vegan', label: '🌱 Vegan' },
  { id: 'vegetarian', label: '🥗 Vegetarian' },
  { id: 'halal', label: '☪️ Halal' },
  { id: 'gluten-free', label: '🌾 Gluten-Free' },
  { id: 'nut-free', label: '🥜 Nut-Free' },
  { id: 'dairy-free', label: '🥛 Dairy-Free' },
]

export default function Onboarding({ role, onDone }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [dietaryPrefs, setDietaryPrefs] = useState([])
  const [building, setBuilding] = useState('')
  const [department, setDepartment] = useState('')
  const [loading, setLoading] = useState(false)

  function toggleDietary(id) {
    setDietaryPrefs((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    )
  }

  async function handleDone() {
    setLoading(true)
    try {
      const profileData = {
        role,
        name: user.displayName || 'EcoEats User',
        email: user.email,
        avatar: user.photoURL || null,
        dietaryPrefs: role === 'student' ? dietaryPrefs : [],
        hostBuilding: role === 'host' ? building : null,
        hostDepartment: role === 'host' ? department : null,
      }
      await createUserProfile(user.uid, profileData)
      onDone()
    } catch (err) {
      toast('Failed to save preferences. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-cream flex flex-col px-6 pt-safe">
      <div className="pt-12 pb-6">
        <div className="inline-block bg-forest-100 text-forest-700 text-xs font-medium font-body px-3 py-1 rounded-full mb-3">
          Almost there!
        </div>
        <h1 className="font-display font-bold text-2xl text-forest-700 leading-tight">
          {role === 'student' ? 'Any dietary preferences?' : 'Tell us about your space'}
        </h1>
        <p className="text-gray-500 font-body text-sm mt-2">
          {role === 'student'
            ? "We'll show you food that matches — skip anytime."
            : 'This helps students find your listings quickly.'}
        </p>
      </div>

      {role === 'student' ? (
        <div className="flex flex-wrap gap-2 mb-6">
          {DIETARY_OPTIONS.map((opt) => {
            const active = dietaryPrefs.includes(opt.id)
            return (
              <button
                key={opt.id}
                onClick={() => toggleDietary(opt.id)}
                className={[
                  'flex items-center gap-1.5 px-4 py-2.5 rounded-full border-2 text-sm font-medium font-body transition-all',
                  active
                    ? 'border-forest-700 bg-forest-700 text-white'
                    : 'border-gray-200 bg-white text-gray-700',
                ].join(' ')}
              >
                {active && <Check size={14} weight="bold" />}
                {opt.label}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-body">
              Home Building / Campus
            </label>
            <select
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              className="w-full h-[52px] px-4 rounded-card border border-gray-200 bg-white font-body text-base focus:outline-none focus:ring-2 focus:ring-forest-400"
            >
              <option value="">Select a building</option>
              {ASU_BUILDINGS.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-body">
              Department / Organization (optional)
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Computer Science, SGA"
              className="w-full h-[52px] px-4 rounded-card border border-gray-200 bg-white font-body text-base focus:outline-none focus:ring-2 focus:ring-forest-400"
            />
          </div>
        </div>
      )}

      <div className="mt-auto pb-6 pt-4">
        <Button fullWidth loading={loading} onClick={handleDone}>
          {role === 'student' && dietaryPrefs.length === 0 ? 'Skip & Get Started' : 'Get Started'}
        </Button>
      </div>
    </div>
  )
}
