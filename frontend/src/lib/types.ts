export type Zone = {
  id: string
  name: string
  lat: number
  lng: number
  suburb: string
  businessContext: string[]
  footfallMorning: number
  footfallAfternoon: number
  footfallEvening: number
  competitionCoffee: number
  competitionFood: number
  competitionRetail: number
  complementarityCoffee: number
  complementarityFood: number
  complementarityRetail: number
  permitFriction: number
  costPressure: number
}

export type BusinessInsight = {
  zoneId: string
  suburb: string
  storeCount: number
  catchmentStoreCount: number
  catchmentConfidence: number
  catchmentMethod: string
  coffeeCount: number
  foodCount: number
  retailCount: number
  clusterId: number
  clusterLabel: string
  clusterSummary: string
  topSectors: Array<{
    sector: string
    count: number
  }>
  topSubsectors: Array<{
    sector: string
    count: number
  }>
  insightBadge: string
}

export type BusinessType =
  | "coffee"
  | "cafe"
  | "bakery_dessert"
  | "bakery"
  | "quick_service_food"
  | "dine_in_restaurant"
  | "bars_nightlife"
  | "fashion_retail"
  | "clothing_retail"
  | "jewellery_accessories"
  | "gifts_stationery"
  | "beauty_wellness"
  | "hair_beauty"
  | "spa_massage"
  | "grocery_convenience"
  | "health_medical"
  | "dental_clinic"
  | "mental_health"
  | "fitness_studio"
  | "gym_fitness"
  | "home_living"
  | "furniture_homewares"
  | "electronics"
  | "mobile_tech"
  | "specialty_retail"
  | "automotive_services"
  | "auto_repair"
  | "professional_services"
  | "finance_legal"
  | "government_services"
  | "hotel_accommodation"
  | "brand_activation"

export type EventType =
  | "product_launch"
  | "testing_location"
  | "seasonal_sales"
  | "online_to_offline"
  | "brand_experience"

export type FormatType = "popup_kiosk" | "full_store" | "procession"

export type FormatScale = "compact" | "standard" | "high_capacity"

export type TimeSlot = "morning" | "afternoon" | "evening"

export type ScoreBreakdown = {
  footfall: number
  contextFit: number
  whiteSpace: number
  complementarity: number
  transitReach: number
  permitFriction: number
  costPressure: number
}

export type ScoreInput = {
  businessType: BusinessType
  eventType: EventType
  formatType: FormatType
  formatScale: FormatScale
  timeSlot: TimeSlot
}

export type ScoreResult = {
  score: number
  breakdown: ScoreBreakdown
}

export type ZoneWithScore = Zone &
  ScoreResult & {
    reasons: string[]
    businessInsight?: BusinessInsight
  }
