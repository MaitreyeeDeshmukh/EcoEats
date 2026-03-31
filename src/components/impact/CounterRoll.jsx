import { useState, useEffect, useRef } from 'react'

export default function CounterRoll({ target, duration = 1200, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef(null)
  const frameRef = useRef(null)

  useEffect(() => {
    if (target === 0) { setDisplay(0); return }

    const start = () => {
      startRef.current = performance.now()
      function step(now) {
        const elapsed = now - startRef.current
        const progress = Math.min(elapsed / duration, 1)
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplay(Math.round(eased * target))
        if (progress < 1) frameRef.current = requestAnimationFrame(step)
      }
      frameRef.current = requestAnimationFrame(step)
    }

    start()
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [target, duration])

  return (
    <span className="number-roll tabular-nums">
      {prefix}{typeof display === 'number' ? display.toLocaleString() : display}{suffix}
    </span>
  )
}
