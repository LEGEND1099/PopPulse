import zones from "@/data/zones.enriched.json";
import type { Zone } from "@/lib/types";

export function getZones(): Zone[] {
  return zones as Zone[];
}
