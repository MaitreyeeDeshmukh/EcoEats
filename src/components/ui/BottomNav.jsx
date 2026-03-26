import { useLocation, useNavigate } from 'react-router-dom'
import { House, MapTrifold, Plus, ChartBar, Bookmark } from '@phosphor-icons/react'
import { useAuth } from '../../contexts/AuthContext'

export default function BottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const isHost = profile?.role === 'host'

  const tabs = [
    { path: '/feed', icon: House, label: 'Feed' },
    { path: '/map', icon: MapTrifold, label: 'Map' },
    isHost
      ? { path: '/post', icon: Plus, label: 'Post', accent: true }
      : { path: '/claims', icon: Bookmark, label: 'Claims' },
    { path: '/impact', icon: ChartBar, label: 'Impact' },
  ]

  return (
    <nav className="bottom-nav bg-white border-t border-gray-100 flex items-center justify-around px-2 pt-2 pb-1 safe-bottom">
      {tabs.map(({ path, icon: Icon, label, accent }) => {
        const active = pathname === path || (path === '/feed' && pathname === '/')
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={[
              'flex flex-col items-center gap-0.5 flex-1 py-1 min-h-touch transition-all',
              active ? 'text-forest-700' : 'text-gray-400',
            ].join(' ')}
          >
            {accent ? (
              <div className="w-12 h-12 rounded-full bg-forest-700 flex items-center justify-center shadow-card -mt-6 mb-0.5">
                <Icon size={22} weight={active ? 'fill' : 'regular'} className="text-white" />
              </div>
            ) : (
              <Icon size={22} weight={active ? 'fill' : 'regular'} />
            )}
            {!accent && <span className="text-xs font-medium font-body">{label}</span>}
            {accent && <span className="text-xs font-medium font-body text-forest-700">{label}</span>}
          </button>
        )
      })}
    </nav>
  )
}
