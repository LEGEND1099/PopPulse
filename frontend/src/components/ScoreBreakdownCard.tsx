import type { ScoreBreakdown } from "@/lib/types"

type ScoreBreakdownCardProps = {
  breakdown: ScoreBreakdown
}

const labels: Record<keyof ScoreBreakdown, string> = {
  footfall: "Footfall",
  contextFit: "Context fit",
  whiteSpace: "White-space",
  complementarity: "Complementarity",
  transitReach: "Transit reach",
  permitFriction: "Permit friction",
  costPressure: "Cost pressure",
}

const descriptions: Record<keyof ScoreBreakdown, string> = {
  footfall: "Estimated demand intensity for the chosen time window.",
  contextFit: "How closely the surrounding context matches the scenario.",
  whiteSpace: "Opportunity created by lower direct competition pressure.",
  complementarity: "Supportive nearby categories that can lift trade.",
  transitReach: "Transport accessibility proxy for passing movement.",
  permitFriction: "Operational drag from approvals and permissions.",
  costPressure: "Relative operating pressure for a commercial setup.",
}

export function ScoreBreakdownCard({ breakdown }: ScoreBreakdownCardProps) {
  const strongestDriver = Object.entries(breakdown)
    .filter(([key]) => key !== "permitFriction" && key !== "costPressure")
    .sort((left, right) => right[1] - left[1])[0]

  const biggestDrag = Object.entries(breakdown)
    .filter(([key]) => key === "permitFriction" || key === "costPressure")
    .sort((left, right) => right[1] - left[1])[0]

  return (
    <div className="rounded-[1.6rem] border border-[#D4151C]/12 bg-[#fff9f0] p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="font-display text-lg font-semibold text-[#D4151C]">Score Breakdown</div>
          <p className="mt-1 text-sm leading-6 text-[#1B120B]/72">
            Weighted components behind the final opportunity score.
          </p>
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-[1.1rem] bg-[#f6ead7] p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#1B120B]/54">
            Strongest Driver
          </div>
          <div className="mt-1 font-semibold text-[#D4151C]">
            {strongestDriver ? labels[strongestDriver[0] as keyof ScoreBreakdown] : "N/A"}
          </div>
        </div>
        <div className="rounded-[1.1rem] bg-[#f6ead7] p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#1B120B]/54">
            Biggest Drag
          </div>
          <div className="mt-1 font-semibold text-[#D4151C]">
            {biggestDrag ? labels[biggestDrag[0] as keyof ScoreBreakdown] : "N/A"}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(breakdown).map(([key, value]) => (
          <div key={key} className="grid grid-cols-[1fr_auto] items-start gap-3">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[#1B120B]">
                  {labels[key as keyof ScoreBreakdown]}
                </div>
              </div>
              <div className="mt-1 text-xs leading-5 text-[#1B120B]/62">
                {descriptions[key as keyof ScoreBreakdown]}
              </div>
              <div className="mt-2 h-2 rounded-full bg-[#eedfca]">
                <div
                  className={`h-2 rounded-full ${
                    key === "permitFriction" || key === "costPressure"
                      ? "bg-amber-400"
                      : "bg-[#D4151C]"
                  }`}
                  style={{ width: `${Math.max(6, Math.min(100, value))}%` }}
                />
              </div>
            </div>
            <div className="rounded-full bg-[#f2e3cd] px-2.5 py-1 text-sm font-semibold text-[#1B120B]">
              {value.toFixed(1)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
