import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, List, X, User, Lightning, Storefront, House } from '@phosphor-icons/react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { logOut } from '../../services/auth'
import { getInitials, getAvatarColor } from '../../utils/formatters'
import MobileDrawer from './MobileDrawer'

function NavLink({ to, children }) {
  const { pathname } = useLocation()
  const active = pathname === to
  return (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors ${
        active ? 'text-brand-600' : 'text-neutral-600 hover:text-neutral-900'
      }`}
    >
      {children}
    </Link>
  )
}

function UserDropdown({ user, profile, onClose }) {
  const navigate = useNavigate()

  async function handleSignOut() {
    await logOut()
    onClose()
    navigate('/')
  }

  return (
    <div className="absolute right-0 top-12 bg-white border border-neutral-100 rounded-xl shadow-lg p-2 w-56 z-50">
      <div className="px-3 py-2 border-b border-neutral-100 mb-1">
        <p className="text-sm font-medium text-neutral-900 truncate">{profile?.name || user.displayName}</p>
        <p className="text-xs text-neutral-500 truncate">{user.email}</p>
      </div>
      <Link
        to="/profile"
        onClick={onClose}
        className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg w-full"
      >
        <User size={16} /> Profile
      </Link>
      <Link
        to="/impact"
        onClick={onClose}
        className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg w-full"
      >
        <Lightning size={16} /> My Impact
      </Link>
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg w-full mt-1"
      >
        Sign out
      </button>
    </div>
  )
}

export default function Navbar() {
  const { user, profile } = useAuth()
  const { getItemCount } = useCart()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const dropdownRef = useRef(null)
  const itemCount = getItemCount()

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <span className="font-bold text-xl">
              <span className="text-brand-600">Eco</span>
              <span className="text-neutral-800">Eats</span>
            </span>
          </Link>

          {/* Center nav (desktop) */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/explore">Explore</NavLink>
            <NavLink to="/impact">Impact</NavLink>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <Link to="/cart" className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors">
              <ShoppingCart size={22} className="text-neutral-700" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-brand-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* Auth */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(v => !v)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                  style={{ background: '#16a34a' }}
                >
                  {profile?.photoURL || user.photoURL ? (
                    <img
                      src={profile?.photoURL || user.photoURL}
                      alt="avatar"
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    getInitials(profile?.name || user.displayName)
                  )}
                </button>
                {dropdownOpen && (
                  <UserDropdown
                    user={user}
                    profile={profile}
                    onClose={() => setDropdownOpen(false)}
                  />
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-medium text-neutral-700 hover:text-neutral-900 px-3 py-1.5"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white px-4 py-1.5 rounded-lg transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              onClick={() => setDrawerOpen(true)}
            >
              <List size={22} className="text-neutral-700" />
            </button>
          </div>
        </div>
      </nav>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
