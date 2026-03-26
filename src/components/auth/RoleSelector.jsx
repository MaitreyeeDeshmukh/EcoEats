import { useState } from 'react'
import { HandHeart, Student } from '@phosphor-icons/react'
import Button from '../ui/Button'

export default function RoleSelector({ onSelect }) {
  const [selected, setSelected] = useState(null)

  return (
    <div className="min-h-dvh bg-cream flex flex-col px-6 pt-safe">
      <div className="pt-12 pb-6">
        <h1 className="font-display font-bold text-3xl text-forest-700 leading-tight">
          How are you using EcoEats?
        </h1>
        <p className="text-gray-500 font-body text-sm mt-2">
          Choose your role — you can have both!
        </p>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        {/* Host card */}
        <button
          onClick={() => setSelected('host')}
          className={[
            'w-full p-6 rounded-card border-2 text-left transition-all',
            selected === 'host'
              ? 'border-forest-700 bg-forest-50 shadow-card'
              : 'border-gray-200 bg-white shadow-card',
          ].join(' ')}
        >
          <div className="w-12 h-12 bg-forest-100 rounded-2xl flex items-center justify-center mb-4">
            <HandHeart size={28} weight="fill" className="text-forest-700" />
          </div>
          <h2 className="font-display font-bold text-xl text-gray-900 mb-1">
            I have food to share
          </h2>
          <p className="text-gray-500 font-body text-sm leading-relaxed">
            Post leftover catered food from events so students can claim it before it goes to waste.
          </p>
          {selected === 'host' && (
            <div className="mt-3 inline-flex items-center gap-1 text-forest-700 text-sm font-medium font-body">
              <span className="w-4 h-4 rounded-full bg-forest-700 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </span>
              Selected
            </div>
          )}
        </button>

        {/* Student card */}
        <button
          onClick={() => setSelected('student')}
          className={[
            'w-full p-6 rounded-card border-2 text-left transition-all',
            selected === 'student'
              ? 'border-lime border-2 bg-forest-50 shadow-card'
              : 'border-gray-200 bg-white shadow-card',
          ].join(' ')}
        >
          <div className="w-12 h-12 bg-lime/20 rounded-2xl flex items-center justify-center mb-4">
            <Student size={28} weight="fill" className="text-forest-600" />
          </div>
          <h2 className="font-display font-bold text-xl text-gray-900 mb-1">
            I need food
          </h2>
          <p className="text-gray-500 font-body text-sm leading-relaxed">
            Find free food rescued from campus events near you, right now.
          </p>
          {selected === 'student' && (
            <div className="mt-3 inline-flex items-center gap-1 text-forest-600 text-sm font-medium font-body">
              <span className="w-4 h-4 rounded-full bg-lime flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </span>
              Selected
            </div>
          )}
        </button>
      </div>

      <div className="py-6">
        <Button
          fullWidth
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
