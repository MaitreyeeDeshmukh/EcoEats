import { supabase } from '../lib/supabase'

// --- Normalize DB row → shape the UI expects ---
function normalizeProfile(data) {
  if (!data) return null
  return {
    uid: data.id,
    name: data.name,
    email: data.email,
    avatar: data.avatar_url || null,
    dietaryPrefs: data.dietary_prefs || [],
    role: data.role || 'student',
    hostBuilding: data.host_building || '',
    impactStats: data.impact_stats || { mealsRescued: 0, co2Saved: 0, pointsEarned: 0 },
    reputationScore: data.reputation_score || 100,
  }
}

export async function signUpWithEmail(email, password, name) {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
  if (error) throw error

  if (data.user) {
    await supabase.from('users').update({ name }).eq('id', data.user.id)
  }
  return data.user
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.user
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
  if (error) throw error
}

export async function logOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export function onAuthChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null)
  })
  return () => subscription.unsubscribe()
}

export async function createUserProfile(uid, data) {
  const { error } = await supabase.from('users').upsert({
    id: uid,
    name: data.name,
    email: data.email,
    avatar_url: data.avatar || null,
    dietary_prefs: data.dietaryPrefs || [],
    role: data.role || 'student',
    impact_stats: { mealsRescued: 0, co2Saved: 0, pointsEarned: 0 },
    reputation_score: 100,
  })
  if (error) throw error
}

export async function getUserProfile(uid) {
  const { data, error } = await supabase.from('users').select('*').eq('id', uid).single()
  if (error || !data) return null
  return normalizeProfile(data)
}

export async function updateUserProfile(uid, data) {
  const mapped = {}
  if (data.name !== undefined) mapped.name = data.name
  if (data.avatar !== undefined) mapped.avatar_url = data.avatar
  if (data.dietaryPrefs !== undefined) mapped.dietary_prefs = data.dietaryPrefs
  if (data.role !== undefined) mapped.role = data.role
  if (data.hostBuilding !== undefined) mapped.host_building = data.hostBuilding
  if (data.impactStats !== undefined) mapped.impact_stats = data.impactStats

  const { error } = await supabase.from('users').update(mapped).eq('id', uid)
  if (error) throw error
}

export async function incrementHostImpactStats(hostId, quantity) {
  const { data } = await supabase.from('users').select('impact_stats').eq('id', hostId).single()
  const current = data?.impact_stats || { mealsRescued: 0, co2Saved: 0, pointsEarned: 0 }
  const POINTS_PER_MEAL = 10

  const { error } = await supabase.from('users').update({
    impact_stats: {
      mealsRescued: (current.mealsRescued || 0) + quantity,
      co2Saved: (current.co2Saved || 0) + quantity * 0.5,
      pointsEarned: (current.pointsEarned || 0) + quantity * POINTS_PER_MEAL,
    },
  }).eq('id', hostId)

  if (error) console.warn('Failed to update host impact stats:', error.message)
}

export async function updateLastSeen(_uid) {}

export { normalizeProfile }
