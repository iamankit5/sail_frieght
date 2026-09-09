// frontend/src/lib/procurementEngine.ts
/**
 * MARITIME DATA ASSUMPTIONS & BENCHMARK DISCLOSURES:
 * 1. Port Draft Limits & Waiting Days: Indian Major Ports Authority berth guidelines.
 * 2. Nautical Route Distances: Calibrated against Sea-Distances.org maritime tables.
 * 3. Vessel Specifications & Daily Hire: Clarksons Research 2024 spot dry bulk benchmarks.
 */

import { PortCoordinate, VesselSpec, VesselEvaluation, RouteRiskProfile } from '../types';

export const DATA_CITATIONS: Record<string, string> = {
  "Route Distances": "Operational distance estimates (calibrated to Sea-Distances.org tables)",
  "Charter Rates": "Industry spot averages (representative of Clarksons Research 2024 ranges)",
  "Port Draft Constraints": "Berth operational guidelines (calibrated to Indian Major Ports Authority)"
};

export const PORT_COORDINATES: Record<string, PortCoordinate> = {
  "Australia (Newcastle)": { lat: -32.9283, lon: 151.7817, weather_risk: "Low", congestion_risk: "Medium" },
  "Australia (Hay Point)": { lat: -21.2858, lon: 149.2997, weather_risk: "Low", congestion_risk: "Low" },
  "Indonesia (Samarinda)": { lat: -0.5021, lon: 117.1537, weather_risk: "Medium", congestion_risk: "Medium" },
  "Mozambique (Maputo)":   { lat: -25.9692, lon: 32.5732, weather_risk: "Low", congestion_risk: "Low" },
  "USA (New Orleans)":     { lat: 29.9511, lon: -90.0715, weather_risk: "Medium", congestion_risk: "High" },
  "Russia (Vladivostok)":  { lat: 43.1155, lon: 131.8855, weather_risk: "High", congestion_risk: "Low" },
  // Discharge Ports
  "Paradip":  { lat: 20.2644, lon: 86.6083, waiting_days: 2.5, draft_limit_m: 14.5 },
  "Haldia":   { lat: 22.0257, lon: 88.0583, waiting_days: 3.8, draft_limit_m: 8.5 }, // Shallow riverine limit
  "Vizag":    { lat: 17.6868, lon: 83.2185, waiting_days: 2.0, draft_limit_m: 14.5 },
  "Dhamra":   { lat: 20.8317, lon: 86.9583, waiting_days: 1.8, draft_limit_m: 18.0 }  // Deepwater berth
};

export const ROUTES: Record<string, Record<string, number>> = {
  "Australia (Newcastle)": { "Paradip": 4580, "Haldia": 4680, "Vizag": 4420, "Dhamra": 4560 },
  "Australia (Hay Point)": { "Paradip": 4320, "Haldia": 4420, "Vizag": 4180, "Dhamra": 4300 },
  "Indonesia (Samarinda)": { "Paradip": 2180, "Haldia": 2320, "Vizag": 2080, "Dhamra": 2220 },
  "Mozambique (Maputo)":   { "Paradip": 3880, "Haldia": 4020, "Vizag": 3740, "Dhamra": 3920 },
  "USA (New Orleans)":     { "Paradip": 9820, "Haldia": 9960, "Vizag": 9680, "Dhamra": 9860 },
  "Russia (Vladivostok)":  { "Paradip": 4760, "Haldia": 4900, "Vizag": 4620, "Dhamra": 4800 }
};

export const VESSEL_SPECS: Record<string, VesselSpec> = {
  "Handysize": { avg_cap: 35000, speed_knots: 13, fuel_per_day: 20, daily_hire_rate: 11500, draft_m: 10.0, availability: "4 vessels", risk: "🟡 Medium" },
  "Supramax":  { avg_cap: 55000, speed_knots: 14, fuel_per_day: 25, daily_hire_rate: 14500, draft_m: 11.5, availability: "3 vessels", risk: "🟡 Medium" },
  "Panamax":   { avg_cap: 75000, speed_knots: 14, fuel_per_day: 30, daily_hire_rate: 16500, draft_m: 13.5, availability: "8 vessels", risk: "🟢 Low" },
  "Capesize":  { avg_cap: 180000, speed_knots: 13, fuel_per_day: 45, daily_hire_rate: 24500, draft_m: 18.2, availability: "1 vessel", risk: "🔴 High" }
};

export const CARGO_PROFILES: Record<string, {
  stowage_factor_m3_mt: number;
  handling_fee_pmt: number;
  discharge_rate_tpd: number;
  demurrage_multiplier: number;
  description: string;
}> = {
  "Coking Coal": {
    stowage_factor_m3_mt: 1.25,
    handling_fee_pmt: 3.20,
    discharge_rate_tpd: 25000,
    demurrage_multiplier: 1.0,
    description: "Prime Hard Coking Coal for blast furnace steel production."
  },
  "Thermal Coal": {
    stowage_factor_m3_mt: 1.38,
    handling_fee_pmt: 2.80,
    discharge_rate_tpd: 20000,
    demurrage_multiplier: 1.35,
    description: "Non-coking thermal coal for captive power plant boilers."
  },
  "Iron Ore Pellets": {
    stowage_factor_m3_mt: 0.52,
    handling_fee_pmt: 4.50,
    discharge_rate_tpd: 35000,
    demurrage_multiplier: 0.85,
    description: "High-grade iron ore pellets for direct reduction and blast furnace feed."
  },
  "Limestone": {
    stowage_factor_m3_mt: 1.15,
    handling_fee_pmt: 3.60,
    discharge_rate_tpd: 18000,
    demurrage_multiplier: 1.10,
    description: "High-calcium limestone flux for basic oxygen furnace slag formation."
  }
};

export function evaluateAllVessels(
  cargoQtyMt: number,
  origin: string,
  destination: string,
  bunkerPrice: number,
  freightMultiplier: number = 1.0,
  cargoType: string = "Coking Coal"
): VesselEvaluation[] {
  if (cargoQtyMt <= 0) {
    throw new Error("Cargo quantity must be a positive number greater than 0 MT.");
  }
  if (!ROUTES[origin] || !ROUTES[origin][destination]) {
    throw new Error(`Invalid route selection: '${origin}' to '${destination}'`);
  }
  if (bunkerPrice <= 0) {
    throw new Error("Bunker price must be a positive numerical value.");
  }

  const cargoProfile = CARGO_PROFILES[cargoType] || CARGO_PROFILES["Coking Coal"];
  const distance = ROUTES[origin][destination];
  const destDraft = PORT_COORDINATES[destination]?.draft_limit_m ?? 14.5;
  const evaluations: VesselEvaluation[] = [];

  for (const [vName, spec] of Object.entries(VESSEL_SPECS)) {
    const dailyDist = spec.speed_knots * 24;
    const voyageDays = distance / dailyDist;

    const fuelCost = voyageDays * spec.fuel_per_day * bunkerPrice;
    const charterCost = voyageDays * spec.daily_hire_rate * freightMultiplier;
    const basePortCharges = 35000;
    const cargoHandlingCost = cargoQtyMt * cargoProfile.handling_fee_pmt;
    const portCharges = basePortCharges + cargoHandlingCost;
    const baseDemurrage = spec.risk.includes("High") ? 12000 : (spec.risk.includes("Medium") ? 6000 : 2500);
    const demurrageRisk = baseDemurrage * cargoProfile.demurrage_multiplier;
    const canalFees = origin.includes("USA") ? 8500 : 2000;

    const totalVoyageCost = fuelCost + charterCost + portCharges + demurrageRisk + canalFees;
    const costPerMt = cargoQtyMt > 0 ? totalVoyageCost / cargoQtyMt : 0;

    const utilization = (cargoQtyMt / spec.avg_cap) * 100;
    const utilPenalty = utilization <= 120 ? Math.abs(100 - utilization) * 0.5 : (utilization - 100) * 1.8;

    // Volumetric stowage check
    const volumetricM3Required = cargoQtyMt * cargoProfile.stowage_factor_m3_mt;
    const vesselGrainCapacityM3 = spec.avg_cap * 1.30;
    let cubePenalty = 0;
    if (volumetricM3Required > vesselGrainCapacityM3) {
      cubePenalty = ((volumetricM3Required - vesselGrainCapacityM3) / vesselGrainCapacityM3) * 30;
    }

    // Physical draft limit check
    let draftPenalty = 0;
    let isFeasible = true;
    let feasibility = "🟢 Cleared";

    if (spec.draft_m > destDraft) {
      draftPenalty = 50; // Heavy score penalty
      isFeasible = false;
      feasibility = `🔴 INFEASIBLE: Draft Exceeds Port Limit (${spec.draft_m}m > ${destDraft}m)`;
    }

    const baseScore = 96 - utilPenalty - (costPerMt * 0.05) - draftPenalty - cubePenalty;
    const aiScore = Math.max(0, Math.min(99, Math.round(baseScore * 10) / 10));

    evaluations.push({
      vessel: vName,
      capacity: `${Math.floor(spec.avg_cap / 1000)}K MT`,
      capacity_dwt: spec.avg_cap,
      draft_m: spec.draft_m,
      port_draft_limit_m: destDraft,
      is_feasible: isFeasible,
      voyage_days: Math.round(voyageDays * 10) / 10,
      fuel_burned_mt: Math.round(voyageDays * spec.fuel_per_day * 10) / 10,
      total_cost_usd: Math.round(totalVoyageCost),
      cost_per_mt: Math.round(costPerMt * 100) / 100,
      freight_pmt: Math.round((charterCost / cargoQtyMt) * 100) / 100,
      fuel_pmt: Math.round((fuelCost / cargoQtyMt) * 100) / 100,
      port_pmt: Math.round(((portCharges + canalFees) / cargoQtyMt) * 100) / 100,
      demurrage_pmt: Math.round((demurrageRisk / cargoQtyMt) * 100) / 100,
      utilization_pct: Math.round(Math.min(100.0, utilization) * 10) / 10,
      availability: spec.availability,
      risk: spec.risk,
      feasibility,
      ai_score: aiScore,
      cargo_type: cargoType,
      cargo_stowage_factor: cargoProfile.stowage_factor_m3_mt,
      cargo_handling_pmt: cargoProfile.handling_fee_pmt
    });
  }

  evaluations.sort((a, b) => b.ai_score - a.ai_score);
  return evaluations;
}

export function getRouteRiskProfile(origin: string, destination: string): RouteRiskProfile {
  const orig = PORT_COORDINATES[origin] || { weather_risk: "Low", congestion_risk: "Low" };
  const dest = PORT_COORDINATES[destination] || { waiting_days: 2.0 };

  return {
    "Origin Weather": orig.weather_risk || "Low",
    "Port Congestion": orig.congestion_risk || "Low",
    "Waiting Time at Dest": `${dest.waiting_days || 2.0} Days`,
    "Freight Volatility": "Medium",
    "Overall Route Risk": "🟡 LOW–MEDIUM"
  };
}
