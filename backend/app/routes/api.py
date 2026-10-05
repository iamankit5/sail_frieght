# backend/app/routes/api.py
import logging
import math
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from backend.app.services.procurement_service import ProcurementService
from backend.app.services.market_service import MarketService
from backend.app.services.forecast_service import ForecastService

api_bp = Blueprint("api", __name__)
logger = logging.getLogger(__name__)

# Sanity bounds for procurement inputs (reject garbage, NaN, Infinity).
CARGO_QTY_BOUNDS = (100.0, 400_000.0)     # MT
BUNKER_PRICE_BOUNDS = (50.0, 2000.0)     # USD/MT
FREIGHT_MULTIPLIER_BOUNDS = (0.1, 5.0)   # multiplier on daily hire


class ValidationError(ValueError):
    pass


def _finite_number(value, name, bounds):
    try:
        number = float(value)
    except (TypeError, ValueError):
        raise ValidationError(f"{name} must be a number.")
    if not math.isfinite(number):
        raise ValidationError(f"{name} must be a finite number.")
    low, high = bounds
    if number < low or number > high:
        raise ValidationError(f"{name} must be between {low:g} and {high:g}.")
    return number


def _clean_text(value, name, fallback):
    if not isinstance(value, str) or not value.strip():
        return fallback
    return value.strip()[:100]


@api_bp.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": "Freight Procurement Intelligence API",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "3.0.0"
    })


@api_bp.route("/procurement/ports", methods=["GET"])
def get_ports():
    ports = ProcurementService.get_ports()
    citations = ProcurementService.get_data_citations()
    return jsonify({
        "ports": ports,
        "citations": citations
    })


@api_bp.route("/procurement/routes", methods=["GET"])
def get_routes():
    routes = ProcurementService.get_routes()
    return jsonify({
        "routes": routes
    })


@api_bp.route("/procurement/evaluate", methods=["POST"])
def evaluate():
    data = request.get_json(silent=True) or {}
    try:
        cargo_qty = _finite_number(
            data.get("cargo_qty_mt", 75000), "cargo_qty_mt", CARGO_QTY_BOUNDS
        )
        bunker_price = _finite_number(
            data.get("bunker_price", 625.0), "bunker_price", BUNKER_PRICE_BOUNDS
        )
        freight_multiplier = _finite_number(
            data.get("freight_multiplier", 1.0), "freight_multiplier", FREIGHT_MULTIPLIER_BOUNDS
        )
        origin = _clean_text(data.get("origin"), "origin", "Australia (Newcastle)")
        destination = _clean_text(data.get("destination"), "destination", "Paradip")
        cargo_type = _clean_text(data.get("cargo_type"), "cargo_type", "Coking Coal")

        if cargo_type not in ProcurementService.get_cargo_profiles():
            raise ValidationError(
                f"Unsupported cargo type '{cargo_type}'. "
                f"Supported: {', '.join(sorted(ProcurementService.get_cargo_profiles()))}."
            )

        evaluations = ProcurementService.evaluate(
            cargo_qty_mt=cargo_qty,
            origin=origin,
            destination=destination,
            bunker_price=bunker_price,
            freight_multiplier=freight_multiplier,
            cargo_type=cargo_type
        )
        risk = ProcurementService.get_risk(origin, destination)
        return jsonify({
            "evaluations": evaluations,
            "risk_profile": risk,
            "parameters": {
                "cargo_qty_mt": cargo_qty,
                "origin": origin,
                "destination": destination,
                "bunker_price": bunker_price,
                "freight_multiplier": freight_multiplier,
                "cargo_type": cargo_type
            }
        })
    except ValidationError as ve:
        return jsonify({"error": str(ve)}), 400
    except ValueError as ve:
        # Domain validation from the engine (bad route, non-positive values, etc.)
        return jsonify({"error": str(ve)}), 400
    except Exception:
        logger.exception("Evaluation failed for route %s -> %s", origin, destination)
        return jsonify({"error": "Evaluation failed due to an internal error."}), 500


@api_bp.route("/procurement/risk-profile", methods=["GET"])
def get_risk_profile():
    origin = request.args.get("origin", "Australia (Newcastle)")
    dest = request.args.get("destination", "Paradip")
    try:
        risk = ProcurementService.get_risk(origin, dest)
        return jsonify(risk)
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception:
        logger.exception("Risk profile failed for route %s -> %s", origin, dest)
        return jsonify({"error": "Risk profile unavailable due to an internal error."}), 500


@api_bp.route("/market/latest", methods=["GET"])
def get_market():
    market_data = MarketService.get_latest_market()
    if market_data.get("error"):
        # Upstream feeds failed; report provenance honestly without leaking internals.
        return jsonify(market_data), 503
    return jsonify(market_data)


@api_bp.route("/forecast/freight", methods=["GET"])
def get_freight_forecast():
    forecast = ForecastService.get_freight_forecast()
    if forecast is None:
        return jsonify({
            "error": "Freight forecast data unavailable. Market dataset is missing or unreadable.",
            "provenance": "UNAVAILABLE"
        }), 503
    return jsonify(forecast)


@api_bp.route("/models/evaluation", methods=["GET"])
def get_model_evaluation():
    evals = ForecastService.get_evaluations()
    if evals is None:
        return jsonify({"error": "Model evaluation report not found."}), 404
    return jsonify(evals)
