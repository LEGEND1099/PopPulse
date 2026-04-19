import { exportZonesAsCsv, exportZonesAsJson } from "@/lib/export"
import type { ScoreInput, ZoneWithScore } from "@/lib/types"

type TopZonesPanelProps = {
  zones: ZoneWithScore[]
  selectedZoneId: string | null
  topCount: number
  onTopCountChange: (value: number) => void
  scoreInput: ScoreInput
  dashboardStats: {
    totalZoneCount: number
    visibleCount: number
    avgScore: number
    aboveThresholdCount: number
    thresholdLabel: string
    averageStores: number
    leadingSuburb: string
  }
  onSelectZone: (zoneId: string) => void
}

function getScoreTone(score: number) {
  if (score >= 75) {
    return "bg-emerald-600 text-white"
  }

  if (score >= 60) {
    return "bg-amber-400 text-[#1B120B]"
  }

  return "bg-rose-300 text-[#781418]"
}

export function TopZonesPanel({
  zones,
  selectedZoneId,
  topCount,
  onTopCountChange,
  scoreInput,
  dashboardStats,
  onSelectZone,
}: TopZonesPanelProps) {
  return (
    <aside className="rounded-[2rem] bg-[#F9F0E1] p-5 text-[#1B120B] shadow-[0_22px_55px_rgba(109,17,21,0.16)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#D4151C]">Top Zones</h2>
          <p className="mt-1 text-sm leading-6 text-[#1B120B]/76">
            Ranked shortlist with business context, sector depth, and current hotspot signals.
          </p>
        </div>
        <label className="block">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1B120B]/52">
            Shortlist Size
          </span>
          <select
            value={topCount}
            onChange={(event) => onTopCountChange(Number(event.target.value))}
            className="min-w-[88px] rounded-full border border-[#D4151C]/12 bg-[#D4151C] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#F9F0E1] outline-none"
          >
            <option value={3}>Top 3</option>
            <option value={5}>Top 5</option>
            <option value={8}>Top 8</option>
            <option value={10}>Top 10</option>
            <option value={15}>Top 15</option>
            <option value={20}>Top 20</option>
            <option value={25}>Top 25</option>
            <option value={50}>Top 50</option>
            <option value={999}>All</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => exportZonesAsCsv(zones, scoreInput)}
          className="rounded-full bg-[#D4151C] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#F9F0E1]"
        >
          Export CSV
        </button>
        <button
          type="button"
          onClick={() => exportZonesAsJson(zones, scoreInput)}
          className="rounded-full bg-[#ead6ba] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1B120B]"
        >
          Export JSON
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-[1.35rem] bg-[#fff9f0] p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#1B120B]/54">Visible</div>
          <div className="mt-1 text-xl font-semibold text-[#D4151C]">
            {dashboardStats.visibleCount}/{dashboardStats.totalZoneCount}
          </div>
          <div className="mt-1 text-xs text-[#1B120B]/64">Zones above the current threshold</div>
        </div>
        <div className="rounded-[1.35rem] bg-[#fff9f0] p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#1B120B]/54">
            Threshold Match
          </div>
          <div className="mt-1 text-xl font-semibold text-[#D4151C]">
            {dashboardStats.aboveThresholdCount}
          </div>
          <div className="mt-1 text-xs text-[#1B120B]/64">
            Zones currently at {dashboardStats.thresholdLabel}
          </div>
        </div>
        <div className="rounded-[1.35rem] bg-[#fff9f0] p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#1B120B]/54">Avg Score</div>
          <div className="mt-1 text-xl font-semibold text-[#D4151C]">
            {dashboardStats.avgScore.toFixed(1)}
          </div>
          <div className="mt-1 text-xs text-[#1B120B]/64">Current opportunity baseline</div>
        </div>
        <div className="rounded-[1.35rem] bg-[#fff9f0] p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#1B120B]/54">Store Depth</div>
          <div className="mt-1 text-xl font-semibold text-[#D4151C]">
            {dashboardStats.averageStores.toFixed(0)}
          </div>
          <div className="mt-1 text-xs text-[#1B120B]/64">Average nearby stores per visible zone</div>
        </div>
      </div>

      <div className="mt-4 rounded-[1.35rem] bg-[#D4151C] px-4 py-3 text-[#F9F0E1]">
        <div className="text-[11px] uppercase tracking-[0.18em] text-[#F9F0E1]/72">Leading cluster</div>
        <div className="mt-1 font-display text-xl font-semibold">{dashboardStats.leadingSuburb}</div>
        <div className="mt-1 text-sm text-[#F9F0E1]/82">
          Strongest current hotspot concentration across the filtered shortlist.
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {zones.map((zone, index) => {
          const isSelected = zone.id === selectedZoneId
          const scoreDelta = zones[0] ? zones[0].score - zone.score : 0

          return (
            <button
              key={zone.id}
              type="button"
              onClick={() => onSelectZone(zone.id)}
              className={`w-full rounded-[1.55rem] border px-4 py-4 text-left transition ${
                isSelected
                  ? "border-[#D4151C]/30 bg-[#fff7eb]"
                  : "border-[#D4151C]/12 bg-[#fffdf8] hover:bg-[#fff7eb]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-[#1B120B]/54">
                    Rank {index + 1}
                  </div>
                  <div className="mt-1 font-display text-xl font-semibold text-[#D4151C]">
                    {zone.name}
                  </div>
                  <div className="text-sm text-[#1B120B]/72">{zone.suburb}</div>
                </div>
                <div
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${getScoreTone(zone.score)}`}
                >
                  {zone.score.toFixed(1)}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {zone.businessInsight ? (
                  <>
                    <span className="rounded-full bg-[#D4151C] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F9F0E1]">
                      {zone.businessInsight.insightBadge}
                    </span>
                    <span className="rounded-full bg-[#ead6ba] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1B120B]">
                      {zone.businessInsight.clusterLabel}
                    </span>
                    <span className="rounded-full bg-[#f4e6d1] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1B120B]">
                      {zone.businessInsight.catchmentStoreCount} catchment stores
                    </span>
                  </>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {zone.reasons.map((reason) => (
                  <span
                    key={reason}
                    className="rounded-full bg-[#f4e6d1] px-2.5 py-1 text-xs text-[#1B120B]"
                  >
                    {reason}
                  </span>
                ))}
              </div>

              {zone.businessInsight?.topSubsectors?.length ? (
                <div className="mt-3 text-xs uppercase tracking-[0.18em] text-[#1B120B]/54">
                  {zone.businessInsight.topSubsectors
                    .slice(0, 3)
                    .map((sector) => sector.sector)
                    .join(" / ")}
                </div>
              ) : zone.businessInsight?.topSectors?.length ? (
                <div className="mt-3 text-xs uppercase tracking-[0.18em] text-[#1B120B]/54">
                  {zone.businessInsight.topSectors
                    .slice(0, 3)
                    .map((sector) => sector.sector)
                    .join(" / ")}
                </div>
              ) : null}

              <div className="mt-3 flex items-center justify-between text-xs text-[#1B120B]/58">
                <span>Gap from #1</span>
                <span className="font-semibold text-[#D4151C]">{scoreDelta.toFixed(1)}</span>
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
