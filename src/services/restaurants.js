import { supabase } from './supabase'
import { normalizeRestaurant } from '../utils/normalize'

export async function getRestaurants({ category } = {}) {
  let query = supabase.from('restaurants').select('*').limit(30)
  if (category && category !== 'all') query = query.eq('category', category)
  const { data, error } = await query
  if (error) throw error
  return (data || []).map(normalizeRestaurant)
}

export async function getFeaturedRestaurants() {
  const { data, error } = await supabase
    .from('restaurants').select('*').eq('is_eco_certified', true)
    .order('eco_rating', { ascending: false }).limit(6)
  if (error) throw error
  return (data || []).map(normalizeRestaurant)
}

export async function getRestaurantById(id) {
  const { data, error } = await supabase.from('restaurants').select('*').eq('id', id).single()
  if (error) return null
  return normalizeRestaurant(data)
}

export async function getRestaurantStats() {
  const { count } = await supabase.from('restaurants').select('*', { count: 'exact', head: true })
  return { totalRestaurants: count || 0 }
}
