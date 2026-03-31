import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Leaf, Warning } from '@phosphor-icons/react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { createOrder } from '../services/orders'
import { addSavedAddress } from '../services/users'
import CartItem from '../components/features/CartItem'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Navbar from '../components/layout/Navbar'
import PageWrapper from '../components/layout/PageWrapper'
import { formatCurrency, formatCarbonGrams } from '../utils/formatters'
import { calculateOrderCarbon, calculateCarbonSaved, AVERAGE_ORDER_CARBON } from '../utils/carbonCalculator'
import { validateRequired, validatePincode } from '../utils/validators'

const GST_RATE = 0.05

function AddressForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ street: '', city: '', pincode: '' })
  const [errors, setErrors] = useState({})

  function validate() {
    const errs = {}
    const streetErr = validateRequired(form.street, 'Street address')
    const cityErr = validateRequired(form.city, 'City')
    const pincodeErr = validatePincode(form.pincode)
    if (streetErr) errs.street = streetErr
    if (cityErr) errs.city = cityErr
    if (pincodeErr) errs.pincode = pincodeErr
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSave() {
    if (!validate()) return
    onSave(`${form.street}, ${form.city} – ${form.pincode}`)
  }

  return (
    <div className="space-y-3">
      <Input
        label="Street address"
        value={form.street}
        onChange={e => { setForm(f => ({ ...f, street: e.target.value })); if (errors.street) setErrors(err => ({ ...err, street: null })) }}
        error={errors.street}
        placeholder="Flat no., Building, Street"
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="City"
          value={form.city}
          onChange={e => { setForm(f => ({ ...f, city: e.target.value })); if (errors.city) setErrors(err => ({ ...err, city: null })) }}
          error={errors.city}
          placeholder="Pune"
        />
        <Input
          label="Pincode"
          value={form.pincode}
          onChange={e => { setForm(f => ({ ...f, pincode: e.target.value })); if (errors.pincode) setErrors(err => ({ ...err, pincode: null })) }}
          error={errors.pincode}
          placeholder="411001"
          inputMode="numeric"
          maxLength={6}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <Button variant="ghost" onClick={onCancel} className="flex-1" size="sm">Cancel</Button>
        <Button variant="primary" onClick={handleSave} className="flex-1" size="sm">Save address</Button>
      </div>
    </div>
  )
}

export default function CartPage() {
  const { user, profile, refreshProfile } = useAuth()
  const { items, restaurantId, restaurantName, clearCart, getTotal, getTotalCarbon } = useCart()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [selectedAddress, setSelectedAddress] = useState('')
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [addressError, setAddressError] = useState('')

  const subtotal = getTotal()
  const deliveryFee = 40
  const tax = Math.round(subtotal * GST_RATE)
  const total = subtotal + deliveryFee + tax
  const carbonTotal = getTotalCarbon()
  const carbonSaved = calculateCarbonSaved(carbonTotal)
  const savedPercent = Math.round((carbonSaved / AVERAGE_ORDER_CARBON) * 100)

  const savedAddresses = profile?.savedAddresses || []

  async function handleSaveNewAddress(addr) {
    try {
      await addSavedAddress(user.uid, addr)
      refreshProfile()
      setSelectedAddress(addr)
      setShowAddressForm(false)
      addToast('Address saved', 'success')
    } catch {
      addToast('Could not save address', 'error')
    }
  }

  async function placeOrder() {
    if (!user) { navigate('/login'); return }
    if (!selectedAddress) { setAddressError('Please select or add a delivery address'); return }
    setAddressError('')
    setPlacing(true)

    try {
      const orderId = await createOrder({
        userId: user.uid,
        restaurantId,
        restaurantName,
        items: items.map(i => ({
          menuItemId: i.menuItemId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          carbonFootprint: i.carbonFootprint || 0,
        })),
        subtotal,
        deliveryFee,
        taxes: tax,
        total,
        deliveryAddress: selectedAddress,
        estimatedDeliveryTime: 40,
        totalCarbonFootprint: carbonTotal,
      })

      clearCart()
      addToast('Order placed successfully!', 'success')
      navigate(`/order/${orderId}`, { replace: true })
    } catch {
      addToast('Could not place order. Please try again.', 'error')
    } finally {
      setPlacing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <ShoppingCart size={56} className="text-neutral-300 mb-4" />
          <h2 className="text-xl font-semibold text-neutral-800 mb-2">Your cart is empty</h2>
          <p className="text-neutral-500 text-sm mb-6">Discover eco-certified restaurants and add items to get started.</p>
          <Link
            to="/explore"
            className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            Browse restaurants
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <PageWrapper className="max-w-3xl">
        <h1 className="text-2xl font-bold text-neutral-900 mb-6">Your cart</h1>

        <div className="grid md:grid-cols-[1fr,340px] gap-6">
          <div className="space-y-5">
            {/* Items */}
            <div className="bg-white rounded-xl border border-neutral-100 p-4">
              <p className="text-xs text-neutral-500 font-medium mb-1 uppercase tracking-wide">{restaurantName}</p>
              {items.map(item => <CartItem key={item.menuItemId} item={item} />)}
            </div>

            {/* Carbon summary */}
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Leaf size={18} weight="fill" className="text-brand-600" />
                <h3 className="font-semibold text-brand-900 text-sm">Carbon footprint</h3>
              </div>
              <p className="text-sm text-brand-700 mb-1">
                This order: <strong>{formatCarbonGrams(carbonTotal)}</strong>
              </p>
              {carbonSaved > 0 && (
                <p className="text-sm text-brand-600">
                  You're saving <strong>{formatCarbonGrams(carbonSaved)}</strong> vs an average order ({savedPercent}% less)
                </p>
              )}
            </div>

            {/* Delivery address */}
            <div className="bg-white rounded-xl border border-neutral-100 p-4">
              <h3 className="font-semibold text-neutral-900 mb-3">Delivery address</h3>
              {addressError && (
                <div className="flex items-center gap-2 text-sm text-red-600 mb-3">
                  <Warning size={14} />
                  {addressError}
                </div>
              )}
              {savedAddresses.map((addr, i) => (
                <label key={i} className="flex items-start gap-3 py-2 cursor-pointer">
                  <input
                    type="radio"
                    name="address"
                    value={addr}
                    checked={selectedAddress === addr}
                    onChange={() => setSelectedAddress(addr)}
                    className="mt-0.5 accent-brand-600"
                  />
                  <span className="text-sm text-neutral-700">{addr}</span>
                </label>
              ))}
              {!showAddressForm ? (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="mt-2 text-sm text-brand-600 font-medium hover:text-brand-700 flex items-center gap-1"
                >
                  + Add new address
                </button>
              ) : (
                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <AddressForm
                    onSave={handleSaveNewAddress}
                    onCancel={() => setShowAddressForm(false)}
                  />
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="bg-white rounded-xl border border-neutral-100 p-4">
              <h3 className="font-semibold text-neutral-900 mb-3">Payment method</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" checked readOnly className="accent-brand-600" />
                <div>
                  <p className="text-sm font-medium text-neutral-800">Cash on Delivery</p>
                  <p className="text-xs text-neutral-500">Pay when your order arrives</p>
                </div>
              </label>
            </div>
          </div>

          {/* Order summary (sticky on desktop) */}
          <div className="md:sticky md:top-20 self-start">
            <div className="bg-white rounded-xl border border-neutral-100 p-4">
              <h3 className="font-semibold text-neutral-900 mb-4">Order summary</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Delivery fee</span>
                  <span>{formatCurrency(deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>GST (5%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="border-t border-neutral-100 pt-2.5 flex justify-between font-semibold text-neutral-900 text-base">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <Button
                onClick={placeOrder}
                loading={placing}
                disabled={placing}
                className="w-full mt-5"
                size="lg"
              >
                Place order · {formatCurrency(total)}
              </Button>

              <p className="text-xs text-neutral-400 text-center mt-3">
                By placing your order, you agree to our terms of service.
              </p>
            </div>
          </div>
        </div>
      </PageWrapper>
    </div>
  )
}
