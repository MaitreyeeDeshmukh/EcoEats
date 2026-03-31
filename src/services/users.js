import { supabase } from './supabase'

export async function getUserDocument(uid) {
  const { data, error } = await supabase.from('users').select('*').eq('id', uid).single()
  if (error) return null
  return data
}

export async function updateUserName(uid, name) {
  const { error } = await supabase.from('users').update({ name }).eq('id', uid)
  if (error) throw error
}

export async function updateFavourites(uid, restaurantId, isFav) {
  const user = await getUserDocument(uid)
  const current = user?.favourite_restaurants || []
  const updated = isFav
    ? [...new Set([...current, restaurantId])]
    : current.filter(id => id !== restaurantId)
  const { error } = await supabase.from('users').update({ favourite_restaurants: updated }).eq('id', uid)
  if (error) throw error
}

export async function addSavedAddress(uid, address) {
  const user = await getUserDocument(uid)
  const current = user?.saved_addresses || []
  const { error } = await supabase.from('users').update({ saved_addresses: [...current, address] }).eq('id', uid)
  if (error) throw error
}

export async function removeSavedAddress(uid, address) {
  const user = await getUserDocument(uid)
  const current = user?.saved_addresses || []
  const { error } = await supabase.from('users').update({ saved_addresses: current.filter(a => a !== address) }).eq('id', uid)
  if (error) throw error
}

export async function updateUserStatsAfterOrder(uid, carbonSaved) {
  const user = await getUserDocument(uid)
  const { error } = await supabase.from('users').update({
    total_orders_count: (user?.total_orders_count || 0) + 1,
    total_carbon_saved: (user?.total_carbon_saved || 0) + carbonSaved,
  }).eq('id', uid)
  if (error) throw error
}
