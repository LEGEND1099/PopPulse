"use client"

import { useEffect, useMemo, useState } from "react"
import { exportZonesAsCsv, exportZonesAsJson } from "@/lib/export"
import type { ScoreInput, ZoneWithScore } from "@/lib/types"

type CompareModalProps = {
  open: boolean
  baseZone: ZoneWithScore | null
  zones: ZoneWithScore[]
  scoreInput: ScoreInput
  onClose: () => void
}

const compareRows: Array<{
  key: keyof ZoneWithScore["breakdown"]
  label: string
}> = [
  { key: "footfall", label: "Footfall" },
  { key: "contextFit", label: "Context Fit" },
  { key: "whiteSpace", label: "White-space" },
  { key: "complementarity", label: "Complementarity" },
  { key: "transitReach", label: "Transit Reach" },
  { key: "permitFriction", label: "Permit Friction" },
  { key: "costPressure", label: "Cost Pressure" },
]

export function CompareModal({ open, baseZone, zones, scoreInput, onClose }: CompareModalProps) {
  const compareOptions = useMemo(
    () => zones.filter((zone) => zone.id !== baseZone?.id).slice(0, 8),
    [baseZone?.id, zones],
  )

  const [compareZoneId, setCompareZoneId] = useState<string>("")

  useEffect(() => {
    if (!open) {
      return
    }

    setCompareZoneId(compareOptions[0]?.id ?? "")
  }, [compareOptions, open])

  if (!open || !baseZone) {
    return null
  }

  const compareZone =
    compareOptions.find((zone) => zone.id === compareZoneId) ?? compareOptions[0] ?? null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(27,18,11,0.4)] px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl rounded-[2rem] bg-[#F9F0E1] p-5 text-[#1B120B] shadow-[0_26px_80px_rgba(109,17,21,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-3xl font-semibold text-[#D4151C]">Compare Zones</h3>
            <p className="mt-2 text-sm leading-6 text-[#1B120B]/72">
              Compare the selected zone against another shortlisted opportunity across score,
              footfall, whitespace, and operating pressure.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#D4151C] px-3 py-1.5 text-sm font-semibold text-[#F9F0E1]"
          >
            Close
          </button>
        </div>

        <div className="mt-5">
          <div className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#1B120B]/58">
                Compare Against
              </span>
              <select
                value={compareZone?.id ?? ""}
                onChange={(event) => setCompareZoneId(event.target.value)}
                className="w-full min-w-[260px] max-w-sm rounded-2xl border border-[#D4151C]/14 bg-[#fff9f0] px-4 py-3 text-base font-semibold text-[#D4151C] outline-none"
              >
                {compareOptions.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} ({zone.suburb})
                  </option>
                ))}
              </select>
            </label>
            {compareZone ? (
              <>
                <button
                  type="button"
                  onClick={() => exportZonesAsCsv([baseZone, compareZone], scoreInput)}
                  className="rounded-full bg-[#D4151C] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#F9F0E1]"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => exportZonesAsJson([baseZone, compareZone], scoreInput)}
                  className="rounded-full bg-[#ead6ba] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1B120B]"
                >
                  Export JSON
                </button>
              </>
            ) : null}
          </div>
        </div>

        {compareZone ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {[baseZone, compareZone].map((zone, index) => (
              <div
                key={zone.id}
                className={`rounded-[1.6rem] p-4 ${
                  index === 0 ? "bg-[#D4151C] text-[#F9F0E1]" : "bg-[#fff9f0]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] opacity-75">
                      {index === 0 ? "Base Zone" : "Comparison Zone"}
                    </div>
                    <div className="mt-1 font-display text-2xl font-semibold">{zone.name}</div>
                    <div className="mt-1 text-sm opacity-80">{zone.suburb}</div>
                  </div>
                  <div
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      index === 0 ? "bg-[#F9F0E1] text-[#D4151C]" : "bg-[#D4151C] text-[#F9F0E1]"
                    }`}
                  >
                    {zone.score.toFixed(1)}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {zone.reasons.map((reason) => (
                    <span
                      key={reason}
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        index === 0 ? "bg-[#be2026] text-[#F9F0E1]" : "bg-[#f1dfc7] text-[#1B120B]"
                      }`}
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {compareZone ? (
          <div className="mt-5 overflow-hidden rounded-[1.6rem] border border-[#D4151C]/14 bg-[#fff9f0]">
            <div className="grid border-b border-[#D4151C]/14 bg-[#f6e7d2] text-xs font-semibold uppercase tracking-[0.16em] text-[#1B120B]/62 md:grid-cols-[200px_1fr_1fr]">
              <div className="border-r border-[#D4151C]/12 px-4 py-3">Metric</div>
              <div className="border-r border-[#D4151C]/12 px-4 py-3">{baseZone.name}</div>
              <div className="border-r border-[#D4151C]/12 px-4 py-3">{compareZone.name}</div>
            </div>
            <div>
              {compareRows.map((row, index) => {
                const baseValue = baseZone.breakdown[row.key]
                const compareValue = compareZone.breakdown[row.key]
                return (
                  <div
                    key={row.key}
                    className={`grid items-center md:grid-cols-[200px_1fr_1fr] ${
                      index !== compareRows.length - 1 ? "border-b border-[#D4151C]/12" : ""
                    }`}
                  >
                    <div className="border-r border-[#D4151C]/12 px-4 py-3 text-sm font-semibold text-[#1B120B]">
                      {row.label}
                    </div>
                    <div className="border-r border-[#D4151C]/12 px-4 py-3 text-sm text-[#D4151C]">
                      {baseValue.toFixed(1)}
                    </div>
                    <div className="border-r border-[#D4151C]/12 px-4 py-3 text-sm text-[#D4151C]">
                      {compareValue.toFixed(1)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
