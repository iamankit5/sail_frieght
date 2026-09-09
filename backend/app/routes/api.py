# backend/app/routes/api.py
from flask import Blueprint, jsonify, request
from datetime import datetime, timezone
from backend.app.services.procurement_service import ProcurementService
from backend.app.services.market_service import MarketService
from backend.app.services.forecast_service import ForecastService

api_bp = Blueprint("api", __name__)

@api_bp.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": "SAIL Freight Intelligence Flask API",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "2.0.0"
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
    cargo_qty = data.get("cargo_qty_mt", 75000)
    origin = data.get("origin", "Australia (Newcastle)")
    destination = data.get("destination", "Paradip")
    bunker_price = data.get("bunker_price", 625.0)
    freight_multiplier = data.get("freight_multiplier", 1.0)
    cargo_type = data.get("cargo_type", "Coking Coal")

    try:
        cargo_qty = float(cargo_qty)
        bunker_price = float(bunker_price)
        freight_multiplier = float(freight_multiplier)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid numerical parameters."}), 400

    try:
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
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Evaluation error: {str(e)}"}), 500

@api_bp.route("/procurement/risk-profile", methods=["GET"])
def get_risk_profile():
    origin = request.args.get("origin", "Australia (Newcastle)")
    dest = request.args.get("destination", "Paradip")
    try:
        risk = ProcurementService.get_risk(origin, dest)
        return jsonify(risk)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@api_bp.route("/market/latest", methods=["GET"])
def get_market():
    market_data = MarketService.get_latest_market()
    return jsonify(market_data)

@api_bp.route("/forecast/freight", methods=["GET"])
def get_freight_forecast():
    forecast = ForecastService.get_freight_forecast()
    return jsonify(forecast)

@api_bp.route("/models/evaluation", methods=["GET"])
def get_model_evaluation():
    evals = ForecastService.get_evaluations()
    return jsonify(evals)
