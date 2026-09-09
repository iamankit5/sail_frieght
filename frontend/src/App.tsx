// frontend/src/App.tsx
import React, { useState, useEffect, useCallback } from 'react';
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
import { 
  MarketData, 
  VesselEvaluation, 
  RouteRiskProfile, 
  FreightForecast, 
  DailyWeather, 
  ModelAuditData 
} from './types';
import { ServerCrash, Terminal, RefreshCw, Activity, Cpu } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation & Mode States
  const [activeTab, setActiveTab] = useState<'procurement' | 'audit'>('procurement');
  const [judgeMode, setJudgeMode] = useState<boolean>(true);
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

  // Data States (No fake or hardcoded rates)
  const [marketData, setMarketData] = useState<MarketData>(DEFAULT_MARKET);
  const [evaluations, setEvaluations] = useState<VesselEvaluation[]>([]);
  const [riskProfile, setRiskProfile] = useState<RouteRiskProfile | null>(null);
  const [forecast, setForecast] = useState<FreightForecast | null>(null);
  const [originWeather, setOriginWeather] = useState<DailyWeather[]>([]);
  const [destWeather, setDestWeather] = useState<DailyWeather[]>([]);
  const [auditData, setAuditData] = useState<ModelAuditData | null>(null);

  // Handle Judge Demo Mode Toggle
  const handleToggleJudgeMode = (val: boolean) => {
    setJudgeMode(val);
    if (val) {
      setOrigin('Australia (Newcastle)');
      setDestination('Paradip');
      setCargoQty(75000);
      setCargoType('Coking Coal');
      setPriceMode('live');
      if (marketData.bunker_price_usd_mt > 0) {
        setBunkerPrice(marketData.bunker_price_usd_mt);
      }
    }
  };

  // Run procurement calculation through Flask backend
  const runEvaluation = useCallback(async (
    qty: number,
    orig: string,
    dest: string,
    bunker: number,
    material: string
  ) => {
    const res = await apiService.evaluateVessels(qty, orig, dest, bunker, 1.0, material);
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

  // Initial Load from Flask backend
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
          const activeBunker = priceMode === 'live' ? market.bunker_price_usd_mt : (bunkerPrice || market.bunker_price_usd_mt);
          setBunkerPrice(activeBunker);

          await Promise.all([
            runEvaluation(cargoQty, origin, destination, activeBunker, cargoType),
            loadWeather(origin, destination),
          ]);
        }

        if (fc) setForecast(fc);
        if (audits) setAuditData(audits);
      } else {
        // Clear all data when backend is not running
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
  }, [bunkerPrice, cargoQty, cargoType, destination, loadWeather, origin, priceMode, runEvaluation]);

  // Initial mount check
  useEffect(() => {
    initData();
  }, [initData]);

  // Auto-poll Flask backend every 3 seconds if disconnected
  useEffect(() => {
    if (backendConnected) return;
    const interval = setInterval(async () => {
      const health = await apiService.checkBackendHealth();
      if (health.isConnected) {
        initData();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [backendConnected, initData]);

  // Trigger evaluation when scenario parameters change (including cargoType!)
  useEffect(() => {
    if (!backendConnected) return;
    const activeBunker = priceMode === 'live' ? marketData.bunker_price_usd_mt : bunkerPrice;
    if (activeBunker > 0) {
      runEvaluation(cargoQty, origin, destination, activeBunker, cargoType);
      loadWeather(origin, destination);
    }
  }, [cargoQty, cargoType, origin, destination, priceMode, bunkerPrice, marketData.bunker_price_usd_mt, backendConnected, runEvaluation, loadWeather]);

  const optimalVessel = evaluations[0];
  const alternativeVessel = evaluations[1];

  return (
    <div className="min-h-screen flex flex-col bg-[#060911] text-[#e2e8f0]">
      
      {/* Top Application Header */}
      <AppHeader
        marketData={marketData}
        backendConnected={backendConnected}
        judgeMode={judgeMode}
        onToggleJudgeMode={handleToggleJudgeMode}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenProvenance={() => setIsProvenanceOpen(true)}
        isRefreshing={isRefreshing}
        onRefresh={initData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 py-5">
        
        {/* Strict Backend Offline Gate: If Flask is not running, NO DATA is shown */}
        {!backendConnected ? (
          <div className="my-10 max-w-2xl mx-auto rounded-xl bg-gradient-to-b from-[#0e1626] to-[#080d17] border border-rose-600/40 p-8 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-950/80 border border-rose-500/60 flex items-center justify-center text-rose-400">
              <ServerCrash className="w-8 h-8 animate-pulse" />
            </div>

            <span className="inline-block px-3 py-1 rounded bg-rose-950 border border-rose-600/60 text-rose-300 font-mono text-xs font-bold uppercase tracking-wider mb-2">
              ● Flask Backend Offline (Required)
            </span>

            <h2 className="text-2xl font-bold text-slate-100 mb-2">
              Live Python Backend Service Disconnected
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              As per strict maritime intelligence guidelines, <strong className="text-rose-400">all hardcoded fallback data (including fixed USD/INR rates) has been removed</strong>. No data can be displayed until the Flask API service is active.
            </p>

            {/* Launch Instructions */}
            <div className="bg-[#050810] border border-[#1a2b42] rounded-lg p-4 text-left mb-6 font-mono text-xs">
              <div className="flex items-center gap-2 text-slate-400 mb-2 pb-2 border-b border-[#142236]">
                <Terminal className="w-4 h-4 text-sky-400" />
                <span>To Start Flask REST API Server:</span>
              </div>
              <p className="text-slate-400 mb-1"># In your repository terminal, run:</p>
              <div className="bg-[#0a101d] p-2.5 rounded border border-[#233857] text-sky-300 font-bold flex items-center justify-between">
                <span>python backend/run.py</span>
                <span className="text-[10px] text-slate-500 font-normal">Port: 5000</span>
              </div>
            </div>

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
                <span>Auto-detecting port 5000 every 3s...</span>
              </div>
            </div>
          </div>
        ) : activeTab === 'procurement' ? (
          <div>
            {/* 1. Hero Decision Overview */}
            {optimalVessel && forecast ? (
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
              <div className="terminal-card p-6 mb-5 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
                <Activity className="w-4 h-4 animate-spin text-sky-400" />
                <span>Computing live optimal charter evaluation from Flask engine...</span>
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
                    origin={origin}
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
            <div className="terminal-card p-6 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
              <Cpu className="w-4 h-4 animate-spin text-amber-400" />
              <span>Fetching model evaluation audits from Flask API...</span>
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
      <footer className="border-t border-[#152338] bg-[#070c17] py-5 px-4 text-xs font-mono text-slate-400">
        <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-200 uppercase">
              SAIL Maritime Freight Intelligence Terminal
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Ministry of Steel • SIH 2026</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
            <span>Route Distances: Sea-Distances.org</span>
            <span>•</span>
            <span>Charter Benchmarks: Clarksons Research 2024</span>
            <span>•</span>
            <span>Port Drafts: Indian Major Ports Authority</span>
          </div>

          <div className="text-[11px] text-slate-500">
            Backend: Python 3.12 Flask REST API (Port 5000) • Live Market Feeds Active
          </div>
        </div>
      </footer>

    </div>
  );
};
