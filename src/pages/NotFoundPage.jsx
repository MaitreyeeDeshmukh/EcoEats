import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <p className="text-6xl mb-4">🌿</p>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          Looks like this page composted.
        </h1>
        <p className="text-neutral-500 text-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-2.5 rounded-xl transition-colors text-sm"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
