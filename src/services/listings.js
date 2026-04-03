import { supabase } from '../lib/supabase'

const PAGE_SIZE = 50

function normalizeListing(data) {
  const qty = parseInt(data.quantity) || 1
  return {
    id: data.id,
    hostId: data.created_by,
    hostName: data.host_name || data.users?.name || 'Anonymous',
    hostBuilding: data.host_building || data.building || '',
    title: data.title,
    description: data.description || '',
    foodItems: data.food_items || [],
    quantity: qty,
    quantityRemaining: data.quantity_remaining ?? qty,
    dietaryTags: data.dietary_tags || [],
    imageUrl: data.image_url || null,
    location: {
      lat: data.lat,
      lng: data.lng,
      buildingName: data.building || data.location || '',
      roomNumber: data.room_number || '',
    },
    expiresAt: data.pickup_by
      ? { toDate: () => new Date(data.pickup_by), _isTimestamp: true }
      : null,
    status: data.status || (data.is_available ? 'active' : 'claimed'),
    claimedBy: [],
    postedAt: data.created_at ? new Date(data.created_at) : new Date(),
  }
}

async function fetchActiveListings() {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('is_available', true)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  if (error) throw error
  return (data || []).map(normalizeListing)
}

export function subscribeToActiveListings(callback) {
  fetchActiveListings().then(callback).catch(console.error)

  const channel = supabase
    .channel('active-listings')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => {
      fetchActiveListings().then(callback).catch(console.error)
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export function subscribeToHostListings(hostId, callback) {
  async function fetch() {
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('created_by', hostId)
      .order('created_at', { ascending: false })
      .limit(20)
    callback((data || []).map(normalizeListing))
  }

  fetch()

  const channel = supabase
    .channel(`host-listings-${hostId}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'listings',
      filter: `created_by=eq.${hostId}`,
    }, fetch)
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export async function createListing(data) {
  const expiryMinutes = data.expiryMinutes || 90
  const pickupBy = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString()

  const { data: listing, error } = await supabase.from('listings').insert({
    created_by: data.hostId,
    host_name: data.hostName,
    host_building: data.hostBuilding,
    title: data.title,
    description: data.description,
    food_items: data.foodItems || [],
    quantity: String(data.quantity),
    quantity_remaining: data.quantity,
    dietary_tags: data.dietaryTags || [],
    image_url: data.imageUrl || null,
    lat: data.location?.lat || null,
    lng: data.location?.lng || null,
    building: data.location?.buildingName || '',
    room_number: data.location?.roomNumber || '',
    location: data.location?.buildingName || '',
    pickup_by: pickupBy,
    expiry_minutes: expiryMinutes,
    status: 'active',
    is_available: true,
    category: 'meal',
  }).select().single()

  if (error) throw error
  return listing.id
}

export async function getListingById(id) {
  const { data, error } = await supabase.from('listings').select('*').eq('id', id).single()
  if (error || !data) return null
  return normalizeListing(data)
}

export async function updateListing(id, data) {
  const mapped = {}
  if (data.status !== undefined) mapped.status = data.status
  if (data.is_available !== undefined) mapped.is_available = data.is_available
  if (data.quantityRemaining !== undefined) mapped.quantity_remaining = data.quantityRemaining

  const { error } = await supabase.from('listings').update(mapped).eq('id', id)
  if (error) throw error
}

export async function cancelListing(id) {
  const { error } = await supabase.from('listings').update({
    is_available: false,
    status: 'cancelled',
  }).eq('id', id)
  if (error) throw error
}

export async function transactionalClaim(listingId, studentId) {
  const { data: existingClaim } = await supabase
    .from('claims')
    .select('id')
    .eq('listing_id', listingId)
    .eq('claimed_by', studentId)
    .maybeSingle()

  if (existingClaim) throw new Error('Already claimed')

  const { data: listing, error: fetchError } = await supabase
    .from('listings')
    .select('quantity_remaining, is_available, status')
    .eq('id', listingId)
    .single()

  if (fetchError || !listing) throw new Error('Listing not found')
  if (!listing.is_available || listing.status !== 'active') throw new Error('Listing is no longer active')
  if ((listing.quantity_remaining ?? 0) <= 0) throw new Error('No portions remaining')

  const newQty = (listing.quantity_remaining ?? 1) - 1
  const updates = { quantity_remaining: newQty }
  if (newQty <= 0) { updates.is_available = false; updates.status = 'claimed' }

  const { error: updateError } = await supabase.from('listings').update(updates).eq('id', listingId)
  if (updateError) throw new Error('Claim failed — please try again')

  return 1
}

export async function expireOldListings() {
  await supabase
    .from('listings')
    .update({ is_available: false, status: 'expired' })
    .lt('pickup_by', new Date().toISOString())
    .eq('is_available', true)
    .eq('status', 'active')
}

export async function fetchMoreListings(_lastDoc) {
  return []
}
