import { useState, useEffect } from 'react'
import { Clock } from '@phosphor-icons/react'

export default function ReservationTimer({ expiresAt, onExpired }) {
  const [remaining, setRemaining] = useState(null)

  useEffect(() => {
    function tick() {
      const target = expiresAt instanceof Date ? expiresAt : new Date(expiresAt)
      const diff = target - Date.now()
      if (diff <= 0) {
        setRemaining({ expired: true, display: '0:00', pct: 0 })
        onExpired?.()
        return
      }
      const totalSeconds = Math.floor(diff / 1000)
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      const totalMinutes = 20
      const pct = Math.min((totalSeconds / (totalMinutes * 60)) * 100, 100)
      setRemaining({
        expired: false,
        display: `${minutes}:${String(seconds).padStart(2, '0')}`,
        pct,
        urgent: minutes < 5,
      })
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt, onExpired])

  if (!remaining) return null

  const color = remaining.expired || remaining.urgent ? '#EF4444' : '#1B4332'
  const circumference = 2 * Math.PI * 20
  const dashOffset = circumference * (1 - remaining.pct / 100)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90 progress-ring" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="#e5e7eb" strokeWidth="4" />
          <circle
            cx="24" cy="24" r="20"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Clock size={20} style={{ color }} />
        </div>
      </div>
      <div className="text-center">
        <p
          className={`font-display font-bold text-2xl ${remaining.urgent || remaining.expired ? 'text-red-500' : 'text-forest-700'}`}
        >
          {remaining.display}
        </p>
        <p className="text-xs text-gray-500 font-body">reservation time left</p>
      </div>
    </div>
  )
}
