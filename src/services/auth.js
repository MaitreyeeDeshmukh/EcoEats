import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export async function signUpWithEmail(email, password, name) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName: name })
  return cred.user
}

export async function signInWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

export async function signInWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider)
  return cred.user
}

export async function logOut() {
  await signOut(auth)
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}

export async function createUserProfile(uid, data) {
  const ref = doc(db, 'users', uid)
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
    impactStats: { mealsRescued: 0, co2Saved: 0, pointsEarned: 0 },
    reputationScore: 100,
  })
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { uid, ...snap.data() } : null
}

export async function updateLastSeen(uid) {
  const ref = doc(db, 'users', uid)
  await setDoc(ref, { lastSeen: serverTimestamp() }, { merge: true })
}
