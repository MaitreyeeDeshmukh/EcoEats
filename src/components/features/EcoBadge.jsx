import { Leaf, Seal } from '@phosphor-icons/react'

export default function EcoBadge({ ecoRating, packagingType, isEcoCertified }) {
  return (
    <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Leaf size={18} weight="fill" className="text-brand-600" />
        <h3 className="font-semibold text-brand-900 text-sm">Eco Credentials</h3>
        {isEcoCertified && (
          <span className="ml-auto flex items-center gap-1 text-xs text-brand-700 font-medium">
            <Seal size={14} weight="fill" />
            Certified
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-neutral-500 mb-0.5">Eco Rating</p>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-sm ${i < Math.round((ecoRating / 10) * 5) ? 'bg-brand-500' : 'bg-neutral-200'}`}
              />
            ))}
          </div>
        </div>
        {packagingType && (
          <div>
            <p className="text-xs text-neutral-500 mb-0.5">Packaging</p>
            <p className="text-xs font-medium text-neutral-800 capitalize">{packagingType}</p>
          </div>
        )}
      </div>
    </div>
  )
}
