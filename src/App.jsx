import { useState, useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ListingsProvider } from './contexts/ListingsContext'
import { ToastProvider } from './contexts/ToastContext'
import ToastContainer from './components/ui/Toast'
import OfflineBanner from './components/ui/OfflineBanner'
import BottomNav from './components/ui/BottomNav'
import TopBar from './components/ui/TopBar'
import SplashScreen from './components/auth/SplashScreen'
import AuthFlow from './components/auth/AuthFlow'
import RoleSelector from './components/auth/RoleSelector'
import Onboarding from './components/auth/Onboarding'
import Landing from './pages/Landing'
import { ListingCardSkeleton } from './components/ui/Skeleton'

// Code-split pages
const Feed = lazy(() => import('./pages/Feed'))
const Map = lazy(() => import('./pages/Map'))
const Post = lazy(() => import('./pages/Post'))
const Impact = lazy(() => import('./pages/Impact'))
const Profile = lazy(() => import('./pages/Profile'))
const Claims = lazy(() => import('./pages/Claims'))

function PageFallback() {
  return (
    <div className="px-4 pt-4 space-y-4">
      <ListingCardSkeleton />
      <ListingCardSkeleton />
    </div>
  )
}

function AppRouter() {
  const { user, profile, loading } = useAuth()
  const [splashDone, setSplashDone] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [authMode, setAuthMode] = useState(null) // null | 'signin' | 'signup'

  if (!splashDone) {
    return <SplashScreen onDone={() => setSplashDone(true)} />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-cream">
        <div className="w-8 h-8 border-3 border-forest-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Not logged in — show landing or auth
  if (!user) {
    if (!authMode) {
      return (
        <Landing
          onSignIn={() => setAuthMode('signin')}
          onGetStarted={() => setAuthMode('signup')}
        />
      )
    }
    return (
      <AuthFlow
        defaultMode={authMode}
        onBack={() => setAuthMode(null)}
      />
    )
  }

  // Logged in but no profile (needs role + onboarding)
  if (!profile) {
    if (!selectedRole) {
      return <RoleSelector onSelect={setSelectedRole} />
    }
    return <Onboarding role={selectedRole} onDone={() => setSelectedRole(null)} />
  }

  // Fully authenticated — show app
  return (
    <BrowserRouter>
      <ListingsProvider>
        <div className="flex flex-col h-dvh overflow-hidden">
          <OfflineBanner />
          <TopBar />
          <main className="flex-1 overflow-hidden relative">
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<Navigate to="/feed" replace />} />
                <Route path="/feed" element={<Feed />} />
                <Route path="/map" element={<Map />} />
                <Route path="/post" element={
                  profile.role === 'host' ? <Post /> : <Navigate to="/feed" replace />
                } />
                <Route path="/claims" element={<Claims />} />
                <Route path="/impact" element={<Impact />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<Navigate to="/feed" replace />} />
              </Routes>
            </Suspense>
          </main>
          <BottomNav />
          <ToastContainer />
        </div>
      </ListingsProvider>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ToastProvider>
  )
}
