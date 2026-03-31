import { Link } from 'react-router-dom'
import { Leaf } from '@phosphor-icons/react'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-100 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="max-w-xs">
            <span className="font-bold text-xl block mb-2">
              <span className="text-brand-600">Eco</span>
              <span className="text-neutral-800">Eats</span>
            </span>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Every order is a choice. We make it easy to choose better — for your plate and the planet.
            </p>
          </div>
          <div className="flex gap-12 text-sm">
            <div>
              <p className="font-semibold text-neutral-800 mb-3">Explore</p>
              <div className="space-y-2">
                <Link to="/explore" className="block text-neutral-500 hover:text-neutral-800">Restaurants</Link>
                <Link to="/impact" className="block text-neutral-500 hover:text-neutral-800">Impact</Link>
              </div>
            </div>
            <div>
              <p className="font-semibold text-neutral-800 mb-3">Account</p>
              <div className="space-y-2">
                <Link to="/login" className="block text-neutral-500 hover:text-neutral-800">Login</Link>
                <Link to="/signup" className="block text-neutral-500 hover:text-neutral-800">Sign up</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-neutral-100 mt-8 pt-6 flex items-center justify-between text-xs text-neutral-400">
          <span>© {new Date().getFullYear()} EcoEats</span>
          <span className="flex items-center gap-1">
            <Leaf size={12} className="text-brand-500" />
            Built with care for the planet
          </span>
        </div>
      </div>
    </footer>
  )
}
