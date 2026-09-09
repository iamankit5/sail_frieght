# backend/app/services/market_service.py
from datetime import datetime, timezone
import json
import urllib.request
import yfinance as yf

class MarketService:
    _cached_market = None
    _last_fetched = None

    @classmethod
    def _fetch_live_forex(cls) -> tuple[float, str]:
        """
        Fetch real-time USD/INR rate.
        Primary: Yahoo Finance USDINR=X
        Secondary: Free Open Exchange Rates API (open.er-api.com)
        """
        # Primary: Yahoo Finance USDINR=X with 7-day lookback for weekend safety
        try:
            inr = yf.Ticker("USDINR=X")
            inr_hist = inr.history(period="7d")
            if not inr_hist.empty and len(inr_hist) > 0:
                rate = round(float(inr_hist['Close'].dropna().iloc[-1]), 2)
                if rate > 0:
                    return rate, "LIVE (Yahoo Finance)"
        except Exception as e:
            print(f"[WARN] Yahoo Finance forex fetch error: {e}")

        # Secondary: Keyless Open Exchange Rates endpoint
        try:
            req = urllib.request.Request(
                "https://open.er-api.com/v6/latest/USD",
                headers={"User-Agent": "SAIL-Freight-Intelligence/2.0"}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode('utf-8'))
                rates = data.get("rates", {})
                if "INR" in rates and float(rates["INR"]) > 0:
                    return round(float(rates["INR"]), 2), "LIVE (Open-ER API)"
        except Exception as e:
            print(f"[WARN] Open-ER forex fetch error: {e}")

        # Tertiary: Frankfurter API
        try:
            req = urllib.request.Request(
                "https://api.frankfurter.app/latest?from=USD&to=INR",
                headers={"User-Agent": "SAIL-Freight-Intelligence/2.0"}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode('utf-8'))
                rates = data.get("rates", {})
                if "INR" in rates and float(rates["INR"]) > 0:
                    return round(float(rates["INR"]), 2), "LIVE (Frankfurter ECB)"
        except Exception as e:
            print(f"[WARN] Frankfurter forex fetch error: {e}")

        raise RuntimeError("Unable to retrieve live USD/INR exchange rate from any live market source.")

    @classmethod
    def _fetch_live_oil(cls) -> tuple[float, str]:
        """
        Fetch real-time crude oil spot proxy and derive marine bunker price.
        Primary: CL=F (WTI Crude Future on NYMEX)
        Secondary: BZ=F (Brent Crude on ICE)
        Conversion: 7.33 bbl/MT standard metric conversion factor.
        """
        # Primary: WTI (CL=F)
        try:
            oil = yf.Ticker("CL=F")
            oil_hist = oil.history(period="7d")
            if not oil_hist.empty and len(oil_hist) > 0:
                oil_price = float(oil_hist['Close'].dropna().iloc[-1])
                bunker_val = round(oil_price * 7.33, 2)
                return bunker_val, "LIVE (WTI CL=F × 7.33)"
        except Exception as e:
            print(f"[WARN] WTI oil fetch error: {e}")

        # Secondary: Brent (BZ=F)
        try:
            brent = yf.Ticker("BZ=F")
            brent_hist = brent.history(period="7d")
            if not brent_hist.empty and len(brent_hist) > 0:
                oil_price = float(brent_hist['Close'].dropna().iloc[-1])
                bunker_val = round(oil_price * 7.33, 2)
                return bunker_val, "LIVE (Brent BZ=F × 7.33)"
        except Exception as e:
            print(f"[WARN] Brent oil fetch error: {e}")

        raise RuntimeError("Unable to retrieve live crude oil spot from any live market source.")

    @classmethod
    def get_latest_market(cls, max_age_seconds=300):
        now = datetime.now(timezone.utc)
        if cls._cached_market and cls._last_fetched:
            age = (now - cls._last_fetched).total_seconds()
            if age < max_age_seconds:
                return cls._cached_market

        try:
            usd_inr, inr_prov = cls._fetch_live_forex()
            bunker_val, oil_prov = cls._fetch_live_oil()

            cls._cached_market = {
                "bunker_price_usd_mt": bunker_val,
                "usd_inr_rate": usd_inr,
                "bunker_provenance": "LIVE",
                "fx_provenance": "LIVE",
                "bunker_source_detail": oil_prov,
                "fx_source_detail": inr_prov,
                "is_live": True,
                "updated_at": now.isoformat(),
                "derivation_note": "Bunker $/MT derived from real-time crude spot using standard maritime conversion ratio (7.33 bbl/MT)."
            }
            cls._last_fetched = now
            return cls._cached_market
        except Exception as e:
            # If live fetching encounters an unrecoverable failure, report provenance clearly
            # and never silently inject arbitrary false rates like 84.
            error_response = {
                "error": f"Live market data fetch failed: {str(e)}",
                "is_live": False,
                "bunker_provenance": "UNAVAILABLE",
                "fx_provenance": "UNAVAILABLE",
                "updated_at": now.isoformat()
            }
            return error_response
