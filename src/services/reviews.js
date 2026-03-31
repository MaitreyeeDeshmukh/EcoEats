import { supabase } from './supabase'
import { normalizeReview } from '../utils/normalize'

export async function getReviewsByRestaurant(restaurantId, limit = 20) {
  const { data, error } = await supabase.from('reviews').select('*')
    .eq('restaurant_id', restaurantId).order('created_at', { ascending: false }).limit(limit)
  if (error) throw error
  return (data || []).map(normalizeReview)
}

export async function addReview(reviewData) {
  const { error } = await supabase.from('reviews').insert(reviewData)
  if (error) throw error
}

export async function deleteReview(reviewId) {
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId)
  if (error) throw error
}
