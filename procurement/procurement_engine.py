# procurement/procurement_engine.py
"""
Deterministic voyage-cost and vessel-feasibility engine.

DATA POSTURE (see docs/DATA_PROVENANCE.md and docs/COMMERCIALIZATION_PLAN.md):
- All engine parameters (ports, routes, vessel specs, cargo profiles, cost
  constants) load from shared/engine_config.json — the single source of truth
  consumed by both this engine and the TypeScript frontend engine.
- Route distances are self-derived (great-circle + documented detour factors;
  Suez waypoint routing for US Gulf lanes) — see shared/derive_distances.py.
- Vessel hire rates, handling fees, demurrage buffers and cost constants are
  operator-editable planning assumptions, NOT data licensed from any provider.
  Operators must validate them against their own broker intelligence.
"""
import json
import os
import threading

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(_THIS_DIR, "..", "shared", "engine_config.json")

_config_lock = threading.Lock()
_config_cache = None


def load_engine_config(path=None):
    """Load and cache the shared engine configuration."""
    global _config_cache
    with _config_lock:
        if _config_cache is not None and path is None:
            return _config_cache
        target = path or CONFIG_PATH
        if not os.path.exists(target):
            raise FileNotFoundError(
                f"Engine configuration not found at {target}. "
                "Run `python shared/derive_distances.py` to generate it."
            )
        with open(target, "r", encoding="utf-8") as f:
            cfg = json.load(f)
        if path is None:
            _config_cache = cfg
        return cfg


_CFG = load_engine_config()

DATA_CITATIONS = {
    "Route Distances": "Self-derived: great-circle (haversine) between public port coordinates x documented detour factors; US Gulf lanes via Suez Canal waypoints (method: shared/derive_distances.py)",
    "Charter Rates": "Operator-editable market assumptions (not licensed data; validate against your own broker intelligence)",
    "Port Draft Constraints": "Public port authority berth guidelines (verify against latest notices before commercial reliance)",
}

COST_CONSTANTS = _CFG["cost_constants"]
BASE_PORT_CHARGE_USD = COST_CONSTANTS["base_port_charge_usd"]
DEMURRAGE_BUFFER_USD = COST_CONSTANTS["demurrage_buffer_usd"]
# Vessel-class-aware routing: e.g. US Gulf lanes — Suez for smaller classes,
# Cape of Good Hope for Capesize. Maps origin -> route_name -> [vessels].
VESSEL_ROUTING = COST_CONSTANTS.get("vessel_routing", {})
ROUTE_FEES_USD = COST_CONSTANTS.get("route_fees_usd", {"Suez": COST_CONSTANTS.get("suez_canal_fee_usd", 8500)})
# Alternate route distance tables, e.g. {"USA (New Orleans)": {"Cape of Good Hope": {...}}}
ROUTES_ALTERNATES = _CFG.get("routes_alternates", {})

PORT_COORDINATES = {}
for _name, _p in _CFG["ports"].items():
    entry = dict(_p)
    ops = _CFG["port_operations"].get(_name)
    if ops:
        entry.update(ops)
    risk = _CFG["load_port_risk"].get(_name)
    if risk:
        entry.update(risk)
    PORT_COORDINATES[_name] = entry

ROUTES = _CFG["routes"]
VESSEL_SPECS = _CFG["vessels"]
CARGO_PROFILES = _CFG["cargo_profiles"]

_RISK_ORDER = {"Low": 1, "Medium": 2, "High": 3}


def evaluate_all_vessels(cargo_qty_mt, origin, destination, bunker_price, freight_multiplier=1.0, cargo_type="Coking Coal"):
    if cargo_qty_mt is None or cargo_qty_mt <= 0:
        raise ValueError("Cargo quantity must be a positive number greater than 0 MT.")
    if origin not in ROUTES or destination not in ROUTES[origin]:
        raise ValueError(f"Invalid route selection: '{origin}' to '{destination}'")
    if bunker_price is None or bunker_price <= 0:
        raise ValueError("Bunker price must be a positive numerical value.")
    if cargo_type not in CARGO_PROFILES:
        raise ValueError(
            f"Unsupported cargo type '{cargo_type}'. Supported: {', '.join(sorted(CARGO_PROFILES))}"
        )

    cargo_profile = CARGO_PROFILES[cargo_type]
    dest_draft = PORT_COORDINATES[destination]["draft_limit_m"]
    origin_routing = VESSEL_ROUTING.get(origin, {})
    evaluations = []

    for v_name, spec in VESSEL_SPECS.items():
        # Resolve the vessel's route: default table, or an alternate lane
        # (e.g. Cape of Good Hope for deep-draft tonnage) with its own fee.
        route_name = next(
            (rn for rn, vessels in origin_routing.items() if v_name in vessels),
            None,
        )
        if route_name and ROUTES_ALTERNATES.get(origin, {}).get(route_name):
            distance = ROUTES_ALTERNATES[origin][route_name][destination]
        else:
            # Default lane table (e.g. the Suez-route distance for US lanes).
            distance = ROUTES[origin][destination]
        canal_fees = ROUTE_FEES_USD.get(route_name, 0) if route_name else 0
        route_via = route_name or ("Suez" if origin in VESSEL_ROUTING else None)
        daily_dist = spec["speed_knots"] * 24
        voyage_days = distance / daily_dist

        fuel_cost = voyage_days * spec["fuel_per_day"] * bunker_price
        charter_cost = voyage_days * spec["daily_hire_rate"] * freight_multiplier
        cargo_handling_cost = cargo_qty_mt * cargo_profile["handling_fee_pmt"]
        port_charges = BASE_PORT_CHARGE_USD + cargo_handling_cost

        demurrage_risk = DEMURRAGE_BUFFER_USD[spec["risk"]] * cargo_profile["demurrage_multiplier"]

        total_voyage_cost = fuel_cost + charter_cost + port_charges + demurrage_risk + canal_fees
        cost_per_mt = total_voyage_cost / cargo_qty_mt if cargo_qty_mt > 0 else 0

        utilization = (cargo_qty_mt / spec["avg_cap"]) * 100
        util_penalty = abs(100 - utilization) * 0.5 if utilization <= 120 else (utilization - 100) * 1.8

        # Volumetric stowage check (grain cube limit)
        volumetric_m3_required = cargo_qty_mt * cargo_profile["stowage_factor_m3_mt"]
        vessel_grain_capacity_m3 = spec["avg_cap"] * 1.30
        cube_penalty = 0
        if volumetric_m3_required > vessel_grain_capacity_m3:
            cube_penalty = ((volumetric_m3_required - vessel_grain_capacity_m3) / vessel_grain_capacity_m3) * 30

        # Physical constraint: draft infeasibility is a hard fail, not a soft penalty
        draft_penalty = 0
        is_feasible = True
        feasibility = "Cleared"
        if spec["draft_m"] > dest_draft:
            draft_penalty = 50
            is_feasible = False
            feasibility = f"INFEASIBLE: Draft Exceeds Port Limit ({spec['draft_m']}m > {dest_draft}m)"

        base_score = 96 - util_penalty - (cost_per_mt * 0.05) - draft_penalty - cube_penalty
        decision_score = max(0, min(99, round(base_score, 1)))

        evaluations.append({
            "vessel": v_name,
            "capacity": f"{spec['avg_cap'] // 1000}K MT",
            "capacity_dwt": spec["avg_cap"],
            "draft_m": spec["draft_m"],
            "port_draft_limit_m": dest_draft,
            "is_feasible": is_feasible,
            "route_via": route_via,
            "voyage_days": round(voyage_days, 1),
            "fuel_burned_mt": round(voyage_days * spec["fuel_per_day"], 1),
            "total_cost_usd": round(total_voyage_cost, 0),
            "cost_per_mt": round(cost_per_mt, 2),
            "freight_pmt": round(charter_cost / cargo_qty_mt, 2),
            "fuel_pmt": round(fuel_cost / cargo_qty_mt, 2),
            "port_pmt": round((port_charges + canal_fees) / cargo_qty_mt, 2),
            "demurrage_pmt": round(demurrage_risk / cargo_qty_mt, 2),
            "utilization_pct": round(min(100.0, utilization), 1),
            "availability": spec["availability"],
            "risk": spec["risk"],
            "feasibility": feasibility,
            "decision_score": decision_score,
            "cargo_type": cargo_type,
            "cargo_stowage_factor": cargo_profile["stowage_factor_m3_mt"],
            "cargo_handling_pmt": cargo_profile["handling_fee_pmt"]
        })

    evaluations.sort(key=lambda x: x["decision_score"], reverse=True)
    return evaluations


def _risk_level(value):
    return _RISK_ORDER.get(value, 2)


def get_route_risk_profile(origin, destination):
    if origin not in PORT_COORDINATES or destination not in PORT_COORDINATES:
        raise ValueError(f"Unknown port in route profile request: '{origin}' to '{destination}'")
    orig = PORT_COORDINATES[origin]
    dest = PORT_COORDINATES[destination]
    waiting_days = dest.get("waiting_days", 0)

    # Derived overall exposure: load-port weather + discharge congestion + berth delay.
    level_score = (
        _risk_level(orig.get("weather_risk", "Medium"))
        + _risk_level(dest.get("congestion_risk", "Medium"))
        + (3 if waiting_days >= 3.5 else 2 if waiting_days >= 2.5 else 1)
    ) / 3.0
    overall = "High" if level_score >= 2.5 else ("Medium" if level_score >= 1.75 else "Low")

    return {
        "Origin Weather": orig.get("weather_risk", "Unknown"),
        "Port Congestion": dest.get("congestion_risk", "Unknown"),
        "Waiting Time at Dest": f"{waiting_days} Days",
        "Overall Route Risk": overall,
    }
