import type { ReactNode } from "react"
import type {
  BusinessType,
  EventType,
  FormatScale,
  FormatType,
  TimeSlot,
} from "@/lib/types"

type FilterPanelProps = {
  businessType: BusinessType
  eventType: EventType
  formatType: FormatType
  formatScale: FormatScale
  timeSlot: TimeSlot
  minScore: number
  allowedEvents: EventType[]
  onBusinessTypeChange: (value: BusinessType) => void
  onEventTypeChange: (value: EventType) => void
  onFormatTypeChange: (value: FormatType) => void
  onFormatScaleChange: (value: FormatScale) => void
  onTimeSlotChange: (value: TimeSlot) => void
  onMinScoreChange: (value: number) => void
}

const businessTypeOptions: Array<{ value: BusinessType; label: string }> = [
  { value: "coffee", label: "Coffee" },
  { value: "cafe", label: "Cafe" },
  { value: "bakery_dessert", label: "Bakery & Dessert" },
  { value: "bakery", label: "Bakery" },
  { value: "quick_service_food", label: "Quick Service Food" },
  { value: "dine_in_restaurant", label: "Dine-in Restaurant" },
  { value: "bars_nightlife", label: "Bars & Nightlife" },
  { value: "fashion_retail", label: "Fashion Retail" },
  { value: "clothing_retail", label: "Clothing Retail" },
  { value: "jewellery_accessories", label: "Jewellery & Accessories" },
  { value: "gifts_stationery", label: "Gifts & Stationery" },
  { value: "beauty_wellness", label: "Beauty & Wellness" },
  { value: "hair_beauty", label: "Hair & Beauty" },
  { value: "spa_massage", label: "Spa & Massage" },
  { value: "grocery_convenience", label: "Grocery & Convenience" },
  { value: "health_medical", label: "Health & Medical" },
  { value: "dental_clinic", label: "Dental Clinic" },
  { value: "mental_health", label: "Mental Health" },
  { value: "fitness_studio", label: "Fitness Studio" },
  { value: "gym_fitness", label: "Gym & Fitness" },
  { value: "home_living", label: "Home & Living" },
  { value: "furniture_homewares", label: "Furniture & Homewares" },
  { value: "electronics", label: "Electronics" },
  { value: "mobile_tech", label: "Mobile & Tech" },
  { value: "specialty_retail", label: "Specialty Retail" },
  { value: "automotive_services", label: "Automotive Services" },
  { value: "auto_repair", label: "Auto Repair" },
  { value: "professional_services", label: "Professional Services" },
  { value: "finance_legal", label: "Finance & Legal" },
  { value: "government_services", label: "Government Services" },
  { value: "hotel_accommodation", label: "Hotel & Accommodation" },
  { value: "brand_activation", label: "Brand Activation" },
]

const eventTypeOptions: Array<{ value: EventType; label: string }> = [
  { value: "product_launch", label: "Product Launch" },
  { value: "testing_location", label: "Testing Location" },
  { value: "seasonal_sales", label: "Seasonal Sales" },
  { value: "online_to_offline", label: "Online to Offline" },
  { value: "brand_experience", label: "Brand Experience" },
]

const formatTypeOptions: Array<{ value: FormatType; label: string }> = [
  { value: "popup_kiosk", label: "Popup Kiosk" },
  { value: "full_store", label: "Full Store" },
  { value: "procession", label: "Procession" },
]

const formatScaleOptions: Array<{
  value: FormatScale
  label: string
  description: string
}> = [
  {
    value: "compact",
    label: "Compact",
    description: "Best for lean tests, counters, carts, and small-footprint activations.",
  },
  {
    value: "standard",
    label: "Standard",
    description: "Balanced footprint for regular popup kiosks or mid-size retail rollouts.",
  },
  {
    value: "high_capacity",
    label: "High Capacity",
    description: "Designed for heavier throughput, larger store setups, or crowd-led activations.",
  },
]

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#1B120B]/72">
      {children}
    </span>
  )
}

export function FilterPanel({
  businessType,
  eventType,
  formatType,
  formatScale,
  timeSlot,
  minScore,
  allowedEvents,
  onBusinessTypeChange,
  onEventTypeChange,
  onFormatTypeChange,
  onFormatScaleChange,
  onTimeSlotChange,
  onMinScoreChange,
}: FilterPanelProps) {
  return (
    <aside className="rounded-[2rem] bg-[#F9F0E1] p-5 text-[#1B120B] shadow-[0_22px_55px_rgba(109,17,21,0.16)]">
      <div className="mb-5">
        <h2 className="font-display text-2xl font-semibold text-[#D4151C]">Filters</h2>
        <p className="mt-1 text-sm leading-6 text-[#1B120B]/78">
          Tune the demand lens without losing the richer business, event, format, and scale logic.
        </p>
      </div>

      <div className="space-y-4">
        <label className="block">
          <FieldLabel>Business Type</FieldLabel>
          <select
            value={businessType}
            onChange={(event) => onBusinessTypeChange(event.target.value as BusinessType)}
            className="w-full rounded-2xl border border-[#D4151C]/14 bg-[#fff9f0] px-4 py-3 text-base font-semibold text-[#D4151C] outline-none transition focus:border-[#D4151C]/35"
          >
            {businessTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <FieldLabel>Format Type</FieldLabel>
          <select
            value={formatType}
            onChange={(event) => onFormatTypeChange(event.target.value as FormatType)}
            className="w-full rounded-2xl border border-[#D4151C]/14 bg-[#fff9f0] px-4 py-3 text-base font-semibold text-[#D4151C] outline-none transition focus:border-[#D4151C]/35"
          >
            {formatTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <FieldLabel>Event Type</FieldLabel>
          <select
            value={eventType}
            onChange={(event) => onEventTypeChange(event.target.value as EventType)}
            className="w-full rounded-2xl border border-[#D4151C]/14 bg-[#fff9f0] px-4 py-3 text-base font-semibold text-[#D4151C] outline-none transition focus:border-[#D4151C]/35"
          >
            {eventTypeOptions
              .filter((option) => allowedEvents.includes(option.value))
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </select>
        </label>

        <label className="block">
          <FieldLabel>{formatType === "full_store" ? "Store Size" : "Kiosk Size"}</FieldLabel>
          <select
            value={formatScale}
            onChange={(event) => onFormatScaleChange(event.target.value as FormatScale)}
            className="w-full rounded-2xl border border-[#D4151C]/14 bg-[#fff9f0] px-4 py-3 text-base font-semibold text-[#D4151C] outline-none transition focus:border-[#D4151C]/35"
          >
            {formatScaleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm leading-6 text-[#1B120B]/72">
            {
              formatScaleOptions.find((option) => option.value === formatScale)?.description
            }
          </p>
        </label>

        <label className="block">
          <FieldLabel>Time Slot</FieldLabel>
          <select
            value={timeSlot}
            onChange={(event) => onTimeSlotChange(event.target.value as TimeSlot)}
            className="w-full rounded-2xl border border-[#D4151C]/14 bg-[#fff9f0] px-4 py-3 text-base font-semibold text-[#D4151C] outline-none transition focus:border-[#D4151C]/35"
          >
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
          </select>
        </label>

        <label className="block">
          <div className="mb-3 flex items-center justify-between">
            <FieldLabel>Minimum Score</FieldLabel>
            <span className="rounded-full bg-[#D4151C] px-3 py-1 text-sm font-semibold text-[#F9F0E1]">
              {minScore}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={minScore}
            onChange={(event) => onMinScoreChange(Number(event.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#e8d8c0] accent-[#D4151C]"
          />
        </label>
      </div>
    </aside>
  )
}
