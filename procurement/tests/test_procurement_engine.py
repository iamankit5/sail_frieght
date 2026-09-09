# procurement/tests/test_procurement_engine.py
import unittest
import sys
import os

# Ensure parent directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from procurement.procurement_engine import (
    evaluate_all_vessels,
    PORT_COORDINATES,
    ROUTES,
    VESSEL_SPECS
)

class TestProcurementEngine(unittest.TestCase):

    def test_haldia_capesize_draft_blocked(self):
        """
        Sanity check: Capesize draft (18.2m) exceeds Haldia max draft (8.5m).
        Must flag feasibility error (Infeasible / Exceeds Port Limit) and penalize AI score.
        """
        evals = evaluate_all_vessels(75000, "Australia (Newcastle)", "Haldia", bunker_price=600.0)
        capesize_eval = next(v for v in evals if v["vessel"] == "Capesize")
        
        self.assertIn("Exceeds Port Limit", capesize_eval["feasibility"], "Capesize should be marked unfeasible for Haldia draft")
        self.assertFalse(capesize_eval["is_feasible"], "Capesize must have is_feasible=False at Haldia")
        self.assertLess(capesize_eval["ai_score"], 50.0, "Capesize AI score should be severely penalized at Haldia")

    def test_deepwater_dhamra_panamax_cleared(self):
        """
        Sanity check: Panamax draft (13.5m) is cleared for Dhamra (18.0m limit).
        """
        evals = evaluate_all_vessels(75000, "Australia (Newcastle)", "Dhamra", bunker_price=600.0)
        panamax_eval = next(v for v in evals if v["vessel"] == "Panamax")
        
        self.assertEqual(panamax_eval["feasibility"], "🟢 Cleared")
        self.assertTrue(panamax_eval["is_feasible"], "Panamax must be feasible at Dhamra")
        self.assertGreater(panamax_eval["ai_score"], 70.0, "Panamax should score high for optimal 75k MT shipment to Dhamra")

    def test_invalid_cargo_quantity_raises_error(self):
        """
        Boundary validation: cargo_qty <= 0 must raise ValueError.
        """
        with self.assertRaises(ValueError):
            evaluate_all_vessels(0, "Australia (Newcastle)", "Paradip", bunker_price=600.0)
            
        with self.assertRaises(ValueError):
            evaluate_all_vessels(-5000, "Australia (Newcastle)", "Paradip", bunker_price=600.0)

    def test_invalid_route_raises_error(self):
        """
        Boundary validation: invalid port names must raise ValueError.
        """
        with self.assertRaises(ValueError):
            evaluate_all_vessels(75000, "NonExistentPort", "Paradip", bunker_price=600.0)

    def test_vessel_ranking_order(self):
        """
        Sanity check: Returned evaluations must be sorted in descending order of AI score.
        """
        evals = evaluate_all_vessels(75000, "Indonesia (Samarinda)", "Paradip", bunker_price=550.0)
        scores = [v["ai_score"] for v in evals]
        self.assertEqual(scores, sorted(scores, reverse=True), "Vessel evaluations must be sorted by AI score descending")

    def test_cargo_material_differentiation(self):
        """
        Verify that cargo material selection (e.g. Thermal Coal vs Coking Coal) 
        alters handling fees and landed costs.
        """
        evals_coking = evaluate_all_vessels(75000, "Australia (Newcastle)", "Paradip", bunker_price=600.0, cargo_type="Coking Coal")
        evals_thermal = evaluate_all_vessels(75000, "Australia (Newcastle)", "Paradip", bunker_price=600.0, cargo_type="Thermal Coal")
        
        # Verify both returned results for Panamax
        panamax_coking = next(v for v in evals_coking if v["vessel"] == "Panamax")
        panamax_thermal = next(v for v in evals_thermal if v["vessel"] == "Panamax")
        
        self.assertEqual(panamax_coking["cargo_type"], "Coking Coal")
        self.assertEqual(panamax_thermal["cargo_type"], "Thermal Coal")
        self.assertNotEqual(panamax_coking["total_cost_usd"], panamax_thermal["total_cost_usd"],
                            "Total voyage cost should differ between Coking Coal and Thermal Coal due to cargo handling & demurrage profiles")

if __name__ == "__main__":
    print("=" * 60)
    print(" Running Procurement Engine Sanity & Boundary Tests... ")
    print("=" * 60)
    unittest.main()
