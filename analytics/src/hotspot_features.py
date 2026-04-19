from __future__ import annotations

import pandas as pd


def add_flow_features(df: pd.DataFrame, trip_col: str, seq_col: str, occupancy_col: str) -> pd.DataFrame:
    ordered = df.sort_values([trip_col, seq_col]).copy()
    ordered["prev_occupancy"] = ordered.groupby(trip_col)[occupancy_col].shift(1)
    ordered["prev_occupancy"] = ordered["prev_occupancy"].fillna(ordered[occupancy_col])
    ordered["arrival_pressure"] = (ordered["prev_occupancy"] - ordered[occupancy_col]).clip(lower=0)
    ordered["departure_pressure"] = (ordered[occupancy_col] - ordered["prev_occupancy"]).clip(lower=0)
    return ordered


def add_time_features(df: pd.DataFrame, time_col: str) -> pd.DataFrame:
    enriched = df.copy()
    enriched[time_col] = pd.to_datetime(enriched[time_col], errors="coerce")
    enriched = enriched.dropna(subset=[time_col]).copy()
    enriched["hour"] = enriched[time_col].dt.hour
    enriched["day_of_week"] = enriched[time_col].dt.day_name()
    enriched["is_weekend"] = enriched[time_col].dt.dayofweek >= 5
    return enriched


def _normalize_series(series: pd.Series) -> pd.Series:
    max_value = series.max()
    if pd.isna(max_value) or max_value <= 0:
        return pd.Series([0.0] * len(series), index=series.index)
    return (series / max_value) * 100


def aggregate_station_hotspots(
    df: pd.DataFrame,
    station_col: str,
    lat_col: str | None,
    lon_col: str | None,
) -> pd.DataFrame:
    group_columns = [station_col, "hour", "day_of_week"]
    aggregations: dict[str, str] = {
        "arrival_pressure": "sum",
        "departure_pressure": "sum",
    }

    if lat_col and lat_col in df.columns:
        aggregations[lat_col] = "mean"
    if lon_col and lon_col in df.columns:
        aggregations[lon_col] = "mean"

    aggregated = (
        df.groupby(group_columns, dropna=False)
        .agg(aggregations)
        .reset_index()
        .rename(
            columns={
                station_col: "station_name",
                **({lat_col: "latitude"} if lat_col and lat_col in df.columns else {}),
                **({lon_col: "longitude"} if lon_col and lon_col in df.columns else {}),
            }
        )
    )

    aggregated["arrival_norm"] = _normalize_series(aggregated["arrival_pressure"])
    aggregated["departure_norm"] = _normalize_series(aggregated["departure_pressure"])
    return aggregated.sort_values(["arrival_norm", "departure_norm"], ascending=[False, False]).reset_index(drop=True)
