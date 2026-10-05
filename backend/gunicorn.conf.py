# backend/gunicorn.conf.py
"""Production WSGI configuration.
Run from the repository root:
    gunicorn -c backend/gunicorn.conf.py backend.run:app
"""
import multiprocessing
import os

bind = os.environ.get("BIND", "0.0.0.0:5000")
workers = int(os.environ.get("WEB_CONCURRENCY", min(4, multiprocessing.cpu_count() * 2 + 1)))
timeout = int(os.environ.get("GUNICORN_TIMEOUT", "60"))
accesslog = "-"
errorlog = "-"
# Never allow the debugger or reload in production.
reload = False
preload_app = True
