export default function Card({ children, className = '', onClick, ...props }) {
  return (
    <div
      className={[
        'bg-white rounded-card shadow-card',
        onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : '',
        className,
      ].join(' ')}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}
