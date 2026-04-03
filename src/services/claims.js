import { supabase } from '../lib/supabase'

const RESERVATION_MINUTES = 20

function normalizeClaim(data) {
  return {
    id: data.id,
    listingId: data.listing_id,
    studentId: data.claimed_by,
    studentName: data.student_name || '',
    quantity: data.quantity || 1,
    status: data.status === 'reserved' ? 'pending' : (data.status || 'pending'),
    claimedAt: data.claimed_at
      ? { toDate: () => new Date(data.claimed_at) }
      : null,
    reservationExpiresAt: data.reservation_expires_at
      ? new Date(data.reservation_expires_at)
      : null,
    rating: data.rating || 0,
  }
}

export async function createClaim(listingId, studentId, studentName, quantity) {
  const reservationExpiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000).toISOString()

  const { data, error } = await supabase.from('claims').insert({
    listing_id: listingId,
    claimed_by: studentId,
    student_name: studentName,
    quantity,
    status: 'reserved',
    reservation_expires_at: reservationExpiresAt,
    rating: null,
  }).select().single()

  if (error) throw error
  return data.id
}

export async function confirmPickup(claimId, _rating = null) {
  const { error } = await supabase.from('claims').update({
    status: 'picked_up',
    resolved_at: new Date().toISOString(),
  }).eq('id', claimId)
  if (error) throw error
}

export async function markNoShow(claimId) {
  const { error } = await supabase.from('claims').update({
    status: 'no_show',
    resolved_at: new Date().toISOString(),
  }).eq('id', claimId)
  if (error) throw error
}

export async function submitRating(claimId, rating) {
  const { error } = await supabase.from('claims').update({ rating }).eq('id', claimId)
  if (error) throw error
}

export function subscribeToStudentClaims(studentId, callback) {
  async function fetch() {
    const { data } = await supabase
      .from('claims')
      .select('*')
      .eq('claimed_by', studentId)
      .order('claimed_at', { ascending: false })
      .limit(20)
    callback((data || []).map(normalizeClaim))
  }

  fetch()

  const channel = supabase
    .channel(`student-claims-${studentId}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'claims',
      filter: `claimed_by=eq.${studentId}`,
    }, fetch)
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export function subscribeToListingClaims(listingId, callback) {
  async function fetch() {
    const { data } = await supabase
      .from('claims')
      .select('*')
      .eq('listing_id', listingId)
      .order('claimed_at', { ascending: false })
    callback((data || []).map(normalizeClaim))
  }

  fetch()

  const channel = supabase
    .channel(`listing-claims-${listingId}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'claims',
      filter: `listing_id=eq.${listingId}`,
    }, fetch)
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export async function submitReport(data) {
  console.warn('submitReport called — reports table not in schema, logging:', data)
}
