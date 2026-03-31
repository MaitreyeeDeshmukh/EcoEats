import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}

export async function signUpWithEmail(email, password, name) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await createUserDocument(cred.user, { name })
  return cred.user
}

export async function signInWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

export async function signInWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider)
  const exists = await getUserDocument(cred.user.uid)
  if (!exists) {
    await createUserDocument(cred.user, {
      name: cred.user.displayName || 'EcoEats User',
    })
  }
  return cred.user
}

export async function logOut() {
  await signOut(auth)
}

export async function createUserDocument(user, extra = {}) {
  await setDoc(doc(db, 'users', user.uid), {
    name: extra.name || user.displayName || 'EcoEats User',
    email: user.email,
    photoURL: user.photoURL || null,
    createdAt: serverTimestamp(),
    ecoScore: 0,
    totalOrdersCount: 0,
    totalCarbonSaved: 0,
    savedAddresses: [],
    favouriteRestaurants: [],
  })
}

export async function getUserDocument(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const AUTH_ERROR_MESSAGES = {
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/wrong-password': 'Incorrect password. Try again.',
  'auth/invalid-credential': 'Incorrect email or password. Try again.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/popup-closed-by-user': 'Sign-in cancelled.',
}

export function getAuthErrorMessage(code) {
  return AUTH_ERROR_MESSAGES[code] || 'Something went wrong. Please try again.'
}
