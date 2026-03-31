import { supabase } from './supabase'

const RESERVATION_MINUTES = 20

function normalizeClaim(r) {
  if (!r) return null
  return {
    id: r.id,
    listingId: r.listing_id,
    studentId: r.student_id,
    studentName: r.student_name,
    quantity: r.quantity,
    claimedAt: r.claimed_at ? { toDate: () => new Date(r.claimed_at) } : null,
    pickedUpAt: r.picked_up_at ? { toDate: () => new Date(r.picked_up_at) } : null,
    status: r.status,
    reservationExpiresAt: r.reservation_expires_at ? new Date(r.reservation_expires_at) : null,
    rating: r.rating,
  }
}

export async function createClaim(listingId, studentId, studentName, quantity) {
  const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000).toISOString()

  const { data, error } = await supabase.from('claims').insert({
    listing_id: listingId,
    student_id: studentId,
    student_name: studentName,
    quantity,
    status: 'pending',
    reservation_expires_at: expiresAt,
    rating: null,
  }).select().single()

  if (error) throw error
  return data.id
}

export async function confirmPickup(claimId, rating = null) {
  const { error } = await supabase.from('claims').update({
    status: 'picked_up',
    picked_up_at: new Date().toISOString(),
    rating,
  }).eq('id', claimId)
  if (error) throw error
}

export async function markNoShow(claimId) {
  const { error } = await supabase.from('claims').update({ status: 'no_show' }).eq('id', claimId)
  if (error) throw error
}

export function subscribeToStudentClaims(studentId, callback) {
  async function fetchClaims() {
    const { data } = await supabase
      .from('claims')
      .select('*')
      .eq('student_id', studentId)
      .order('claimed_at', { ascending: false })
      .limit(20)
    callback((data || []).map(normalizeClaim))
  }

  fetchClaims()

  const channel = supabase
    .channel(`student-claims-${studentId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'claims', filter: `student_id=eq.${studentId}` }, () => {
      fetchClaims()
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export function subscribeToListingClaims(listingId, callback) {
  async function fetchClaims() {
    const { data } = await supabase
      .from('claims')
      .select('*')
      .eq('listing_id', listingId)
      .order('claimed_at', { ascending: false })
    callback((data || []).map(normalizeClaim))
  }

  fetchClaims()

  const channel = supabase
    .channel(`listing-claims-${listingId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'claims', filter: `listing_id=eq.${listingId}` }, () => {
      fetchClaims()
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}

export async function submitReport(data) {
  // Just log for now — can add a reports table later
  console.warn('Report submitted:', data)
}
