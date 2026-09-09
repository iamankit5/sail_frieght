// frontend/src/components/procurement/ExecutiveHero.tsx
import React from 'react';
import { VesselEvaluation, FreightForecast, MarketData } from '../../types';
import { ProvenanceBadge } from '../provenance/ProvenanceBadge';
import { AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Ship, ShieldCheck } from 'lucide-react';

interface ExecutiveHeroProps {
  optimalVessel: VesselEvaluation;
  alternativeVessel?: VesselEvaluation;
  cargoQty: number;
  cargoType: string;
  origin: string;
  destination: string;
  forecast: FreightForecast;
  marketData: MarketData;
}

export const ExecutiveHero: React.FC<ExecutiveHeroProps> = ({
  optimalVessel,
  alternativeVessel,
  cargoQty,
  cargoType,
  origin,
  destination,
  forecast,
  marketData,
}) => {
  // Avoided cost calculation vs next best alternative
  const savingsPerMt = alternativeVessel ? Math.max(0, alternativeVessel.cost_per_mt - optimalVessel.cost_per_mt) : 0;
  const totalSavingsUsd = savingsPerMt * cargoQty;
  const totalSavingsInrLakhs = (totalSavingsUsd * marketData.usd_inr_rate) / 100000;

  // 30-day forecast delta
  const pctChange = forecast.pct_change_30d;
  const isCharterNow = pctChange > 1.0;
  const forecastSavingsUsd = ((forecast.forecast_30d_pmt - forecast.spot_rate_pmt) * cargoQty);
  const forecastSavingsInrLakhs = Math.abs((forecastSavingsUsd * marketData.usd_inr_rate) / 100000);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">
      
      {/* Primary Optimal Strategy Card (7 cols) */}
      <div className="lg:col-span-7 rounded-lg bg-gradient-to-br from-[#0c1628] via-[#09101d] to-[#060a12] border border-[#1e3452] p-5 shadow-xl relative overflow-hidden">
        {/* Subtle decorative grid overlay */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-[#182942]">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-sky-950 border border-sky-600/40 text-sky-400">
              <Ship className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono font-bold tracking-wider text-sky-400 uppercase">
              Operational Procurement Recommendation
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ProvenanceBadge type="ESTIMATED" />
            <span className="px-2 py-0.5 rounded bg-sky-950/70 border border-sky-600/40 text-sky-300 text-xs font-mono font-bold">
              OPTIMAL SCORE: {optimalVessel.ai_score}/100
            </span>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mb-2 tracking-tight">
          Charter <span className="text-sky-400">{optimalVessel.vessel}</span> for {cargoQty.toLocaleString()} MT {cargoType}
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
          Routing from <span className="text-slate-100 font-semibold">{origin}</span> to{' '}
          <span className="text-slate-100 font-semibold">{destination}</span>. Achieves{' '}
          <span className="text-emerald-400 font-semibold">{optimalVessel.utilization_pct}% capacity fit</span>{' '}
          at landed cost of{' '}
          <span className="text-sky-300 font-mono font-bold">${optimalVessel.cost_per_mt.toFixed(2)}/MT</span>. 
          {alternativeVessel && savingsPerMt > 0 && (
            <> Avoids estimated <span className="text-emerald-300 font-mono font-bold">₹{totalSavingsInrLakhs.toFixed(1)} Lakhs</span> vs {alternativeVessel.vessel} class.</>
          )}
        </p>

        {/* Operational Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#152338] text-xs font-mono">
          <div className="p-2.5 rounded bg-[#070d17] border border-[#16253c]">
            <span className="text-slate-500 block text-[11px]">Landed Cost / MT</span>
            <span className="text-base font-bold text-slate-100">${optimalVessel.cost_per_mt.toFixed(2)}</span>
            <span className="text-[10px] text-slate-400 block font-sans mt-0.5">₹{(optimalVessel.cost_per_mt * marketData.usd_inr_rate).toFixed(0)}/MT</span>
          </div>

          <div className="p-2.5 rounded bg-[#070d17] border border-[#16253c]">
            <span className="text-slate-500 block text-[11px]">Total Voyage Exp.</span>
            <span className="text-base font-bold text-slate-100">${optimalVessel.total_cost_usd.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400 block font-sans mt-0.5">₹{((optimalVessel.total_cost_usd * marketData.usd_inr_rate) / 100000).toFixed(1)} Lakhs</span>
          </div>

          <div className="p-2.5 rounded bg-[#070d17] border border-[#16253c]">
            <span className="text-slate-500 block text-[11px]">Transit Duration</span>
            <span className="text-base font-bold text-slate-100">{optimalVessel.voyage_days} Days</span>
            <span className="text-[10px] text-slate-400 block font-sans mt-0.5">{optimalVessel.fuel_burned_mt} MT Fuel</span>
          </div>

          <div className="p-2.5 rounded bg-[#070d17] border border-[#16253c]">
            <span className="text-slate-500 block text-[11px]">Fleet Availability</span>
            <span className="text-base font-bold text-slate-100">{optimalVessel.availability}</span>
            <span className="text-[10px] text-emerald-400 block font-sans mt-0.5 font-semibold">Physical: Cleared</span>
          </div>
        </div>

      </div>

      {/* Decision Signal & Market Timing Alert (5 cols) */}
      <div className={`lg:col-span-5 rounded-lg border p-5 shadow-xl flex flex-col justify-between ${
        isCharterNow 
          ? 'bg-gradient-to-br from-[#1c0e12] to-[#0c0709] border-rose-900/60' 
          : 'bg-gradient-to-br from-[#0c1815] to-[#060e0c] border-emerald-900/60'
      }`}>
        <div>
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              {isCharterNow ? (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              <span className={`text-xs font-mono font-bold tracking-wider uppercase ${isCharterNow ? 'text-rose-400' : 'text-emerald-400'}`}>
                Market Timing Signal
              </span>
            </div>

            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
              isCharterNow 
                ? 'bg-rose-950/80 border-rose-600/50 text-rose-300' 
                : 'bg-emerald-950/80 border-emerald-600/50 text-emerald-300'
            }`}>
              {isCharterNow ? 'ACTION: CHARTER NOW' : 'ACTION: HOLD / WAIT'}
            </span>
          </div>

          <h2 className="text-lg font-bold text-slate-100 mb-1.5 flex items-center gap-2">
            {isCharterNow ? (
              <>
                <TrendingUp className="w-5 h-5 text-rose-400" />
                Rates Expected to Rise ({pctChange > 0 ? `+${pctChange}%` : `${pctChange}%`})
              </>
            ) : (
              <>
                <TrendingDown className="w-5 h-5 text-emerald-400" />
                Rates Softening or Stable ({pctChange}% over 30d)
              </>
            )}
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            {isCharterNow ? (
              <>Multi-horizon Dry Bulk Index forecast indicates upward rate pressure. Securing vessel tonnage in the current tender window protects against projected 30-day escalation.</>
            ) : (
              <>Freight rate projections indicate softening or stable market conditions. Holding tender release provides opportunity to capture lower spot fixtures.</>
            )}
          </p>

          <div className="space-y-1.5 text-xs font-mono bg-black/30 p-2.5 rounded border border-white/5">
            <div className="flex justify-between">
              <span className="text-slate-400">Current Spot Rate:</span>
              <span className="text-slate-200 font-bold">${forecast.spot_rate_pmt.toFixed(2)}/MT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Projected 30-Day Rate:</span>
              <span className="text-slate-200 font-bold">${forecast.forecast_30d_pmt.toFixed(2)}/MT</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-white/10">
              <span className="text-slate-400">Projected Value Impact:</span>
              <span className={`font-bold ${isCharterNow ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isCharterNow ? 'Protects ₹' : 'Potential Saving: ₹'}{forecastSavingsInrLakhs.toFixed(1)} Lakhs
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            Statistical Confidence: 95% Band
          </span>
          <span className="font-mono text-slate-500">
            Signal: Trend Delta
          </span>
        </div>

      </div>

    </div>
  );
};
