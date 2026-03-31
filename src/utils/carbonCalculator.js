export function calculateOrderCarbon(items) {
  return items.reduce((sum, item) => sum + (item.carbonFootprint * item.quantity), 0)
}

export const AVERAGE_ORDER_CARBON = 2400

export function calculateCarbonSaved(orderCarbon) {
  return Math.max(0, AVERAGE_ORDER_CARBON - orderCarbon)
}

export const CO2_PER_TREE_YEAR = 21000

export function carbonToTrees(grams) {
  return (grams / CO2_PER_TREE_YEAR).toFixed(3)
}

export function carbonToKmDriving(grams) {
  return (grams / 192).toFixed(1)
}

export function calculateEcoScore(totalCarbonSaved, totalOrdersCount) {
  return Math.min(100, Math.round((totalCarbonSaved / 1000) * 10 + totalOrdersCount * 2))
}
