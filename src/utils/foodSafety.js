export const DEFAULT_EXPIRY_MINUTES = 90
export const MAX_EXPIRY_MINUTES = 180

export function calcExpiresAt(minutesFromNow = DEFAULT_EXPIRY_MINUTES) {
  return new Date(Date.now() + minutesFromNow * 60 * 1000)
}

export function getTimeRemaining(expiresAt) {
  if (!expiresAt) return null
  const target = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt)
  const diff = target - Date.now()
  if (diff <= 0) return { expired: true, display: 'Expired', minutes: 0, seconds: 0 }

  const totalSeconds = Math.floor(diff / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  let display
  if (minutes >= 60) {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    display = `${hrs}h ${mins}m`
  } else if (minutes >= 10) {
    display = `${minutes}m`
  } else {
    display = `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  return { expired: false, display, minutes, seconds, totalSeconds }
}

export function isUrgent(expiresAt) {
  const remaining = getTimeRemaining(expiresAt)
  return remaining && !remaining.expired && remaining.minutes < 15
}

export const FOOD_SAFETY_CHECKLIST = [
  'Food was prepared or handled in a licensed kitchen or professional catering event',
  'Food has been stored at safe temperatures (hot foods above 140°F, cold below 40°F)',
  'Food is still within 4 hours of being prepared',
  'There are no known allergens beyond what is labeled in the dietary tags',
  'I understand this listing is protected under the Bill Emerson Good Samaritan Food Donation Act',
]
