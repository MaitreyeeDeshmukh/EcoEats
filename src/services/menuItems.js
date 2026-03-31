import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from 'firebase/firestore'
import { db } from './firebase'

export async function getMenuItemsByRestaurant(restaurantId) {
  const q = query(
    collection(db, 'menuItems'),
    where('restaurantId', '==', restaurantId),
    where('isAvailable', '==', true),
    orderBy('category')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
