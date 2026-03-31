import { useNavigate } from 'react-router-dom'
import { Leaf } from '@phosphor-icons/react'
import { useAuth } from '../../contexts/AuthContext'

export default function TopBar() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const initials = (profile?.name || user?.displayName || 'U')
    .split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-cream safe-top sticky top-0 z-20">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-forest-700 rounded-lg flex items-center justify-center">
          <Leaf size={14} weight="fill" className="text-lime" />
        </div>
        <span className="font-display font-bold text-forest-700 text-base tracking-tight">EcoEats</span>
        {profile?.role && (
          <span className={`text-[10px] font-bold font-body px-2 py-0.5 rounded-full ${
            profile.role === 'organizer'
              ? 'bg-forest-100 text-forest-700'
              : 'bg-lime/20 text-forest-600'
          }`}>
            {profile.role === 'organizer' ? 'Organizer' : 'Student'}
          </span>
        )}
      </div>

      <button
        onClick={() => navigate('/profile')}
        className="w-8 h-8 rounded-full bg-forest-700 flex items-center justify-center overflow-hidden"
      >
        {profile?.avatar ? (
          <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[11px] font-bold text-white font-display">{initials}</span>
        )}
      </button>
    </header>
  )
}
