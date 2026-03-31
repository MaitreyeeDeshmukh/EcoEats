import { forwardRef } from 'react'

const variants = {
  primary: 'bg-forest-700 text-white hover:bg-forest-600 active:bg-forest-800 disabled:bg-forest-200 disabled:text-forest-400',
  secondary: 'bg-white text-forest-700 border-2 border-forest-700 hover:bg-forest-50 active:bg-forest-100 disabled:opacity-40',
  ghost: 'bg-transparent text-forest-700 hover:bg-forest-50 active:bg-forest-100 disabled:opacity-40',
  danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 disabled:opacity-40',
  lime: 'bg-lime text-white hover:bg-forest-400 active:bg-forest-500 disabled:opacity-40',
}

const sizes = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-[52px] px-6 text-base',
  lg: 'h-14 px-8 text-lg',
  icon: 'h-11 w-11 p-0',
}

const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    children,
    className = '',
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      className={[
        'inline-flex items-center justify-center gap-2 font-body font-medium',
        'rounded-btn transition-all duration-150 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-400 focus-visible:ring-offset-2',
        variants[variant],
        sizes[size],
        fullWidth ? 'w-full' : '',
        loading ? 'opacity-70 cursor-wait' : '',
        className,
      ].join(' ')}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  )
})

export default Button
