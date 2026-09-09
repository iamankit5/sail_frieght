// frontend/src/data/defaultMarket.ts
import { MarketData } from '../types';

export const DEFAULT_MARKET: MarketData = {
  bunker_price_usd_mt: 0,
  usd_inr_rate: 0,
  bunker_provenance: "LIVE",
  fx_provenance: "LIVE",
  updated_at: "",
  derivation_note: "Live market data pending from Python Flask service (yfinance USDINR=X & CL=F)...",
  is_live: false
};

export const PROVENANCE_DEFINITIONS = {
  LIVE: {
    label: "LIVE",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    description: "Data genuinely retrieved in real-time during this active session from live market tickers or Open-Meteo API."
  },
  HISTORICAL: {
    label: "HISTORICAL",
    color: "bg-sky-500/20 text-sky-400 border-sky-500/40",
    description: "Empirical historical records (2021–Present) from Yahoo Finance (BDRY) and bunker price logs."
  },
  ESTIMATED: {
    label: "ESTIMATED",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    description: "Values computed using calibrated industry conversion formulas (e.g., bunker from crude multiplier 7.33, freight $/MT multiplier 0.24)."
  },
  BENCHMARK: {
    label: "BENCHMARK",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/40",
    description: "Published standard maritime operational references (Clarksons Research 2024 spot averages, Indian Major Ports berth draft tables, Sea-Distances.org tables)."
  },
  DEMO: {
    label: "DEMO",
    color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/40",
    description: "Pre-calibrated parameter preset engineered for competition demonstration and judge walkthrough."
  }
};
