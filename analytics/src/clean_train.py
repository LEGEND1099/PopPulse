from __future__ import annotations

import re
from difflib import SequenceMatcher

import pandas as pd

from utils import to_snake_case

OCCUPANCY_MAP = {
    "MANY_SEATS_AVAILABLE": 0.35,
    "FEW_SEATS_AVAILABLE": 0.75,
    "STANDING_ROOM_ONLY": 1.10,
    "FULL_STANDING_ROOM_ONLY": 1.15,
    "CRUSH_CAPACITY": 1.25,
}

OCCUPANCY_ALIASES = {
    "MANYSEATSAVAILABLE": "MANY_SEATS_AVAILABLE",
    "MANY_SEAT_AVAILABLE": "MANY_SEATS_AVAILABLE",
    "MANY_SEATS_AVAIL": "MANY_SEATS_AVAILABLE",
    "FEWSEATSAVAILABLE": "FEW_SEATS_AVAILABLE",
    "FEW_SEAT_AVAILABLE": "FEW_SEATS_AVAILABLE",
    "STANDINGROOMONLY": "STANDING_ROOM_ONLY",
    "STANDING_ROOM": "STANDING_ROOM_ONLY",
    "STANDING_ONLY": "STANDING_ROOM_ONLY",
    "FULLSTANDINGROOMONLY": "FULL_STANDING_ROOM_ONLY",
    "FULL_STANDING_ROOM": "FULL_STANDING_ROOM_ONLY",
    "CRUSHCAPACITY": "CRUSH_CAPACITY",
}

CANONICAL_COLUMN_ALIASES = {
    "trip_id": [
        "trip_name",
        "new_trip_name",
        "trip_id",
        "service_id",
        "run_id",
    ],
    "station_name": [
        "station_name",
        "actual_stop_station",
        "stop_name",
        "station",
        "node_name",
    ],
    "stop_sequence": [
        "node_seq_order",
        "stop_sequence",
        "stop_seq",
        "station_order",
        "node_sequence",
        "sequence",
    ],
    "arrival_time": [
        "actual_arrival_time",
        "actual_station_arr_time",
        "arrival_time",
        "planned_arrival_time",
    ],
    "departure_time": [
        "actual_departure_time",
        "actual_station_dprt_time",
        "departure_time",
        "planned_departure_time",
    ],
    "occupancy_status": [
        "occupancy_status",
        "occupancy",
        "occupancy_level",
        "crowding",
        "occupancy_range",
    ],
    "latitude": ["lat", "latitude", "stop_lat", "station_latitude"],
    "longitude": ["lon", "lng", "longitude", "stop_lon", "station_longitude"],
}


def clean_occupancy_labels(series: pd.Series) -> pd.Series:
    cleaned = (
        series.astype(str)
        .str.upper()
        .str.strip()
        .str.replace(r"[^A-Z0-9]+", "_", regex=True)
        .str.replace(r"_+", "_", regex=True)
        .str.strip("_")
    )

    return cleaned.replace(OCCUPANCY_ALIASES)


def map_occupancy_to_numeric(series: pd.Series) -> pd.Series:
    cleaned = clean_occupancy_labels(series)
    numeric = cleaned.map(OCCUPANCY_MAP)
    return numeric


def _normalize_column(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", to_snake_case(value))


def _best_column_match(columns: list[str], candidates: list[str]) -> str | None:
    normalized_columns = {_normalize_column(column): column for column in columns}

    for candidate in candidates:
        normalized_candidate = _normalize_column(candidate)
        if normalized_candidate in normalized_columns:
            return normalized_columns[normalized_candidate]

    best_column = None
    best_score = 0.0
    for column in columns:
        normalized_column = _normalize_column(column)
        for candidate in candidates:
            score = SequenceMatcher(None, normalized_column, _normalize_column(candidate)).ratio()
            if score > best_score:
                best_score = score
                best_column = column

    return best_column if best_score >= 0.72 else None


def detect_train_columns(df: pd.DataFrame) -> dict:
    columns = [to_snake_case(str(column)) for column in df.columns]
    detected: dict[str, str | None] = {}

    for canonical_name, aliases in CANONICAL_COLUMN_ALIASES.items():
        detected[canonical_name] = _best_column_match(columns, aliases)

    detected["time_col"] = detected.get("departure_time") or detected.get("arrival_time")
    return detected


def clean_train_dataframe(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    working = df.copy()
    working.columns = [to_snake_case(str(column)) for column in working.columns]

    detected = detect_train_columns(working)
    required_columns = ["trip_id", "station_name", "occupancy_status", "time_col"]
    missing = [name for name in required_columns if not detected.get(name)]
    if missing:
        raise ValueError(f"Could not detect required columns: {missing}")

    rename_map = {
        detected["trip_id"]: "trip_id",
        detected["station_name"]: "station_name",
        detected["occupancy_status"]: "occupancy_status",
        detected["time_col"]: "event_time",
    }

    stop_sequence_source = detected.get("stop_sequence")
    if stop_sequence_source:
        rename_map[stop_sequence_source] = "stop_sequence"

    if detected.get("latitude"):
        rename_map[detected["latitude"]] = "latitude"
    if detected.get("longitude"):
        rename_map[detected["longitude"]] = "longitude"

    cleaned = working.rename(columns=rename_map).copy()
    cleaned["occupancy_status"] = clean_occupancy_labels(cleaned["occupancy_status"])
    cleaned["occupancy_numeric"] = map_occupancy_to_numeric(cleaned["occupancy_status"])
    cleaned["event_time"] = pd.to_datetime(cleaned["event_time"], errors="coerce")

    if "stop_sequence" in cleaned.columns:
        cleaned["stop_sequence"] = pd.to_numeric(cleaned["stop_sequence"], errors="coerce")

    if "latitude" in cleaned.columns:
        cleaned["latitude"] = pd.to_numeric(cleaned["latitude"], errors="coerce")
    if "longitude" in cleaned.columns:
        cleaned["longitude"] = pd.to_numeric(cleaned["longitude"], errors="coerce")

    cleaned["trip_id"] = cleaned["trip_id"].astype(str).str.strip()
    cleaned["station_name"] = cleaned["station_name"].astype(str).str.strip()

    cleaned = cleaned.dropna(subset=["trip_id", "station_name", "event_time", "occupancy_numeric"]).copy()
    cleaned = cleaned.loc[cleaned["trip_id"] != ""].copy()
    cleaned = cleaned.loc[cleaned["station_name"] != ""].copy()

    if "stop_sequence" not in cleaned.columns or cleaned["stop_sequence"].isna().all():
        cleaned = cleaned.sort_values(["trip_id", "event_time", "station_name"]).copy()
        cleaned["stop_sequence"] = cleaned.groupby("trip_id").cumcount() + 1
        detected["stop_sequence"] = "derived_from_event_time"
    else:
        cleaned = cleaned.sort_values(["trip_id", "stop_sequence", "event_time"]).copy()

    cleaned = cleaned.reset_index(drop=True)

    metadata = {
        "detected_columns": detected,
        "row_count": len(cleaned),
        "occupancy_labels": sorted(cleaned["occupancy_status"].dropna().unique().tolist()),
    }

    print(f"Cleaned rows: {len(cleaned)}")
    print(f"Detected columns: {detected}")

    return cleaned, metadata
