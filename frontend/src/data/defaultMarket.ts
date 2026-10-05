// frontend/src/data/defaultMarket.ts
import { MarketData } from '../types';

export const DEFAULT_MARKET: MarketData = {
  bunker_price_usd_mt: 0,
  usd_inr_rate: 0,
  bunker_provenance: "ESTIMATED",
  fx_provenance: "LIVE",
  updated_at: "",
  derivation_note: "Awaiting market data from the intelligence API service...",
  is_live: false
};

export const PROVENANCE_DEFINITIONS = {
  LIVE: {
    label: "LIVE",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    description: "Retrieved in real-time during this session from a connected market data provider or public weather API."
  },
  HISTORICAL: {
    label: "HISTORICAL",
    color: "bg-sky-500/20 text-sky-400 border-sky-500/40",
    description: "Empirical historical records retained in the platform's own market dataset."
  },
  ESTIMATED: {
    label: "ESTIMATED",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    description: "Computed with documented planning formulas and assumptions (e.g. bunker estimate derived from crude spot, freight $/MT trend conversion). Not a market quote."
  },
  BENCHMARK: {
    label: "BENCHMARK",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/40",
    description: "Self-derived operational reference values (route distances from documented great-circle methodology; port drafts from public port authority notices)."
  },
  DEMO: {
    label: "DEMO",
    color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/40",
    description: "Clearly-labeled synthetic data served only in demo mode for interface walkthroughs. Never real market data."
  }
};
