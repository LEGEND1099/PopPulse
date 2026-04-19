import type { ScoreBreakdown, ScoreInput, Zone } from "@/lib/types"

const businessLabels = {
  coffee: "coffee",
  cafe: "cafe",
  bakery_dessert: "dessert",
  bakery: "bakery",
  quick_service_food: "quick-service food",
  dine_in_restaurant: "restaurant",
  bars_nightlife: "nightlife",
  fashion_retail: "fashion",
  clothing_retail: "clothing",
  jewellery_accessories: "jewellery",
  gifts_stationery: "gifts",
  beauty_wellness: "beauty",
  hair_beauty: "hair & beauty",
  spa_massage: "spa",
  grocery_convenience: "convenience",
  health_medical: "health",
  dental_clinic: "dental",
  mental_health: "mental health",
  fitness_studio: "fitness",
  gym_fitness: "gym",
  home_living: "home living",
  furniture_homewares: "homewares",
  electronics: "electronics",
  mobile_tech: "mobile tech",
  specialty_retail: "specialty retail",
  automotive_services: "automotive",
  auto_repair: "auto repair",
  professional_services: "services",
  finance_legal: "finance/legal",
  government_services: "government",
  hotel_accommodation: "hospitality",
  brand_activation: "activation",
} as const

const timeCopy = {
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
} as const

export function getZoneReasons(
  zone: Zone,
  input: ScoreInput,
  breakdown: ScoreBreakdown,
): string[] {
  const reasons: string[] = []

  if (breakdown.footfall >= 78) {
    reasons.push(`Strong ${timeCopy[input.timeSlot]} footfall`)
  }

  if (breakdown.whiteSpace >= 60) {
    reasons.push(`Lower ${businessLabels[input.businessType]} competition`)
  }

  if (breakdown.contextFit >= 68) {
    const bestTag = zone.businessContext[0]
    if (bestTag) {
      reasons.push(`Good fit for ${bestTag.toLowerCase()} demand`)
    }
  }

  if (breakdown.complementarity >= 70) {
    reasons.push(`Healthy complementary trade nearby`)
  }

  if (input.eventType === "brand_experience" && zone.businessContext.includes("tourist")) {
    reasons.push("Tourist energy suits experiential formats")
  }

  if (input.formatType === "full_store" && breakdown.whiteSpace >= 55) {
    reasons.push("Enough whitespace for a larger footprint")
  }

  if (reasons.length < 2 && breakdown.transitReach >= 70) {
    reasons.push("Reliable transit reach")
  }

  if (reasons.length < 3 && breakdown.costPressure <= 45) {
    reasons.push("Manageable operating pressure")
  }

  return reasons.slice(0, 3)
}
