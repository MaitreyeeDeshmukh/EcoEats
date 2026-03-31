// Normalize Supabase snake_case rows to camelCase for UI components

export function normalizeRestaurant(r) {
  if (!r) return null
  return {
    ...r,
    cuisineType: r.cuisine_type,
    imageURL: r.image_url,
    deliveryTimeMin: r.delivery_time_min,
    deliveryFee: r.delivery_fee,
    minimumOrder: r.minimum_order,
    isOpen: r.is_open,
    isEcoCertified: r.is_eco_certified,
    ecoRating: r.eco_rating,
    carbonFootprintPerOrder: r.carbon_footprint_per_order,
    packagingType: r.packaging_type,
    reviewCount: r.review_count,
    menuCategories: r.menu_categories,
  }
}

export function normalizeMenuItem(item) {
  if (!item) return null
  return {
    ...item,
    restaurantId: item.restaurant_id,
    imageURL: item.image_url,
    isVegetarian: item.is_vegetarian,
    isVegan: item.is_vegan,
    carbonFootprint: item.carbon_footprint,
    ecoScore: item.eco_score,
    isAvailable: item.is_available,
    isBestSeller: item.is_best_seller,
  }
}

export function normalizeOrder(o) {
  if (!o) return null
  return {
    ...o,
    userId: o.user_id,
    restaurantId: o.restaurant_id,
    restaurantName: o.restaurant_name,
    deliveryFee: o.delivery_fee,
    estimatedDeliveryTime: o.estimated_delivery_time,
    totalCarbonFootprint: o.total_carbon_footprint,
    carbonSavedVsAverage: o.carbon_saved_vs_average,
    paymentMethod: o.payment_method,
    paymentStatus: o.payment_status,
    createdAt: o.created_at ? { toDate: () => new Date(o.created_at) } : null,
    updatedAt: o.updated_at ? { toDate: () => new Date(o.updated_at) } : null,
  }
}

export function normalizeProfile(p) {
  if (!p) return null
  return {
    ...p,
    photoURL: p.photo_url,
    totalCarbonSaved: p.total_carbon_saved,
    totalOrdersCount: p.total_orders_count,
    savedAddresses: p.saved_addresses || [],
    favouriteRestaurants: p.favourite_restaurants || [],
    ecoScore: p.eco_score,
  }
}

export function normalizeReview(r) {
  if (!r) return null
  return {
    ...r,
    userId: r.user_id,
    userName: r.user_name,
    userPhotoURL: r.user_photo_url,
    restaurantId: r.restaurant_id,
    orderId: r.order_id,
    ecoRating: r.eco_rating,
    createdAt: r.created_at ? { toDate: () => new Date(r.created_at) } : null,
  }
}
