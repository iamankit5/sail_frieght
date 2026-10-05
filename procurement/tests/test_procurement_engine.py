# procurement/tests/test_procurement_engine.py
import unittest
import sys
import os

# Ensure parent directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from procurement.procurement_engine import (
    evaluate_all_vessels,
    get_route_risk_profile,
    load_engine_config,
    CARGO_PROFILES,
    COST_CONSTANTS,
    PORT_COORDINATES,
    ROUTES,
    VESSEL_SPECS,
)


class TestProcurementEngine(unittest.TestCase):

    def test_haldia_capesize_draft_blocked(self):
        """
        Sanity check: Capesize draft (18.2m) exceeds Haldia max draft (8.5m).
        Must flag feasibility error and severely penalize the decision score.
        """
        evals = evaluate_all_vessels(75000, "Australia (Newcastle)", "Haldia", bunker_price=600.0)
        capesize_eval = next(v for v in evals if v["vessel"] == "Capesize")

        self.assertIn("Exceeds Port Limit", capesize_eval["feasibility"], "Capesize should be marked unfeasible for Haldia draft")
        self.assertFalse(capesize_eval["is_feasible"], "Capesize must have is_feasible=False at Haldia")
        self.assertLess(capesize_eval["decision_score"], 50.0, "Capesize decision score should be severely penalized at Haldia")

    def test_haldia_all_vessels_infeasible(self):
        """Haldia's 8.5m river channel excludes every vessel class in the fleet set."""
        evals = evaluate_all_vessels(35000, "Indonesia (Samarinda)", "Haldia", bunker_price=600.0)
        self.assertTrue(all(not v["is_feasible"] for v in evals),
                        "Every vessel class exceeds the Haldia draft limit and must be flagged infeasible")

    def test_deepwater_dhamra_panamax_cleared(self):
        """Sanity check: Panamax draft (13.5m) is cleared for Dhamra (18.0m limit)."""
        evals = evaluate_all_vessels(75000, "Australia (Newcastle)", "Dhamra", bunker_price=600.0)
        panamax_eval = next(v for v in evals if v["vessel"] == "Panamax")

        self.assertEqual(panamax_eval["feasibility"], "Cleared")
        self.assertTrue(panamax_eval["is_feasible"], "Panamax must be feasible at Dhamra")
        self.assertGreater(panamax_eval["decision_score"], 70.0, "Panamax should score high for optimal 75k MT shipment to Dhamra")

    def test_invalid_cargo_quantity_raises_error(self):
        """Boundary validation: cargo_qty <= 0 must raise ValueError."""
        with self.assertRaises(ValueError):
            evaluate_all_vessels(0, "Australia (Newcastle)", "Paradip", bunker_price=600.0)

        with self.assertRaises(ValueError):
            evaluate_all_vessels(-5000, "Australia (Newcastle)", "Paradip", bunker_price=600.0)

    def test_invalid_route_raises_error(self):
        """Boundary validation: invalid port names must raise ValueError."""
        with self.assertRaises(ValueError):
            evaluate_all_vessels(75000, "NonExistentPort", "Paradip", bunker_price=600.0)

    def test_unsupported_cargo_type_raises_error(self):
        """Unknown cargo must be rejected, never silently priced as another cargo."""
        with self.assertRaises(ValueError):
            evaluate_all_vessels(75000, "Australia (Newcastle)", "Paradip", bunker_price=600.0, cargo_type="Unobtanium")

    def test_vessel_ranking_order(self):
        """Returned evaluations must be sorted in descending order of decision score."""
        evals = evaluate_all_vessels(75000, "Indonesia (Samarinda)", "Paradip", bunker_price=550.0)
        scores = [v["decision_score"] for v in evals]
        self.assertEqual(scores, sorted(scores, reverse=True), "Vessel evaluations must be sorted by decision score descending")

    def test_cargo_material_differentiation(self):
        """Cargo material selection (e.g. Thermal Coal vs Coking Coal) alters handling fees and landed costs."""
        evals_coking = evaluate_all_vessels(75000, "Australia (Newcastle)", "Paradip", bunker_price=600.0, cargo_type="Coking Coal")
        evals_thermal = evaluate_all_vessels(75000, "Australia (Newcastle)", "Paradip", bunker_price=600.0, cargo_type="Thermal Coal")

        panamax_coking = next(v for v in evals_coking if v["vessel"] == "Panamax")
        panamax_thermal = next(v for v in evals_thermal if v["vessel"] == "Panamax")

        self.assertEqual(panamax_coking["cargo_type"], "Coking Coal")
        self.assertEqual(panamax_thermal["cargo_type"], "Thermal Coal")
        self.assertNotEqual(panamax_coking["total_cost_usd"], panamax_thermal["total_cost_usd"],
                            "Total voyage cost should differ between Coking Coal and Thermal Coal due to cargo handling & demurrage profiles")

    def test_canal_fees_only_on_canal_lanes(self):
        """US Gulf lanes transit the Suez Canal; all other lanes here have no canal and must not be charged one."""
        cargo_qty, bunker = 75000, 600.0
        panamax = VESSEL_SPECS["Panamax"]
        coking = CARGO_PROFILES["Coking Coal"]

        def expected_total(origin, vessel_name, include_canal):
            spec = VESSEL_SPECS[vessel_name]
            days = ROUTES[origin]["Paradip"] / (spec["speed_knots"] * 24)
            total = (
                days * spec["fuel_per_day"] * bunker
                + days * spec["daily_hire_rate"]
                + COST_CONSTANTS["base_port_charge_usd"]
                + cargo_qty * coking["handling_fee_pmt"]
                + COST_CONSTANTS["demurrage_buffer_usd"][spec["risk"]] * coking["demurrage_multiplier"]
            )
            if include_canal:
                total += COST_CONSTANTS["route_fees_usd"]["Suez"]
            return total

        evals_us = evaluate_all_vessels(cargo_qty, "USA (New Orleans)", "Paradip", bunker_price=bunker)
        evals_au = evaluate_all_vessels(cargo_qty, "Australia (Newcastle)", "Paradip", bunker_price=bunker)

        panamax_us = next(v for v in evals_us if v["vessel"] == "Panamax")
        panamax_au = next(v for v in evals_au if v["vessel"] == "Panamax")

        self.assertAlmostEqual(panamax_us["total_cost_usd"], round(expected_total("USA (New Orleans)", "Panamax", True), 0), delta=1.0,
                               msg="US Gulf Panamax total must include the Suez canal fee on the Suez distance")
        self.assertEqual(panamax_us["route_via"], "Suez")
        self.assertAlmostEqual(panamax_au["total_cost_usd"], round(expected_total("Australia (Newcastle)", "Panamax", False), 0), delta=1.0,
                               msg="Australia lane total must NOT include a canal fee (no canal on route)")
        self.assertIsNone(panamax_au["route_via"])

    def test_capesize_sails_cape_route_toll_free(self):
        """Deep-draft Capesize on US Gulf lanes takes the longer Cape route with no canal fee."""
        cargo_qty, bunker = 170000, 600.0
        capesize = VESSEL_SPECS["Capesize"]
        coking = CARGO_PROFILES["Coking Coal"]

        cape_table = load_engine_config()["routes_alternates"]["USA (New Orleans)"]["Cape of Good Hope"]
        days = cape_table["Paradip"] / (capesize["speed_knots"] * 24)
        expected = (
            days * capesize["fuel_per_day"] * bunker
            + days * capesize["daily_hire_rate"]
            + COST_CONSTANTS["base_port_charge_usd"]
            + cargo_qty * coking["handling_fee_pmt"]
            + COST_CONSTANTS["demurrage_buffer_usd"][capesize["risk"]] * coking["demurrage_multiplier"]
        )

        evals = evaluate_all_vessels(cargo_qty, "USA (New Orleans)", "Paradip", bunker_price=bunker)
        capesize_eval = next(v for v in evals if v["vessel"] == "Capesize")
        self.assertEqual(capesize_eval["route_via"], "Cape of Good Hope")
        self.assertAlmostEqual(capesize_eval["total_cost_usd"], round(expected, 0), delta=1.0,
                               msg="Capesize US Gulf total must use the Cape distance with zero canal fee")

    def test_us_cape_distance_longer_than_suez(self):
        """The Cape route must be materially longer than Suez (no toll-free lunch)."""
        suez = ROUTES["USA (New Orleans)"]["Paradip"]
        cape = load_engine_config()["routes_alternates"]["USA (New Orleans)"]["Cape of Good Hope"]["Paradip"]
        self.assertGreater(cape, suez + 2000, "Cape route should be >2,000 NM longer than Suez")

    def test_risk_levels_are_plain_enums(self):
        """Risk is a machine-readable enum (Low/Medium/High); emoji belong to the render layer only."""
        for spec in VESSEL_SPECS.values():
            self.assertIn(spec["risk"], {"Low", "Medium", "High"})
        evals = evaluate_all_vessels(75000, "Australia (Newcastle)", "Paradip", bunker_price=600.0)
        for v in evals:
            self.assertIn(v["risk"], {"Low", "Medium", "High"})
            self.assertNotIn("🟢", v["feasibility"])
            self.assertNotIn("🔴", v["feasibility"])

    def test_route_risk_profile_validated_ports(self):
        """Risk profile rejects unknown ports with ValueError (not KeyError)."""
        profile = get_route_risk_profile("Australia (Newcastle)", "Paradip")
        self.assertIn(profile["Overall Route Risk"], {"Low", "Medium", "High"})
        self.assertIn("Waiting Time at Dest", profile)

        with self.assertRaises(ValueError):
            get_route_risk_profile("Nowhere", "Paradip")

    def test_engine_config_integrity(self):
        """Shared config is complete: every load port covers every discharge port, vessels carry required fields."""
        cfg = load_engine_config()
        load_ports = set(cfg["routes"].keys())
        discharge = {"Paradip", "Haldia", "Vizag", "Dhamra"}
        self.assertTrue(discharge.issubset(set(cfg["ports"].keys())))
        for origin in load_ports:
            self.assertEqual(set(cfg["routes"][origin].keys()), discharge, f"{origin} must cover all discharge ports")
            self.assertGreater(cfg["routes"][origin]["Paradip"], 0)
        for name, spec in cfg["vessels"].items():
            for field in ("avg_cap", "speed_knots", "fuel_per_day", "daily_hire_rate", "draft_m", "risk"):
                self.assertIn(field, spec, f"Vessel {name} missing {field}")
        # Distances must be plain integers (derived), not float artifacts
        self.assertIsInstance(cfg["routes"]["Australia (Newcastle)"]["Paradip"], int)


if __name__ == "__main__":
    print("=" * 60)
    print(" Running Procurement Engine Sanity & Boundary Tests... ")
    print("=" * 60)
    unittest.main()
