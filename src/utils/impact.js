export const CO2_PER_MEAL_KG = 0.5
export const POINTS_PER_MEAL = 10

export function calcCo2Saved(mealsRescued) {
  return (mealsRescued * CO2_PER_MEAL_KG).toFixed(1)
}

export function calcPoints(mealsRescued) {
  return mealsRescued * POINTS_PER_MEAL
}

export function formatImpactNumber(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

// Weekly goal: 500 meals rescued
export const WEEKLY_GOAL = 500

export function weeklyProgress(mealsThisWeek) {
  return Math.min((mealsThisWeek / WEEKLY_GOAL) * 100, 100)
}
