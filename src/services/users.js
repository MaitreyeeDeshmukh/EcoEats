import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export async function getUserDocument(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function updateUserName(uid, name) {
  await updateDoc(doc(db, 'users', uid), { name })
}

export async function updateFavourites(uid, restaurantId, isFav) {
  const ref = doc(db, 'users', uid)
  if (isFav) {
    await updateDoc(ref, { favouriteRestaurants: arrayUnion(restaurantId) })
  } else {
    await updateDoc(ref, { favouriteRestaurants: arrayRemove(restaurantId) })
  }
}

export async function addSavedAddress(uid, address) {
  await updateDoc(doc(db, 'users', uid), {
    savedAddresses: arrayUnion(address),
  })
}

export async function removeSavedAddress(uid, address) {
  await updateDoc(doc(db, 'users', uid), {
    savedAddresses: arrayRemove(address),
  })
}

export async function updateUserStatsAfterOrder(uid, carbonSaved) {
  await runTransaction(db, async tx => {
    const ref = doc(db, 'users', uid)
    const snap = await tx.get(ref)
    if (!snap.exists()) return
    const data = snap.data()
    tx.update(ref, {
      totalOrdersCount: (data.totalOrdersCount || 0) + 1,
      totalCarbonSaved: (data.totalCarbonSaved || 0) + carbonSaved,
    })
  })
}
