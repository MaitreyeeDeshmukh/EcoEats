import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  increment,
  runTransaction,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

const LISTINGS_COL = 'listings'
const PAGE_SIZE = 10

export async function createListing(data) {
  const now = Timestamp.now()
  const expiryMinutes = data.expiryMinutes || 90
  const expiresAt = new Timestamp(now.seconds + expiryMinutes * 60, now.nanoseconds)

  const docRef = await addDoc(collection(db, LISTINGS_COL), {
    ...data,
    postedAt: serverTimestamp(),
    expiresAt,
    status: 'active',
    quantityRemaining: data.quantity,
    claimedBy: [],
  })
  return docRef.id
}

export async function getListingById(id) {
  const snap = await getDoc(doc(db, LISTINGS_COL, id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function updateListing(id, data) {
  await updateDoc(doc(db, LISTINGS_COL, id), data)
}

export async function cancelListing(id) {
  await updateDoc(doc(db, LISTINGS_COL, id), { status: 'cancelled' })
}

export function subscribeToActiveListings(callback) {
  const q = query(
    collection(db, LISTINGS_COL),
    where('status', '==', 'active'),
    orderBy('postedAt', 'desc'),
    limit(PAGE_SIZE)
  )
  return onSnapshot(q, (snap) => {
    const listings = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    callback(listings)
  })
}

export function subscribeToHostListings(hostId, callback) {
  const q = query(
    collection(db, LISTINGS_COL),
    where('hostId', '==', hostId),
    orderBy('postedAt', 'desc'),
    limit(20)
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export async function fetchMoreListings(lastDoc) {
  const q = query(
    collection(db, LISTINGS_COL),
    where('status', '==', 'active'),
    orderBy('postedAt', 'desc'),
    startAfter(lastDoc),
    limit(PAGE_SIZE)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Auto-expire listings whose expiresAt < now
export async function expireOldListings() {
  const now = Timestamp.now()
  const q = query(
    collection(db, LISTINGS_COL),
    where('status', '==', 'active'),
    where('expiresAt', '<=', now)
  )
  const snap = await getDocs(q)
  const updates = snap.docs.map((d) => updateDoc(d.ref, { status: 'expired' }))
  await Promise.all(updates)
}

// Transactional claim — prevents race conditions
export async function transactionalClaim(listingId, studentId) {
  const listingRef = doc(db, LISTINGS_COL, listingId)
  let claimedQty = 0

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(listingRef)
    if (!snap.exists()) throw new Error('Listing not found')
    const data = snap.data()
    if (data.status !== 'active') throw new Error('Listing is no longer active')
    if (data.quantityRemaining <= 0) throw new Error('No portions remaining')
    if (data.claimedBy?.includes(studentId)) throw new Error('Already claimed')

    claimedQty = 1
    const newQty = data.quantityRemaining - 1
    const updates = {
      quantityRemaining: increment(-1),
      claimedBy: [...(data.claimedBy || []), studentId],
    }
    if (newQty <= 0) updates.status = 'claimed'
    tx.update(listingRef, updates)
  })

  return claimedQty
}
