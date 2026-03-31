import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { X, House, Storefront, Lightning, User, SignOut } from '@phosphor-icons/react'
import { useAuth } from '../../context/AuthContext'
import { logOut } from '../../services/auth'

export default function MobileDrawer({ open, onClose }) {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  async function handleSignOut() {
    await logOut()
    onClose()
    navigate('/')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <span className="font-bold text-lg">
            <span className="text-brand-600">Eco</span>
            <span className="text-neutral-800">Eats</span>
          </span>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { to: '/', icon: House, label: 'Home' },
            { to: '/explore', icon: Storefront, label: 'Explore' },
            { to: '/impact', icon: Lightning, label: 'My Impact' },
            { to: '/profile', icon: User, label: 'Profile' },
          ].map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-700 hover:bg-neutral-50 font-medium"
            >
              <Icon size={20} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-100">
          {user ? (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 font-medium w-full"
            >
              <SignOut size={20} />
              Sign out
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                to="/login"
                onClick={onClose}
                className="text-center py-2.5 rounded-lg border border-brand-500 text-brand-600 font-medium text-sm"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={onClose}
                className="text-center py-2.5 rounded-lg bg-brand-500 text-white font-medium text-sm"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
