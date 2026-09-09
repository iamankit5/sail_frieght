# backend/run.py
import sys
import os

# Ensure project root is in python path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "True").lower() in ("true", "1")
    print("=" * 65)
    print(f"  SAIL Freight Intelligence Flask REST API starting on port {port}")
    print("=" * 65)
    app.run(host="0.0.0.0", port=port, debug=debug)
