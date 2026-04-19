from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

import pandas as pd
from cluster_zone_labels import cluster_zones
from zone_catchments import assign_stores_to_zones, summarize_zone_assignments


ROOT = Path(__file__).resolve().parents[2]
STORES_PATH = ROOT / "analytics" / "data" / "raw" / "locations" / "stores.csv"
ZONES_PATH = ROOT / "frontend" / "src" / "data" / "zones.json"
INSIGHTS_PATH = ROOT / "frontend" / "src" / "data" / "business-insights.json"
ENRICHED_ZONES_PATH = ROOT / "frontend" / "src" / "data" / "zones.enriched.json"
ZONE_CLUSTER_PATH = ROOT / "frontend" / "src" / "data" / "zone-clusters.json"


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    normalized = normalized.lower().strip()
    normalized = re.sub(r"[^a-z0-9]+", "-", normalized)
    return normalized.strip("-")


def normalize_text(value: object) -> str:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return ""
    text = unicodedata.normalize("NFKD", str(value)).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", text).strip().lower()


def normalize_suburb(value: object) -> str:
    text = normalize_text(value)
    aliases = {
        "sydney cbd": "sydney",
        "circular quay": "sydney",
        "barangaroo": "barangaroo",
        "haymarket": "haymarket",
        "newtown": "newtown",
        "redfern": "redfern",
        "bondi junction": "bondi junction",
        "north sydney": "north sydney",
        "surry hills": "surry hills",
        "st leonards": "st leonards",
        "macquarie park": "macquarie park",
    }
    return aliases.get(text, text)


FOOD_TERMS = {
    "dine-in restaurant",
    "restaurants",
    "restaurants & bistros",
    "quick-service / takeaway",
    "takeaways",
    "international restaurant",
    "take away food, pizza, fish & chips shops",
}
COFFEE_TERMS = {
    "cafe & dessert",
    "cafes north sydney",
    "cafes",
    "cafe",
    "caf & dessert",
    "cafa & dessert",
    "cafes & snack bars",
}
RETAIL_TERMS = {
    "fashion & accessories",
    "specialty retail",
    "general clothing",
    "electronics & appliances",
    "grocery / convenience store",
    "home & furniture",
    "health & beauty retail",
    "general retailers",
    "jewellery & watch retailers",
}
NIGHTLIFE_TERMS = {"bar / pub / nightlife"}
OFFICE_TERMS = {
    "it / design / creative agency",
    "finance & legal",
    "government / utility services",
    "corporate office",
    "office furniture",
}
FAMILY_TERMS = {"grocery / convenience store", "medical & dental"}
BEAUTY_TERMS = {"beauty salon / barber", "spa & massage", "aesthetic clinic", "hairdressers"}


def read_stores() -> pd.DataFrame:
    dataframe = pd.read_csv(STORES_PATH, engine="python", on_bad_lines="skip")
    dataframe["suburb_norm"] = dataframe["suburb"].map(normalize_suburb)
    dataframe["sector_2_norm"] = dataframe["sector_level_2"].map(normalize_text)
    dataframe["sector_3_norm"] = dataframe["sector_level_3"].map(normalize_text)
    dataframe["business_name"] = dataframe["business_name"].astype(str).str.strip()
    return dataframe


def build_feature_frame(zones: list[dict], insights: list[dict]) -> pd.DataFrame:
    zone_frame = pd.DataFrame(zones)
    insight_frame = pd.DataFrame(insights)
    merged = zone_frame.merge(insight_frame, left_on="id", right_on="zoneId", how="left")
    merged["footfall"] = merged[
        ["footfallMorning", "footfallAfternoon", "footfallEvening"]
    ].mean(axis=1)
    merged["competition"] = merged[
        ["competitionCoffee", "competitionFood", "competitionRetail"]
    ].mean(axis=1)
    merged["complementarity"] = merged[
        ["complementarityCoffee", "complementarityFood", "complementarityRetail"]
    ].mean(axis=1)
    merged["store_count"] = merged["storeCount"].fillna(0)
    merged["context_count"] = merged["businessContext"].map(len)
    return merged


def build_suburb_profiles(stores: pd.DataFrame) -> dict[str, dict]:
    profiles: dict[str, dict] = {}

    for suburb, frame in stores.groupby("suburb_norm"):
        if not suburb:
            continue

        total_stores = len(frame)
        sector_counts = frame["sector_2_norm"].value_counts()
        subsector_counts = frame["sector_3_norm"].value_counts()

        coffee_count = int(frame["sector_2_norm"].isin(COFFEE_TERMS).sum())
        food_count = int(frame["sector_2_norm"].isin(FOOD_TERMS).sum())
        retail_count = int(frame["sector_2_norm"].isin(RETAIL_TERMS).sum())

        office_presence = int(frame["sector_2_norm"].isin(OFFICE_TERMS).sum())
        nightlife_presence = int(frame["sector_2_norm"].isin(NIGHTLIFE_TERMS).sum())
        family_presence = int(frame["sector_2_norm"].isin(FAMILY_TERMS).sum())
        beauty_presence = int(frame["sector_2_norm"].isin(BEAUTY_TERMS).sum())

        top_sectors = [
            {"sector": sector, "count": int(count)}
            for sector, count in sector_counts.head(6).items()
            if sector and sector not in {"others", "nan"}
        ]
        top_subsectors = [
            {"sector": sector, "count": int(count)}
            for sector, count in subsector_counts.head(10).items()
            if sector and sector not in {"others", "nan"}
        ]

        profiles[suburb] = {
            "storeCount": int(total_stores),
            "coffeeCount": coffee_count,
            "foodCount": food_count,
            "retailCount": retail_count,
            "officeCount": office_presence,
            "nightlifeCount": nightlife_presence,
            "familyCount": family_presence,
            "beautyCount": beauty_presence,
            "topSectors": top_sectors,
            "topSubsectors": top_subsectors,
        }

    return profiles


def score_bucket(count: int, total: int, multiplier: float, floor: int = 8, cap: int = 95) -> int:
    if total <= 0:
        return floor
    value = int(round((count / total) * 100 * multiplier))
    return max(floor, min(cap, value))


def merge_business_context(existing_context: list[str], suburb_profile: dict) -> list[str]:
    context = set(existing_context)
    if suburb_profile["officeCount"] >= 20:
        context.add("office")
    if suburb_profile["nightlifeCount"] >= 12:
        context.add("nightlife")
    if suburb_profile["familyCount"] >= 12:
        context.add("family")
    if suburb_profile["retailCount"] >= 20:
        context.add("shopping")
    if suburb_profile["foodCount"] >= 25:
        context.add("food")
    return sorted(context)


def enrich_zones(zones: list[dict], suburb_profiles: dict[str, dict]) -> list[dict]:
    enriched: list[dict] = []

    for zone in zones:
        suburb_key = normalize_suburb(zone["suburb"])
        fallback_key = normalize_suburb(zone["name"])
        profile = suburb_profiles.get(suburb_key) or suburb_profiles.get(fallback_key)
        if not profile:
            enriched.append(zone)
            continue

        total = max(profile["storeCount"], 1)

        updated = dict(zone)
        updated["businessContext"] = merge_business_context(zone["businessContext"], profile)
        updated["competitionCoffee"] = score_bucket(profile["coffeeCount"], total, 8.0)
        updated["competitionFood"] = score_bucket(profile["foodCount"], total, 5.7)
        updated["competitionRetail"] = score_bucket(profile["retailCount"], total, 4.6)
        updated["complementarityCoffee"] = min(
            95,
            max(18, 100 - updated["competitionCoffee"] + score_bucket(profile["officeCount"], total, 3.2)),
        )
        updated["complementarityFood"] = min(
            95,
            max(
                18,
                100
                - updated["competitionFood"]
                + score_bucket(profile["nightlifeCount"] + profile["familyCount"], total, 2.2),
            ),
        )
        updated["complementarityRetail"] = min(
            95,
            max(
                18,
                100
                - updated["competitionRetail"]
                + score_bucket(profile["beautyCount"] + profile["familyCount"], total, 1.8),
            ),
        )
        updated["costPressure"] = min(95, max(20, zone["costPressure"] + score_bucket(total, 200, 0.25, floor=0)))
        enriched.append(updated)

    return enriched


def build_zone_insight_payload(zones: list[dict], suburb_profiles: dict[str, dict]) -> list[dict]:
    payload = []
    for zone in zones:
        suburb_key = normalize_suburb(zone["suburb"])
        fallback_key = normalize_suburb(zone["name"])
        profile = suburb_profiles.get(suburb_key) or suburb_profiles.get(fallback_key) or {}

        payload.append(
            {
                "zoneId": zone["id"],
                "suburb": zone["suburb"],
                "storeCount": profile.get("storeCount", 0),
                "coffeeCount": profile.get("coffeeCount", 0),
                "foodCount": profile.get("foodCount", 0),
                "retailCount": profile.get("retailCount", 0),
                "topSectors": profile.get("topSectors", []),
                "topSubsectors": profile.get("topSubsectors", []),
                "insightBadge": (
                    "Dense store cluster"
                    if profile.get("storeCount", 0) >= 900
                    else "Balanced precinct"
                    if profile.get("storeCount", 0) >= 350
                    else "Emerging pocket"
                ),
            }
        )

    return payload


def attach_catchment_profiles(
    insights: list[dict],
    catchment_summary: pd.DataFrame,
    clustered_frame: pd.DataFrame,
) -> list[dict]:
    summary_lookup = (
        catchment_summary.set_index("zone_id").to_dict("index") if not catchment_summary.empty else {}
    )
    cluster_lookup = clustered_frame.set_index("id").to_dict("index")
    payload = []

    for insight in insights:
        zone_id = insight["zoneId"]
        summary = summary_lookup.get(zone_id, {})
        cluster = cluster_lookup.get(zone_id, {})
        payload.append(
            {
                **insight,
                "catchmentStoreCount": int(summary.get("catchment_store_count", insight.get("storeCount", 0))),
                "catchmentConfidence": round(float(summary.get("catchment_confidence", 0.0)), 2),
                "catchmentMethod": "text_to_zone_catchment",
                "clusterId": int(cluster.get("cluster_id", 0)),
                "clusterLabel": cluster.get("cluster_label", "Balanced lifestyle precinct"),
                "clusterSummary": cluster.get(
                    "cluster_summary",
                    "Mixed-use catchment with stable trade support and versatile popup potential.",
                ),
            }
        )
    return payload


def main() -> None:
    stores = read_stores()
    suburb_profiles = build_suburb_profiles(stores)
    zones = json.loads(ZONES_PATH.read_text(encoding="utf-8"))
    zone_frame = pd.DataFrame(zones)
    assignments = assign_stores_to_zones(stores, zone_frame)
    catchment_summary = summarize_zone_assignments(assignments)
    enriched_zones = enrich_zones(zones, suburb_profiles)
    insights = build_zone_insight_payload(enriched_zones, suburb_profiles)
    feature_frame = build_feature_frame(enriched_zones, insights)
    clustered = cluster_zones(feature_frame)
    insights = attach_catchment_profiles(insights, catchment_summary, clustered)

    ENRICHED_ZONES_PATH.write_text(json.dumps(enriched_zones, indent=2), encoding="utf-8")
    INSIGHTS_PATH.write_text(json.dumps(insights, indent=2), encoding="utf-8")
    ZONE_CLUSTER_PATH.write_text(
        json.dumps(
            clustered[
                ["id", "name", "cluster_id", "cluster_label", "cluster_summary"]
            ].rename(columns={"id": "zoneId"}).to_dict(orient="records"),
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"Wrote {ENRICHED_ZONES_PATH}")
    print(f"Wrote {INSIGHTS_PATH}")
    print(f"Wrote {ZONE_CLUSTER_PATH}")
    print(f"Zones enriched: {len(enriched_zones)}")


if __name__ == "__main__":
    main()
