export default function Card({ children, className = '', onClick, hoverable = false }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-neutral-100 ${
        hoverable || onClick ? 'hover:shadow-md transition-shadow duration-200 cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
