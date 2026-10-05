# backend/run.py
"""
Development entrypoint. For production use a real WSGI server:
    gunicorn -c backend/gunicorn.conf.py backend.run:app
"""
import os
import sys

# Ensure project root is in python path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    host = os.environ.get("HOST", "127.0.0.1")
    # The Flask dev server must never run with the debugger enabled in any
    # reachable deployment: its interactive console is remote code execution.
    debug = os.environ.get("FLASK_DEBUG", "").lower() in ("true", "1")
    print("=" * 65)
    print(f"  Freight Procurement API (development) on http://{host}:{port}")
    if debug:
        print("  WARNING: FLASK_DEBUG is enabled — development use only.")
    print("=" * 65)
    app.run(host=host, port=port, debug=debug)
