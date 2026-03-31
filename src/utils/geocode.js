const BASE = 'https://nominatim.openstreetmap.org'

export async function searchLocations(query) {
  if (!query || query.length < 3) return []
  const res = await fetch(
    `${BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`,
    { headers: { 'Accept-Language': 'en', 'User-Agent': 'EcoEats/1.0 contact@ecoeats.app' } }
  )
  if (!res.ok) throw new Error('Geocoding failed')
  const data = await res.json()
  return data.map(r => ({
    label: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  }))
}

export async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `${BASE}/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: { 'Accept-Language': 'en', 'User-Agent': 'EcoEats/1.0 contact@ecoeats.app' } }
  )
  if (!res.ok) throw new Error('Reverse geocoding failed')
  const data = await res.json()
  return data.display_name
}
