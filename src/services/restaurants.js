import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db } from './firebase'

export async function getRestaurants({ category, limit: lim = 20 } = {}) {
  let q = query(collection(db, 'restaurants'), limit(lim))
  if (category && category !== 'all') {
    q = query(collection(db, 'restaurants'), where('category', '==', category), limit(lim))
  }
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getFeaturedRestaurants() {
  const q = query(
    collection(db, 'restaurants'),
    where('isEcoCertified', '==', true),
    orderBy('ecoRating', 'desc'),
    limit(6)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getRestaurantById(id) {
  const snap = await getDoc(doc(db, 'restaurants', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function getRestaurantStats() {
  const snap = await getDocs(collection(db, 'restaurants'))
  return { totalRestaurants: snap.size }
}
