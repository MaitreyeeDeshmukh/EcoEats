import { collection, getDocs, limit, query } from 'firebase/firestore'
import { db } from './firebase'

export async function getEcoTips(lim = 5) {
  const q = query(collection(db, 'ecoTips'), limit(lim))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
