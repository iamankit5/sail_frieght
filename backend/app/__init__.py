# backend/app/__init__.py
from flask import Flask, jsonify, request

def create_app():
    app = Flask(__name__)
    app.config["JSON_SORT_KEYS"] = False

    # Universal CORS handler (no external package required)
    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
        return response

    @app.route("/<path:path>", methods=["OPTIONS"])
    def options_handler(path):
        return "", 204

    # Register blueprints
    from backend.app.routes.api import api_bp
    app.register_blueprint(api_bp, url_prefix="/api")

    # Global Error Handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found", "status_code": 404}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal server error", "status_code": 500}), 500

    return app
