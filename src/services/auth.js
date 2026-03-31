import { supabase } from './supabase'

export function onAuthChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
  return () => subscription.unsubscribe()
}

export async function signUpWithEmail(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  })
  if (error) throw error
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
  await supabase.auth.signOut()
}

export async function createUserProfile(uid, data) {
  const { error } = await supabase.from('users').upsert({
    id: uid,
    name: data.name,
    email: data.email,
    avatar_url: data.avatar || null,
    role: data.role || 'student',
    dietary_prefs: data.dietaryPrefs || [],
    impact_stats: { mealsRescued: 0, co2Saved: 0, pointsEarned: 0 },
    reputation_score: 100,
  })
  if (error) throw error
}

export async function getUserProfile(uid) {
  const { data, error } = await supabase.from('users').select('*').eq('id', uid).single()
  if (error) return null
  return normalizeProfile(data)
}

export async function updateLastSeen(uid) {
  await supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('id', uid)
}

function normalizeProfile(p) {
  if (!p) return null
  return {
    uid: p.id,
    id: p.id,
    name: p.name,
    email: p.email,
    avatar: p.avatar_url,
    role: p.role || 'student',
    dietaryPrefs: p.dietary_prefs || [],
    impactStats: p.impact_stats || { mealsRescued: 0, co2Saved: 0, pointsEarned: 0 },
    reputationScore: p.reputation_score || 100,
  }
}
