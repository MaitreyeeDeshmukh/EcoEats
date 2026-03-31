import { supabase } from './supabase'

function normalizeListing(r) {
  if (!r) return null
  return {
    id: r.id,
    hostId: r.host_id,
    hostName: r.host_name,
    hostBuilding: r.host_building,
    title: r.title,
    description: r.description,
    foodItems: r.food_items || [],
    quantity: r.quantity,
    quantityRemaining: r.quantity_remaining,
    dietaryTags: r.dietary_tags || [],
    imageUrl: r.image_url,
    location: {
      buildingName: r.building_name,
      roomNumber: r.room_number,
      lat: r.lat,
      lng: r.lng,
    },
    expiryMinutes: r.expiry_minutes,
    expiresAt: r.expires_at ? { toDate: () => new Date(r.expires_at) } : null,
    postedAt: r.posted_at ? { toDate: () => new Date(r.posted_at) } : null,
    status: r.status,
    claimedBy: r.claimed_by || [],
  }
}

export async function createListing(data) {
  const expiryMinutes = data.expiryMinutes || 90
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString()

  const { data: row, error } = await supabase.from('listings').insert({
    host_id: data.hostId,
    host_name: data.hostName,
    host_building: data.hostBuilding,
    title: data.title,
    description: data.description,
    food_items: data.foodItems || [],
    quantity: data.quantity,
    quantity_remaining: data.quantity,
    dietary_tags: data.dietaryTags || [],
    image_url: data.imageUrl || null,
    building_name: data.location?.buildingName,
    room_number: data.location?.roomNumber,
    lat: data.location?.lat,
    lng: data.location?.lng,
    expiry_minutes: expiryMinutes,
    expires_at: expiresAt,
    status: 'active',
    claimed_by: [],
  }).select().single()

  if (error) throw error
  return row.id
}

export async function getListingById(id) {
  const { data, error } = await supabase.from('listings').select('*').eq('id', id).single()
  if (error) return null
  return normalizeListing(data)
}

export async function cancelListing(id) {
  const { error } = await supabase.from('listings').update({ status: 'cancelled' }).eq('id', id)
  if (error) throw error
}

export function subscribeToActiveListings(callback) {
  // Initial fetch
  async function fetchActive() {
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .order('posted_at', { ascending: false })
      .limit(30)
    callback((data || []).map(normalizeListing))
  }

  fetchActive()

  // Real-time updates
  const channel = supabase
    .channel('active-listings')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => {
      fetchActive()
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export function subscribeToHostListings(hostId, callback) {
  async function fetchHost() {
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('host_id', hostId)
      .order('posted_at', { ascending: false })
      .limit(20)
    callback((data || []).map(normalizeListing))
  }

  fetchHost()

  const channel = supabase
    .channel(`host-listings-${hostId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'listings', filter: `host_id=eq.${hostId}` }, () => {
      fetchHost()
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export async function expireOldListings() {
  await supabase.rpc('expire_old_listings').catch(() => {})
}

// Transactional claim using Supabase RPC
export async function transactionalClaim(listingId, studentId) {
  // Fetch current listing
  const { data: listing, error: fetchErr } = await supabase
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .single()

  if (fetchErr || !listing) throw new Error('Listing not found')
  if (listing.status !== 'active') throw new Error('Listing is no longer active')
  if (listing.quantity_remaining <= 0) throw new Error('No portions remaining')
  if ((listing.claimed_by || []).includes(studentId)) throw new Error('Already claimed')

  const newQty = listing.quantity_remaining - 1
  const newStatus = newQty <= 0 ? 'claimed' : 'active'
  const newClaimedBy = [...(listing.claimed_by || []), studentId]

  const { error: updateErr } = await supabase
    .from('listings')
    .update({
      quantity_remaining: newQty,
      status: newStatus,
      claimed_by: newClaimedBy,
    })
    .eq('id', listingId)
    .eq('quantity_remaining', listing.quantity_remaining) // optimistic lock

  if (updateErr) throw new Error('Claim failed — someone else just claimed it')
  return 1
}
