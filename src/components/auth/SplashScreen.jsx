import { useEffect, useState } from 'react'
import { Leaf } from '@phosphor-icons/react'

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    // Phase 0: logo appears (0-600ms)
    // Phase 1: tagline appears (600-1400ms)
    // Phase 2: fade out (1400-1900ms)
    const t1 = setTimeout(() => setPhase(1), 600)
    const t2 = setTimeout(() => setPhase(2), 1600)
    const t3 = setTimeout(() => onDone(), 2000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  return (
    <div
      className={[
        'fixed inset-0 z-50 flex flex-col items-center justify-center bg-forest-700',
        'transition-opacity duration-400',
        phase === 2 ? 'opacity-0' : 'opacity-100',
      ].join(' ')}
    >
      {/* Animated logo */}
      <div
        className={[
          'flex flex-col items-center gap-4 transition-all duration-500',
          phase >= 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-75',
        ].join(' ')}
      >
        <div className="relative">
          <div className="w-20 h-20 bg-lime/30 rounded-full flex items-center justify-center animate-pulse-soft">
            <div className="w-14 h-14 bg-lime rounded-full flex items-center justify-center shadow-lg">
              <Leaf size={32} weight="fill" className="text-forest-700" />
            </div>
          </div>
        </div>

        <div className="text-center">
          <h1 className="font-display font-bold text-4xl text-white tracking-tight">
            EcoEats
          </h1>
        </div>
      </div>

      {/* Tagline */}
      <div
        className={[
          'mt-4 text-center transition-all duration-500',
          phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        ].join(' ')}
      >
        <p className="text-lime/90 font-body text-base tracking-wide">
          rescue food. feed people.
        </p>
      </div>
    </div>
  )
}
