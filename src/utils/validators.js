export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email) return 'Email is required'
  if (!re.test(email)) return 'Enter a valid email address'
  return null
}

export function validatePassword(password) {
  if (!password) return 'Password is required'
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (!/\d/.test(password)) return 'Password must contain at least one number'
  return null
}

export function validateName(name) {
  if (!name || !name.trim()) return 'Name is required'
  if (name.trim().length < 2) return 'Name must be at least 2 characters'
  return null
}

export function validatePincode(pincode) {
  if (!pincode) return 'Pincode is required'
  if (!/^\d{6}$/.test(pincode)) return 'Enter a valid 6-digit pincode'
  return null
}

export function validateRequired(value, fieldName) {
  if (!value || !String(value).trim()) return `${fieldName} is required`
  return null
}
