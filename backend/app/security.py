# backend/app/security.py
"""
Lightweight, stdlib-only security primitives:
- Sliding-window rate limiter (per API key / client IP)
- Environment parsing for API keys and CORS origins

Commercial posture (docs/COMMERCIALIZATION_PLAN.md):
- Set API_KEYS="key1,key2" to require the X-API-Key header on every /api/*
  request except /api/health. Keys are per-tenant credentials issued at sale.
- Set CORS_ALLOWED_ORIGINS="https://app.example.com,https://www.example.com"
  to restrict cross-origin browser access. Leave empty for same-origin only.
- RATE_LIMIT_PER_MINUTE applies per key (or per IP when unauthenticated).
"""
import os
import threading
import time


def env_list(name):
    raw = os.environ.get(name, "")
    return [item.strip() for item in raw.split(",") if item.strip()]


def get_api_keys():
    return env_list("API_KEYS")


def get_cors_origins():
    return env_list("CORS_ALLOWED_ORIGINS")


def get_rate_limit_per_minute():
    try:
        return max(1, int(os.environ.get("RATE_LIMIT_PER_MINUTE", "120")))
    except ValueError:
        return 120


class SlidingWindowLimiter:
    """Thread-safe in-memory sliding-window limiter. Single-process scope:
    for multi-worker deployments put a limiter (e.g. Redis) in front or keep
    worker counts low; per-worker budgets are an acceptable approximation."""

    def __init__(self, limit_per_minute, window_seconds=60.0, max_keys=20000):
        self.limit = max(1, int(limit_per_minute))
        self.window = window_seconds
        self.max_keys = max_keys
        self._hits = {}
        self._lock = threading.Lock()

    def allow(self, key):
        """Return (allowed: bool, remaining: int, retry_after_seconds: int)."""
        now = time.monotonic()
        with self._lock:
            hits = [t for t in self._hits.get(key, ()) if now - t < self.window]
            if len(hits) >= self.limit:
                self._hits[key] = hits
                retry_after = int(self.window - (now - hits[0])) + 1
                return False, 0, max(1, retry_after)
            hits.append(now)
            self._hits[key] = hits
            if len(self._hits) > self.max_keys:
                self._prune(now)
            return True, self.limit - len(hits), 0

    def _prune(self, now):
        expired = [k for k, v in self._hits.items() if not v or now - v[-1] >= self.window]
        for k in expired:
            self._hits.pop(k, None)
