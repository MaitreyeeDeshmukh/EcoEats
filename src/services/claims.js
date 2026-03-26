import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit,
} from 'firebase/firestore'
import { db } from './firebase'

const CLAIMS_COL = 'claims'
const RESERVATION_MINUTES = 20

export async function createClaim(listingId, studentId, studentName, quantity) {
  const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000)
  const ref = await addDoc(collection(db, CLAIMS_COL), {
    listingId,
    studentId,
    studentName,
    quantity,
    claimedAt: serverTimestamp(),
    pickedUpAt: null,
    status: 'pending',
    reservationExpiresAt: expiresAt,
    rating: null,
  })
  return ref.id
}

export async function confirmPickup(claimId, rating = null) {
  await updateDoc(doc(db, CLAIMS_COL, claimId), {
    status: 'picked_up',
    pickedUpAt: serverTimestamp(),
    rating,
  })
}

export async function markNoShow(claimId) {
  await updateDoc(doc(db, CLAIMS_COL, claimId), { status: 'no_show' })
}

export function subscribeToStudentClaims(studentId, callback) {
  const q = query(
    collection(db, CLAIMS_COL),
    where('studentId', '==', studentId),
    orderBy('claimedAt', 'desc'),
    limit(20)
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export function subscribeToListingClaims(listingId, callback) {
  const q = query(
    collection(db, CLAIMS_COL),
    where('listingId', '==', listingId),
    orderBy('claimedAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export async function submitReport(data) {
  await addDoc(collection(db, 'reports'), {
    ...data,
    createdAt: serverTimestamp(),
  })
}
