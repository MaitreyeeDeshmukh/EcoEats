import { useState } from 'react'
import { Sliders, X } from '@phosphor-icons/react'
import Badge from '../ui/Badge'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

const DIETARY_OPTIONS = ['vegan', 'vegetarian', 'halal', 'gluten-free', 'nut-free', 'dairy-free']
const RADIUS_OPTIONS = [0.25, 0.5, 1, 2]
const TIME_OPTIONS = [{ label: '30 min', value: 30 }, { label: '1 hr', value: 60 }, { label: '2 hr', value: 120 }, { label: 'Any', value: 180 }]

export default function FilterBar({ filters, onFiltersChange, onClear }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(filters)

  function toggleDietary(tag) {
    setDraft((prev) => ({
      ...prev,
      dietary: prev.dietary.includes(tag)
        ? prev.dietary.filter((d) => d !== tag)
        : [...prev.dietary, tag],
    }))
  }

  function applyFilters() {
    onFiltersChange(draft)
    setOpen(false)
  }

  function openModal() {
    setDraft(filters)
    setOpen(true)
  }

  const activeCount = filters.dietary.length + (filters.radiusMiles < 2 ? 1 : 0)

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto scroll-hide">
        {/* Filter button */}
        <button
          onClick={openModal}
          className={[
            'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-medium font-body transition-colors min-h-touch',
            activeCount > 0
              ? 'bg-forest-700 text-white border-forest-700'
              : 'bg-white text-gray-700 border-gray-200',
          ].join(' ')}
        >
          <Sliders size={14} />
          Filters
          {activeCount > 0 && (
            <span className="bg-white/30 text-white text-xs rounded-full px-1.5">{activeCount}</span>
          )}
        </button>

        {/* Active dietary chips */}
        {filters.dietary.map((tag) => (
          <button
            key={tag}
            onClick={() => onFiltersChange({ dietary: filters.dietary.filter((d) => d !== tag) })}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-full bg-forest-100 text-forest-700 text-sm font-medium font-body border border-forest-200 min-h-touch"
          >
            {tag}
            <X size={12} />
          </button>
        ))}

        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="flex-shrink-0 text-xs text-gray-400 font-body underline min-h-touch flex items-center px-2"
          >
            Clear all
          </button>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Filter Listings">
        <div className="space-y-6">
          {/* Dietary */}
          <div>
            <h3 className="font-display font-bold text-sm text-gray-700 mb-3 uppercase tracking-wide">
              Dietary Preferences
            </h3>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleDietary(tag)}
                  className={[
                    'px-4 py-2 rounded-full border-2 text-sm font-medium font-body transition-all min-h-touch',
                    draft.dietary.includes(tag)
                      ? 'border-forest-700 bg-forest-700 text-white'
                      : 'border-gray-200 bg-white text-gray-700',
                  ].join(' ')}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Radius */}
          <div>
            <h3 className="font-display font-bold text-sm text-gray-700 mb-3 uppercase tracking-wide">
              Distance Radius
            </h3>
            <div className="flex gap-2">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setDraft((prev) => ({ ...prev, radiusMiles: r }))}
                  className={[
                    'flex-1 py-2.5 rounded-card border-2 text-sm font-medium font-body transition-all',
                    draft.radiusMiles === r
                      ? 'border-forest-700 bg-forest-700 text-white'
                      : 'border-gray-200 bg-white text-gray-700',
                  ].join(' ')}
                >
                  {r < 1 ? `${r * 5280 | 0}ft` : `${r}mi`}
                </button>
              ))}
            </div>
          </div>

          {/* Time window */}
          <div>
            <h3 className="font-display font-bold text-sm text-gray-700 mb-3 uppercase tracking-wide">
              Time Remaining
            </h3>
            <div className="flex gap-2">
              {TIME_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setDraft((prev) => ({ ...prev, maxMinutes: t.value }))}
                  className={[
                    'flex-1 py-2.5 rounded-card border-2 text-sm font-medium font-body transition-all',
                    draft.maxMinutes === t.value
                      ? 'border-forest-700 bg-forest-700 text-white'
                      : 'border-gray-200 bg-white text-gray-700',
                  ].join(' ')}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <Button fullWidth onClick={applyFilters}>Apply Filters</Button>
        </div>
      </Modal>
    </>
  )
}
