export default function Input({
  label,
  error,
  helper,
  className = '',
  id,
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
          error
            ? 'border-red-400 focus:ring-red-400'
            : 'border-neutral-200 focus:ring-brand-500'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {helper && !error && <p className="mt-1 text-xs text-neutral-500">{helper}</p>}
    </div>
  )
}
