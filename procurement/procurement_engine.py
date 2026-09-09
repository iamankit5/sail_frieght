# procurement/procurement_engine.py
"""
MARITIME DATA ASSUMPTIONS & BENCHMARK DISCLOSURES:
-----------------------------------------------------------------------------
1. Port Draft Limits & Waiting Days: Representative operational limits calibrated 
   to Indian Major Ports Authority berth guidelines (e.g. Haldia riverine draft limit ~8.5m).
2. Nautical Route Distances: Operational distance approximations calibrated 
   against Sea-Distances.org maritime tables.
3. Vessel Specifications & Daily Hire Rates: Standard market averages calibrated 
   to Clarksons Research 2024 dry bulk spot ranges (Handysize, Supramax, Panamax, Capesize).
-----------------------------------------------------------------------------
"""

DATA_CITATIONS = {
    "Route Distances": "Operational distance estimates (calibrated to Sea-Distances.org tables)",
    "Charter Rates": "Industry spot averages (representative of Clarksons Research 2024 ranges)",
    "Port Draft Constraints": "Berth operational guidelines (calibrated to Indian Major Ports Authority)"
}

PORT_COORDINATES = {
    "Australia (Newcastle)": {"lat": -32.9283, "lon": 151.7817, "weather_risk": "Low", "congestion_risk": "Medium"},
    "Australia (Hay Point)": {"lat": -21.2858, "lon": 149.2997, "weather_risk": "Low", "congestion_risk": "Low"},
    "Indonesia (Samarinda)": {"lat": -0.5021, "lon": 117.1537, "weather_risk": "Medium", "congestion_risk": "Medium"},
    "Mozambique (Maputo)":   {"lat": -25.9692, "lon": 32.5732, "weather_risk": "Low", "congestion_risk": "Low"},
    "USA (New Orleans)":     {"lat": 29.9511, "lon": -90.0715, "weather_risk": "Medium", "congestion_risk": "High"},
    "Russia (Vladivostok)":  {"lat": 43.1155, "lon": 131.8855, "weather_risk": "High", "congestion_risk": "Low"},
    # Port Draft Constraints (Max Permissible Depth in meters - Source: Port Trust operational guidelines)
    "Paradip":  {"lat": 20.2644, "lon": 86.6083, "waiting_days": 2.5, "draft_limit_m": 14.5},
    "Haldia":   {"lat": 22.0257, "lon": 88.0583, "waiting_days": 3.8, "draft_limit_m": 8.5}, # Shallow river channel draft restriction
    "Vizag":    {"lat": 17.6868, "lon": 83.2185, "waiting_days": 2.0, "draft_limit_m": 14.5},
    "Dhamra":   {"lat": 20.8317, "lon": 86.9583, "waiting_days": 1.8, "draft_limit_m": 18.0}  # Deepwater berth
}

# Nautical Distances in Nautical Miles (NM) - Calibrated to Sea-Distances.org maritime routing tables
ROUTES = {
    "Australia (Newcastle)": {"Paradip": 4580, "Haldia": 4680, "Vizag": 4420, "Dhamra": 4560},
    "Australia (Hay Point)": {"Paradip": 4320, "Haldia": 4420, "Vizag": 4180, "Dhamra": 4300},
    "Indonesia (Samarinda)": {"Paradip": 2180, "Haldia": 2320, "Vizag": 2080, "Dhamra": 2220},
    "Mozambique (Maputo)":   {"Paradip": 3880, "Haldia": 4020, "Vizag": 3740, "Dhamra": 3920},
    "USA (New Orleans)":     {"Paradip": 9820, "Haldia": 9960, "Vizag": 9680, "Dhamra": 9860},
    "Russia (Vladivostok)":  {"Paradip": 4760, "Haldia": 4900, "Vizag": 4620, "Dhamra": 4800}
}

# Vessel Specifications & Daily Hire Rates - Representative of Clarksons Research 2024 Spot Benchmarks
VESSEL_SPECS = {
    "Handysize": {"avg_cap": 35000, "speed_knots": 13, "fuel_per_day": 20, "daily_hire_rate": 11500, "draft_m": 10.0, "availability": "4 vessels", "risk": "🟡 Medium"},
    "Supramax":  {"avg_cap": 55000, "speed_knots": 14, "fuel_per_day": 25, "daily_hire_rate": 14500, "draft_m": 11.5, "availability": "3 vessels", "risk": "🟡 Medium"},
    "Panamax":   {"avg_cap": 75000, "speed_knots": 14, "fuel_per_day": 30, "daily_hire_rate": 16500, "draft_m": 13.5, "availability": "8 vessels", "risk": "🟢 Low"},
    "Capesize":  {"avg_cap": 180000, "speed_knots": 13, "fuel_per_day": 45, "daily_hire_rate": 24500, "draft_m": 18.2, "availability": "1 vessel", "risk": "🔴 High"}
}

# Cargo Material Profiles - Stowage Factors, Port Handling Tariffs & Handling Dynamics
CARGO_PROFILES = {
    "Coking Coal": {
        "stowage_factor_m3_mt": 1.25,
        "handling_fee_pmt": 3.20,
        "discharge_rate_tpd": 25000,
        "demurrage_multiplier": 1.0,
        "description": "Prime Hard Coking Coal for blast furnace steel production."
    },
    "Thermal Coal": {
        "stowage_factor_m3_mt": 1.38,
        "handling_fee_pmt": 2.80,
        "discharge_rate_tpd": 20000,
        "demurrage_multiplier": 1.35,
        "description": "Non-coking thermal coal for captive power plant boilers."
    },
    "Iron Ore Pellets": {
        "stowage_factor_m3_mt": 0.52,
        "handling_fee_pmt": 4.50,
        "discharge_rate_tpd": 35000,
        "demurrage_multiplier": 0.85,
        "description": "High-grade iron ore pellets for direct reduction and blast furnace feed."
    },
    "Limestone": {
        "stowage_factor_m3_mt": 1.15,
        "handling_fee_pmt": 3.60,
        "discharge_rate_tpd": 18000,
        "demurrage_multiplier": 1.10,
        "description": "High-calcium limestone flux for basic oxygen furnace slag formation."
    }
}

def evaluate_all_vessels(cargo_qty_mt, origin, destination, bunker_price, freight_multiplier=1.0, cargo_type="Coking Coal"):
    if cargo_qty_mt is None or cargo_qty_mt <= 0:
        raise ValueError("Cargo quantity must be a positive number greater than 0 MT.")
    if origin not in ROUTES or destination not in ROUTES[origin]:
        raise ValueError(f"Invalid route selection: '{origin}' to '{destination}'")
    if bunker_price is None or bunker_price <= 0:
        raise ValueError("Bunker price must be a positive numerical value.")

    cargo_profile = CARGO_PROFILES.get(cargo_type, CARGO_PROFILES["Coking Coal"])
    distance = ROUTES[origin][destination]
    dest_draft = PORT_COORDINATES[destination]["draft_limit_m"]
    evaluations = []

    for v_name, spec in VESSEL_SPECS.items():
        daily_dist = spec["speed_knots"] * 24
        voyage_days = distance / daily_dist
        
        fuel_cost = voyage_days * spec["fuel_per_day"] * bunker_price
        charter_cost = voyage_days * spec["daily_hire_rate"] * freight_multiplier
        base_port_charges = 35000
        cargo_handling_cost = cargo_qty_mt * cargo_profile["handling_fee_pmt"]
        port_charges = base_port_charges + cargo_handling_cost
        
        base_demurrage = 12000 if spec["risk"] == "🔴 High" else (6000 if spec["risk"] == "🟡 Medium" else 2500)
        demurrage_risk = base_demurrage * cargo_profile["demurrage_multiplier"]
        canal_fees = 8500 if "USA" in origin else 2000
        
        total_voyage_cost = fuel_cost + charter_cost + port_charges + demurrage_risk + canal_fees
        cost_per_mt = total_voyage_cost / cargo_qty_mt if cargo_qty_mt > 0 else 0
        
        utilization = (cargo_qty_mt / spec["avg_cap"]) * 100
        util_penalty = abs(100 - utilization) * 0.5 if utilization <= 120 else (utilization - 100) * 1.8
        
        # Volumetric Stowage Check (Stowage Cube Limit)
        volumetric_m3_required = cargo_qty_mt * cargo_profile["stowage_factor_m3_mt"]
        vessel_grain_capacity_m3 = spec["avg_cap"] * 1.30
        cube_penalty = 0
        if volumetric_m3_required > vessel_grain_capacity_m3:
            cube_penalty = ((volumetric_m3_required - vessel_grain_capacity_m3) / vessel_grain_capacity_m3) * 30

        # Physical Constraint Check: Draft Infeasibility
        draft_penalty = 0
        is_feasible = True
        feasibility = "🟢 Cleared"
        if spec["draft_m"] > dest_draft:
            draft_penalty = 50  # Severe physical constraint penalty
            is_feasible = False
            feasibility = f"🔴 INFEASIBLE: Draft Exceeds Port Limit ({spec['draft_m']}m > {dest_draft}m)"
        
        base_score = 96 - util_penalty - (cost_per_mt * 0.05) - draft_penalty - cube_penalty
        ai_score = max(0, min(99, round(base_score, 1)))

        evaluations.append({
            "vessel": v_name,
            "capacity": f"{spec['avg_cap'] // 1000}K MT",
            "capacity_dwt": spec["avg_cap"],
            "draft_m": spec["draft_m"],
            "port_draft_limit_m": dest_draft,
            "is_feasible": is_feasible,
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
            "ai_score": ai_score,
            "cargo_type": cargo_type,
            "cargo_stowage_factor": cargo_profile["stowage_factor_m3_mt"],
            "cargo_handling_pmt": cargo_profile["handling_fee_pmt"]
        })

    evaluations.sort(key=lambda x: x["ai_score"], reverse=True)
    return evaluations

def get_route_risk_profile(origin, destination):
    orig = PORT_COORDINATES[origin]
    dest = PORT_COORDINATES[destination]
    return {
        "Origin Weather": orig["weather_risk"],
        "Port Congestion": orig["congestion_risk"],
        "Waiting Time at Dest": f"{dest['waiting_days']} Days",
        "Freight Volatility": "Medium",
        "Overall Route Risk": "🟡 LOW–MEDIUM"
    }
