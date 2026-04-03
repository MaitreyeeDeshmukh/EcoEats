import { supabase } from '../lib/supabase'

const MAX_DIMENSION = 800
const WEBP_QUALITY = 0.82

async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => resolve(blob || file),
        'image/webp',
        WEBP_QUALITY
      )
    }
    img.onerror = () => resolve(file)
    img.src = url
  })
}

export async function uploadListingPhoto(file, listingId) {
  try {
    const compressed = await compressImage(file)
    const filename = `${listingId}/${Date.now()}.webp`

    const { error } = await supabase.storage
      .from('listing-images')
      .upload(filename, compressed, { contentType: 'image/webp', upsert: false })

    if (error) return null

    const { data } = supabase.storage.from('listing-images').getPublicUrl(filename)
    return data.publicUrl
  } catch {
    return null
  }
}

export async function uploadAvatar(file, uid) {
  try {
    const compressed = await compressImage(file)
    const filename = `${uid}.webp`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(filename, compressed, { contentType: 'image/webp', upsert: true })

    if (error) return null

    const { data } = supabase.storage.from('avatars').getPublicUrl(filename)
    return data.publicUrl
  } catch {
    return null
  }
}
