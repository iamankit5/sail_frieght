# backend/tests/test_api.py
import unittest
import json
import sys
import os

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.app import create_app

class TestFlaskAPI(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_health(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data["status"], "healthy")
        self.assertIn("version", data)

    def test_get_ports(self):
        res = self.client.get("/api/procurement/ports")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("ports", data)
        self.assertIn("Paradip", data["ports"])
        self.assertIn("Haldia", data["ports"])

    def test_get_routes(self):
        res = self.client.get("/api/procurement/routes")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("routes", data)
        self.assertIn("Australia (Newcastle)", data["routes"])

    def test_evaluate_valid(self):
        payload = {
            "cargo_qty_mt": 75000,
            "origin": "Australia (Newcastle)",
            "destination": "Paradip",
            "bunker_price": 600.0,
            "freight_multiplier": 1.0
        }
        res = self.client.post(
            "/api/procurement/evaluate",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("evaluations", data)
        self.assertEqual(len(data["evaluations"]), 4)
        optimal = data["evaluations"][0]
        self.assertEqual(optimal["vessel"], "Panamax")
        self.assertTrue(optimal["is_feasible"])

    def test_evaluate_cargo_type_thermal_vs_coking(self):
        payload_coking = {
            "cargo_qty_mt": 75000,
            "origin": "Australia (Newcastle)",
            "destination": "Paradip",
            "bunker_price": 600.0,
            "cargo_type": "Coking Coal"
        }
        res1 = self.client.post("/api/procurement/evaluate", data=json.dumps(payload_coking), content_type="application/json")
        self.assertEqual(res1.status_code, 200)
        data1 = json.loads(res1.data)

        payload_thermal = {
            "cargo_qty_mt": 75000,
            "origin": "Australia (Newcastle)",
            "destination": "Paradip",
            "bunker_price": 600.0,
            "cargo_type": "Thermal Coal"
        }
        res2 = self.client.post("/api/procurement/evaluate", data=json.dumps(payload_thermal), content_type="application/json")
        self.assertEqual(res2.status_code, 200)
        data2 = json.loads(res2.data)

        self.assertNotEqual(data1["evaluations"][0]["total_cost_usd"], data2["evaluations"][0]["total_cost_usd"])
        self.assertEqual(data1["parameters"]["cargo_type"], "Coking Coal")
        self.assertEqual(data2["parameters"]["cargo_type"], "Thermal Coal")

    def test_evaluate_haldia_infeasible_draft(self):
        payload = {
            "cargo_qty_mt": 75000,
            "origin": "Australia (Newcastle)",
            "destination": "Haldia",
            "bunker_price": 600.0
        }
        res = self.client.post(
            "/api/procurement/evaluate",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        capesize = next(v for v in data["evaluations"] if v["vessel"] == "Capesize")
        self.assertFalse(capesize["is_feasible"])
        self.assertIn("Exceeds Port Limit", capesize["feasibility"])

    def test_evaluate_invalid_qty(self):
        payload = {
            "cargo_qty_mt": -100,
            "origin": "Australia (Newcastle)",
            "destination": "Paradip",
            "bunker_price": 600.0
        }
        res = self.client.post(
            "/api/procurement/evaluate",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 400)

    def test_market_latest(self):
        res = self.client.get("/api/market/latest")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("bunker_price_usd_mt", data)
        self.assertIn("usd_inr_rate", data)
        self.assertIn("bunker_provenance", data)

    def test_forecast_freight(self):
        res = self.client.get("/api/forecast/freight")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("spot_rate_pmt", data)
        self.assertIn("timeline_30d", data)
        self.assertEqual(len(data["timeline_30d"]), 30)

    def test_model_evaluation(self):
        res = self.client.get("/api/models/evaluation")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("models", data)

if __name__ == "__main__":
    unittest.main()
