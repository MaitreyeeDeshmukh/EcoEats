import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export async function getReviewsByRestaurant(restaurantId, lim = 20) {
  const q = query(
    collection(db, 'reviews'),
    where('restaurantId', '==', restaurantId),
    orderBy('createdAt', 'desc'),
    limit(lim)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function addReview(data) {
  await addDoc(collection(db, 'reviews'), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function deleteReview(reviewId) {
  await deleteDoc(doc(db, 'reviews', reviewId))
}
