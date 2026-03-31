import { supabase } from './supabase'

export async function getEcoTips(limit = 5) {
  const { data, error } = await supabase.from('eco_tips').select('*').limit(limit)
  if (error) throw error
  return data || []
}
