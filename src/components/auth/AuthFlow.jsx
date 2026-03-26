import { useState } from 'react'
import { Leaf, Eye, EyeSlash, ArrowLeft } from '@phosphor-icons/react'
import Button from '../ui/Button'
import { signUpWithEmail, signInWithEmail, signInWithGoogle } from '../../services/auth'
import { useToast } from '../../contexts/ToastContext'

export default function AuthFlow({ defaultMode = 'signin', onBack }) {
  const [mode, setMode] = useState(defaultMode) // 'signin' | 'signup'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { toast } = useToast()

  function validate() {
    const e = {}
    if (mode === 'signup' && !name.trim()) e.name = 'Name is required'
    if (!email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email'
    if (!password) e.password = 'Password is required'
    else if (password.length < 6) e.password = 'Password must be at least 6 characters'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      if (mode === 'signup') await signUpWithEmail(email, password, name)
      else await signInWithEmail(email, password)
    } catch (err) {
      const msg = err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password'
        ? 'Invalid email or password'
        : err.code === 'auth/email-already-in-use'
        ? 'Email already in use — try signing in'
        : err.message
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-cream flex flex-col px-6 pt-safe">
      {/* Back button */}
      {onBack && (
        <button onClick={onBack} className="mt-4 -ml-1 flex items-center gap-1 text-forest-700 font-body text-sm self-start">
          <ArrowLeft size={18} />
          Back
        </button>
      )}
      {/* Header */}
      <div className="flex flex-col items-center pt-8 pb-8 gap-3">
        <div className="w-14 h-14 bg-forest-700 rounded-2xl flex items-center justify-center shadow-card">
          <Leaf size={28} weight="fill" className="text-lime" />
        </div>
        <h1 className="font-display font-bold text-3xl text-forest-700">EcoEats</h1>
        <p className="text-sm text-gray-500 font-body">rescue food. feed people.</p>
      </div>

      {/* Tab toggle */}
      <div className="flex bg-white rounded-card p-1 shadow-card mb-6">
        {['signin', 'signup'].map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setErrors({}) }}
            className={[
              'flex-1 py-2.5 rounded-[12px] text-sm font-medium font-body transition-all',
              mode === m ? 'bg-forest-700 text-white shadow-sm' : 'text-gray-500',
            ].join(' ')}
          >
            {m === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === 'signup' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-body">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className={`w-full h-[52px] px-4 rounded-card border bg-white font-body text-base focus:outline-none focus:ring-2 focus:ring-forest-400 ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 font-body">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@asu.edu"
            autoComplete="email"
            className={`w-full h-[52px] px-4 rounded-card border bg-white font-body text-base focus:outline-none focus:ring-2 focus:ring-forest-400 ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 font-body">Password</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              className={`w-full h-[52px] px-4 pr-12 rounded-card border bg-white font-body text-base focus:outline-none focus:ring-2 focus:ring-forest-400 ${errors.password ? 'border-red-400' : 'border-gray-200'}`}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400"
            >
              {showPass ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>

        <Button type="submit" fullWidth loading={loading} className="mt-2">
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </Button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-sm text-gray-400 font-body">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <Button variant="secondary" fullWidth loading={googleLoading} onClick={handleGoogle}>
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
        Continue with Google
      </Button>
    </div>
  )
}
