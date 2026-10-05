// frontend/src/App.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppHeader } from './components/layout/AppHeader';
import { ExecutiveHero } from './components/procurement/ExecutiveHero';
import { ProcurementControls } from './components/procurement/ProcurementControls';
import { VesselComparisonTable } from './components/vessel/VesselComparisonTable';
import { RouteMapVisualizer } from './components/route/RouteMapVisualizer';
import { VoyageRiskCard } from './components/route/VoyageRiskCard';
import { PortWeatherCard } from './components/weather/PortWeatherCard';
import { FreightForecastChart } from './components/forecasting/FreightForecastChart';
import { TimingSimulator } from './components/forecasting/TimingSimulator';
import { WhatIfSimulator } from './components/simulator/WhatIfSimulator';
import { ProvenanceDrawer } from './components/provenance/ProvenanceDrawer';
import { ModelHonestyAudit } from './components/audit/ModelHonestyAudit';

import { apiService } from './services/api';
import { PORT_COORDINATES } from './lib/procurementEngine';
import { DEFAULT_MARKET } from './data/defaultMarket';
import { Skeleton } from './components/ui/Primitives';
import {
  MarketData,
  VesselEvaluation,
  RouteRiskProfile,
  FreightForecast,
  DailyWeather,
  ModelAuditData
} from './types';
import { ServerCrash, RefreshCw, AlertCircle } from 'lucide-react';

// Debounce window for parameter-driven re-evaluation (slider drags etc.)
const EVALUATION_DEBOUNCE_MS = 300;
// Poll interval while the API service is unreachable.
const RECONNECT_POLL_MS = 10_000;

export const App: React.FC = () => {
  // Navigation & Mode States
  const [activeTab, setActiveTab] = useState<'procurement' | 'audit'>('procurement');
  const [isProvenanceOpen, setIsProvenanceOpen] = useState<boolean>(false);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Scenario States
  const [cargoType, setCargoType] = useState<string>('Coking Coal');
  const [cargoQty, setCargoQty] = useState<number>(75000);
  const [origin, setOrigin] = useState<string>('Australia (Newcastle)');
  const [destination, setDestination] = useState<string>('Paradip');
  const [priceMode, setPriceMode] = useState<'live' | 'manual'>('live');
  const [bunkerPrice, setBunkerPrice] = useState<number>(0);

  // Data States (no hardcoded fallback rates: data comes only from the API)
  const [marketData, setMarketData] = useState<MarketData>(DEFAULT_MARKET);
  const [evaluations, setEvaluations] = useState<VesselEvaluation[]>([]);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [riskProfile, setRiskProfile] = useState<RouteRiskProfile | null>(null);
  const [forecast, setForecast] = useState<FreightForecast | null>(null);
  const [originWeather, setOriginWeather] = useState<DailyWeather[]>([]);
  const [destWeather, setDestWeather] = useState<DailyWeather[]>([]);
  const [auditData, setAuditData] = useState<ModelAuditData | null>(null);

  const scenarioRef = useRef({ cargoQty, origin, destination, cargoType, priceMode, bunkerPrice });
  scenarioRef.current = { cargoQty, origin, destination, cargoType, priceMode, bunkerPrice };

  // Run procurement calculation through the API
  const runEvaluation = useCallback(async (
    qty: number,
    orig: string,
    dest: string,
    bunker: number,
    material: string
  ) => {
    const res = await apiService.evaluateVessels(qty, orig, dest, bunker, 1.0, material);
    if (res.error) {
      setEvalError(res.error);
      setEvaluations([]);
      return;
    }
    setEvalError(null);
    setEvaluations(res.evaluations || []);
    if (res.risk_profile) {
      setRiskProfile(res.risk_profile);
    }
  }, []);

  // Fetch Weather for current ports
  const loadWeather = useCallback(async (orig: string, dest: string) => {
    const origGeo = PORT_COORDINATES[orig] || { lat: -32.92, lon: 151.78 };
    const destGeo = PORT_COORDINATES[dest] || { lat: 20.26, lon: 86.60 };

    const [wOrig, wDest] = await Promise.all([
      apiService.getPortWeather(origGeo.lat, origGeo.lon),
      apiService.getPortWeather(destGeo.lat, destGeo.lon),
    ]);

    setOriginWeather(wOrig);
    setDestWeather(wDest);
  }, []);

  // Bootstrap: runs ONCE on mount (and on manual refresh). Fetches connection
  // status and singleton datasets; scenario evaluation is handled separately
  // by the parameter effect below so slider changes never re-trigger this.
  const initData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const backendStatus = await apiService.checkBackendHealth();
      setBackendConnected(backendStatus.isConnected);

      if (backendStatus.isConnected) {
        const [market, fc, audits] = await Promise.all([
          apiService.getMarketData(),
          apiService.getFreightForecast(),
          apiService.getModelAudits(),
        ]);

        if (market) {
          setMarketData(market);
          const { priceMode: mode, bunkerPrice: manualBunker } = scenarioRef.current;
          const activeBunker = mode === 'live'
            ? market.bunker_price_usd_mt
            : (manualBunker || market.bunker_price_usd_mt);
          setBunkerPrice(activeBunker);
        }

        if (fc) setForecast(fc);
        if (audits) setAuditData(audits);

        const { origin: o, destination: d } = scenarioRef.current;
        loadWeather(o, d);
      } else {
        setEvaluations([]);
        setRiskProfile(null);
        setForecast(null);
        setAuditData(null);
      }
    } catch (err) {
      console.error('Data initialization error:', err);
      setBackendConnected(false);
      setEvaluations([]);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadWeather]);

  // Initial mount check
  useEffect(() => {
    initData();
  }, [initData]);

  // Poll the API while disconnected (gentle interval; the header shows status).
  useEffect(() => {
    if (backendConnected) return;
    const interval = setInterval(async () => {
      const health = await apiService.checkBackendHealth();
      if (health.isConnected) {
        initData();
      }
    }, RECONNECT_POLL_MS);
    return () => clearInterval(interval);
  }, [backendConnected, initData]);

  // Re-evaluate when scenario parameters change (debounced; runs only when
  // the service is connected and an active bunker price exists).
  useEffect(() => {
    if (!backendConnected) return;
    const activeBunker = priceMode === 'live' ? marketData.bunker_price_usd_mt : bunkerPrice;
    if (!(activeBunker > 0)) return;

    const handle = setTimeout(() => {
      runEvaluation(cargoQty, origin, destination, activeBunker, cargoType);
    }, EVALUATION_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [cargoQty, cargoType, origin, destination, priceMode, bunkerPrice, marketData.bunker_price_usd_mt, backendConnected, runEvaluation]);

  // Weather follows the selected ports (debounced, non-critical).
  useEffect(() => {
    if (!backendConnected) return;
    const handle = setTimeout(() => {
      loadWeather(origin, destination);
    }, EVALUATION_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [origin, destination, backendConnected, loadWeather]);

  // Feasibility-first recommendation: never showcase a draft-blocked vessel
  // as the optimal charter; if no class can berth, the hero says so.
  const optimalVessel = evaluations.find(v => v.is_feasible);
  const alternativeVessel = optimalVessel
    ? evaluations.find(v => v.is_feasible && v.vessel !== optimalVessel.vessel)
    : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-[#060911] text-[#e2e8f0]">

      {/* Top Application Header */}
      <AppHeader
        marketData={marketData}
        backendConnected={backendConnected}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenProvenance={() => setIsProvenanceOpen(true)}
        isRefreshing={isRefreshing}
        onRefresh={initData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 py-5">

        {/* Offline Gate: no fabricated data is shown while disconnected */}
        {!backendConnected ? (
          <div className="my-10 max-w-2xl mx-auto rounded-xl bg-gradient-to-b from-[#0e1626] to-[#080d17] border border-rose-600/40 p-8 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-950/80 border border-rose-500/60 flex items-center justify-center text-rose-400">
              <ServerCrash className="w-8 h-8 animate-pulse" />
            </div>

            <span className="inline-block px-3 py-1 rounded bg-rose-950 border border-rose-600/60 text-rose-300 font-mono text-xs font-bold uppercase tracking-wider mb-2">
              ● Intelligence Service Unreachable
            </span>

            <h2 className="text-2xl font-bold text-slate-100 mb-2">
              Cannot Connect to the Decision API
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              This terminal never displays estimated market or cost data without a live connection to
              the decision engine. Verify your network connection and the configured API endpoint
              (<span className="font-mono text-sky-300">VITE_API_URL</span>), or contact your administrator.
            </p>

            {/* Auto-reconnect & Manual Retry */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={initData}
                disabled={isRefreshing}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Retry Connection Now</span>
              </button>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span>Auto-retrying every {RECONNECT_POLL_MS / 1000}s...</span>
              </div>
            </div>
          </div>
        ) : activeTab === 'procurement' ? (
          <div>
            {/* Evaluation error banner */}
            {evalError && (
              <div className="mb-5 rounded-lg bg-gradient-to-b from-[#1c0e12] to-[#0c0709] border border-rose-900/60 p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-bold text-rose-300 block mb-0.5">Evaluation Error</span>
                  <span className="text-slate-300">{evalError}</span>
                </div>
              </div>
            )}

            {/* 1. Hero Decision Overview */}
            {forecast && (evaluations.length > 0 || evalError) ? (
              <ExecutiveHero
                optimalVessel={optimalVessel}
                alternativeVessel={alternativeVessel}
                cargoQty={cargoQty}
                cargoType={cargoType}
                origin={origin}
                destination={destination}
                forecast={forecast}
                marketData={marketData}
              />
            ) : (
              /* Skeleton hero while the engine computes */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">
                <div className="lg:col-span-7 terminal-card p-5">
                  <div className="flex justify-between mb-4">
                    <Skeleton className="h-6 w-56" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <Skeleton className="h-8 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-1/2 mb-5" />
                  <div className="grid grid-cols-4 gap-2.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-20" />
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-5 terminal-card p-5">
                  <Skeleton className="h-6 w-48 mb-5" />
                  <Skeleton className="h-10 w-40 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-5" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            )}

            {/* 2. Procurement Parameters Controls */}
            <ProcurementControls
              cargoType={cargoType}
              onCargoTypeChange={setCargoType}
              cargoQty={cargoQty}
              onCargoQtyChange={setCargoQty}
              origin={origin}
              onOriginChange={setOrigin}
              destination={destination}
              onDestinationChange={setDestination}
              priceMode={priceMode}
              onPriceModeChange={setPriceMode}
              bunkerPrice={bunkerPrice}
              onBunkerPriceChange={setBunkerPrice}
              liveBunkerPrice={marketData.bunker_price_usd_mt}
            />

            {/* 3. Vessel Suitability & Landed Cost Breakdown */}
            {evaluations.length > 0 ? (
              <VesselComparisonTable
                evaluations={evaluations}
                destination={destination}
                marketData={marketData}
              />
            ) : null}

            {/* 4. Ocean Route & Weather Grid (2 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <div className="space-y-5">
                <RouteMapVisualizer
                  origin={origin}
                  destination={destination}
                  optimalVessel={optimalVessel}
                />
                {riskProfile && (
                  <VoyageRiskCard
                    riskProfile={riskProfile}
                    destination={destination}
                  />
                )}
              </div>

              <div className="space-y-5">
                <PortWeatherCard
                  portName={origin}
                  weather={originWeather}
                  isOrigin={true}
                />
                <PortWeatherCard
                  portName={destination}
                  weather={destWeather}
                  isOrigin={false}
                />
              </div>
            </div>

            {/* 5. Multi-Horizon Forecast Chart */}
            {forecast && <FreightForecastChart forecast={forecast} />}

            {/* 6. Timing Simulator Table */}
            {forecast && (
              <TimingSimulator
                forecast={forecast}
                cargoQty={cargoQty}
                marketData={marketData}
              />
            )}

            {/* 7. What-If Scenario Simulator */}
            {optimalVessel && (
              <WhatIfSimulator
                baseCargoQty={cargoQty}
                origin={origin}
                destination={destination}
                baseBunkerPrice={bunkerPrice}
                marketData={marketData}
                optimalVessel={optimalVessel}
                cargoType={cargoType}
              />
            )}

          </div>
        ) : (
          /* ML Honesty & Methodology Tab */
          auditData ? (
            <ModelHonestyAudit auditData={auditData} />
          ) : (
            <div className="terminal-card p-6 space-y-3">
              <Skeleton className="h-6 w-72" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-40 w-full mt-4" />
            </div>
          )
        )}
      </main>

      {/* Data Provenance Modal Drawer */}
      <ProvenanceDrawer
        isOpen={isProvenanceOpen}
        onClose={() => setIsProvenanceOpen(false)}
      />

      {/* Terminal Footer */}
      <footer className="border-t border-[rgba(56,116,187,0.14)] bg-[#050a13]/90 py-4 px-4 text-[11px] font-mono text-slate-500">
        <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-slate-300 uppercase tracking-wide">
              Freight Procurement Terminal
            </span>
            <span className="text-slate-700">|</span>
            <span>Decision support only — not a fixture quote</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span>Distances: self-derived great-circle methodology</span>
            <span className="text-slate-700">·</span>
            <span>Port drafts: public authority notices</span>
            <span className="text-slate-700">·</span>
            <span>Assumptions: operator-configured</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="status-led status-led-emerald" style={{ width: 6, height: 6 }} />
            <span>Data Provenance audit available in-app</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
