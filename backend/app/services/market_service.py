# backend/app/services/market_service.py
import json
import logging
import threading
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

import yfinance as yf

logger = logging.getLogger(__name__)

_FETCH_TIMEOUT_SECONDS = 8
_HTTP_USER_AGENT = "FreightProcurementTerminal/3.0"

# NOTE (see docs/DATA_PROVENANCE.md): the bunker price below is an ESTIMATED
# value derived from crude spot, not a published VLSFO assessment. VLSFO
# trades at a spread to crude; a production deployment should replace this
# with a licensed bunker assessment (e.g. Ship & Bunker) or customer-supplied
# actuals. Yahoo Finance is a development-time source: its terms of service
# do not permit commercial redistribution, so contract a licensed feed or
# collect data with user consent before charging customers.


def _fetch_with_timeout(fn, timeout_seconds=_FETCH_TIMEOUT_SECONDS):
    """Run a blocking fetch on a worker thread and give up after timeout.

    yfinance offers no per-call timeout; without this a slow upstream request
    can pin a Flask worker indefinitely.
    """
    executor = ThreadPoolExecutor(max_workers=1)
    try:
        return executor.submit(fn).result(timeout=timeout_seconds)
    except TimeoutError:
        raise RuntimeError(f"Market data fetch timed out after {timeout_seconds}s")
    finally:
        executor.shutdown(wait=False)


class MarketService:
    _lock = threading.Lock()
    _cached_market = None
    _last_fetched = None

    @classmethod
    def _fetch_live_forex(cls) -> tuple[float, str]:
        """
        Fetch real-time USD/INR rate.
        Primary: Yahoo Finance USDINR=X. Secondary: keyless open FX APIs.
        """
        try:
            def _yahoo():
                hist = yf.Ticker("USDINR=X").history(period="7d")
                if hist.empty:
                    raise RuntimeError("empty history")
                return float(hist['Close'].dropna().iloc[-1])

            rate = _fetch_with_timeout(_yahoo)
            if rate > 0:
                return round(rate, 2), "LIVE (Yahoo Finance USDINR=X)"
        except Exception as exc:
            logger.warning("Yahoo Finance forex fetch error: %s", exc)

        for label, url in (
            ("Open-ER API", "https://open.er-api.com/v6/latest/USD"),
            ("Frankfurter ECB", "https://api.frankfurter.app/latest?from=USD&to=INR"),
        ):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": _HTTP_USER_AGENT})
                with urllib.request.urlopen(req, timeout=5) as response:
                    data = json.loads(response.read().decode("utf-8"))
                inr = float(data.get("rates", {}).get("INR", 0))
                if inr > 0:
                    return round(inr, 2), f"LIVE ({label})"
            except (urllib.error.URLError, ValueError, KeyError, OSError) as exc:
                logger.warning("%s forex fetch error: %s", label, exc)

        raise RuntimeError("Unable to retrieve live USD/INR exchange rate from any configured source.")

    @classmethod
    def _fetch_live_crude(cls) -> tuple[float, str]:
        """
        Fetch a crude oil spot proxy (USD/bbl).
        Primary: CL=F (WTI). Secondary: BZ=F (Brent).
        """
        for ticker, label in (("CL=F", "WTI CL=F"), ("BZ=F", "Brent BZ=F")):
            try:
                def _yahoo(t=ticker):
                    hist = yf.Ticker(t).history(period="7d")
                    if hist.empty:
                        raise RuntimeError("empty history")
                    return float(hist['Close'].dropna().iloc[-1])

                price = _fetch_with_timeout(_yahoo)
                if price > 0:
                    return price, f"LIVE ({label} crude spot)"
            except Exception as exc:
                logger.warning("%s crude fetch error: %s", label, exc)

        raise RuntimeError("Unable to retrieve live crude spot from any configured source.")

    @classmethod
    def get_latest_market(cls, max_age_seconds=300):
        now = datetime.now(timezone.utc)
        with cls._lock:
            if cls._cached_market and cls._last_fetched:
                age = (now - cls._last_fetched).total_seconds()
                if age < max_age_seconds:
                    return cls._cached_market

            try:
                usd_inr, inr_prov = cls._fetch_live_forex()
                crude_bbl, oil_prov = cls._fetch_live_crude()
                # ESTIMATED bunker: crude USD/bbl -> USD/MT of crude-equivalent
                # energy tonnage (7.33 bbl/MT). This is NOT a VLSFO assessment;
                # see the module note above before commercial use.
                bunker_val = round(crude_bbl * 7.33, 2)

                cls._cached_market = {
                    "bunker_price_usd_mt": bunker_val,
                    "usd_inr_rate": usd_inr,
                    "bunker_provenance": "ESTIMATED",
                    "fx_provenance": "LIVE",
                    "bunker_source_detail": oil_prov,
                    "fx_source_detail": inr_prov,
                    "is_live": True,
                    "updated_at": now.isoformat(),
                    "derivation_note": (
                        "Bunker value ESTIMATED from live crude spot (7.33 bbl/MT crude-equivalent). "
                        "It is not a published VLSFO assessment; connect a licensed bunker feed for contract-grade numbers."
                    ),
                }
                cls._last_fetched = now
                return cls._cached_market
            except Exception as exc:
                logger.exception("Live market data fetch failed")
                return {
                    "error": f"Live market data unavailable: {exc}",
                    "is_live": False,
                    "bunker_provenance": "UNAVAILABLE",
                    "fx_provenance": "UNAVAILABLE",
                    "updated_at": now.isoformat(),
                }
