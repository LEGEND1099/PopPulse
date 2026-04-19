import { ScoreBreakdownCard } from "@/components/ScoreBreakdownCard"
import { ZoneTimelineCard } from "@/components/ZoneTimelineCard"
import type {
  BusinessType,
  EventType,
  FormatScale,
  FormatType,
  TimeSlot,
  ZoneWithScore,
} from "@/lib/types"

type ZoneDrawerProps = {
  zone: ZoneWithScore | null
  businessType: BusinessType
  eventType: EventType
  formatType: FormatType
  formatScale: FormatScale
  timeSlot: TimeSlot
  selectedRank: number | null
  visibleZoneCount: number
  onCompare: () => void
  onClose: () => void
}

function getScoreTier(score: number) {
  if (score >= 75) {
    return {
      label: "High confidence",
      className: "bg-emerald-600 text-white",
    }
  }

  if (score >= 60) {
    return {
      label: "Promising",
      className: "bg-amber-400 text-[#1B120B]",
    }
  }

  return {
    label: "Riskier",
    className: "bg-rose-300 text-[#7c1519]",
  }
}

function prettyLabel(value: string) {
  return value.replace(/_/g, " ")
}

function describeHotspot(zone: ZoneWithScore) {
  if (zone.breakdown.footfall >= 82 && zone.breakdown.transitReach >= 80) {
    return "Heavy arrival pressure with excellent through-movement."
  }

  if (zone.breakdown.whiteSpace >= 65 && zone.breakdown.complementarity >= 70) {
    return "Strong whitespace with a supportive surrounding trade mix."
  }

  if (zone.breakdown.contextFit >= 72) {
    return "The precinct context is unusually aligned to this scenario."
  }

  return "A balanced zone with workable trade-offs across demand, context, and cost."
}

function buildSummary(
  zone: ZoneWithScore,
  businessType: BusinessType,
  eventType: EventType,
  formatType: FormatType,
  formatScale: FormatScale,
  timeSlot: TimeSlot,
) {
  return `${zone.name} is shaping up as a strong ${prettyLabel(formatType)} play for ${prettyLabel(
    businessType,
  )} in the ${timeSlot} because the precinct balances footfall, whitespace, and contextual fit for a ${prettyLabel(
    eventType,
  )} brief at ${prettyLabel(formatScale)} scale.`
}

export function ZoneDrawer({
  zone,
  businessType,
  eventType,
  formatType,
  formatScale,
  timeSlot,
  selectedRank,
  visibleZoneCount,
  onCompare,
  onClose,
}: ZoneDrawerProps) {
  if (!zone) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 md:px-6">
        <div className="pointer-events-auto max-h-[min(82vh,760px)] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-[#F9F0E1] p-5 text-[#1B120B] shadow-[0_26px_80px_rgba(109,17,21,0.18)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-3xl font-semibold text-[#D4151C]">Selected Zone</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#1B120B]/76">
                Click a marker or ranked zone to inspect footfall pressure, business context, nearby
                store density, top sectors, and the full opportunity score breakdown for the current
                scenario.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const scoreTier = getScoreTier(zone.score)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 md:px-6">
      <div className="pointer-events-auto max-h-[min(86vh,820px)] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-[#F9F0E1] p-5 text-[#1B120B] shadow-[0_26px_80px_rgba(109,17,21,0.18)]">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-3xl font-semibold text-[#D4151C]">{zone.name}</h3>
                <p className="mt-1 text-sm text-[#1B120B]/72">{zone.suburb}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-[#D4151C] px-3 py-1.5 text-sm font-semibold text-[#F9F0E1] transition hover:opacity-90"
              >
                Close
              </button>
            </div>

            <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1.35rem] bg-[#D4151C] px-4 py-3 text-[#F9F0E1]">
                <div className="text-xs uppercase tracking-[0.2em] text-[#F9F0E1]/72">Score</div>
                <div className="mt-1 text-2xl font-bold">{zone.score.toFixed(1)}</div>
                <div className="mt-3 flex justify-center">
                  <div
                    className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${scoreTier.className}`}
                  >
                    {scoreTier.label}
                  </div>
                </div>
              </div>
              <div className="rounded-[1.35rem] bg-[#fff9f0] px-4 py-3 text-sm">
                <div className="text-xs uppercase tracking-[0.2em] text-[#1B120B]/58">Scenario</div>
                <div className="mt-1 capitalize text-[#1B120B]">
                  {prettyLabel(businessType)} / {prettyLabel(eventType)}
                </div>
                <div className="mt-1 capitalize text-[#1B120B]/72">
                  {prettyLabel(formatType)} / {prettyLabel(formatScale)} / {timeSlot}
                </div>
              </div>
              <div className="rounded-[1.35rem] bg-[#fff9f0] px-4 py-3 text-sm">
                <div className="text-xs uppercase tracking-[0.2em] text-[#1B120B]/58">Rank</div>
                <div className="mt-1 text-xl font-semibold text-[#D4151C]">#{selectedRank ?? "-"}</div>
                <div className="mt-1 text-[#1B120B]/72">Current shortlist</div>
              </div>
              {zone.businessInsight ? (
                <div className="rounded-[1.35rem] bg-[#fff9f0] px-4 py-3 text-sm">
                  <div className="text-xs uppercase tracking-[0.2em] text-[#1B120B]/58">Catchment</div>
                  <div className="mt-1 text-[#1B120B]">{zone.businessInsight.catchmentStoreCount} mapped stores</div>
                  <div className="mt-1 text-[#1B120B]/72">{Math.round(zone.businessInsight.catchmentConfidence * 100)}% address match</div>
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="rounded-[1.5rem] bg-[#fff9f0] p-4">
                <div className="font-display text-lg font-semibold text-[#D4151C]">Why It Works</div>
                <p className="mt-2 text-sm leading-6 text-[#1B120B]/78">
                  {buildSummary(zone, businessType, eventType, formatType, formatScale, timeSlot)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {zone.reasons.map((reason) => (
                    <span
                      key={reason}
                      className="rounded-full bg-[#D4151C] px-2.5 py-1 text-xs font-medium text-[#F9F0E1]"
                    >
                      {reason}
                    </span>
                  ))}
                </div>

                <div className="mt-4 rounded-[1.2rem] bg-[#f1dfc7] p-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-[#1B120B]/58">
                    Hotspot Read
                  </div>
                  <div className="mt-2 text-sm leading-6 text-[#1B120B]">{describeHotspot(zone)}</div>
                </div>

                <button
                  type="button"
                  onClick={onCompare}
                  className="mt-4 rounded-full bg-[#D4151C] px-4 py-2 text-sm font-semibold text-[#F9F0E1]"
                >
                  Compare
                </button>
              </div>

              <div className="rounded-[1.5rem] bg-[#fff9f0] p-4">
                <div className="font-display text-lg font-semibold text-[#D4151C]">Context Snapshot</div>
                {zone.businessInsight ? (
                  <div className="mt-3 rounded-[1.15rem] bg-[#f4e5cf] p-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-[#1B120B]/58">Cluster Label</div>
                    <div className="mt-1 font-semibold text-[#D4151C]">
                      {zone.businessInsight.clusterLabel}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-[#1B120B]/74">
                      {zone.businessInsight.clusterSummary}
                    </div>
                  </div>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {zone.businessContext.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#f1dfc7] px-2.5 py-1 text-xs text-[#1B120B]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {zone.businessInsight ? (
                  <>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-[1rem] bg-[#f7ebd8] p-3">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-[#1B120B]/54">
                          Coffee
                        </div>
                        <div className="mt-1 font-semibold text-[#D4151C]">
                          {zone.businessInsight.coffeeCount}
                        </div>
                      </div>
                      <div className="rounded-[1rem] bg-[#f7ebd8] p-3">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-[#1B120B]/54">
                          Food
                        </div>
                        <div className="mt-1 font-semibold text-[#D4151C]">
                          {zone.businessInsight.foodCount}
                        </div>
                      </div>
                      <div className="rounded-[1rem] bg-[#f7ebd8] p-3">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-[#1B120B]/54">
                          Retail
                        </div>
                        <div className="mt-1 font-semibold text-[#D4151C]">
                          {zone.businessInsight.retailCount}
                        </div>
                      </div>
                    </div>

                    {zone.businessInsight.topSectors?.length ? (
                      <div className="mt-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-[#1B120B]/58">
                          Top Sectors
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {zone.businessInsight.topSectors.slice(0, 5).map((sector) => (
                            <span
                              key={sector.sector}
                              className="rounded-full bg-[#f1dfc7] px-2.5 py-1 text-xs text-[#1B120B]"
                            >
                              {sector.sector} ({sector.count})
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {zone.businessInsight.topSubsectors?.length ? (
                      <div className="mt-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-[#1B120B]/58">
                          Level 3 Mix
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {zone.businessInsight.topSubsectors.slice(0, 6).map((sector) => (
                            <span
                              key={sector.sector}
                              className="rounded-full bg-[#f7ebd8] px-2.5 py-1 text-xs text-[#1B120B]"
                            >
                              {sector.sector} ({sector.count})
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>

            <div className="mt-4">
              <ZoneTimelineCard zone={zone} activeTimeSlot={timeSlot} />
            </div>
          </div>

          <ScoreBreakdownCard breakdown={zone.breakdown} />
        </div>
      </div>
    </div>
  )
}
