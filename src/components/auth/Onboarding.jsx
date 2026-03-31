import { useState } from 'react'
import { Check, HandHeart, Student } from '@phosphor-icons/react'
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
  const [step, setStep] = useState(1)
  const [role, setRole] = useState(null)
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
        role,
        dietaryPrefs,
      })
      onDone()
    } catch {
      toast('Failed to save preferences. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (step === 1) {
    return (
      <div className="min-h-dvh bg-cream flex flex-col px-6 pt-safe">
        <div className="pt-12 pb-6">
          <div className="inline-block bg-forest-100 text-forest-700 text-xs font-medium font-body px-3 py-1 rounded-full mb-3">
            Step 1 of 2
          </div>
          <h1 className="font-display font-bold text-3xl text-forest-700 leading-tight">
            How are you using EcoEats?
          </h1>
          <p className="text-gray-500 font-body text-sm mt-2">
            You can always switch later in your profile.
          </p>
        </div>

        <div className="flex flex-col gap-4 flex-1">
          <button
            onClick={() => setRole('organizer')}
            className={[
              'w-full p-6 rounded-card border-2 text-left transition-all',
              role === 'organizer'
                ? 'border-forest-700 bg-forest-50 shadow-card'
                : 'border-gray-200 bg-white shadow-card',
            ].join(' ')}
          >
            <div className="w-12 h-12 bg-forest-100 rounded-2xl flex items-center justify-center mb-4">
              <HandHeart size={28} weight="fill" className="text-forest-700" />
            </div>
            <h2 className="font-display font-bold text-xl text-gray-900 mb-1">
              Event Organizer
            </h2>
            <p className="text-gray-500 font-body text-sm leading-relaxed">
              I run campus events and have leftover catered food to share with students.
            </p>
            {role === 'organizer' && (
              <div className="mt-3 inline-flex items-center gap-1.5 text-forest-700 text-sm font-medium font-body">
                <span className="w-4 h-4 rounded-full bg-forest-700 flex items-center justify-center">
                  <Check size={10} weight="bold" className="text-white" />
                </span>
                Selected
              </div>
            )}
          </button>

          <button
            onClick={() => setRole('student')}
            className={[
              'w-full p-6 rounded-card border-2 text-left transition-all',
              role === 'student'
                ? 'border-forest-700 bg-forest-50 shadow-card'
                : 'border-gray-200 bg-white shadow-card',
            ].join(' ')}
          >
            <div className="w-12 h-12 bg-lime/20 rounded-2xl flex items-center justify-center mb-4">
              <Student size={28} weight="fill" className="text-forest-600" />
            </div>
            <h2 className="font-display font-bold text-xl text-gray-900 mb-1">
              Student
            </h2>
            <p className="text-gray-500 font-body text-sm leading-relaxed">
              I'm looking for free food rescued from campus events near me.
            </p>
            {role === 'student' && (
              <div className="mt-3 inline-flex items-center gap-1.5 text-forest-700 text-sm font-medium font-body">
                <span className="w-4 h-4 rounded-full bg-forest-700 flex items-center justify-center">
                  <Check size={10} weight="bold" className="text-white" />
                </span>
                Selected
              </div>
            )}
          </button>
        </div>

        <div className="py-6">
          <Button fullWidth disabled={!role} onClick={() => setStep(2)}>
            Continue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-cream flex flex-col px-6 pt-safe">
      <div className="pt-12 pb-6">
        <div className="inline-block bg-forest-100 text-forest-700 text-xs font-medium font-body px-3 py-1 rounded-full mb-3">
          Step 2 of 2
        </div>
        <h1 className="font-display font-bold text-2xl text-forest-700 leading-tight">
          Any dietary preferences?
        </h1>
        <p className="text-gray-500 font-body text-sm mt-2">
          {role === 'organizer'
            ? "We'll tag your listings automatically — skip anytime."
            : "We'll show you food that matches — skip anytime."}
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

      <div className="mt-auto pb-6 pt-4 flex gap-3">
        <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
          Back
        </Button>
        <Button loading={loading} onClick={handleDone} className="flex-1">
          {dietaryPrefs.length === 0 ? 'Skip & Start' : 'Get Started'}
        </Button>
      </div>
    </div>
  )
}
