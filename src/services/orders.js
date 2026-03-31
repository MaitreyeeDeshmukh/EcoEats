import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore'
import { db } from './firebase'
import { updateUserStatsAfterOrder } from './users'
import { calculateCarbonSaved } from '../utils/carbonCalculator'

export async function createOrder(orderData) {
  const carbonSaved = calculateCarbonSaved(orderData.totalCarbonFootprint)

  const ref = await addDoc(collection(db, 'orders'), {
    ...orderData,
    carbonSavedVsAverage: carbonSaved,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await updateUserStatsAfterOrder(orderData.userId, carbonSaved)

  return ref.id
}

export async function getOrderById(id) {
  const snap = await getDoc(doc(db, 'orders', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function getUserOrders(uid, lim = 20) {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(lim)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getUserOrdersByMonth(uid) {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const q = query(
    collection(db, 'orders'),
    where('userId', '==', uid),
    where('status', '==', 'delivered'),
    orderBy('createdAt', 'desc'),
    limit(100)
  )
  const snap = await getDocs(q)
  const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }))

  const monthlyData = {}
  orders.forEach(order => {
    if (!order.createdAt) return
    const date = order.createdAt.toDate()
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!monthlyData[key]) monthlyData[key] = { carbon: 0, orders: 0 }
    monthlyData[key].carbon += order.carbonSavedVsAverage || 0
    monthlyData[key].orders += 1
  })

  return monthlyData
}

export async function getPlatformStats() {
  const q = query(collection(db, 'orders'), limit(500))
  const snap = await getDocs(q)
  const orders = snap.docs.map(d => d.data())
  const totalOrders = orders.length
  const totalCarbonSaved = orders.reduce((sum, o) => sum + (o.carbonSavedVsAverage || 0), 0)
  return { totalOrders, totalCarbonSaved }
}
