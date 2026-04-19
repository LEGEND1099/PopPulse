import math
from datetime import datetime
from typing import List, Dict, Tuple

import pandas as pd
import pydeck as pdk
import requests
import streamlit as st
from google.transit import gtfs_realtime_pb2



st.set_page_config(page_title="Sydney Transport Map Feasibility Test", layout="wide")

MAPBOX_TOKEN = "pk.eyJ1IjoiZGVlcGFrMTc4IiwiYSI6ImNtbzQyY2JtZjFhb2UycnFha3V3eXk2bXEifQ.CQAoABMh_yC6rLwBdzcR1A"
TFNSW_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJ6Wmg1Y29XblhNbXdIcFlZREZNeVEyblRrRC1sQjl1MkV0SExQUFFGWWxvIiwiaWF0IjoxNzc2NTA0MTc5fQ.1QzAm639IbPIZKHKNjPT7TwP3kTuHoTBX9oLwRKEBtk"

# TfNSW realtime vehicle position v2 endpoints
VEHICLE_ENDPOINTS = {
    "Sydney Trains": "https://api.transport.nsw.gov.au/v2/gtfs/vehiclepos/sydneytrains",
    "Metro": "https://api.transport.nsw.gov.au/v2/gtfs/vehiclepos/metro",
    "Inner West Light Rail": "https://api.transport.nsw.gov.au/v2/gtfs/vehiclepos/lightrail/innerwest",
}

MODE_COLORS = {
    "Sydney Trains": [0, 102, 255, 235],
    "Metro": [0, 200, 140, 235],
    "Inner West Light Rail": [255, 122, 89, 235],
}


# -----------------------------
# Page styling
# -----------------------------
st.markdown(
    """
    <style>
        .block-container {
            padding-top: 1.2rem;
            padding-bottom: 1rem;
            max-width: 100%;
        }
        .main-title {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.2rem;
        }
        .subtle {
            color: #9aa0a6;
            margin-bottom: 1rem;
        }
        .small-note {
            color: #b7bcc4;
            font-size: 0.92rem;
        }
        .status-good {
            color: #28c76f;
            font-weight: 600;
        }
        .status-bad {
            color: #ea5455;
            font-weight: 600;
        }
    </style>
    """,
    unsafe_allow_html=True,
)


# -----------------------------
# Config
# -----------------------------
SYDNEY_CENTER = {
    "latitude": -33.8688,
    "longitude": 151.2093,
    "zoom": 10.8,
    "pitch": 0,
    "bearing": 0,
}


# -----------------------------
# Fake base data
# -----------------------------
STATIONS = [
    {"name": "Central", "lat": -33.8830, "lon": 151.2065, "importance": 10},
    {"name": "Town Hall", "lat": -33.8737, "lon": 151.2069, "importance": 8},
    {"name": "Wynyard", "lat": -33.8666, "lon": 151.2057, "importance": 8},
    {"name": "Circular Quay", "lat": -33.8610, "lon": 151.2126, "importance": 8},
    {"name": "Martin Place", "lat": -33.8678, "lon": 151.2101, "importance": 7},
    {"name": "Redfern", "lat": -33.8924, "lon": 151.1982, "importance": 6},
    {"name": "Strathfield", "lat": -33.8732, "lon": 151.0944, "importance": 7},
    {"name": "Parramatta", "lat": -33.8171, "lon": 151.0034, "importance": 8},
    {"name": "Chatswood", "lat": -33.7969, "lon": 151.1814, "importance": 7},
    {"name": "North Sydney", "lat": -33.8394, "lon": 151.2070, "importance": 6},
    {"name": "Bondi Junction", "lat": -33.8915, "lon": 151.2488, "importance": 6},
    {"name": "Hurstville", "lat": -33.9670, "lon": 151.1010, "importance": 5},
]

ROUTES = [
    {
        "name": "Western Corridor",
        "path": [
            [151.0034, -33.8171],
            [151.0944, -33.8732],
            [151.1982, -33.8924],
            [151.2065, -33.8830],
            [151.2069, -33.8737],
            [151.2057, -33.8666],
            [151.2126, -33.8610],
        ],
    },
    {
        "name": "North Shore Corridor",
        "path": [
            [151.1814, -33.7969],
            [151.2070, -33.8394],
            [151.2057, -33.8666],
            [151.2126, -33.8610],
        ],
    },
    {
        "name": "Eastern Corridor",
        "path": [
            [151.2488, -33.8915],
            [151.2065, -33.8830],
            [151.2069, -33.8737],
            [151.2101, -33.8678],
        ],
    },
    {
        "name": "South Corridor",
        "path": [
            [151.1010, -33.9670],
            [151.1982, -33.8924],
            [151.2065, -33.8830],
            [151.2069, -33.8737],
        ],
    },
]


# -----------------------------
# Theme logic
# -----------------------------
def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i + 2], 16) for i in (0, 2, 4))


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def blend_rgb(c1: Tuple[int, int, int], c2: Tuple[int, int, int], t: float) -> List[int]:
    return [
        int(lerp(c1[0], c2[0], t)),
        int(lerp(c1[1], c2[1], t)),
        int(lerp(c1[2], c2[2], t)),
    ]


def get_theme(hour: int) -> Dict:
    night_route = hex_to_rgb("#4FC3F7")
    dawn_route = hex_to_rgb("#F59E0B")
    day_route = hex_to_rgb("#1565C0")
    dusk_route = hex_to_rgb("#FF7A59")

    night_station = hex_to_rgb("#E1F5FE")
    dawn_station = hex_to_rgb("#FFE0B2")
    day_station = hex_to_rgb("#0D47A1")
    dusk_station = hex_to_rgb("#FFD3C2")

    base_style = "mapbox://styles/mapbox/streets-v12"

    if 0 <= hour <= 5:
        return {
            "phase": "Night",
            "map_style": base_style,
            "route_color": list(night_route),
            "station_color": list(night_station),
            "route_width": 5,
            "station_radius_multiplier": 10,
            "glow_alpha": 180,
            "overlay_color": [10, 20, 45, 70],
        }

    elif 6 <= hour <= 8:
        t = (hour - 6) / 2 if hour < 8 else 1.0
        return {
            "phase": "Dawn",
            "map_style": base_style,
            "route_color": blend_rgb(night_route, dawn_route, t),
            "station_color": blend_rgb(night_station, dawn_station, t),
            "route_width": int(lerp(5, 6, t)),
            "station_radius_multiplier": int(lerp(10, 11, t)),
            "glow_alpha": int(lerp(180, 110, t)),
            "overlay_color": [255, 170, 80, int(lerp(55, 20, t))],
        }

    elif 9 <= hour <= 16:
        return {
            "phase": "Day",
            "map_style": base_style,
            "route_color": list(day_route),
            "station_color": list(day_station),
            "route_width": 6,
            "station_radius_multiplier": 11,
            "glow_alpha": 45,
            "overlay_color": [255, 255, 255, 8],
        }

    elif 17 <= hour <= 19:
        t = (hour - 17) / 2 if hour < 19 else 1.0
        return {
            "phase": "Dusk",
            "map_style": base_style,
            "route_color": blend_rgb(day_route, dusk_route, t),
            "station_color": blend_rgb(day_station, dusk_station, t),
            "route_width": int(lerp(6, 5, t)),
            "station_radius_multiplier": int(lerp(11, 10, t)),
            "glow_alpha": int(lerp(45, 120, t)),
            "overlay_color": [255, 120, 70, int(lerp(15, 40, t))],
        }

    else:
        return {
            "phase": "Night",
            "map_style": base_style,
            "route_color": list(night_route),
            "station_color": list(night_station),
            "route_width": 5,
            "station_radius_multiplier": 10,
            "glow_alpha": 180,
            "overlay_color": [10, 20, 45, 70],
        }


# -----------------------------
# Geometry helpers
# -----------------------------
def build_overlay_polygon() -> List[Dict]:
    return [
        {
            "name": "time_overlay",
            "polygon": [
                [150.70, -34.20],
                [151.50, -34.20],
                [151.50, -33.45],
                [150.70, -33.45],
            ],
        }
    ]


# -----------------------------
# Realtime fetch + parse
# -----------------------------
@st.cache_data(ttl=15, show_spinner=False)
def fetch_vehicle_positions(api_key: str) -> Tuple[pd.DataFrame, List[str]]:
    """
    Fetches TfNSW GTFS-realtime vehicle positions for Sydney Trains, Metro,
    and Inner West Light Rail.
    """
    if not api_key or api_key == "YOUR_TFNSW_API_KEY_HERE":
        return pd.DataFrame(), ["Set your TfNSW API key to load live vehicles."]

    headers = {
        "Authorization": f"apikey {api_key}",
        "Accept": "application/octet-stream",
    }

    rows = []
    errors = []

    for mode_name, url in VEHICLE_ENDPOINTS.items():
        try:
            response = requests.get(url, headers=headers, timeout=20)
            response.raise_for_status()

            feed = gtfs_realtime_pb2.FeedMessage()
            feed.ParseFromString(response.content)

            feed_ts = getattr(feed.header, "timestamp", 0)

            for entity in feed.entity:
                if not entity.HasField("vehicle"):
                    continue

                vehicle = entity.vehicle
                if not vehicle.HasField("position"):
                    continue

                position = vehicle.position
                lat = getattr(position, "latitude", None)
                lon = getattr(position, "longitude", None)

                if lat is None or lon is None:
                    continue

                trip_id = vehicle.trip.trip_id if vehicle.HasField("trip") else ""
                route_id = vehicle.trip.route_id if vehicle.HasField("trip") else ""
                start_date = vehicle.trip.start_date if vehicle.HasField("trip") else ""
                vehicle_id = vehicle.vehicle.id if vehicle.HasField("vehicle") else ""
                label = vehicle.vehicle.label if vehicle.HasField("vehicle") else ""

                stop_id = getattr(vehicle, "stop_id", "")
                current_status = str(getattr(vehicle, "current_status", ""))
                current_stop_sequence = getattr(vehicle, "current_stop_sequence", 0)
                bearing = getattr(position, "bearing", None)
                timestamp = getattr(vehicle, "timestamp", 0) or feed_ts

                ts_display = ""
                if timestamp:
                    try:
                        ts_display = datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")
                    except Exception:
                        ts_display = str(timestamp)

                color = MODE_COLORS[mode_name]

                rows.append(
                    {
                        "name": label or vehicle_id or f"{mode_name} vehicle",
                        "lon": lon,
                        "lat": lat,
                        "radius": 80,
                        "fill_r": color[0],
                        "fill_g": color[1],
                        "fill_b": color[2],
                        "fill_a": color[3],
                        "mode": mode_name,
                        "route_id": route_id,
                        "trip_id": trip_id,
                        "vehicle_id": vehicle_id,
                        "start_date": start_date,
                        "stop_id": stop_id,
                        "current_status": current_status,
                        "current_stop_sequence": current_stop_sequence,
                        "bearing": bearing if bearing is not None else "",
                        "timestamp_display": ts_display,
                        "type": "Live Vehicle",
                        "details": f"Mode: {mode_name} | Route: {route_id or '-'} | Trip: {trip_id or '-'}",
                    }
                )

        except requests.HTTPError as exc:
            errors.append(f"{mode_name}: HTTP {response.status_code} while fetching feed")
        except requests.RequestException as exc:
            errors.append(f"{mode_name}: request failed ({exc})")
        except Exception as exc:
            errors.append(f"{mode_name}: parse failed ({exc})")

    return pd.DataFrame(rows), errors


# -----------------------------
# Layer builders
# -----------------------------
def build_station_dataframe(hour: int, station_color: List[int], glow_alpha: int, radius_multiplier: int) -> pd.DataFrame:
    rows = []
    pulse = 1 + 0.08 * math.sin((hour / 24) * 2 * math.pi)

    for station in STATIONS:
        base_radius = (4 + station["importance"]) * radius_multiplier
        rows.append(
            {
                "name": station["name"],
                "lat": station["lat"],
                "lon": station["lon"],
                "importance": station["importance"],
                "radius": base_radius,
                "glow_radius": base_radius * 1.2 * pulse,
                "fill_r": station_color[0],
                "fill_g": station_color[1],
                "fill_b": station_color[2],
                "fill_a": 230,
                "glow_r": station_color[0],
                "glow_g": station_color[1],
                "glow_b": station_color[2],
                "glow_a": glow_alpha,
                "type": "Station",
                "details": f"Importance: {station['importance']}",
            }
        )
    return pd.DataFrame(rows)


def build_route_dataframe(route_color: List[int]) -> pd.DataFrame:
    rows = []
    for route in ROUTES:
        rows.append(
            {
                "name": route["name"],
                "path": route["path"],
                "r": route_color[0],
                "g": route_color[1],
                "b": route_color[2],
                "a": 210,
                "type": "Route",
                "details": "Static base corridor",
            }
        )
    return pd.DataFrame(rows)


def build_demo_alerts_dataframe() -> pd.DataFrame:
    alerts = [
        {
            "name": "Signal issue near Central",
            "lat": -33.8830,
            "lon": 151.2065,
            "severity": "High",
            "radius": 170,
        },
        {
            "name": "Minor delay on North Shore corridor",
            "lat": -33.8394,
            "lon": 151.2070,
            "severity": "Medium",
            "radius": 140,
        },
    ]

    rows = []
    for alert in alerts:
        color = [255, 59, 48, 210] if alert["severity"] == "High" else [255, 149, 0, 190]

        rows.append(
            {
                "name": alert["name"],
                "lat": alert["lat"],
                "lon": alert["lon"],
                "radius": alert["radius"],
                "fill_r": color[0],
                "fill_g": color[1],
                "fill_b": color[2],
                "fill_a": color[3],
                "type": "Service Alert Demo",
                "details": f"Severity: {alert['severity']}",
            }
        )

    return pd.DataFrame(rows)


def get_layers(hour: int, api_key: str):
    theme = get_theme(hour)

    station_df = build_station_dataframe(
        hour=hour,
        station_color=theme["station_color"],
        glow_alpha=theme["glow_alpha"],
        radius_multiplier=theme["station_radius_multiplier"],
    )

    route_df = build_route_dataframe(theme["route_color"])
    overlay_df = pd.DataFrame(build_overlay_polygon())
    live_vehicle_df, vehicle_errors = fetch_vehicle_positions(api_key)
    alerts_df = build_demo_alerts_dataframe()

    layers = [
        # 0: route lines
        pdk.Layer(
            "PathLayer",
            data=route_df,
            get_path="path",
            get_width=theme["route_width"],
            width_scale=1,
            width_min_pixels=3,
            get_color="[r, g, b, a]",
            pickable=True,
        ),
        # 1: station glow
        pdk.Layer(
            "ScatterplotLayer",
            data=station_df,
            get_position="[lon, lat]",
            get_radius="glow_radius",
            get_fill_color="[glow_r, glow_g, glow_b, glow_a]",
            pickable=False,
            stroked=False,
            filled=True,
            opacity=0.55,
        ),
        # 2: station core
        pdk.Layer(
            "ScatterplotLayer",
            data=station_df,
            get_position="[lon, lat]",
            get_radius="radius",
            get_fill_color="[fill_r, fill_g, fill_b, fill_a]",
            get_line_color=[255, 255, 255, 120],
            line_width_min_pixels=1,
            pickable=True,
            stroked=True,
            filled=True,
        ),
        # # 3: subtle time tint overlay
        # pdk.Layer(
        #     "PolygonLayer",
        #     data=overlay_df,
        #     get_polygon="polygon",
        #     get_fill_color=theme["overlay_color"],
        #     pickable=False,
        #     stroked=False,
        #     filled=True,
        # ),
        # 4: live vehicles
        pdk.Layer(
            "ScatterplotLayer",
            data=live_vehicle_df,
            get_position="[lon, lat]",
            get_radius="radius",
            get_fill_color="[fill_r, fill_g, fill_b, fill_a]",
            get_line_color=[255, 255, 255, 180],
            line_width_min_pixels=1,
            pickable=True,
            stroked=True,
            filled=True,
        ),
        # 5: demo alerts
        pdk.Layer(
            "ScatterplotLayer",
            data=alerts_df,
            get_position="[lon, lat]",
            get_radius="radius",
            get_fill_color="[fill_r, fill_g, fill_b, fill_a]",
            pickable=True,
            stroked=False,
            filled=True,
            opacity=0.6,
        ),
    ]

    return layers, theme, live_vehicle_df, vehicle_errors


# -----------------------------
# UI
# -----------------------------
st.markdown('<div class="main-title">Sydney Transport Map Feasibility Test</div>', unsafe_allow_html=True)
st.markdown(
    '<div class="subtle">Street basemap for all times, subtle tinting, and live TfNSW vehicle positions for trains, metro, and Inner West Light Rail.</div>',
    unsafe_allow_html=True,
)

left, right = st.columns([3, 1])

with right:
    hour = st.slider("Time of day", min_value=0, max_value=23, value=8, step=1)

    tfnsw_key_ui = st.text_input(
        "TfNSW API key",
        value=TFNSW_API_KEY,
        type="password",
        help="Used for live vehicle feeds",
    )

    layers, theme, live_vehicle_df, vehicle_errors = get_layers(hour, tfnsw_key_ui)

    st.markdown(f"**Phase:** {theme['phase']}")

    st.markdown("**Visible layers**")
    show_stations = st.checkbox("Show station points", value=True)
    show_routes = st.checkbox("Show route lines", value=True)
    show_overlay = st.checkbox("Show time tint overlay", value=True)
    show_vehicles = st.checkbox("Show live vehicles", value=True)
    show_alerts = st.checkbox("Show alerts (demo)", value=True)

    st.markdown("**Live feed status**")
    if not live_vehicle_df.empty:
        st.markdown(f'<div class="status-good">Live vehicles loaded: {len(live_vehicle_df)}</div>', unsafe_allow_html=True)
        st.write(live_vehicle_df["mode"].value_counts().to_dict())
    else:
        st.markdown('<div class="status-bad">No live vehicles loaded</div>', unsafe_allow_html=True)

    if vehicle_errors:
        st.warning("\n".join(vehicle_errors))

    st.markdown(
        '<div class="small-note">Live vehicle feed uses TfNSW GTFS-realtime protobuf. Alerts are still demo data for now.</div>',
        unsafe_allow_html=True,
    )

    visible_layers = []
    if show_routes:
        visible_layers.append(layers[0])
    if show_stations:
        visible_layers.extend([layers[1], layers[2]])
    if show_vehicles:
        visible_layers.append(layers[3])
    if show_alerts:
        visible_layers.append(layers[4])
    # if show_alerts:
    #     visible_layers.append(layers[5])

with left:
    deck = pdk.Deck(
        map_provider="mapbox",
        api_keys={"mapbox": MAPBOX_TOKEN},
        map_style=theme["map_style"],
        initial_view_state=pdk.ViewState(
            latitude=SYDNEY_CENTER["latitude"],
            longitude=SYDNEY_CENTER["longitude"],
            zoom=SYDNEY_CENTER["zoom"],
            pitch=SYDNEY_CENTER["pitch"],
            bearing=SYDNEY_CENTER["bearing"],
        ),
        tooltip={
            "html": """
                <b>{name}</b><br/>
                <b>Type:</b> {type}<br/>
                <b>Details:</b> {details}<br/>
                <b>Mode:</b> {mode}<br/>
                <b>Route:</b> {route_id}<br/>
                <b>Trip:</b> {trip_id}<br/>
                <b>Vehicle:</b> {vehicle_id}<br/>
                <b>Stop:</b> {stop_id}<br/>
                <b>Status:</b> {current_status}<br/>
                <b>Feed time:</b> {timestamp_display}
            """,
            "style": {
                "backgroundColor": "rgba(20, 20, 20, 0.9)",
                "color": "white",
                "fontSize": "13px",
            },
        },
        layers=visible_layers,
    )

    st.pydeck_chart(deck, use_container_width=True)

st.markdown("---")
st.markdown("### Next upgrades")
st.write(
    "- replace fake routes/stations with actual NSW transport datasets\n"
    "- add realtime alerts feed\n"
    "- add filters by mode and route\n"
    "- draw real route shapes instead of corridor placeholders\n"
    "- add auto-refresh and playback/replay controls"
)