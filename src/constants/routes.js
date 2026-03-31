export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  EXPLORE: '/explore',
  RESTAURANT: '/restaurant/:id',
  CART: '/cart',
  ORDER: '/order/:id',
  PROFILE: '/profile',
  IMPACT: '/impact',
  NOT_FOUND: '*',
}

export function restaurantPath(id) {
  return `/restaurant/${id}`
}

export function orderPath(id) {
  return `/order/${id}`
}
