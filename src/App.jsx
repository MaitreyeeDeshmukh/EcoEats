import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import ToastContainer from './components/ui/Toast'
import { PageSpinner } from './components/ui/Spinner'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const ExplorePage = lazy(() => import('./pages/ExplorePage'))
const RestaurantPage = lazy(() => import('./pages/RestaurantPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const OrderPage = lazy(() => import('./pages/OrderPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const ImpactPage = lazy(() => import('./pages/ImpactPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <PageSpinner />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return children
}

function RedirectIfAuth({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <PageSpinner />
  if (user) return <Navigate to="/explore" replace />
  return children
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <RedirectIfAuth>
              <LoginPage />
            </RedirectIfAuth>
          }
        />
        <Route
          path="/signup"
          element={
            <RedirectIfAuth>
              <SignupPage />
            </RedirectIfAuth>
          }
        />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/restaurant/:id" element={<RestaurantPage />} />
        <Route
          path="/cart"
          element={
            <RequireAuth>
              <CartPage />
            </RequireAuth>
          }
        />
        <Route
          path="/order/:id"
          element={
            <RequireAuth>
              <OrderPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/impact"
          element={
            <RequireAuth>
              <ImpactPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <AppRoutes />
            <ToastContainer />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
