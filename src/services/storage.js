import { supabase } from './supabase'

export async function uploadListingImage(uid, file) {
  const ext = file.name.split('.').pop()
  const path = `listings/${uid}/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from('listing-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error

  const { data } = supabase.storage.from('listing-images').getPublicUrl(path)
  return data.publicUrl
}

// Alias used by PostForm
export const uploadListingPhoto = uploadListingImage

export async function deleteListingImage(url) {
  // Extract path from public URL
  const parts = url.split('/listing-images/')
  if (parts.length < 2) return
  const path = parts[1]
  await supabase.storage.from('listing-images').remove([path])
}
