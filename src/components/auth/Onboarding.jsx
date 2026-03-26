import { useState } from 'react'
import { Check } from '@phosphor-icons/react'
import Button from '../ui/Button'
import { createUserProfile } from '../../services/auth'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

const DIETARY_OPTIONS = [
  { id: 'vegan', label: '🌱 Vegan' },
  { id: 'vegetarian', label: '🥗 Vegetarian' },
  { id: 'halal', label: '☪️ Halal' },
  { id: 'gluten-free', label: '🌾 Gluten-Free' },
  { id: 'nut-free', label: '🥜 Nut-Free' },
  { id: 'dairy-free', label: '🥛 Dairy-Free' },
]

export default function Onboarding({ onDone }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [dietaryPrefs, setDietaryPrefs] = useState([])
  const [loading, setLoading] = useState(false)

  function toggleDietary(id) {
    setDietaryPrefs((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    )
  }

  async function handleDone() {
    setLoading(true)
    try {
      await createUserProfile(user.uid, {
        name: user.displayName || 'EcoEats User',
        email: user.email,
        avatar: user.photoURL || null,
        dietaryPrefs,
      })
      onDone()
    } catch {
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
          Any dietary preferences?
        </h1>
        <p className="text-gray-500 font-body text-sm mt-2">
          We'll show you food that matches — skip anytime.
        </p>
      </div>

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

      <div className="mt-auto pb-6 pt-4">
        <Button fullWidth loading={loading} onClick={handleDone}>
          {dietaryPrefs.length === 0 ? 'Skip & Get Started' : 'Get Started'}
        </Button>
      </div>
    </div>
  )
}
