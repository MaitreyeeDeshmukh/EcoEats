export const ASU_BUILDINGS = [
  { id: 'mU', name: 'Memorial Union', lat: 33.4192, lng: -111.9340 },
  { id: 'byeng', name: 'Brickyard Engineering', lat: 33.4214, lng: -111.9280 },
  { id: 'coor', name: 'Coor Hall', lat: 33.4188, lng: -111.9336 },
  { id: 'asu_union', name: 'ASU Student Union (Downtown)', lat: 33.4502, lng: -112.0740 },
  { id: 'fulton', name: 'Fulton Center', lat: 33.4207, lng: -111.9276 },
  { id: 'noble', name: 'Noble Library', lat: 33.4178, lng: -111.9306 },
  { id: 'hayden', name: 'Hayden Library', lat: 33.4176, lng: -111.9341 },
  { id: 'ghall', name: 'Gammage Auditorium', lat: 33.4145, lng: -111.9262 },
  { id: 'wrigley', name: 'Wrigley Hall', lat: 33.4213, lng: -111.9360 },
  { id: 'lala', name: 'La Loma Complex', lat: 33.4220, lng: -111.9295 },
  { id: 'bateman', name: 'Bateman Physical Sciences F', lat: 33.4186, lng: -111.9317 },
  { id: 'neeb', name: 'Neeb Hall', lat: 33.4182, lng: -111.9323 },
  { id: 'soeba', name: 'School of Earth & Space', lat: 33.4196, lng: -111.9330 },
  { id: 'ecg', name: 'ECG Building', lat: 33.4203, lng: -111.9269 },
  { id: 'poly_mu', name: 'Polytechnic Campus — MU', lat: 33.3063, lng: -111.6789 },
  { id: 'west_fletcher', name: 'West Campus — Fletcher Library', lat: 33.5083, lng: -112.1538 },
  { id: 'dtphx_ucenter', name: 'Downtown Phoenix — UCntr', lat: 33.4488, lng: -112.0674 },
  { id: 'other', name: 'Other / Off-campus', lat: 33.4192, lng: -111.9340 },
]

export function getBuildingById(id) {
  return ASU_BUILDINGS.find((b) => b.id === id) || null
}

export function getBuildingByName(name) {
  return ASU_BUILDINGS.find((b) => b.name.toLowerCase().includes(name.toLowerCase())) || null
}
