import type { TimeSlot, Zone } from "@/lib/types"

type ZoneTimelineCardProps = {
  zone: Zone
  activeTimeSlot: TimeSlot
}

const timeRows: Array<{
  key: TimeSlot
  label: string
  getValue: (zone: Zone) => number
}> = [
  { key: "morning", label: "Morning", getValue: (zone) => zone.footfallMorning },
  { key: "afternoon", label: "Afternoon", getValue: (zone) => zone.footfallAfternoon },
  { key: "evening", label: "Evening", getValue: (zone) => zone.footfallEvening },
]

export function ZoneTimelineCard({ zone, activeTimeSlot }: ZoneTimelineCardProps) {
  return (
    <div className="rounded-[1.5rem] bg-[#fff9f0] p-4">
      <div className="font-display text-lg font-semibold text-[#D4151C]">Zone History Timeline</div>
      <p className="mt-1 text-sm leading-6 text-[#1B120B]/72">
        Time-of-day demand rhythm for this zone, using the current hotspot engine&apos;s historical
        footfall profile.
      </p>

      <div className="mt-4 space-y-3">
        {timeRows.map((row) => {
          const value = row.getValue(zone)
          const isActive = row.key === activeTimeSlot
          return (
            <div key={row.key} className="rounded-[1.15rem] bg-[#f5e8d5] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                      isActive ? "bg-[#D4151C] text-[#F9F0E1]" : "bg-[#ead6ba] text-[#1B120B]"
                    }`}
                  >
                    {row.label}
                  </span>
                  {isActive ? (
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D4151C]">
                      Current view
                    </span>
                  ) : null}
                </div>
                <span className="text-sm font-semibold text-[#1B120B]">{value.toFixed(0)}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[#e6d6bf]">
                <div
                  className="h-2 rounded-full bg-[#D4151C]"
                  style={{ width: `${Math.max(8, Math.min(100, value))}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
