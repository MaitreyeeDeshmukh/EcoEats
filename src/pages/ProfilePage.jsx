import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PencilSimple, Check, X, Trash, Plus } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'
import { useOrders } from '../hooks/useOrders'
import { useToast } from '../context/ToastContext'
import { logOut } from '../services/auth'
import { updateUserName, removeSavedAddress, addSavedAddress } from '../services/users'
import Navbar from '../components/layout/Navbar'
import PageWrapper from '../components/layout/PageWrapper'
import Badge from '../components/ui/Badge'
import { OrderRowSkeleton } from '../components/ui/Skeleton'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import {
  getInitials, getAvatarColor, formatCurrency, formatDate, formatCarbonGrams,
} from '../utils/formatters'
import { calculateEcoScore, carbonToTrees, carbonToKmDriving } from '../utils/carbonCalculator'
import { validateName, validateRequired, validatePincode } from '../utils/validators'
import { ORDER_STATUSES } from '../constants/categories'

function EcoScoreRing({ score }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ

  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e5e5" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke="#16a34a" strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-neutral-900">{score}</span>
        <span className="text-xs text-neutral-500">/ 100</span>
      </div>
    </div>
  )
}

function NameEditor({ name, uid, onSave }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  async function handleSave() {
    const err = validateName(value)
    if (err) { setError(err); return }
    setLoading(true)
    try {
      await updateUserName(uid, value.trim())
      onSave()
      setEditing(false)
      addToast('Name updated', 'success')
    } catch {
      addToast('Could not update name', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-lg font-bold text-neutral-900">{name}</p>
        <button
          onClick={() => setEditing(true)}
          className="text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          <PencilSimple size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        value={value}
        onChange={e => { setValue(e.target.value); setError('') }}
        className={`border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${error ? 'border-red-400' : 'border-neutral-200'}`}
        autoFocus
      />
      <button
        onClick={handleSave}
        disabled={loading}
        className="text-brand-600 hover:text-brand-700"
      >
        <Check size={18} />
      </button>
      <button
        onClick={() => { setEditing(false); setValue(name); setError('') }}
        className="text-neutral-400 hover:text-neutral-700"
      >
        <X size={18} />
      </button>
      {error && <p className="text-xs text-red-500 w-full">{error}</p>}
    </div>
  )
}

function AddressSection({ profile, uid, onRefresh }) {
  const { addToast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ street: '', city: '', pincode: '' })
  const [errors, setErrors] = useState({})

  async function handleAdd() {
    const errs = {}
    const streetErr = validateRequired(form.street, 'Street')
    const cityErr = validateRequired(form.city, 'City')
    const pincodeErr = validatePincode(form.pincode)
    if (streetErr) errs.street = streetErr
    if (cityErr) errs.city = cityErr
    if (pincodeErr) errs.pincode = pincodeErr
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    try {
      await addSavedAddress(uid, `${form.street}, ${form.city} – ${form.pincode}`)
      onRefresh()
      setShowForm(false)
      setForm({ street: '', city: '', pincode: '' })
      addToast('Address added', 'success')
    } catch {
      addToast('Could not save address', 'error')
    }
  }

  async function handleRemove(addr) {
    try {
      await removeSavedAddress(uid, addr)
      onRefresh()
      addToast('Address removed', 'info')
    } catch {
      addToast('Could not remove address', 'error')
    }
  }

  return (
    <div>
      {(profile?.savedAddresses || []).map((addr, i) => (
        <div key={i} className="flex items-center justify-between py-2.5 border-b border-neutral-100 last:border-0">
          <p className="text-sm text-neutral-700 flex-1 mr-2">{addr}</p>
          <button
            onClick={() => handleRemove(addr)}
            className="text-neutral-400 hover:text-red-500 transition-colors flex-shrink-0"
          >
            <Trash size={15} />
          </button>
        </div>
      ))}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="mt-2 text-sm text-brand-600 font-medium hover:text-brand-700 flex items-center gap-1"
        >
          <Plus size={14} />
          Add address
        </button>
      ) : (
        <div className="mt-3 space-y-3">
          <Input
            label="Street address"
            value={form.street}
            error={errors.street}
            onChange={e => { setForm(f => ({ ...f, street: e.target.value })); setErrors(e => ({ ...e, street: null })) }}
            placeholder="Flat no., Building, Street"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              value={form.city}
              error={errors.city}
              onChange={e => { setForm(f => ({ ...f, city: e.target.value })); setErrors(e => ({ ...e, city: null })) }}
              placeholder="Pune"
            />
            <Input
              label="Pincode"
              value={form.pincode}
              error={errors.pincode}
              onChange={e => { setForm(f => ({ ...f, pincode: e.target.value })); setErrors(e => ({ ...e, pincode: null })) }}
              placeholder="411001"
              inputMode="numeric"
              maxLength={6}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleAdd} className="flex-1">Save</Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const { orders, loading: ordersLoading } = useOrders(user?.uid)
  const navigate = useNavigate()

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <p className="text-neutral-500 mb-4">Sign in to view your profile.</p>
          <Link to="/login" className="bg-brand-500 text-white px-5 py-2 rounded-lg text-sm font-medium">
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  const ecoScore = calculateEcoScore(profile.totalCarbonSaved || 0, profile.totalOrdersCount || 0)
  const trees = carbonToTrees(profile.totalCarbonSaved || 0)

  async function handleSignOut() {
    await logOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <PageWrapper className="max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className={`w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center text-xl font-bold text-white overflow-hidden ${getAvatarColor(profile.name)}`}>
            {profile.photoURL || user.photoURL ? (
              <img
                src={profile.photoURL || user.photoURL}
                alt="avatar"
                className="w-16 h-16 object-cover"
              />
            ) : getInitials(profile.name)}
          </div>
          <div className="min-w-0">
            <NameEditor name={profile.name} uid={user.uid} onSave={refreshProfile} />
            <p className="text-sm text-neutral-500 truncate">{user.email}</p>
          </div>
        </div>

        {/* Eco score */}
        <div className="bg-white rounded-xl border border-neutral-100 p-5 mb-5">
          <h2 className="font-semibold text-neutral-900 mb-4">Eco score</h2>
          <div className="flex items-center gap-6 flex-wrap">
            <EcoScoreRing score={ecoScore} />
            <div className="grid grid-cols-3 gap-4 flex-1 min-w-0">
              <div className="text-center">
                <p className="text-xl font-bold text-neutral-900">{profile.totalOrdersCount || 0}</p>
                <p className="text-xs text-neutral-500">Orders</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-neutral-900">
                  {formatCarbonGrams(profile.totalCarbonSaved || 0).replace(' CO₂', '')}
                </p>
                <p className="text-xs text-neutral-500">CO₂ saved</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-neutral-900">{trees}</p>
                <p className="text-xs text-neutral-500">Trees eq.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order history */}
        <div className="bg-white rounded-xl border border-neutral-100 p-4 mb-5">
          <h2 className="font-semibold text-neutral-900 mb-4">Order history</h2>
          {ordersLoading ? (
            Array.from({ length: 3 }).map((_, i) => <OrderRowSkeleton key={i} />)
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-500 text-sm mb-3">No orders yet.</p>
              <Link to="/explore" className="text-brand-600 text-sm font-medium">
                Discover restaurants →
              </Link>
            </div>
          ) : (
            orders.slice(0, 10).map(order => (
              <Link
                key={order.id}
                to={`/order/${order.id}`}
                className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0 hover:bg-neutral-50 -mx-4 px-4 transition-colors rounded-lg"
              >
                <div className="min-w-0 flex-1 mr-3">
                  <p className="text-sm font-medium text-neutral-900 truncate">{order.restaurantName}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {formatDate(order.createdAt)} · {formatCurrency(order.total)}
                  </p>
                </div>
                <Badge variant={order.status}>
                  {ORDER_STATUSES[order.status]?.label || order.status}
                </Badge>
              </Link>
            ))
          )}
        </div>

        {/* Saved addresses */}
        <div className="bg-white rounded-xl border border-neutral-100 p-4 mb-5">
          <h2 className="font-semibold text-neutral-900 mb-4">Saved addresses</h2>
          <AddressSection profile={profile} uid={user.uid} onRefresh={refreshProfile} />
        </div>

        {/* Sign out */}
        <div className="pt-4 border-t border-neutral-100 text-center">
          <button
            onClick={handleSignOut}
            className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
          >
            Sign out
          </button>
        </div>
      </PageWrapper>
    </div>
  )
}
