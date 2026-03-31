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
    options: { redirectTo: `${window.location.origin}/explore` },
  })
  if (error) throw error
}

export async function logOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getUserDocument(uid) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', uid)
    .single()
  if (error) return null
  return data
}

const AUTH_ERROR_MESSAGES = {
  'Invalid login credentials': 'Incorrect email or password. Try again.',
  'Email not confirmed': 'Please verify your email before signing in.',
  'User already registered': 'An account with this email already exists.',
  'Password should be at least 6 characters': 'Password must be at least 8 characters.',
}

export function getAuthErrorMessage(message) {
  return AUTH_ERROR_MESSAGES[message] || message || 'Something went wrong. Please try again.'
}
