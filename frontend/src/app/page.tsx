"use client"

import { useEffect, useMemo, useState } from "react"
import { FilterPanel } from "@/components/FilterPanel"
import { HeaderBar } from "@/components/HeaderBar"
import { IntroOverlay } from "@/components/IntroOverlay"
import { MapView } from "@/components/MapView"
import { CompareModal } from "@/components/CompareModal"
import { TopZonesPanel } from "@/components/TopZonesPanel"
import { ZoneDrawer } from "@/components/ZoneDrawer"
import { useZones } from "@/hooks/useZones"
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

const allowedEventsByFormat: Record<FormatType, EventType[]> = {
  popup_kiosk: [
    "product_launch",
    "testing_location",
    "seasonal_sales",
    "online_to_offline",
    "brand_experience",
  ],
  full_store: ["testing_location", "seasonal_sales", "online_to_offline"],
  procession: ["product_launch", "seasonal_sales", "brand_experience"],
}

export default function HomePage() {
  const { zones, businessInsights } = useZones()
  const [isIntroOpen, setIsIntroOpen] = useState(true)
  const [businessType, setBusinessType] = useState<BusinessType>("coffee")
  const [eventType, setEventType] = useState<EventType>("testing_location")
  const [formatType, setFormatType] = useState<FormatType>("popup_kiosk")
  const [formatScale, setFormatScale] = useState<FormatScale>("standard")
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("afternoon")
  const [minScore, setMinScore] = useState(60)
  const [topCount, setTopCount] = useState(5)
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [isCompareOpen, setIsCompareOpen] = useState(false)
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)

  const allowedEvents = allowedEventsByFormat[formatType]

  useEffect(() => {
    if (!allowedEvents.includes(eventType)) {
      setEventType(allowedEvents[0])
    }
  }, [allowedEvents, eventType])

  const insightByZone = useMemo(
    () => new Map(businessInsights.map((insight) => [insight.zoneId, insight])),
    [businessInsights],
  )

  const scoreInput = {
    businessType,
    eventType,
    formatType,
    formatScale,
    timeSlot,
  }

  const scoredZones: ZoneWithScore[] = zones
    .map((zone) => {
      const scored = scoreZone(zone, scoreInput)
      return {
        ...zone,
        score: scored.score,
        breakdown: scored.breakdown,
        reasons: getZoneReasons(zone, scoreInput, scored.breakdown),
        businessInsight: insightByZone.get(zone.id),
      }
    })
    .sort((left, right) => right.score - left.score)

  const visibleZones = scoredZones.filter((zone) => zone.score >= minScore)
  const topZones = visibleZones.slice(0, topCount)
  const selectedZone = selectedZoneId
    ? visibleZones.find((zone) => zone.id === selectedZoneId) ?? null
    : null
  const selectedRank = selectedZoneId
    ? visibleZones.findIndex((zone) => zone.id === selectedZoneId) + 1
    : null

  const dashboardStats = useMemo(() => {
    const visibleCount = visibleZones.length
    const avgScore =
      visibleCount > 0
        ? visibleZones.reduce((total, zone) => total + zone.score, 0) / visibleCount
        : 0
    const aboveThresholdCount = visibleZones.filter((zone) => zone.score >= minScore).length
    const totalStores = visibleZones.reduce(
      (total, zone) => total + (zone.businessInsight?.storeCount ?? 0),
      0,
    )
    const averageStores = visibleCount > 0 ? totalStores / visibleCount : 0
    const suburbStrength = new Map<string, number>()

    visibleZones.forEach((zone) => {
      suburbStrength.set(zone.suburb, (suburbStrength.get(zone.suburb) ?? 0) + zone.score)
    })

    const leadingSuburb =
      [...suburbStrength.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
      "Sydney CBD"

    return {
      totalZoneCount: zones.length,
      visibleCount,
      avgScore,
      aboveThresholdCount,
      thresholdLabel: `${minScore}+`,
      averageStores,
      leadingSuburb,
    }
  }, [minScore, visibleZones, zones.length])

  useEffect(() => {
    if (selectedZoneId && !visibleZones.some((zone) => zone.id === selectedZoneId)) {
      setSelectedZoneId(null)
      setIsCompareOpen(false)
    }
  }, [selectedZoneId, visibleZones])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return
      }

      if (isCompareOpen) {
        setIsCompareOpen(false)
        return
      }

      if (selectedZoneId) {
        setSelectedZoneId(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isCompareOpen, selectedZoneId])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#e15b60_0%,#d4151c_100%)] px-4 pb-6 pt-4 text-[#F9F0E1] md:px-6 lg:px-8">
      <IntroOverlay visible={isIntroOpen} onEnter={() => setIsIntroOpen(false)} />
      <div
        className={`mx-auto flex max-w-[1680px] flex-col gap-4 transition duration-300 ${
          selectedZone ? "scale-[0.995] blur-[2px]" : ""
        }`}
      >
        <HeaderBar
          tickerItems={visibleZones.slice(0, 8).map((zone) => ({
            suburb: zone.suburb,
            score: zone.score,
          }))}
        />

        <section className="grid items-start gap-4 xl:grid-cols-[320px_minmax(0,1fr)_370px]">
          <div className="h-[760px] overflow-y-auto pr-1">
            <FilterPanel
              businessType={businessType}
              eventType={eventType}
              formatType={formatType}
              formatScale={formatScale}
              timeSlot={timeSlot}
              minScore={minScore}
              allowedEvents={allowedEvents}
              onBusinessTypeChange={setBusinessType}
              onEventTypeChange={setEventType}
              onFormatTypeChange={setFormatType}
              onFormatScaleChange={setFormatScale}
              onTimeSlotChange={setTimeSlot}
              onMinScoreChange={setMinScore}
            />
          </div>

          <MapView
            zones={visibleZones}
            selectedZoneId={selectedZoneId}
            timeSlot={timeSlot}
            overlayContent={
              selectedZone ? (
                <div className="rounded-[1.6rem] border border-[#f0dbc0] bg-[rgba(249,240,225,0.96)] p-4 text-[#1B120B] shadow-[0_22px_70px_rgba(54,12,14,0.28)] backdrop-blur">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-display text-2xl font-semibold text-[#D4151C]">
                        {selectedZone.name}
                      </div>
                      <div className="mt-1 text-sm text-[#1B120B]/70">{selectedZone.suburb}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedZoneId(null)}
                      className="rounded-full bg-[#D4151C] px-3 py-1.5 text-sm font-semibold text-[#F9F0E1]"
                    >
                      Close
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#D4151C] px-3 py-1 text-sm font-semibold text-[#F9F0E1]">
                      Score {selectedZone.score.toFixed(1)}
                    </span>
                    {selectedZone.reasons.slice(0, 3).map((reason) => (
                      <span
                        key={reason}
                        className="rounded-full bg-[#f3dfc6] px-3 py-1 text-xs text-[#1B120B]"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                    <div className="rounded-[1rem] bg-[#fff7eb] p-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-[#1B120B]/56">
                        Footfall
                      </div>
                      <div className="mt-1 font-semibold text-[#D4151C]">
                        {selectedZone.breakdown.footfall.toFixed(1)}
                      </div>
                    </div>
                    <div className="rounded-[1rem] bg-[#fff7eb] p-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-[#1B120B]/56">
                        Context fit
                      </div>
                      <div className="mt-1 font-semibold text-[#D4151C]">
                        {selectedZone.breakdown.contextFit.toFixed(1)}
                      </div>
                    </div>
                    <div className="rounded-[1rem] bg-[#fff7eb] p-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-[#1B120B]/56">
                        White space
                      </div>
                      <div className="mt-1 font-semibold text-[#D4151C]">
                        {selectedZone.breakdown.whiteSpace.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCompareOpen(true)}
                      className="rounded-full bg-[#D4151C] px-4 py-2 text-sm font-semibold text-[#F9F0E1]"
                    >
                      Compare
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedZoneId(null)}
                      className="rounded-full bg-[#ead6ba] px-4 py-2 text-sm font-semibold text-[#1B120B]"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : null
            }
            dashboardStats={dashboardStats}
            onFullscreenChange={setIsMapFullscreen}
            onSelectZone={setSelectedZoneId}
          />

          <div className="h-[760px] overflow-y-auto pr-1">
            <TopZonesPanel
              zones={topZones}
              selectedZoneId={selectedZoneId}
              topCount={topCount}
              onTopCountChange={setTopCount}
              scoreInput={scoreInput}
              dashboardStats={dashboardStats}
              onSelectZone={setSelectedZoneId}
            />
          </div>
        </section>
      </div>
      {selectedZone ? (
        <button
          type="button"
          aria-label="Close selected zone"
          onClick={() => setSelectedZoneId(null)}
          className="fixed inset-0 z-30 bg-[rgba(27,18,11,0.08)] backdrop-blur-[2px]"
        />
      ) : null}

      {!isMapFullscreen ? (
        <ZoneDrawer
          zone={selectedZone}
          businessType={businessType}
          eventType={eventType}
          formatType={formatType}
          formatScale={formatScale}
          timeSlot={timeSlot}
          selectedRank={selectedRank}
          visibleZoneCount={dashboardStats.visibleCount}
          onCompare={() => setIsCompareOpen(true)}
          onClose={() => setSelectedZoneId(null)}
        />
      ) : null}
      <CompareModal
        open={isCompareOpen}
        baseZone={selectedZone}
        zones={visibleZones}
        scoreInput={scoreInput}
        onClose={() => setIsCompareOpen(false)}
      />
    </main>
  )
}
