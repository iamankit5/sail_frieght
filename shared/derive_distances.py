# shared/derive_distances.py
"""
Self-derived nautical route distances — the documented, vendor-independent method.

WHY THIS EXISTS
---------------
The commercial product must not resell distances copied from a licensed vendor
(e.g. Sea-Distances.org tables). Instead, every route distance in
`shared/engine_config.json` is derived here from public facts:

  1. Port coordinates (public knowledge, published by port authorities).
  2. Great-circle (haversine) distance between consecutive waypoints.
  3. A documented detour factor per lane class (added mileage from real
     sea-lane geometry: traffic separation schemes, strait approaches,
     coastal steering). Factors used:
       >= 4000 NM open-ocean lanes ............ 1.07
       2000-4000 NM lanes ..................... 1.09
       < 2000 NM archipelago/coastal lanes .... 1.15
       Suez-route sea legs .................... 1.06 per leg
  4. US Gulf -> India lanes are routed via the Suez Canal with waypoint legs
     (New Orleans -> Gibraltar -> Port Said -> canal transit -> Gulf of Suez
     -> Bab-el-Mandeb -> destination) and a fixed 120 NM canal transit.

The resulting distances are physical approximations produced by a transparent,
reproducible method owned by this project — re-run this script after editing
port coordinates or factors to regenerate `engine_config.json`.
"""
import json
import math
import os
from datetime import datetime, timezone

SHARED_DIR = os.path.dirname(os.path.abspath(__file__))

# Port coordinates: public knowledge (port authority / hydrographic publications).
PORTS = {
    # Load ports
    "Australia (Newcastle)": {"lat": -32.9283, "lon": 151.7817, "region": "Australia"},
    "Australia (Hay Point)": {"lat": -21.2858, "lon": 149.2997, "region": "Australia"},
    "Indonesia (Samarinda)": {"lat": -0.5021, "lon": 117.1537, "region": "Indonesia"},
    "Mozambique (Maputo)":   {"lat": -25.9692, "lon": 32.5732, "region": "Mozambique"},
    "USA (New Orleans)":     {"lat": 29.9511, "lon": -90.0715, "region": "USA"},
    "Russia (Vladivostok)":  {"lat": 43.1155, "lon": 131.8855, "region": "Russia"},
    # Discharge ports
    "Paradip":  {"lat": 20.2644, "lon": 86.6083, "region": "India"},
    "Haldia":   {"lat": 22.0257, "lon": 88.0583, "region": "India"},
    "Vizag":    {"lat": 17.6868, "lon": 83.2185, "region": "India"},
    "Dhamra":   {"lat": 20.8317, "lon": 86.9583, "region": "India"},
}

DEST_PORTS = ["Paradip", "Haldia", "Vizag", "Dhamra"]

# Suez Canal routing waypoints for US Gulf -> India lanes (public geography).
SUEZ_WAYPOINTS = [
    {"name": "Strait of Gibraltar", "lat": 35.97, "lon": -5.50},
    {"name": "Port Said (N canal entrance)", "lat": 31.26, "lon": 32.30},
]
SUEZ_CANAL_TRANSIT_NM = 120.0  # Port Said -> Port Suez, published canal length
SUEZ_EXIT = {"name": "Gulf of Suez", "lat": 29.95, "lon": 32.55}
BAB_EL_MANDEB = {"name": "Bab-el-Mandeb Strait", "lat": 12.58, "lon": 43.33}

SUEZ_SEA_LEG_FACTOR = 1.06

# Cape of Good Hope routing for US Gulf lanes — the standard deep-draft
# (Capesize) alternative to the Suez Canal.
CAPE_WAYPOINTS = [
    {"name": "Lesser Antilles Passage", "lat": 12.0, "lon": -61.0},
    {"name": "Central Atlantic", "lat": 3.0, "lon": -30.0},
    {"name": "South Atlantic", "lat": -24.0, "lon": -5.0},
    {"name": "Cape of Good Hope", "lat": -34.8, "lon": 18.5},
    {"name": "Southern Indian Ocean", "lat": -20.0, "lon": 52.0},
    {"name": "Arabian Sea", "lat": 2.0, "lon": 72.0},
]

LOAD_PORTS = [p for p in PORTS if p not in DEST_PORTS]


def haversine_nm(lat1, lon1, lat2, lon2):
    """Great-circle distance in nautical miles."""
    r = 3440.065  # Earth radius in NM
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlmb / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def detour_factor(nm):
    if nm >= 4000:
        return 1.07
    if nm >= 2000:
        return 1.09
    return 1.15


def route_distance(origin, destination):
    """Return (distance_nm, method_note) for the DEFAULT (Suez) US-lane route."""
    o = PORTS[origin]
    d = PORTS[destination]

    if o["region"] == "USA" and d["region"] == "India":
        # Suez route: sea legs via waypoints + fixed canal transit.
        legs = []
        legs.append(haversine_nm(o["lat"], o["lon"], SUEZ_WAYPOINTS[0]["lat"], SUEZ_WAYPOINTS[0]["lon"]))
        legs.append(haversine_nm(SUEZ_WAYPOINTS[0]["lat"], SUEZ_WAYPOINTS[0]["lon"], SUEZ_WAYPOINTS[1]["lat"], SUEZ_WAYPOINTS[1]["lon"]))
        legs.append(haversine_nm(SUEZ_EXIT["lat"], SUEZ_EXIT["lon"], BAB_EL_MANDEB["lat"], BAB_EL_MANDEB["lon"]))
        legs.append(haversine_nm(BAB_EL_MANDEB["lat"], BAB_EL_MANDEB["lon"], d["lat"], d["lon"]))
        total = sum(leg * SUEZ_SEA_LEG_FACTOR for leg in legs) + SUEZ_CANAL_TRANSIT_NM
        return int(round(total / 10.0) * 10), "Suez Canal route (4 waypoint legs x1.06 + 120NM canal)"

    direct = haversine_nm(o["lat"], o["lon"], d["lat"], d["lon"])
    factor = detour_factor(direct)
    total = direct * factor
    return int(round(total / 10.0) * 10), f"Great-circle x{factor} detour factor"


def cape_route_distance(origin, destination):
    """Cape of Good Hope route for US Gulf lanes (deep-draft vessels)."""
    o = PORTS[origin]
    d = PORTS[destination]
    chain = [(o["lat"], o["lon"])] + [(w["lat"], w["lon"]) for w in CAPE_WAYPOINTS] + [(d["lat"], d["lon"])]
    total = 0.0
    for (la1, lo1), (la2, lo2) in zip(chain, chain[1:]):
        total += haversine_nm(la1, lo1, la2, lo2) * SUEZ_SEA_LEG_FACTOR
    return int(round(total / 10.0) * 10), "Cape of Good Hope route (7 waypoint legs x1.06)"


def main():
    routes = {}
    route_methods = {}
    routes_alternates = {}  # e.g. US Cape-route table per load port
    for origin in LOAD_PORTS:
        routes[origin] = {}
        route_methods[origin] = {}
        for dest in DEST_PORTS:
            nm, method = route_distance(origin, dest)
            routes[origin][dest] = nm
            route_methods[origin][dest] = method
            print(f"{origin:26s} -> {dest:10s} {nm:6d} NM  ({method})")

    # Vessel-class routing: deep-draft US Gulf cargoes sail the Cape route
    # (no canal transit); smaller classes take Suez.
    us_port = "USA (New Orleans)"
    routes_alternates[us_port] = {"Cape of Good Hope": {}}
    for dest in DEST_PORTS:
        nm, _ = cape_route_distance(us_port, dest)
        routes_alternates[us_port]["Cape of Good Hope"][dest] = nm
        print(f"{us_port:26s} -> {dest:10s} {nm:6d} NM  (Cape of Good Hope route)")

    config = {
        "_meta": {
            "description": "Single source of truth for procurement engine parameters. Consumed by both the Python engine (procurement/procurement_engine.py) and the TypeScript engine (frontend/src/lib/procurementEngine.ts).",
            "distance_method": "Great-circle (haversine) distances between public port coordinates, multiplied by documented detour factors; US Gulf lanes via Suez Canal waypoints. Derivation: shared/derive_distances.py (re-run to regenerate this file).",
            "assumption_disclosure": "Vessel hire rates, fuel consumption, handling fees, demurrage buffers and cost constants are operator-editable planning assumptions, not data licensed from any commercial provider. Operators must validate all assumptions against their own broker intelligence before commercial use.",
            "generated_at": datetime.now(timezone.utc).isoformat(),
        },
        "cost_constants": {
            "base_port_charge_usd": 35000,
            "suez_canal_fee_usd": 8500,
            "demurrage_buffer_usd": {"High": 12000, "Medium": 6000, "Low": 2500},
            # Rough index-to-rate conversion used ONLY for relative trend display.
            "freight_usd_per_mt_per_index_point": 0.24,
            # US Gulf lanes: canal fees apply only to the Suez route; deep-draft
            # Capesize tonnage sails the Cape of Good Hope route instead.
            "vessel_routing": {
                "USA (New Orleans)": {
                    "Suez": ["Handysize", "Supramax", "Panamax"],
                    "Cape of Good Hope": ["Capesize"],
                }
            },
            "route_fees_usd": {"Suez": 8500, "Cape of Good Hope": 0},
        },
        "ports": PORTS,
        "routes": routes,
        "routes_alternates": routes_alternates,
        "route_methods": route_methods,
        "vessels": {
            "Handysize": {"avg_cap": 35000, "speed_knots": 13, "fuel_per_day": 20, "daily_hire_rate": 11500, "draft_m": 10.0, "availability": "4 vessels", "risk": "Medium"},
            "Supramax":  {"avg_cap": 55000, "speed_knots": 14, "fuel_per_day": 25, "daily_hire_rate": 14500, "draft_m": 11.5, "availability": "3 vessels", "risk": "Medium"},
            "Panamax":   {"avg_cap": 75000, "speed_knots": 14, "fuel_per_day": 30, "daily_hire_rate": 16500, "draft_m": 13.5, "availability": "8 vessels", "risk": "Low"},
            "Capesize":  {"avg_cap": 180000, "speed_knots": 13, "fuel_per_day": 45, "daily_hire_rate": 24500, "draft_m": 18.2, "availability": "1 vessel", "risk": "High"},
        },
        "cargo_profiles": {
            "Coking Coal": {
                "stowage_factor_m3_mt": 1.25,
                "handling_fee_pmt": 3.20,
                "discharge_rate_tpd": 25000,
                "demurrage_multiplier": 1.0,
                "description": "Prime Hard Coking Coal for blast furnace steel production.",
            },
            "Thermal Coal": {
                "stowage_factor_m3_mt": 1.38,
                "handling_fee_pmt": 2.80,
                "discharge_rate_tpd": 20000,
                "demurrage_multiplier": 1.35,
                "description": "Non-coking thermal coal for captive power plant boilers.",
            },
            "Iron Ore Pellets": {
                "stowage_factor_m3_mt": 0.52,
                "handling_fee_pmt": 4.50,
                "discharge_rate_tpd": 35000,
                "demurrage_multiplier": 0.85,
                "description": "High-grade iron ore pellets for direct reduction and blast furnace feed.",
            },
            "Limestone": {
                "stowage_factor_m3_mt": 1.15,
                "handling_fee_pmt": 3.60,
                "discharge_rate_tpd": 18000,
                "demurrage_multiplier": 1.10,
                "description": "High-calcium limestone flux for basic oxygen furnace slag formation.",
            },
        },
        # Port operations profile: draft limits from public port authority notices
        # (verify against the latest notice-to-mariners before commercial reliance).
        "port_operations": {
            "Paradip":  {"waiting_days": 2.5, "draft_limit_m": 14.5},
            "Haldia":   {"waiting_days": 3.8, "draft_limit_m": 8.5},
            "Vizag":    {"waiting_days": 2.0, "draft_limit_m": 14.5},
            "Dhamra":   {"waiting_days": 1.8, "draft_limit_m": 18.0},
        },
        # Load-port operating environment (planning assumptions, editable).
        "load_port_risk": {
            "Australia (Newcastle)": {"weather_risk": "Low", "congestion_risk": "Medium"},
            "Australia (Hay Point)": {"weather_risk": "Low", "congestion_risk": "Low"},
            "Indonesia (Samarinda)": {"weather_risk": "Medium", "congestion_risk": "Medium"},
            "Mozambique (Maputo)":   {"weather_risk": "Low", "congestion_risk": "Low"},
            "USA (New Orleans)":     {"weather_risk": "Medium", "congestion_risk": "High"},
            "Russia (Vladivostok)":  {"weather_risk": "High", "congestion_risk": "Low"},
            # Discharge-port congestion profile (planning assumptions, editable).
            "Paradip":  {"weather_risk": "Low", "congestion_risk": "Medium"},
            "Haldia":   {"weather_risk": "Medium", "congestion_risk": "High"},
            "Vizag":    {"weather_risk": "Low", "congestion_risk": "Low"},
            "Dhamra":   {"weather_risk": "Low", "congestion_risk": "Low"},
        },
    }

    out = os.path.join(SHARED_DIR, "engine_config.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"\nWrote {out}")


if __name__ == "__main__":
    main()
