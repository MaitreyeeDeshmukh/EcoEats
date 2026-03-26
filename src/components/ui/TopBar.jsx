import { useNavigate } from 'react-router-dom'
import { Leaf } from '@phosphor-icons/react'
import { useAuth } from '../../contexts/AuthContext'

export default function TopBar() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const initials = (profile?.name || user?.displayName || 'U')
    .split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-cream/90 backdrop-blur-sm safe-top border-b border-gray-100/60 sticky top-0 z-20">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-forest-700 rounded-lg flex items-center justify-center">
          <Leaf size={16} weight="fill" className="text-lime" />
        </div>
        <span className="font-display font-bold text-forest-700 text-lg">EcoEats</span>
        {/* PROTOTYPE badge */}
        <span className="bg-amber-400 text-white text-[10px] font-bold font-body px-1.5 py-0.5 rounded-full uppercase tracking-wide">
          PROTOTYPE
        </span>
      </div>

      {/* Avatar → profile */}
      <button
        onClick={() => navigate('/profile')}
        className="w-9 h-9 rounded-full bg-forest-100 flex items-center justify-center overflow-hidden min-h-touch min-w-[36px]"
      >
        {profile?.avatar ? (
          <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-forest-700 font-display">{initials}</span>
        )}
      </button>
    </header>
  )
}
