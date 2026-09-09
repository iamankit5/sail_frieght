// frontend/src/services/api.ts
import { 
  MarketData, 
  VesselEvaluation, 
  RouteRiskProfile, 
  FreightForecast, 
  DailyWeather, 
  ModelAuditData 
} from '../types';

const API_BASE = import.meta.env.PROD
  ? 'https://sail-frieght.onrender.com/api'
  : '/api';

export interface EvaluationResponse {
  evaluations: VesselEvaluation[];
  risk_profile: RouteRiskProfile | null;
  source: 'FLASK_API';
  error?: string;
}

export const apiService = {
  // Check if Flask backend is alive
  async checkBackendHealth(): Promise<{ isConnected: boolean; version?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        return { isConnected: true, version: data.version };
      }
    } catch {
      // Backend offline
    }
    return { isConnected: false };
  },

  // Market data (oil & forex) - Fetched strictly from Flask backend
  async getMarketData(): Promise<MarketData | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${API_BASE}/market/latest`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (!data.error) {
          return data;
        }
      }
    } catch (err) {
      console.warn('[API] Failed to fetch live market data from Flask backend:', err);
    }
    return null;
  },

  // Evaluate vessels for cargo, route & material - Routed through Flask backend
  async evaluateVessels(
    cargoQtyMt: number,
    origin: string,
    destination: string,
    bunkerPrice: number,
    freightMultiplier: number = 1.0,
    cargoType: string = 'Coking Coal'
  ): Promise<EvaluationResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${API_BASE}/procurement/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cargo_qty_mt: cargoQtyMt,
          origin,
          destination,
          bunker_price: bunkerPrice,
          freight_multiplier: freightMultiplier,
          cargo_type: cargoType
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return {
          evaluations: data.evaluations || [],
          risk_profile: data.risk_profile || null,
          source: 'FLASK_API'
        };
      } else {
        const errData = await res.json().catch(() => ({}));
        return {
          evaluations: [],
          risk_profile: null,
          source: 'FLASK_API',
          error: errData.error || `Flask error ${res.status}`
        };
      }
    } catch (err) {
      return {
        evaluations: [],
        risk_profile: null,
        source: 'FLASK_API',
        error: 'Flask backend is offline. Run python backend/run.py to enable live calculations.'
      };
    }
  },

  // Freight forecast time-series - Loaded from Flask backend
  async getFreightForecast(): Promise<FreightForecast | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${API_BASE}/forecast/freight`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[API] Failed to fetch freight forecast from Flask:', err);
    }
    return null;
  },

  // Live 5-day weather from public Open-Meteo API
  async getPortWeather(lat: number, lon: number): Promise<DailyWeather[]> {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=5`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

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
      // Network failure or CORS issue
    }
    return [];
  },

  // Model audit data - Loaded from Flask backend
  async getModelAudits(): Promise<ModelAuditData | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${API_BASE}/models/evaluation`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[API] Failed to fetch model evaluations from Flask:', err);
    }
    return null;
  }
};
