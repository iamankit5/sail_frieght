# backend/app/__init__.py
import logging

from flask import Flask, jsonify, request

from backend.app.security import (
    SlidingWindowLimiter,
    get_api_keys,
    get_cors_origins,
    get_rate_limit_per_minute,
)

logging.basicConfig(level=logging.INFO)


def create_app():
    app = Flask(__name__)
    app.config["JSON_SORT_KEYS"] = False
    app.json.sort_keys = False  # Flask 2.3+: preserve report/model insertion order
    # Reject oversized request bodies (evaluate payloads are tiny JSON).
    app.config["MAX_CONTENT_LENGTH"] = 64 * 1024

    api_keys = get_api_keys()
    cors_origins = get_cors_origins()
    limiter = SlidingWindowLimiter(get_rate_limit_per_minute())

    @app.before_request
    def gate_requests():
        """CORS preflight short-circuit + rate limiting + API-key auth."""
        if request.method == "OPTIONS":
            # Preflight: headers are appended by after_request.
            return ("", 204)
        if not request.path.startswith("/api/"):
            return None
        if request.path == "/api/health":
            # Health stays open (unauthenticated, unthrottled) for LB probes.
            return None

        provided_key = request.headers.get("X-API-Key", "")
        identity = provided_key if provided_key else (request.remote_addr or "unknown")
        allowed, remaining, retry_after = limiter.allow(identity)
        if not allowed:
            response = jsonify({"error": "Rate limit exceeded. Retry shortly."})
            response.status_code = 429
            response.headers["Retry-After"] = str(retry_after)
            return response

        if api_keys and provided_key not in api_keys:
            return jsonify({"error": "Unauthorized. A valid X-API-Key header is required."}), 401
        return None

    @app.after_request
    def add_cors_headers(response):
        # CORS is allowlist-only: origins must be configured via
        # CORS_ALLOWED_ORIGINS. No wildcard cross-origin on a commercial API.
        origin = request.headers.get("Origin")
        if origin and origin in cors_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Vary"] = "Origin"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-API-Key, Authorization"
            response.headers["Access-Control-Max-Age"] = "600"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    # Register blueprints
    from backend.app.routes.api import api_bp
    app.register_blueprint(api_bp, url_prefix="/api")

    # Global error handlers — never leak internal exception text to clients.
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found", "status_code": 404}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed", "status_code": 405}), 405

    @app.errorhandler(413)
    def payload_too_large(e):
        return jsonify({"error": "Request body too large", "status_code": 413}), 413

    @app.errorhandler(500)
    def internal_error(e):
        app.logger.exception("Unhandled server error")
        return jsonify({"error": "Internal server error", "status_code": 500}), 500

    @app.errorhandler(Exception)
    def uncaught(e):
        app.logger.exception("Uncaught exception")
        return jsonify({"error": "Internal server error", "status_code": 500}), 500

    return app
