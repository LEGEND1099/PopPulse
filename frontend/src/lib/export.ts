import type { ScoreInput, ZoneWithScore } from "@/lib/types"

function downloadFile(contents: string, filename: string, mimeType: string) {
  const blob = new Blob([contents], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function buildFilename(input: ScoreInput, extension: string) {
  return `poppulse-${input.businessType}-${input.eventType}-${input.formatType}-${input.formatScale}-${input.timeSlot}.${extension}`
}

export function exportZonesAsJson(zones: ZoneWithScore[], input: ScoreInput) {
  downloadFile(
    JSON.stringify(zones, null, 2),
    buildFilename(input, "json"),
    "application/json",
  )
}

export function exportZonesAsCsv(zones: ZoneWithScore[], input: ScoreInput) {
  const header = [
    "id",
    "name",
    "suburb",
    "score",
    "footfall",
    "contextFit",
    "whiteSpace",
    "complementarity",
    "transitReach",
    "permitFriction",
    "costPressure",
  ]

  const rows = zones.map((zone) => [
    zone.id,
    zone.name,
    zone.suburb,
    zone.score.toFixed(2),
    zone.breakdown.footfall.toFixed(2),
    zone.breakdown.contextFit.toFixed(2),
    zone.breakdown.whiteSpace.toFixed(2),
    zone.breakdown.complementarity.toFixed(2),
    zone.breakdown.transitReach.toFixed(2),
    zone.breakdown.permitFriction.toFixed(2),
    zone.breakdown.costPressure.toFixed(2),
  ])

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n")

  downloadFile(csv, buildFilename(input, "csv"), "text/csv;charset=utf-8")
}
