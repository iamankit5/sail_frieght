# backend/tests/test_api.py
import unittest
import json
import sys
import os
from unittest import mock

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.app import create_app
from backend.app.services.market_service import MarketService


def _mock_market_fetches():
    """Patch outbound market fetches so tests never touch the network."""
    forex = mock.patch.object(MarketService, "_fetch_live_forex", return_value=(83.5, "TEST (fx)"))
    crude = mock.patch.object(MarketService, "_fetch_live_crude", return_value=(75.0, "TEST (crude)"))
    return forex, crude


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
        self.assertNotIn("error", data)
        optimal = data["evaluations"][0]
        self.assertTrue(optimal["is_feasible"])

    def test_evaluate_cargo_type_thermal_vs_coking(self):
        base = {
            "cargo_qty_mt": 75000,
            "origin": "Australia (Newcastle)",
            "destination": "Paradip",
            "bunker_price": 600.0,
        }
        res1 = self.client.post("/api/procurement/evaluate", data=json.dumps({**base, "cargo_type": "Coking Coal"}), content_type="application/json")
        self.assertEqual(res1.status_code, 200)
        data1 = json.loads(res1.data)

        res2 = self.client.post("/api/procurement/evaluate", data=json.dumps({**base, "cargo_type": "Thermal Coal"}), content_type="application/json")
        self.assertEqual(res2.status_code, 200)
        data2 = json.loads(res2.data)

        self.assertNotEqual(data1["evaluations"][0]["total_cost_usd"], data2["evaluations"][0]["total_cost_usd"])
        self.assertEqual(data1["parameters"]["cargo_type"], "Coking Coal")
        self.assertEqual(data2["parameters"]["cargo_type"], "Thermal Coal")

    def test_evaluate_unsupported_cargo_type_rejected(self):
        payload = {"cargo_qty_mt": 75000, "origin": "Australia (Newcastle)", "destination": "Paradip", "cargo_type": "Unobtanium"}
        res = self.client.post("/api/procurement/evaluate", data=json.dumps(payload), content_type="application/json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("Unsupported cargo type", json.loads(res.data)["error"])

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

    def test_evaluate_rejects_nan_and_infinity(self):
        """Flask's JSON parser accepts NaN/Infinity literals; the API must reject them."""
        for bad in (float("nan"), float("inf"), float("-inf")):
            payload = {"cargo_qty_mt": bad, "origin": "Australia (Newcastle)", "destination": "Paradip"}
            res = self.client.post(
                "/api/procurement/evaluate",
                data=json.dumps(payload),
                content_type="application/json"
            )
            self.assertEqual(res.status_code, 400, f"cargo_qty_mt={bad} must be rejected")
            self.assertIn("finite", json.loads(res.data)["error"])

    def test_evaluate_rejects_out_of_bounds(self):
        payload = {"cargo_qty_mt": 999_999_999, "origin": "Australia (Newcastle)", "destination": "Paradip"}
        res = self.client.post("/api/procurement/evaluate", data=json.dumps(payload), content_type="application/json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("between", json.loads(res.data)["error"])

    def test_evaluate_invalid_route_is_400_not_500(self):
        payload = {"cargo_qty_mt": 75000, "origin": "Atlantis", "destination": "Paradip"}
        res = self.client.post("/api/procurement/evaluate", data=json.dumps(payload), content_type="application/json")
        self.assertEqual(res.status_code, 400)

    def test_market_latest_mocked(self):
        forex, crude = _mock_market_fetches()
        with forex, crude:
            MarketService._cached_market = None
            MarketService._last_fetched = None
            res = self.client.get("/api/market/latest")
            self.assertEqual(res.status_code, 200)
            data = json.loads(res.data)
            self.assertIn("bunker_price_usd_mt", data)
            self.assertIn("usd_inr_rate", data)
            self.assertEqual(data["bunker_provenance"], "ESTIMATED")
        MarketService._cached_market = None
        MarketService._last_fetched = None

    def test_market_latest_reports_unavailable_on_failure(self):
        forex = mock.patch.object(MarketService, "_fetch_live_forex", side_effect=RuntimeError("down"))
        crude = mock.patch.object(MarketService, "_fetch_live_crude", side_effect=RuntimeError("down"))
        with forex, crude:
            MarketService._cached_market = None
            MarketService._last_fetched = None
            res = self.client.get("/api/market/latest")
            self.assertEqual(res.status_code, 503)
            data = json.loads(res.data)
            self.assertEqual(data["fx_provenance"], "UNAVAILABLE")
        MarketService._cached_market = None
        MarketService._last_fetched = None

    def test_forecast_freight(self):
        res = self.client.get("/api/forecast/freight")
        if res.status_code == 503:
            # Dataset missing/corrupt: must fail loudly, never fabricate data.
            data = json.loads(res.data)
            self.assertIn("error", data)
            return
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("spot_rate_pmt", data)
        self.assertIn("timeline_30d", data)
        self.assertEqual(len(data["timeline_30d"]), 30)
        self.assertIn("series_note", data)
        # Measured-accuracy block: the projection must carry its own backtest.
        bt = data.get("backtest")
        self.assertIsNotNone(bt, "forecast payload must include the walk-forward backtest")
        self.assertIn("window", bt)
        self.assertIn("horizons", bt)
        for h in ("7", "14", "30"):
            self.assertIn(h, bt["horizons"], f"backtest missing {h}d horizon")
            m = bt["horizons"][h]
            self.assertIn("mae_pct", m)
            self.assertIn("directional_hit_pct", m)
            self.assertIn("oos_band_coverage_pct", m)
            self.assertGreater(m["oos_band_coverage_pct"], 50.0,
                               "calibrated band must cover reality out-of-sample")
        # Signal must be one of the three honest states.
        self.assertIn(data["recommended_action"], ("CHARTER NOW", "HOLD / WAIT", "NEUTRAL"))
        # Bands must be empirical (wider than the old fake ±(4%+0.3%/day)).
        day30 = data["timeline_30d"][29]
        self.assertLess(day30["lower_rate_pmt"], data["spot_rate_pmt"])
        self.assertGreater(day30["upper_rate_pmt"], data["spot_rate_pmt"])

    def test_model_evaluation(self):
        res = self.client.get("/api/models/evaluation")
        if res.status_code == 404:
            return  # report absent in checkout
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("models", data)


class TestFlaskAPISecurity(unittest.TestCase):
    """Auth, CORS allowlist, and rate limiting behave per environment config."""

    def _make(self, env):
        with mock.patch.dict(os.environ, env, clear=False):
            app = create_app()
        app.config["TESTING"] = True
        return app.test_client()

    def test_api_key_required_when_configured(self):
        client = self._make({"API_KEYS": "secret-key-1"})
        res = client.get("/api/procurement/ports")
        self.assertEqual(res.status_code, 401)

        res = client.get("/api/procurement/ports", headers={"X-API-Key": "wrong"})
        self.assertEqual(res.status_code, 401)

        res = client.get("/api/procurement/ports", headers={"X-API-Key": "secret-key-1"})
        self.assertEqual(res.status_code, 200)

        # Health stays open for load-balancer probes.
        res = client.get("/api/health")
        self.assertEqual(res.status_code, 200)

    def test_no_auth_when_keys_unset(self):
        with mock.patch.dict(os.environ, {"API_KEYS": ""}, clear=False):
            app = create_app()
        app.config["TESTING"] = True
        client = app.test_client()
        res = client.get("/api/procurement/ports")
        self.assertEqual(res.status_code, 200)

    def test_cors_allowlist(self):
        client = self._make({"CORS_ALLOWED_ORIGINS": "https://app.example.com"})
        res = client.get("/api/health", headers={"Origin": "https://app.example.com"})
        self.assertEqual(res.headers.get("Access-Control-Allow-Origin"), "https://app.example.com")

        res = client.get("/api/health", headers={"Origin": "https://evil.example.com"})
        self.assertIsNone(res.headers.get("Access-Control-Allow-Origin"))

    def test_rate_limit(self):
        client = self._make({"RATE_LIMIT_PER_MINUTE": "3"})
        codes = [client.get("/api/procurement/routes").status_code for _ in range(4)]
        self.assertEqual(codes[:3], [200, 200, 200])
        self.assertEqual(codes[3], 429)
        self.assertIn("Retry-After", client.get("/api/procurement/routes").headers)


if __name__ == "__main__":
    unittest.main()
