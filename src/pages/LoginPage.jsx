import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeSlash } from '@phosphor-icons/react'
import { signInWithEmail, signInWithGoogle, getAuthErrorMessage } from '../services/auth'
import { validateEmail, validatePassword } from '../utils/validators'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Navbar from '../components/layout/Navbar'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/explore'

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [serverError, setServerError] = useState('')

  function validate() {
    const errs = {}
    const emailErr = validateEmail(form.email)
    const passErr = validatePassword(form.password)
    if (emailErr) errs.email = emailErr
    if (passErr) errs.password = passErr
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')
    if (!validate()) return
    setLoading(true)
    try {
      await signInWithEmail(form.email, form.password)
      navigate(from, { replace: true })
    } catch (err) {
      setServerError(getAuthErrorMessage(err.message))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setServerError('')
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
      navigate(from, { replace: true })
    } catch (err) {
      setServerError(getAuthErrorMessage(err.message))
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-neutral-900 mb-1">Welcome back</h1>
            <p className="text-sm text-neutral-500">Sign in to continue your eco journey</p>
          </div>

          {serverError && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={e => {
                setForm(f => ({ ...f, email: e.target.value }))
                if (errors.email) setErrors(err => ({ ...err, email: null }))
              }}
              error={errors.email}
              autoComplete="email"
              inputMode="email"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => {
                  setForm(f => ({ ...f, password: e.target.value }))
                  if (errors.password) setErrors(err => ({ ...err, password: null }))
                }}
                error={errors.password}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 bottom-2 text-neutral-400 hover:text-neutral-600 transition-colors"
                style={{ top: errors.password ? 'auto' : '50%', transform: errors.password ? 'none' : 'translateY(-50%)' }}
              >
                {showPass ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button type="submit" loading={loading} disabled={loading} className="w-full" size="lg">
              Sign in
            </Button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-xs text-neutral-400">or</span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 border border-neutral-200 rounded-lg py-2.5 px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            {googleLoading ? (
              <span className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
                <path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 16.5 19.2 14 24 14c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2c-7.6 0-14.2 4.2-17.7 10.7z"/>
                <path fill="#FBBC05" d="M24 46c5.4 0 10.3-1.8 14.1-4.9l-6.5-5.3C29.6 37.6 27 38.5 24 38.5c-6.1 0-11.2-3.9-13.1-9.3l-7 5.4C7.5 41.7 15.1 46 24 46z"/>
                <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-1 3-3.1 5.6-5.7 7.3l6.5 5.3C40.5 37.9 44.5 31.5 44.5 24c0-1.3-.2-2.7-.5-4z"/>
              </svg>
            )}
            Continue with Google
          </button>

          <p className="text-center text-sm text-neutral-500 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-600 font-medium hover:text-brand-700">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
