import { supabase } from './supabase'
import { normalizeMenuItem } from '../utils/normalize'

export async function getMenuItemsByRestaurant(restaurantId) {
  const { data, error } = await supabase
    .from('menu_items').select('*')
    .eq('restaurant_id', restaurantId).eq('is_available', true).order('category')
  if (error) throw error
  return (data || []).map(normalizeMenuItem)
}
