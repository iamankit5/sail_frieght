// frontend/src/services/api.ts
import {
  MarketData,
  VesselEvaluation,
  RouteRiskProfile,
  FreightForecast,
  DailyWeather,
  ModelAuditData
} from '../types';

// API base URL: same-origin /api by default (deploy the API behind the same
// domain or a reverse proxy), override per environment with VITE_API_URL.
const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

// Optional per-tenant API key (set VITE_API_KEY when the backend enforces API_KEYS).
const API_KEY = import.meta.env.VITE_API_KEY || '';

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const h = { ...extra };
  if (API_KEY) h['X-API-Key'] = API_KEY;
  return h;
}

function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeoutId));
}

export interface EvaluationResponse {
  evaluations: VesselEvaluation[];
  risk_profile: RouteRiskProfile | null;
  error?: string;
}

export const apiService = {
  // Service health probe
  async checkBackendHealth(): Promise<{ isConnected: boolean; version?: string }> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/health`, {}, 2500);
      if (res.ok) {
        const data = await res.json();
        return { isConnected: true, version: data.version };
      }
    } catch {
      // Service unreachable
    }
    return { isConnected: false };
  },

  // Market data (crude-derived bunker estimate & FX)
  async getMarketData(): Promise<MarketData | null> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/market/latest`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        if (!data.error && typeof data.bunker_price_usd_mt === 'number') {
          return data;
        }
      }
    } catch (err) {
      console.warn('[API] Market data request failed:', err);
    }
    return null;
  },

  // Evaluate vessels for cargo, route & material
  async evaluateVessels(
    cargoQtyMt: number,
    origin: string,
    destination: string,
    bunkerPrice: number,
    freightMultiplier: number = 1.0,
    cargoType: string = 'Coking Coal'
  ): Promise<EvaluationResponse> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/procurement/evaluate`, {
        method: 'POST',
        headers: headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          cargo_qty_mt: cargoQtyMt,
          origin,
          destination,
          bunker_price: bunkerPrice,
          freight_multiplier: freightMultiplier,
          cargo_type: cargoType
        })
      }, 6000);

      if (res.ok) {
        const data = await res.json();
        return {
          evaluations: Array.isArray(data.evaluations) ? data.evaluations : [],
          risk_profile: data.risk_profile || null
        };
      }
      const errData = await res.json().catch(() => ({}));
      const message =
        errData && typeof errData.error === 'string'
          ? errData.error
          : `Evaluation request failed (HTTP ${res.status}).`;
      return { evaluations: [], risk_profile: null, error: message };
    } catch {
      return {
        evaluations: [],
        risk_profile: null,
        error: 'The evaluation service could not be reached. Check your connection and retry.'
      };
    }
  },

  // Freight-market trend forecast
  async getFreightForecast(): Promise<FreightForecast | null> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/forecast/freight`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.timeline_30d) && data.timeline_30d.length === 30) {
          return data;
        }
      }
    } catch (err) {
      console.warn('[API] Freight forecast request failed:', err);
    }
    return null;
  },

  // Live 5-day port weather from Open-Meteo (requires a commercial plan for
  // commercial deployments — see docs/DATA_PROVENANCE.md).
  async getPortWeather(lat: number, lon: number): Promise<DailyWeather[]> {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=5`;
      const res = await fetchWithTimeout(url, {}, 3500);
      if (res.ok) {
        const json = await res.json();
        const daily = json.daily;
        if (daily && daily.time) {
          return daily.time.map((date: string, idx: number) => ({
            date,
            maxTemp: Math.round(daily.temperature_2m_max[idx]),
            minTemp: Math.round(daily.temperature_2m_min[idx]),
            rain: Math.round((daily.precipitation_sum[idx] || 0) * 10) / 10
          }));
        }
      }
    } catch {
      // Weather is a non-critical enrichment; render without it.
    }
    return [];
  },

  // Model audit data
  async getModelAudits(): Promise<ModelAuditData | null> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/models/evaluation`, { headers: headers() });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[API] Model evaluation request failed:', err);
    }
    return null;
  }
};
