// frontend/src/types/index.ts

export type ProvenanceType = 'LIVE' | 'HISTORICAL' | 'ESTIMATED' | 'BENCHMARK' | 'DEMO';

export interface PortCoordinate {
  lat: number;
  lon: number;
  weather_risk?: string;
  congestion_risk?: string;
  waiting_days?: number;
  draft_limit_m?: number;
}

export interface VesselSpec {
  avg_cap: number;
  speed_knots: number;
  fuel_per_day: number;
  daily_hire_rate: number;
  draft_m: number;
  availability: string;
  risk: string;
}

export interface VesselEvaluation {
  vessel: string;
  capacity: string;
  capacity_dwt: number;
  draft_m: number;
  port_draft_limit_m: number;
  is_feasible: boolean;
  voyage_days: number;
  fuel_burned_mt: number;
  total_cost_usd: number;
  cost_per_mt: number;
  freight_pmt: number;
  fuel_pmt: number;
  port_pmt: number;
  demurrage_pmt: number;
  utilization_pct: number;
  availability: string;
  risk: string;
  feasibility: string;
  ai_score: number;
  cargo_type?: string;
  cargo_stowage_factor?: number;
  cargo_handling_pmt?: number;
}

export interface RouteRiskProfile {
  "Origin Weather": string;
  "Port Congestion": string;
  "Waiting Time at Dest": string;
  "Freight Volatility": string;
  "Overall Route Risk": string;
}

export interface MarketData {
  bunker_price_usd_mt: number;
  usd_inr_rate: number;
  bunker_provenance: ProvenanceType;
  fx_provenance: ProvenanceType;
  updated_at: string;
  derivation_note: string;
  is_live?: boolean;
  bunker_source_detail?: string;
  fx_source_detail?: string;
}

export interface ForecastDay {
  day: number;
  date: string;
  predicted_index: number;
  predicted_rate_pmt: number;
  lower_rate_pmt: number;
  upper_rate_pmt: number;
}

export interface HistoricalPoint {
  date: string;
  index_val: number;
  rate_pmt: number;
}

export interface FreightForecast {
  provenance: string;
  model_status: string;
  confidence_level: string;
  spot_index: number;
  spot_rate_pmt: number;
  forecast_7d_pmt: number;
  forecast_14d_pmt: number;
  forecast_30d_pmt: number;
  pct_change_30d: number;
  recommended_action: 'CHARTER NOW' | 'HOLD / WAIT' | 'NEUTRAL';
  history: HistoricalPoint[];
  timeline_30d: ForecastDay[];
}

export interface DailyWeather {
  date: string;
  maxTemp: number;
  minTemp: number;
  rain: number;
}

export interface ModelMetrics {
  train_rmse?: number;
  test_rmse?: number;
  train_mae?: number;
  test_mae?: number;
  train_r2?: number;
  test_r2?: number;
  rmse_overfit_gap?: number;
  rmse_overfit_ratio?: number;
  naive_baseline_rmse?: number;
  naive_baseline_r2?: number;
  beats_naive_baseline?: boolean;
  skill_gain_vs_naive_pct?: number;
  train_accuracy?: number;
  test_accuracy?: number;
  accuracy_gap?: number;
  precision_macro?: number;
  recall_macro?: number;
  f1_score_macro?: number;
}

export interface ModelAuditItem {
  model_name: string;
  task: string;
  dataset: string;
  train_samples: number;
  test_samples: number;
  metrics: ModelMetrics;
  status: string;
  diagnosis_reason: string;
  confusion_matrix: number[][];
}

export interface ModelAuditData {
  evaluation_timestamp: string;
  summary: {
    total_models_evaluated: number;
    statuses: Record<string, number>;
    naive_baseline_check: {
      description: string;
      models_checked: number;
      models_beating_naive_baseline: number;
    };
  };
  models: Record<string, ModelAuditItem>;
}
