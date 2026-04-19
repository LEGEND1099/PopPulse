import type {
  BusinessType,
  EventType,
  FormatScale,
  FormatType,
  ScoreBreakdown,
  ScoreInput,
  ScoreResult,
  Zone,
} from "@/lib/types"

const contextPreferences: Record<BusinessType, string[]> = {
  coffee: ["commuter", "office", "university", "morning"],
  cafe: ["commuter", "office", "retail", "morning"],
  bakery_dessert: ["retail", "tourist", "nightlife", "university"],
  bakery: ["commuter", "morning", "family", "retail"],
  quick_service_food: ["commuter", "retail", "nightlife", "office"],
  dine_in_restaurant: ["nightlife", "retail", "tourist", "office"],
  bars_nightlife: ["nightlife", "tourist", "retail", "weekend"],
  fashion_retail: ["shopping", "tourist", "office", "retail"],
  clothing_retail: ["shopping", "tourist", "retail", "office"],
  jewellery_accessories: ["shopping", "tourist", "retail", "office"],
  gifts_stationery: ["shopping", "tourist", "commuter", "retail"],
  beauty_wellness: ["shopping", "office", "retail", "weekend"],
  hair_beauty: ["shopping", "office", "retail", "weekday"],
  spa_massage: ["shopping", "tourist", "weekend", "retail"],
  grocery_convenience: ["commuter", "family", "office", "retail"],
  health_medical: ["office", "family", "retail", "weekday"],
  dental_clinic: ["office", "family", "weekday", "retail"],
  mental_health: ["office", "weekday", "family", "retail"],
  fitness_studio: ["office", "commuter", "weekend", "retail"],
  gym_fitness: ["office", "commuter", "weekend", "retail"],
  home_living: ["shopping", "family", "retail", "weekend"],
  furniture_homewares: ["shopping", "family", "retail", "weekend"],
  electronics: ["shopping", "office", "commuter", "retail"],
  mobile_tech: ["shopping", "commuter", "office", "retail"],
  specialty_retail: ["shopping", "tourist", "retail", "weekend"],
  automotive_services: ["commuter", "family", "weekday", "retail"],
  auto_repair: ["commuter", "family", "weekday", "retail"],
  professional_services: ["office", "commuter", "weekday", "retail"],
  finance_legal: ["office", "weekday", "commuter", "retail"],
  government_services: ["office", "commuter", "weekday", "retail"],
  hotel_accommodation: ["tourist", "nightlife", "retail", "weekend"],
  brand_activation: ["tourist", "office", "nightlife", "shopping"],
}

const eventBonuses: Record<EventType, string[]> = {
  product_launch: ["tourist", "office", "shopping"],
  testing_location: ["office", "university", "commuter"],
  seasonal_sales: ["shopping", "retail", "tourist"],
  online_to_offline: ["shopping", "office", "commuter"],
  brand_experience: ["tourist", "nightlife", "shopping"],
}

const formatExpectations: Record<FormatType, string[]> = {
  popup_kiosk: ["commuter", "office", "shopping"],
  full_store: ["shopping", "office", "retail"],
  procession: ["tourist", "nightlife", "retail"],
}

const scaleAdjustments: Record<FormatScale, { crowdNeed: number; costTolerance: number }> = {
  compact: { crowdNeed: -8, costTolerance: 1.15 },
  standard: { crowdNeed: 0, costTolerance: 1 },
  high_capacity: { crowdNeed: 10, costTolerance: 0.88 },
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

function normalizeTag(tag: string) {
  return tag.trim().toLowerCase().replace(/\s+/g, "_")
}

function getFootfall(zone: Zone, timeSlot: ScoreInput["timeSlot"]) {
  if (timeSlot === "morning") {
    return zone.footfallMorning
  }

  if (timeSlot === "afternoon") {
    return zone.footfallAfternoon
  }

  return zone.footfallEvening
}

function getCompetition(zone: Zone, businessType: BusinessType) {
  if (businessType === "coffee" || businessType === "cafe" || businessType === "bakery") {
    return zone.competitionCoffee
  }

  if (
    businessType === "bakery_dessert" ||
    businessType === "quick_service_food" ||
    businessType === "dine_in_restaurant" ||
    businessType === "bars_nightlife"
  ) {
    return zone.competitionFood
  }

  if (businessType === "grocery_convenience") {
    return clamp(zone.competitionFood * 0.7 + zone.competitionRetail * 0.3)
  }

  return zone.competitionRetail
}

function getComplementarity(zone: Zone, businessType: BusinessType) {
  if (businessType === "coffee" || businessType === "cafe" || businessType === "bakery") {
    return zone.complementarityCoffee
  }

  if (
    businessType === "bakery_dessert" ||
    businessType === "quick_service_food" ||
    businessType === "dine_in_restaurant" ||
    businessType === "bars_nightlife"
  ) {
    return zone.complementarityFood
  }

  if (businessType === "grocery_convenience") {
    return clamp(zone.complementarityFood * 0.7 + zone.complementarityRetail * 0.3)
  }

  return zone.complementarityRetail
}

function computeContextFit(zone: Zone, input: ScoreInput) {
  const tags = zone.businessContext.map(normalizeTag)
  const preferredTags = new Set([
    ...contextPreferences[input.businessType],
    ...eventBonuses[input.eventType],
    ...formatExpectations[input.formatType],
  ])

  let matched = 0
  preferredTags.forEach((tag) => {
    if (tags.includes(tag)) {
      matched += 1
    }
  })

  const densityBoost = Math.min(tags.length * 3, 12)
  return clamp((matched / preferredTags.size) * 88 + densityBoost)
}

function applyFormatModifiers(
  breakdown: ScoreBreakdown,
  zone: Zone,
  input: ScoreInput,
): ScoreBreakdown {
  const adjustments = scaleAdjustments[input.formatScale]
  const result = { ...breakdown }

  result.footfall = clamp(result.footfall + adjustments.crowdNeed)
  result.transitReach = clamp(result.transitReach + adjustments.crowdNeed)
  result.costPressure = clamp(zone.costPressure * adjustments.costTolerance)

  if (input.formatType === "popup_kiosk") {
    result.permitFriction = clamp(zone.permitFriction * 0.92)
  } else if (input.formatType === "full_store") {
    result.permitFriction = clamp(zone.permitFriction * 1.08)
    result.whiteSpace = clamp(result.whiteSpace + 4)
  } else {
    result.permitFriction = clamp(zone.permitFriction * 1.15)
    result.complementarity = clamp(result.complementarity + 5)
  }

  return result
}

function calibrateScore(rawScore: number) {
  return clamp(rawScore * 1.08 + 6)
}

export function scoreZone(zone: Zone, input: ScoreInput): ScoreResult {
  const baseFootfall = getFootfall(zone, input.timeSlot)
  const competition = getCompetition(zone, input.businessType)
  const complementarity = getComplementarity(zone, input.businessType)

  const initialBreakdown: ScoreBreakdown = {
    footfall: baseFootfall,
    contextFit: computeContextFit(zone, input),
    whiteSpace: clamp(100 - competition),
    complementarity,
    transitReach: baseFootfall,
    permitFriction: zone.permitFriction,
    costPressure: zone.costPressure,
  }

  const breakdown = applyFormatModifiers(initialBreakdown, zone, input)
  const score =
    0.35 * breakdown.footfall +
    0.2 * breakdown.contextFit +
    0.15 * breakdown.whiteSpace +
    0.15 * breakdown.complementarity +
    0.1 * breakdown.transitReach -
    0.03 * breakdown.permitFriction -
    0.02 * breakdown.costPressure

  return {
    score: Number(calibrateScore(score).toFixed(2)),
    breakdown,
  }
}
