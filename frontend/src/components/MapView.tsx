"use client"

import { ReactNode, useEffect, useMemo, useRef, useState } from "react"
import maplibregl, { GeoJSONSource, LngLatBounds, Map, Popup } from "maplibre-gl"
import type { Feature, FeatureCollection, Point } from "geojson"
import type { TimeSlot, ZoneWithScore } from "@/lib/types"

type ScoreColorExpression = [
  "interpolate",
  ["linear"],
  ["get", "score"],
  number,
  string,
  number,
  string,
  number,
  string,
  number,
  string,
]

type BuildingColorExpression = [
  "interpolate",
  ["linear"],
  ["coalesce", ["get", "render_height"], ["get", "height"], number],
  number,
  string,
  number,
  string,
  number,
  string,
  number,
  string,
]

const mapStyle = "https://tiles.openfreemap.org/styles/bright"
const buildingLayerIds = ["building-footprints", "3d-buildings", "building-outline"] as const
const explicitBuildingSourceId = "openfreemap-3d"

type MapViewProps = {
  zones: ZoneWithScore[]
  selectedZoneId: string | null
  timeSlot: TimeSlot
  overlayContent?: ReactNode
  dashboardStats: {
    totalZoneCount: number
    visibleCount: number
    avgScore: number
    aboveThresholdCount: number
    thresholdLabel: string
    averageStores: number
    leadingSuburb: string
  }
  onFullscreenChange?: (isFullscreen: boolean) => void
  onSelectZone: (zoneId: string) => void
}

function buildFeature(zone: ZoneWithScore): Feature<Point> {
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [zone.lng, zone.lat],
    },
    properties: {
      id: zone.id,
      name: zone.name,
      suburb: zone.suburb,
      score: zone.score,
      badge: zone.businessInsight?.insightBadge ?? "",
    },
  }
}

function buildCollection(zones: ZoneWithScore[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: zones.map(buildFeature),
  }
}

function getTimeTheme(timeSlot: TimeSlot) {
  if (timeSlot === "morning") {
    return {
      chip: "Morning",
      panelColor: "rgba(249, 240, 225, 0.94)",
      panelText: "#1B120B",
      haloColor: "rgba(255, 196, 92, 0.24)",
      colors: ["#f7c76c", "#f0a34f", "#e46d4a", "#d4151c"],
      extrusionColorLow: "#f7f2ea",
      extrusionColorHigh: "#cfe3f3",
    }
  }

  if (timeSlot === "afternoon") {
    return {
      chip: "Afternoon",
      panelColor: "rgba(249, 240, 225, 0.94)",
      panelText: "#1B120B",
      haloColor: "rgba(242, 112, 75, 0.2)",
      colors: ["#f1a26b", "#ea6f46", "#dd3d30", "#c21018"],
      extrusionColorLow: "#f5f0e8",
      extrusionColorHigh: "#c8def0",
    }
  }

  return {
    chip: "Evening",
    panelColor: "rgba(249, 240, 225, 0.94)",
    panelText: "#1B120B",
    haloColor: "rgba(210, 21, 28, 0.2)",
    colors: ["#f09a81", "#e66c53", "#d53a31", "#ad1118"],
    extrusionColorLow: "#f0ece5",
    extrusionColorHigh: "#bfd8eb",
  }
}

function getScoreColorExpression(colors: string[]) {
  const expression: ScoreColorExpression = [
    "interpolate",
    ["linear"],
    ["get", "score"],
    35,
    colors[0],
    55,
    colors[1],
    75,
    colors[2],
    100,
    colors[3],
  ]

  return expression
}

function getBuildingColorExpression(low: string, high: string) {
  const expression: BuildingColorExpression = [
    "interpolate",
    ["linear"],
    ["coalesce", ["get", "render_height"], ["get", "height"], 0],
    0,
    low,
    100,
    "#eef3f7",
    220,
    "#dce8f2",
    420,
    high,
  ]

  return expression
}

function findLabelLayerId(map: Map) {
  const layers = map.getStyle().layers ?? []
  for (const layer of layers) {
    if (layer.type === "symbol" && typeof layer.layout?.["text-field"] !== "undefined") {
      return layer.id
    }
  }

  return undefined
}

function findBuildingSourceId(map: Map) {
  if (map.getSource(explicitBuildingSourceId)) {
    return explicitBuildingSourceId
  }

  const sources = map.getStyle().sources ?? {}
  const candidates = ["openmaptiles", "stadia", "osm", "basemap", "default"]

  for (const candidate of candidates) {
    const source = sources[candidate]
    if (source && source.type === "vector") {
      return candidate
    }
  }

  for (const [sourceId, source] of Object.entries(sources)) {
    if (source.type === "vector") {
      return sourceId
    }
  }

  return null
}

function removeBuildingLayers(map: Map) {
  for (const layerId of [...buildingLayerIds].reverse()) {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId)
    }
  }
}

function ensure3DBuildings(map: Map, low: string, high: string) {
  if (!map.getSource(explicitBuildingSourceId)) {
    map.addSource(explicitBuildingSourceId, {
      type: "vector",
      url: "https://tiles.openfreemap.org/planet",
    })
  }

  const sourceId = findBuildingSourceId(map)
  if (!sourceId) {
    return false
  }

  const labelLayerId = findLabelLayerId(map)

  if (!map.getLayer("building-footprints")) {
    map.addLayer(
      {
        id: "building-footprints",
        source: sourceId,
        "source-layer": "building",
        type: "fill",
        minzoom: 13,
        paint: {
          "fill-color": "#f8f4ed",
          "fill-opacity": 0.72,
        },
      },
      labelLayerId,
    )
  }

  if (!map.getLayer("3d-buildings")) {
    map.addLayer(
      {
        id: "3d-buildings",
        source: sourceId,
        "source-layer": "building",
        type: "fill-extrusion",
        minzoom: 13.2,
        filter: ["!=", ["get", "hide_3d"], true],
        paint: {
          "fill-extrusion-color": getBuildingColorExpression(low, high),
          "fill-extrusion-height": [
            "interpolate",
            ["linear"],
            ["zoom"],
            13.2,
            0,
            14.8,
            ["coalesce", ["get", "render_height"], ["get", "height"], 14],
          ],
          "fill-extrusion-base": [
            "interpolate",
            ["linear"],
            ["zoom"],
            13.2,
            0,
            16,
            ["coalesce", ["get", "render_min_height"], ["get", "min_height"], 0],
          ],
          "fill-extrusion-opacity": 0.8,
          "fill-extrusion-vertical-gradient": true,
        },
      },
      labelLayerId,
    )
  } else {
    map.setPaintProperty("3d-buildings", "fill-extrusion-color", getBuildingColorExpression(low, high))
  }

  if (!map.getLayer("building-outline")) {
    map.addLayer(
      {
        id: "building-outline",
        source: sourceId,
        "source-layer": "building",
        type: "line",
        minzoom: 13.5,
        paint: {
          "line-color": "#b8d4ea",
          "line-width": 0.85,
          "line-opacity": 0.8,
        },
      },
      labelLayerId,
    )
  }

  return true
}

export function MapView({
  zones,
  selectedZoneId,
  timeSlot,
  overlayContent,
  dashboardStats,
  onFullscreenChange,
  onSelectZone,
}: MapViewProps) {
  const frameRef = useRef<HTMLElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)
  const popupRef = useRef<Popup | null>(null)
  const [is3D, setIs3D] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const timeTheme = useMemo(() => getTimeTheme(timeSlot), [timeSlot])

  useEffect(() => {
    const handleFullscreenChange = () => {
      const nextFullscreen = document.fullscreenElement === frameRef.current
      setIsFullscreen(nextFullscreen)
      onFullscreenChange?.(nextFullscreen)
      mapRef.current?.resize()
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [onFullscreenChange])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: [151.2093, -33.8688],
      zoom: 13.6,
      pitch: 62,
      bearing: -22,
      attributionControl: false,
      canvasContextAttributes: { antialias: true },
    })

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right")

    map.on("load", () => {
      map.addSource("zones", {
        type: "geojson",
        data: buildCollection(zones),
      })

      try {
        ensure3DBuildings(map, timeTheme.extrusionColorLow, timeTheme.extrusionColorHigh)
      } catch {
        setIs3D(false)
      }

      map.addLayer({
        id: "zone-halos",
        type: "circle",
        source: "zones",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "score"],
            35,
            16,
            100,
            44,
          ],
          "circle-color": timeTheme.haloColor,
          "circle-blur": 0.72,
        },
      })

      map.addLayer({
        id: "zone-circles",
        type: "circle",
        source: "zones",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "score"],
            35,
            8,
            100,
            18,
          ],
          "circle-color": getScoreColorExpression(timeTheme.colors),
          "circle-stroke-width": ["case", ["==", ["get", "id"], selectedZoneId ?? ""], 3.4, 1.4],
          "circle-stroke-color": "#F9F0E1",
          "circle-opacity": 0.92,
        },
      })

      map.addLayer({
        id: "selected-zone-ring",
        type: "circle",
        source: "zones",
        filter: ["==", ["get", "id"], selectedZoneId ?? ""],
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "score"],
            35,
            20,
            100,
            39,
          ],
          "circle-color": "rgba(0,0,0,0)",
          "circle-stroke-color": "#D4151C",
          "circle-stroke-width": 2.8,
          "circle-stroke-opacity": 0.95,
        },
      })

      map.addLayer({
        id: "zone-labels",
        type: "symbol",
        source: "zones",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 11.5,
          "text-offset": [0, 1.5],
          "text-anchor": "top",
          "text-optional": true,
        },
        paint: {
          "text-color": "#7b1a1e",
          "text-halo-color": "#F9F0E1",
          "text-halo-width": 1.25,
          "text-opacity": [
            "interpolate",
            ["linear"],
            ["get", "score"],
            40,
            0,
            65,
            0.8,
            100,
            1,
          ],
        },
      })

      popupRef.current = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 14,
      })

      map.on("mousemove", "zone-circles", (event) => {
        map.getCanvas().style.cursor = "pointer"
        const feature = event.features?.[0]
        if (!feature || !popupRef.current) {
          return
        }

        const coordinates = (feature.geometry as Point).coordinates.slice() as [number, number]
        const name = String(feature.properties?.name ?? "")
        const suburb = String(feature.properties?.suburb ?? "")
        const score = Number(feature.properties?.score ?? 0).toFixed(1)
        const badge = String(feature.properties?.badge ?? "")

        popupRef.current
          .setLngLat(coordinates)
          .setHTML(
            `<div style="min-width:190px"><strong>${name}</strong><br/><span style="color:#6f5444">${suburb}</span><br/><span style="display:inline-block;margin-top:8px">Opportunity score ${score}</span>${badge ? `<br/><span style="display:inline-block;margin-top:6px;color:#7b1a1e;font-weight:600">${badge}</span>` : ""}</div>`,
          )
          .addTo(map)
      })

      map.on("mouseleave", "zone-circles", () => {
        map.getCanvas().style.cursor = ""
        popupRef.current?.remove()
      })

      map.on("click", "zone-circles", (event) => {
        const feature = event.features?.[0]
        const zoneId = feature?.properties?.id
        if (typeof zoneId === "string") {
          onSelectZone(zoneId)
        }
      })
    })

    mapRef.current = map

    return () => {
      popupRef.current?.remove()
      map.remove()
      mapRef.current = null
    }
  }, [
    onSelectZone,
    selectedZoneId,
    timeTheme.colors,
    timeTheme.extrusionColorHigh,
    timeTheme.extrusionColorLow,
    timeTheme.haloColor,
    zones,
  ])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) {
      return
    }

    const source = map.getSource("zones") as GeoJSONSource | undefined
    source?.setData(buildCollection(zones))
  }, [zones])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) {
      return
    }

    map.setPaintProperty("zone-halos", "circle-color", timeTheme.haloColor)
    map.setPaintProperty("zone-circles", "circle-color", getScoreColorExpression(timeTheme.colors))

    if (map.getLayer("3d-buildings")) {
      map.setPaintProperty("3d-buildings", "fill-extrusion-color", getBuildingColorExpression(timeTheme.extrusionColorLow, timeTheme.extrusionColorHigh))
    }
  }, [timeTheme])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) {
      return
    }

    if (is3D) {
      try {
        ensure3DBuildings(map, timeTheme.extrusionColorLow, timeTheme.extrusionColorHigh)
        map.easeTo({
          pitch: selectedZoneId ? 70 : 60,
          bearing: selectedZoneId ? -24 : -18,
          duration: 500,
        })
      } catch {
        setIs3D(false)
      }
    } else {
      removeBuildingLayers(map)
      map.easeTo({ pitch: 0, bearing: 0, duration: 500 })
    }
  }, [is3D, selectedZoneId, timeTheme.extrusionColorHigh, timeTheme.extrusionColorLow])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) {
      return
    }

    map.setPaintProperty("zone-circles", "circle-stroke-width", [
      "case",
      ["==", ["get", "id"], selectedZoneId ?? ""],
      3.4,
      1.4,
    ])
    map.setFilter("selected-zone-ring", ["==", ["get", "id"], selectedZoneId ?? ""])

    if (!selectedZoneId) {
      if (zones.length > 1) {
        const bounds = zones.reduce(
          (accumulator, zone) => accumulator.extend([zone.lng, zone.lat]),
          new LngLatBounds([zones[0].lng, zones[0].lat], [zones[0].lng, zones[0].lat]),
        )

        map.fitBounds(bounds, {
          padding: { top: 96, right: 80, bottom: 120, left: 80 },
          duration: 900,
          maxZoom: 13.9,
        })

        if (is3D) {
          map.once("moveend", () => {
            map.easeTo({
              pitch: 60,
              bearing: -18,
              duration: 500,
            })
          })
        }
      } else {
        map.easeTo({
          center: [151.2093, -33.8688],
          zoom: 13.2,
          pitch: is3D ? 62 : 0,
          bearing: is3D ? -18 : 0,
          duration: 900,
        })
      }
      return
    }

    const selectedZone = zones.find((zone) => zone.id === selectedZoneId)
    if (!selectedZone) {
      return
    }

    map.flyTo({
      center: [selectedZone.lng, selectedZone.lat],
      zoom: 16,
      pitch: is3D ? 70 : 0,
      bearing: is3D ? -24 : 0,
      duration: 1100,
      essential: true,
    })
  }, [selectedZoneId, zones, is3D])

  const selectedZone = selectedZoneId ? zones.find((zone) => zone.id === selectedZoneId) : null

  return (
    <section
      ref={frameRef}
      className="relative min-h-[760px] overflow-hidden rounded-[2rem] bg-[#F9F0E1] p-3 shadow-[0_22px_55px_rgba(109,17,21,0.16)]"
    >
      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 h-36 rounded-b-[1.6rem] bg-gradient-to-t from-[rgba(249,240,225,0.88)] to-transparent" />
      <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between rounded-t-[1.6rem] bg-[rgba(249,240,225,0.93)] px-4 py-3 backdrop-blur">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#D4151C]">Opportunity Map</h2>
          <p className="text-sm text-[#1B120B]/74">
            Sydney zone view with score overlays and switchable dimensionality.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIs3D(false)}
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
              !is3D ? "bg-[#D4151C] text-[#F9F0E1]" : "bg-[#ead6ba] text-[#1B120B]"
            }`}
          >
            2D
          </button>
          <button
            type="button"
            onClick={() => setIs3D(true)}
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
              is3D ? "bg-[#D4151C] text-[#F9F0E1]" : "bg-[#ead6ba] text-[#1B120B]"
            }`}
          >
            3D
          </button>
          <button
            type="button"
            onClick={async () => {
              if (!frameRef.current) {
                return
              }

              if (document.fullscreenElement === frameRef.current) {
                await document.exitFullscreen()
                return
              }

              await frameRef.current.requestFullscreen()
            }}
            className="rounded-full bg-[#ead6ba] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#1B120B]"
          >
            {isFullscreen ? "Exit Full" : "Full Map"}
          </button>
          <div
            className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]"
            style={{ backgroundColor: timeTheme.panelColor, color: timeTheme.panelText }}
          >
            {timeTheme.chip}
          </div>
        </div>
      </div>
      {isFullscreen && overlayContent ? (
        <div className="absolute inset-x-5 bottom-5 z-20 max-w-[540px]">{overlayContent}</div>
      ) : null}

      <div className="absolute left-7 top-24 z-10 grid w-[320px] gap-3">
        <div className="rounded-[1.35rem] bg-[rgba(249,240,225,0.95)] px-4 py-3 text-[#1B120B] shadow-[0_18px_40px_rgba(72,13,16,0.12)] backdrop-blur">
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#1B120B]/58">
            Hotspot portfolio
          </div>
          <div className="mt-2 grid grid-cols-3 gap-3">
            <div>
              <div className="text-lg font-semibold text-[#D4151C]">{dashboardStats.visibleCount}</div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-[#1B120B]/56">Visible</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-[#D4151C]">
                {dashboardStats.aboveThresholdCount}
              </div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-[#1B120B]/56">
                {dashboardStats.thresholdLabel}
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold text-[#D4151C]">
                {dashboardStats.avgScore.toFixed(1)}
              </div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-[#1B120B]/56">
                Avg
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs leading-5 text-[#1B120B]/68">
            Leading cluster: <span className="font-semibold text-[#D4151C]">{dashboardStats.leadingSuburb}</span>
          </div>
        </div>

        {selectedZone ? (
          <div className="rounded-[1.35rem] bg-[rgba(249,240,225,0.95)] px-4 py-3 text-[#1B120B] shadow-[0_18px_40px_rgba(72,13,16,0.12)] backdrop-blur">
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#1B120B]/58">
              Selected zone
            </div>
            <div className="mt-1 font-display text-xl font-semibold text-[#D4151C]">
              {selectedZone.name}
            </div>
            <div className="mt-1 text-sm text-[#1B120B]/72">{selectedZone.suburb}</div>
            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-full bg-[#D4151C] px-2.5 py-1 text-xs font-semibold text-[#F9F0E1]">
                {selectedZone.score.toFixed(1)}
              </span>
              {selectedZone.businessInsight?.insightBadge ? (
                <span className="rounded-full bg-[#f2e3cd] px-2.5 py-1 text-xs text-[#1B120B]">
                  {selectedZone.businessInsight.insightBadge}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="absolute bottom-7 left-7 z-10 rounded-[1.4rem] bg-[rgba(249,240,225,0.95)] px-4 py-3 text-[#1B120B] shadow-[0_18px_40px_rgba(72,13,16,0.12)] backdrop-blur">
        <div className="text-[11px] uppercase tracking-[0.22em] text-[#1B120B]/58">Visible zones</div>
        <div className="mt-1 text-lg font-semibold text-[#D4151C]">
          {dashboardStats.visibleCount}/{dashboardStats.totalZoneCount}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: timeTheme.colors[0] }}
          />
          Lower score
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: timeTheme.colors[3] }}
          />
          Higher score
        </div>
        <div className="mt-3 text-xs text-[#1B120B]/68">
          Avg nearby stores{" "}
          <span className="font-semibold text-[#D4151C]">{dashboardStats.averageStores.toFixed(0)}</span>
        </div>
      </div>
      <div ref={containerRef} className="h-[736px] w-full rounded-[1.6rem]" />
    </section>
  )
}
