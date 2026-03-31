import { supabase } from './supabase'
import { updateUserStatsAfterOrder } from './users'
import { calculateCarbonSaved } from '../utils/carbonCalculator'
import { normalizeOrder } from '../utils/normalize'

export async function createOrder(orderData) {
  const carbonSaved = calculateCarbonSaved(orderData.totalCarbonFootprint)
  const { data, error } = await supabase.from('orders').insert({
    user_id: orderData.userId,
    restaurant_id: orderData.restaurantId,
    restaurant_name: orderData.restaurantName,
    items: orderData.items,
    subtotal: orderData.subtotal,
    delivery_fee: orderData.deliveryFee,
    taxes: orderData.taxes,
    total: orderData.total,
    status: 'pending',
    delivery_address: orderData.deliveryAddress,
    estimated_delivery_time: orderData.estimatedDeliveryTime,
    total_carbon_footprint: orderData.totalCarbonFootprint,
    carbon_saved_vs_average: carbonSaved,
    payment_method: 'cod',
    payment_status: 'pending',
  }).select().single()
  if (error) throw error
  await updateUserStatsAfterOrder(orderData.userId, carbonSaved)
  return data.id
}

export async function getOrderById(id) {
  const { data, error } = await supabase.from('orders').select('*').eq('id', id).single()
  if (error) return null
  return normalizeOrder(data)
}

export async function getUserOrders(uid, limit = 20) {
  const { data, error } = await supabase.from('orders').select('*')
    .eq('user_id', uid).order('created_at', { ascending: false }).limit(limit)
  if (error) throw error
  return (data || []).map(normalizeOrder)
}

export async function getUserOrdersByMonth(uid) {
  const { data, error } = await supabase.from('orders')
    .select('created_at, carbon_saved_vs_average')
    .eq('user_id', uid).eq('status', 'delivered')
    .order('created_at', { ascending: false }).limit(100)
  if (error) throw error
  const monthlyData = {}
  ;(data || []).forEach(order => {
    const date = new Date(order.created_at)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!monthlyData[key]) monthlyData[key] = { carbon: 0, orders: 0 }
    monthlyData[key].carbon += order.carbon_saved_vs_average || 0
    monthlyData[key].orders += 1
  })
  return monthlyData
}

export async function getPlatformStats() {
  const { data, error } = await supabase.from('orders').select('carbon_saved_vs_average').limit(500)
  if (error) return { totalOrders: 0, totalCarbonSaved: 0 }
  return {
    totalOrders: data.length,
    totalCarbonSaved: data.reduce((sum, o) => sum + (o.carbon_saved_vs_average || 0), 0),
  }
}
