export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const variants = {
    primary: 'bg-brand-500 hover:bg-brand-600 text-white focus:ring-brand-500',
    ghost: 'border border-brand-500 text-brand-600 hover:bg-brand-50 focus:ring-brand-500',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500',
    neutral: 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 focus:ring-neutral-400',
  }

  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          Loading...
        </>
      ) : children}
    </button>
  )
}
