// frontend/src/lib/procurementEngine.ts
/**
 * TypeScript port of the deterministic procurement engine, used ONLY by the
 * client-side What-If simulator and for UI constants. All parameters load
 * from shared/engine_config.json — the same single source of truth the
 * Python engine (procurement/procurement_engine.py) consumes, so the two
 * engines cannot drift apart on data.
 *
 * Distances are self-derived (great-circle x documented detour factors; Suez
 * waypoint routing for US Gulf lanes) — see shared/derive_distances.py.
 * Hire rates, handling fees and cost constants are operator-editable
 * planning assumptions, not data licensed from any commercial provider.
 */
import engineConfig from '../../../shared/engine_config.json';
import { PortCoordinate, RiskLevel, VesselSpec, VesselEvaluation } from '../types';

export const ENGINE_CONFIG = engineConfig;

// Typed views of the JSON config (JSON imports index as string keys).
const DEMURRAGE_BUFFER_USD: Record<RiskLevel, number> = engineConfig.cost_constants.demurrage_buffer_usd;
// Vessel-class-aware routing: origin -> route_name -> [vessel classes].
const VESSEL_ROUTING = engineConfig.cost_constants.vessel_routing as Record<string, Record<string, string[]>>;
const ROUTE_FEES_USD = engineConfig.cost_constants.route_fees_usd as Record<string, number>;
const ROUTES_ALTERNATES = engineConfig.routes_alternates as Record<string, Record<string, Record<string, number>>>;

export const DATA_CITATIONS: Record<string, string> = {
  "Route Distances": "Self-derived: great-circle (haversine) between public port coordinates x documented detour factors (method: shared/derive_distances.py)",
  "Charter Rates": "Operator-editable market assumptions (not licensed data; validate against your own broker intelligence)",
  "Port Draft Constraints": "Public port authority berth guidelines (verify against latest notices before commercial reliance)"
};

// Merged port view: coordinates + operations + operating-risk profile.
export const PORT_COORDINATES: Record<string, PortCoordinate> = Object.fromEntries(
  Object.entries(engineConfig.ports).map(([name, p]) => [
    name,
    {
      ...p,
      ...(engineConfig.port_operations[name as keyof typeof engineConfig.port_operations] ?? {}),
      ...(engineConfig.load_port_risk[name as keyof typeof engineConfig.load_port_risk] ?? {})
    }
  ])
);

export const ROUTES: Record<string, Record<string, number>> = engineConfig.routes;

export const VESSEL_SPECS: Record<string, VesselSpec> = engineConfig.vessels;

export const CARGO_PROFILES: Record<string, {
  stowage_factor_m3_mt: number;
  handling_fee_pmt: number;
  discharge_rate_tpd: number;
  demurrage_multiplier: number;
  description: string;
}> = engineConfig.cargo_profiles;

export const COST_CONSTANTS = engineConfig.cost_constants;

// Render-layer mapping: emoji never live inside the data model.
export const RISK_EMOJI: Record<RiskLevel, string> = {
  Low: "🟢",
  Medium: "🟡",
  High: "🔴"
};

export function evaluateAllVessels(
  cargoQtyMt: number,
  origin: string,
  destination: string,
  bunkerPrice: number,
  freightMultiplier: number = 1.0,
  cargoType: string = "Coking Coal"
): VesselEvaluation[] {
  if (!Number.isFinite(cargoQtyMt) || cargoQtyMt <= 0) {
    throw new Error("Cargo quantity must be a positive finite number of MT.");
  }
  if (!ROUTES[origin] || !ROUTES[origin][destination]) {
    throw new Error(`Invalid route selection: '${origin}' to '${destination}'`);
  }
  if (!Number.isFinite(bunkerPrice) || bunkerPrice <= 0) {
    throw new Error("Bunker price must be a positive numerical value.");
  }
  const cargoProfile = CARGO_PROFILES[cargoType];
  if (!cargoProfile) {
    throw new Error(
      `Unsupported cargo type '${cargoType}'. Supported: ${Object.keys(CARGO_PROFILES).sort().join(", ")}`
    );
  }

  const destDraft = PORT_COORDINATES[destination]?.draft_limit_m ?? 14.5;
  const originRouting = VESSEL_ROUTING[origin] ?? {};
  const evaluations: VesselEvaluation[] = [];

  for (const [vName, spec] of Object.entries(VESSEL_SPECS)) {
    // Resolve the vessel's route (default table, or an alternate lane such as
    // the Cape of Good Hope for deep-draft tonnage) with its own fee.
    const routeName =
      Object.keys(originRouting).find((rn) => originRouting[rn]?.includes(vName)) ?? null;
    let distance: number;
    if (routeName && ROUTES_ALTERNATES[origin]?.[routeName]?.[destination] != null) {
      distance = ROUTES_ALTERNATES[origin][routeName][destination];
    } else {
      // Default lane table (e.g. the Suez-route distance for US lanes).
      distance = ROUTES[origin][destination];
    }
    const canalFees = routeName ? (ROUTE_FEES_USD[routeName] ?? 0) : 0;
    const routeVia = routeName ?? (VESSEL_ROUTING[origin] ? "Suez" : null);
    const dailyDist = spec.speed_knots * 24;
    const voyageDays = distance / dailyDist;

    const fuelCost = voyageDays * spec.fuel_per_day * bunkerPrice;
    const charterCost = voyageDays * spec.daily_hire_rate * freightMultiplier;
    const basePortCharges = COST_CONSTANTS.base_port_charge_usd;
    const cargoHandlingCost = cargoQtyMt * cargoProfile.handling_fee_pmt;
    const portCharges = basePortCharges + cargoHandlingCost;
    const demurrageRisk = DEMURRAGE_BUFFER_USD[spec.risk as RiskLevel] * cargoProfile.demurrage_multiplier;

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

    // Physical draft limit check (hard feasibility, not a soft penalty)
    let draftPenalty = 0;
    let isFeasible = true;
    let feasibility = "Cleared";

    if (spec.draft_m > destDraft) {
      draftPenalty = 50;
      isFeasible = false;
      feasibility = `INFEASIBLE: Draft Exceeds Port Limit (${spec.draft_m}m > ${destDraft}m)`;
    }

    const baseScore = 96 - utilPenalty - (costPerMt * 0.05) - draftPenalty - cubePenalty;
    const decisionScore = Math.max(0, Math.min(99, Math.round(baseScore * 10) / 10));

    evaluations.push({
      vessel: vName,
      capacity: `${Math.floor(spec.avg_cap / 1000)}K MT`,
      capacity_dwt: spec.avg_cap,
      draft_m: spec.draft_m,
      port_draft_limit_m: destDraft,
      is_feasible: isFeasible,
      route_via: routeVia,
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
      risk: spec.risk as RiskLevel,
      feasibility,
      decision_score: decisionScore,
      cargo_type: cargoType,
      cargo_stowage_factor: cargoProfile.stowage_factor_m3_mt,
      cargo_handling_pmt: cargoProfile.handling_fee_pmt
    });
  }

  evaluations.sort((a, b) => b.decision_score - a.decision_score);
  return evaluations;
}
