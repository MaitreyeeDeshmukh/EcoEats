import { useState } from 'react'
import { CheckSquare, Square, ShieldCheck } from '@phosphor-icons/react'
import Button from '../ui/Button'
import { FOOD_SAFETY_CHECKLIST } from '../../utils/foodSafety'

export default function FoodSafetyChecklist({ onAccept }) {
  const [checked, setChecked] = useState(new Set())

  function toggle(i) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const allChecked = checked.size === FOOD_SAFETY_CHECKLIST.length

  return (
    <div className="px-4 py-2 space-y-4">
      <div className="flex items-center gap-3 p-4 bg-forest-50 rounded-card border border-forest-200">
        <ShieldCheck size={28} weight="fill" className="text-forest-700 flex-shrink-0" />
        <div>
          <p className="font-display font-bold text-sm text-forest-700">Food Safety Acknowledgment</p>
          <p className="text-xs text-forest-600 font-body mt-0.5 leading-relaxed">
            EcoEats operates under the Bill Emerson Good Samaritan Food Donation Act. Please confirm each item before posting.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {FOOD_SAFETY_CHECKLIST.map((item, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className="w-full flex items-start gap-3 p-3 rounded-card bg-white border border-gray-100 text-left transition-all active:scale-[0.98]"
          >
            <div className="flex-shrink-0 mt-0.5">
              {checked.has(i)
                ? <CheckSquare size={22} weight="fill" className="text-forest-700" />
                : <Square size={22} className="text-gray-300" />
              }
            </div>
            <p className="text-sm text-gray-700 font-body leading-relaxed">{item}</p>
          </button>
        ))}
      </div>

      <Button
        fullWidth
        disabled={!allChecked}
        onClick={onAccept}
        className="mt-2"
      >
        I Confirm — Publish Listing
      </Button>
    </div>
  )
}
