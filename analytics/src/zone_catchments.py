from __future__ import annotations

import re
import unicodedata
from math import asin, cos, radians, sin, sqrt

import pandas as pd


def normalize_text(value: object) -> str:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return ""
    text = unicodedata.normalize("NFKD", str(value)).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", text).strip().lower()


ZONE_KEYWORDS: dict[str, list[str]] = {
    "central-station": [
        "central station",
        "haymarket",
        "ultimo",
        "chippendale",
        "railway square",
        "broadway",
    ],
    "town-hall": [
        "town hall",
        "qvb",
        "queen victoria building",
        "world square",
        "bathurst st",
        "market st",
        "druitt st",
        "george st",
    ],
    "wynyard": [
        "wynyard",
        "bridge st",
        "york st",
        "hunter st",
        "jamison st",
    ],
    "circular-quay": [
        "circular quay",
        "the rocks",
        "opera house",
        "bennelong",
        "macquarie st",
        "alfred st",
    ],
    "martin-place": [
        "martin place",
        "st james",
        "castlereagh st",
        "phillip st",
        "macquarie place",
    ],
    "barangaroo": [
        "barangaroo",
        "darling harbour",
        "pyrmont",
        "king street wharf",
        "walsh bay",
    ],
    "parramatta": ["parramatta", "church st", "westfield parramatta", "eat street"],
    "westmead": ["westmead", "westmead hospital"],
    "chatswood": ["chatswood", "victoria ave chatswood"],
    "north-sydney": ["north sydney", "miller st", "greenwood plaza"],
    "newtown": ["newtown", "king st newtown", "camperdown", "stanmore"],
    "redfern": ["redfern", "eveleigh", "waterloo", "darlington"],
    "bondi-junction": ["bondi junction", "westfield bondi junction"],
    "burwood": ["burwood", "burwood plaza", "strathfield south"],
    "surry-hills": ["surry hills", "holt st", "crown st surry hills"],
    "st-leonards": ["st leonards", "crows nest", "artarmon"],
    "macquarie-park": ["macquarie park", "macquarie centre", "north ryde"],
    "green-square": ["green square", "zetland", "rosebery", "beaconsfield"],
    "marrickville": ["marrickville", "dulwich hill", "sydenham"],
    "manly": ["manly"],
    "ashfield": ["ashfield", "summer hill", "haberfield"],
    "rhodes": ["rhodes", "wentworth point", "olympic park", "homebush"],
    "darlinghurst": ["darlinghurst", "potts point", "kings cross", "elizabeth bay"],
    "alexandria": ["alexandria"],
    "glebe": ["glebe", "forest lodge"],
    "crows-nest": ["crows nest"],
    "lane-cove": ["lane cove", "lane cove west"],
}

SUBURB_TO_ZONE = {
    "sydney cbd": "town-hall",
    "sydney": "town-hall",
    "haymarket": "central-station",
    "ultimo": "central-station",
    "chippendale": "central-station",
    "barangaroo": "barangaroo",
    "pyrmont": "barangaroo",
    "redfern": "redfern",
    "waterloo": "redfern",
    "newtown": "newtown",
    "camperdown": "newtown",
    "bondi junction": "bondi-junction",
    "parramatta": "parramatta",
    "westmead": "westmead",
    "chatswood": "chatswood",
    "north sydney": "north-sydney",
    "surry hills": "surry-hills",
    "st leonards": "st-leonards",
    "crows nest": "crows-nest",
    "macquarie park": "macquarie-park",
    "green square": "green-square",
    "zetland": "green-square",
    "marrickville": "marrickville",
    "manly": "manly",
    "ashfield": "ashfield",
    "rhodes": "rhodes",
    "darlinghurst": "darlinghurst",
    "alexandria": "alexandria",
    "glebe": "glebe",
    "lane cove": "lane-cove",
}


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = (
        sin(dlat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    )
    c = 2 * asin(sqrt(a))
    return radius_km * c


def infer_zone_from_text(store_row: pd.Series) -> tuple[str | None, str]:
    suburb = normalize_text(store_row.get("suburb"))
    address = normalize_text(store_row.get("address"))
    haystack = f"{suburb} {address}".strip()

    if suburb in SUBURB_TO_ZONE:
      return SUBURB_TO_ZONE[suburb], "suburb_alias"

    for zone_id, keywords in ZONE_KEYWORDS.items():
        if any(keyword in haystack for keyword in keywords):
            return zone_id, "address_keyword"

    return None, "unmatched"


def assign_stores_to_zones(stores: pd.DataFrame, zones: pd.DataFrame) -> pd.DataFrame:
    zone_lookup = zones.set_index("id")[["name", "suburb", "lat", "lng"]].to_dict("index")
    assignments = stores.copy()
    inferred = assignments.apply(infer_zone_from_text, axis=1, result_type="expand")
    inferred.columns = ["zone_id", "catchment_method"]
    assignments = pd.concat([assignments, inferred], axis=1)

    assignments["zone_name"] = assignments["zone_id"].map(
        lambda zone_id: zone_lookup.get(zone_id, {}).get("name", "")
    )
    assignments["zone_suburb"] = assignments["zone_id"].map(
        lambda zone_id: zone_lookup.get(zone_id, {}).get("suburb", "")
    )
    assignments["zone_lat"] = assignments["zone_id"].map(
        lambda zone_id: zone_lookup.get(zone_id, {}).get("lat")
    )
    assignments["zone_lng"] = assignments["zone_id"].map(
        lambda zone_id: zone_lookup.get(zone_id, {}).get("lng")
    )
    assignments["catchment_confidence"] = assignments["catchment_method"].map(
        {
            "suburb_alias": 0.82,
            "address_keyword": 0.7,
            "unmatched": 0.0,
        }
    )
    return assignments


def summarize_zone_assignments(assignments: pd.DataFrame) -> pd.DataFrame:
    usable = assignments[assignments["zone_id"].notna()].copy()
    if usable.empty:
        return pd.DataFrame()

    summary = (
        usable.groupby("zone_id")
        .agg(
            catchment_store_count=("zone_id", "size"),
            catchment_confidence=("catchment_confidence", "mean"),
            suburb_hits=("catchment_method", lambda values: int((values == "suburb_alias").sum())),
            keyword_hits=("catchment_method", lambda values: int((values == "address_keyword").sum())),
        )
        .reset_index()
    )
    return summary
