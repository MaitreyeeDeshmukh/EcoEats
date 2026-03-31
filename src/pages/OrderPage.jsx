import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet'
import L from 'leaflet'
import { Warning, Leaf } from '@phosphor-icons/react'
import { getOrderById } from '../services/orders'
import { reverseGeocode } from '../utils/geocode'
import { useAuth } from '../context/AuthContext'
import OrderStatusTracker from '../components/features/OrderStatusTracker'
import Navbar from '../components/layout/Navbar'
import PageWrapper from '../components/layout/PageWrapper'
import { formatCurrency, formatCarbonGrams, formatDate, formatTime } from '../utils/formatters'
import { calculateCarbonSaved, AVERAGE_ORDER_CARBON } from '../utils/carbonCalculator'
import { restaurantPath } from '../constants/routes'
import Badge from '../components/ui/Badge'
import { ORDER_STATUSES } from '../constants/categories'

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

export default function OrderPage() {
  const { id } = useParams()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deliveryCoords, setDeliveryCoords] = useState(null)

  // Mock restaurant coords for Pune (would come from restaurant doc in real scenario)
  const restaurantCoords = [18.5204, 73.8567]

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login', { state: { from: `/order/${id}` } }); return }

    getOrderById(id)
      .then(data => {
        if (!data) { setError('Order not found.'); return }
        if (data.userId !== user.id) { setError('You do not have access to this order.'); return }
        setOrder(data)

        // Geocode delivery address
        if (data.deliveryAddress) {
          reverseGeocode(18.5204, 73.8567)
            .then(() => setDeliveryCoords([18.5104, 73.8667]))
            .catch(() => setDeliveryCoords([18.5104, 73.8667]))
        }
      })
      .catch(() => setError('Failed to load order.'))
      .finally(() => setLoading(false))
  }, [id, user, authLoading, navigate])

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-4">
          <Warning size={40} className="text-neutral-400" />
          <p className="text-neutral-600">{error}</p>
          <Link to="/profile" className="text-brand-600 font-medium text-sm">← My orders</Link>
        </div>
      </div>
    )
  }

  const carbonSaved = calculateCarbonSaved(order.totalCarbonFootprint || 0)
  const statusConfig = ORDER_STATUSES[order.status] || ORDER_STATUSES.pending

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <PageWrapper className="max-w-3xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-1">Order details</h1>
            <p className="text-sm text-neutral-500">
              {order.createdAt && `${formatDate(order.createdAt)} at ${formatTime(order.createdAt)}`}
            </p>
          </div>
          <Badge variant={order.status}>{statusConfig.label}</Badge>
        </div>

        {/* Status tracker */}
        <div className="bg-white rounded-xl border border-neutral-100 p-5 mb-5">
          <h2 className="font-semibold text-neutral-900 mb-5">Order status</h2>
          <OrderStatusTracker status={order.status} />
          {order.estimatedDeliveryTime && order.status !== 'delivered' && order.status !== 'cancelled' && (
            <p className="text-sm text-neutral-500 mt-4 text-center">
              Estimated delivery: ~{order.estimatedDeliveryTime} minutes
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Order items */}
          <div className="bg-white rounded-xl border border-neutral-100 p-4">
            <h2 className="font-semibold text-neutral-900 mb-3">
              <Link to={restaurantPath(order.restaurantId)} className="hover:text-brand-600 transition-colors">
                {order.restaurantName}
              </Link>
            </h2>
            <div className="space-y-2 mb-4">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-neutral-700">{item.name} × {item.quantity}</span>
                  <span className="text-neutral-600">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-neutral-100 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Delivery + GST</span>
                <span>{formatCurrency((order.deliveryFee || 0) + (order.taxes || 0))}</span>
              </div>
              <div className="flex justify-between font-semibold text-neutral-900 text-base pt-1">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
            <p className="text-xs text-neutral-400 mt-2">Cash on delivery</p>
          </div>

          {/* Carbon impact */}
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Leaf size={18} weight="fill" className="text-brand-600" />
              <h2 className="font-semibold text-brand-900 text-sm">Carbon impact</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-brand-600 mb-0.5">This order generated</p>
                <p className="text-lg font-bold text-brand-800">{formatCarbonGrams(order.totalCarbonFootprint || 0)}</p>
              </div>
              {carbonSaved > 0 && (
                <div>
                  <p className="text-xs text-brand-600 mb-0.5">Saved vs average delivery</p>
                  <p className="text-lg font-bold text-brand-800">{formatCarbonGrams(carbonSaved)}</p>
                  <p className="text-xs text-brand-600 mt-0.5">
                    Eco packaging saved an estimated {formatCarbonGrams(Math.round(carbonSaved * 0.2))} on packaging alone.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delivery address */}
        {order.deliveryAddress && (
          <div className="bg-white rounded-xl border border-neutral-100 p-4 mt-5">
            <h2 className="font-semibold text-neutral-900 mb-1">Delivery address</h2>
            <p className="text-sm text-neutral-600">{order.deliveryAddress}</p>
          </div>
        )}

        {/* Map */}
        {deliveryCoords && (
          <div className="mt-5 rounded-xl overflow-hidden border border-neutral-100 h-56">
            <MapContainer
              center={[
                (restaurantCoords[0] + deliveryCoords[0]) / 2,
                (restaurantCoords[1] + deliveryCoords[1]) / 2,
              ]}
              zoom={13}
              className="w-full h-full"
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <Marker position={restaurantCoords} icon={greenIcon} />
              <Marker position={deliveryCoords} />
              <Polyline
                positions={[restaurantCoords, deliveryCoords]}
                color="#16a34a"
                dashArray="6, 8"
                weight={2}
              />
            </MapContainer>
          </div>
        )}
      </PageWrapper>
    </div>
  )
}
