export default function StepIndicator({ step, total = 3 }) {
  return (
    <div className="flex items-center gap-2 justify-center px-4 py-3">
      {[...Array(total)].map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={[
              'flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold font-body transition-all',
              i < step
                ? 'bg-forest-700 text-white'
                : i === step
                ? 'bg-forest-700 text-white ring-4 ring-forest-200'
                : 'bg-gray-200 text-gray-400',
            ].join(' ')}
          >
            {i < step ? '✓' : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`w-8 h-0.5 transition-all ${i < step ? 'bg-forest-700' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}
