export const CUISINE_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'indian', label: 'Indian' },
  { id: 'continental', label: 'Continental' },
  { id: 'healthy', label: 'Healthy' },
  { id: 'cafe', label: 'Cafe' },
  { id: 'street', label: 'Street Food' },
  { id: 'desserts', label: 'Desserts' },
]

export const DIETARY_TAGS = [
  { id: 'veg', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'glutenFree', label: 'Gluten-Free' },
]

export const ORDER_STATUSES = {
  pending: { label: 'Pending', color: 'bg-neutral-100 text-neutral-700' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700' },
  preparing: { label: 'Preparing', color: 'bg-earth-100 text-earth-600' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-orange-100 text-orange-700' },
  delivered: { label: 'Delivered', color: 'bg-brand-100 text-brand-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
}
