import { NextRequest, NextResponse } from "next/server"
import { getZones } from "@/lib/getZones"
import { getZoneReasons } from "@/lib/reasons"
import { scoreZone } from "@/lib/score"
import type {
  BusinessType,
  EventType,
  FormatScale,
  FormatType,
  TimeSlot,
  ZoneWithScore,
} from "@/lib/types"

function parseBusinessType(value: string | null): BusinessType {
  const allowed: BusinessType[] = [
    "coffee",
    "cafe",
    "bakery_dessert",
    "bakery",
    "quick_service_food",
    "dine_in_restaurant",
    "bars_nightlife",
    "fashion_retail",
    "clothing_retail",
    "jewellery_accessories",
    "gifts_stationery",
    "beauty_wellness",
    "hair_beauty",
    "spa_massage",
    "grocery_convenience",
    "health_medical",
    "dental_clinic",
    "mental_health",
    "fitness_studio",
    "gym_fitness",
    "home_living",
    "furniture_homewares",
    "electronics",
    "mobile_tech",
    "specialty_retail",
    "automotive_services",
    "auto_repair",
    "professional_services",
    "finance_legal",
    "government_services",
    "hotel_accommodation",
    "brand_activation",
  ]

  return allowed.includes(value as BusinessType) ? (value as BusinessType) : "coffee"
}

function parseEventType(value: string | null): EventType {
  const allowed: EventType[] = [
    "product_launch",
    "testing_location",
    "seasonal_sales",
    "online_to_offline",
    "brand_experience",
  ]

  return allowed.includes(value as EventType) ? (value as EventType) : "testing_location"
}

function parseFormatType(value: string | null): FormatType {
  const allowed: FormatType[] = ["popup_kiosk", "full_store", "procession"]
  return allowed.includes(value as FormatType) ? (value as FormatType) : "popup_kiosk"
}

function parseFormatScale(value: string | null): FormatScale {
  const allowed: FormatScale[] = ["compact", "standard", "high_capacity"]
  return allowed.includes(value as FormatScale) ? (value as FormatScale) : "standard"
}

function parseTimeSlot(value: string | null): TimeSlot {
  const allowed: TimeSlot[] = ["morning", "afternoon", "evening"]
  return allowed.includes(value as TimeSlot) ? (value as TimeSlot) : "afternoon"
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const minScore = Number(params.get("minScore") ?? "0")
  const input = {
    businessType: parseBusinessType(params.get("businessType")),
    eventType: parseEventType(params.get("eventType")),
    formatType: parseFormatType(params.get("formatType")),
    formatScale: parseFormatScale(params.get("formatScale")),
    timeSlot: parseTimeSlot(params.get("timeSlot")),
  }

  const shortlisted: ZoneWithScore[] = getZones()
    .map((zone) => {
      const scored = scoreZone(zone, input)
      return {
        ...zone,
        score: scored.score,
        breakdown: scored.breakdown,
        reasons: getZoneReasons(zone, input, scored.breakdown),
      }
    })
    .filter((zone) => zone.score >= minScore)
    .sort((left, right) => right.score - left.score)

  return NextResponse.json({
    filters: {
      ...input,
      minScore,
    },
    count: shortlisted.length,
    zones: shortlisted,
  })
}
