// frontend/src/components/procurement/ExecutiveHero.tsx
import React from 'react';
import { VesselEvaluation, FreightForecast, MarketData } from '../../types';
import { ProvenanceBadge } from '../provenance/ProvenanceBadge';
import { ScoreMeter } from '../ui/Primitives';
import { useCountUp } from '../../hooks/useCountUp';
import {
  AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Ship, ShieldCheck, Ban, Scale,
  DollarSign, Wallet, Timer, Boxes,
} from 'lucide-react';

interface ExecutiveHeroProps {
  optimalVessel?: VesselEvaluation;
  alternativeVessel?: VesselEvaluation;
  cargoQty: number;
  cargoType: string;
  origin: string;
  destination: string;
  forecast: FreightForecast;
  marketData: MarketData;
}

const MetricTile: React.FC<{
  icon: React.ReactNode;
  label: string;
  main: string;
  sub: string;
  subClass?: string;
}> = ({ icon, label, main, sub, subClass = 'text-slate-400' }) => (
  <div className="inset-well p-3 group hover:border-[rgba(56,189,248,0.35)] transition-colors">
    <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase tracking-wider mb-1.5">
      <span className="text-sky-400/80 group-hover:text-sky-300 transition-colors">{icon}</span>
      {label}
    </div>
    <div className="text-xl font-bold text-slate-50 num leading-none">{main}</div>
    <div className={`text-[10px] font-sans mt-1.5 ${subClass}`}>{sub}</div>
  </div>
);

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
  const isCharterNow = forecast.recommended_action === 'CHARTER NOW';
  const pctChange = forecast.pct_change_30d;
  const forecastSavingsUsd = (forecast.forecast_30d_pmt - forecast.spot_rate_pmt) * cargoQty;
  const forecastSavingsInrLakhs = Math.abs((forecastSavingsUsd * marketData.usd_inr_rate) / 100000);

  /* ---------- Physically infeasible scenario (hook-free branch) ---------- */
  if (!optimalVessel) {
    return (
      <div className="grid grid-cols-1 gap-4 mb-5 reveal">
        <div
          className="rounded-xl border p-6 shadow-xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(80,10,25,0.5), rgba(20,6,12,0.9))',
            borderColor: 'rgba(251,113,133,0.35)',
            boxShadow: '0 0 40px -12px rgba(251,113,133,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-rose-500/10 border border-rose-400/40 text-rose-300">
                <Ban className="w-5 h-5" />
              </span>
              <span className="text-sm font-mono font-bold tracking-wider text-rose-300 uppercase">
                No Physically Feasible Charter
              </span>
            </div>
            <ProvenanceBadge type="ESTIMATED" />
          </div>

          <h1 className="text-2xl font-bold text-slate-50 mb-2.5 tracking-tight">
            Every vessel class is draft-blocked at <span className="text-rose-300 text-glow-rose">{destination}</span>
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
            The discharge port's channel/berth draft limit is shallower than every vessel class in the
            configured fleet. This cargo ({cargoQty.toLocaleString()} MT {cargoType} from {origin}) cannot
            be chartered as a single direct parcel to this port.
          </p>

          <div className="flex flex-wrap gap-2.5 mt-4">
            {['Switch to a deepwater port (Dhamra, Paradip, Vizag)', 'Reduce parcel size to a smaller class', 'Plan transshipment'].map((opt) => (
              <span key={opt} className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-400/25 text-rose-200 text-xs font-medium">
                {opt}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-5 shadow-xl border border-emerald-500/25" style={{ background: 'linear-gradient(135deg, rgba(6,40,32,0.5), rgba(5,15,13,0.9))' }}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-emerald-300">
              Market Timing Signal — independent of vessel selection
            </span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">
            30-day freight projection:{' '}
            <span className="font-mono font-bold text-slate-50 num">{pctChange > 0 ? `+${pctChange}%` : `${pctChange}%`}</span>.
            {isCharterNow
              ? ' Rates are projected to rise — factor timing into the revised discharge plan.'
              : ' No clear timing edge — re-plan the discharge port on commercial merit alone.'}{' '}
            Projected value swing on this parcel:{' '}
            <span className="font-mono font-bold text-emerald-300">₹{forecastSavingsInrLakhs.toFixed(1)} Lakhs</span>.
          </p>
        </div>
      </div>
    );
  }

  /* ---------- Normal recommendation (isolated so hooks stay ordered) ---------- */
  return (
    <RecommendationCard
      optimalVessel={optimalVessel}
      alternativeVessel={alternativeVessel}
      cargoQty={cargoQty}
      cargoType={cargoType}
      origin={origin}
      destination={destination}
      forecast={forecast}
      marketData={marketData}
      isCharterNow={isCharterNow}
      isNeutral={forecast.recommended_action === 'NEUTRAL'}
      signalThresholdPct={forecast.signal_threshold_pct}
      pctChange={pctChange}
      forecastSavingsInrLakhs={forecastSavingsInrLakhs}
    />
  );
};

const RecommendationCard: React.FC<{
  optimalVessel: VesselEvaluation;
  alternativeVessel?: VesselEvaluation;
  cargoQty: number;
  cargoType: string;
  origin: string;
  destination: string;
  forecast: FreightForecast;
  marketData: MarketData;
  isCharterNow: boolean;
  isNeutral: boolean;
  signalThresholdPct?: number;
  pctChange: number;
  forecastSavingsInrLakhs: number;
}> = ({
  optimalVessel,
  alternativeVessel,
  cargoQty,
  cargoType,
  origin,
  destination,
  forecast,
  marketData,
  isCharterNow,
  isNeutral,
  signalThresholdPct,
  pctChange,
  forecastSavingsInrLakhs,
}) => {
  const savingsPerMt = alternativeVessel ? Math.max(0, alternativeVessel.cost_per_mt - optimalVessel.cost_per_mt) : 0;
  const totalSavingsUsd = savingsPerMt * cargoQty;
  const totalSavingsInrLakhs = (totalSavingsUsd * marketData.usd_inr_rate) / 100000;

  // Animated figures
  const costPerMt = useCountUp(optimalVessel.cost_per_mt, 700, 2);
  const totalCostLakhs = useCountUp((optimalVessel.total_cost_usd * marketData.usd_inr_rate) / 100000, 800, 1);
  const voyageDays = useCountUp(optimalVessel.voyage_days, 700, 1);
  const score = useCountUp(optimalVessel.decision_score, 900, 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">

      {/* Primary recommendation (7 cols) */}
      <div
        className="lg:col-span-7 rounded-xl p-5 shadow-xl relative overflow-hidden reveal"
        style={{
          background: 'linear-gradient(140deg, rgba(11,25,45,0.95), rgba(8,14,26,0.98) 55%, rgba(6,10,20,1))',
          border: '1px solid rgba(56,116,187,0.3)',
          boxShadow: '0 20px 50px -18px rgba(2,8,20,0.95), 0 0 44px -14px rgba(56,189,248,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.12), transparent 65%)' }} />

        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3.5 border-b border-[rgba(56,116,187,0.2)] relative">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-sky-500/10 border border-sky-400/40 text-sky-300 shadow-[0_0_16px_-4px_rgba(56,189,248,0.6)]">
              <Ship className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-bold tracking-wider text-sky-300 uppercase">
              Operational Recommendation
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ProvenanceBadge type="ESTIMATED" />
            <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-400/35 text-sky-200 text-xs font-mono font-bold num">
              SCORE {score}/100
            </span>
          </div>
        </div>

        <h1 className="text-[22px] sm:text-2xl font-bold text-slate-50 mb-1.5 tracking-tight">
          Charter <span className="text-sky-300 text-glow-sky">{optimalVessel.vessel}</span>
          {' '}for {cargoQty.toLocaleString()} MT {cargoType}
        </h1>

        <p className="text-[13px] text-slate-400 mb-4 leading-relaxed">
          <span className="text-slate-200 font-semibold">{origin}</span>
          <span className="mx-1.5 text-slate-600">→</span>
          <span className="text-slate-200 font-semibold">{destination}</span>
          {' · '}
          <span className="text-emerald-300 font-semibold">{optimalVessel.utilization_pct}% capacity fit</span>
          {alternativeVessel && savingsPerMt > 0 && (
            <>{' · '}Avoids <span className="text-emerald-300 font-mono font-bold">₹{totalSavingsInrLakhs.toFixed(1)} L</span> vs {alternativeVessel.vessel}</>
          )}
        </p>

        {/* Score meter */}
        <div className="mb-4">
          <ScoreMeter score={optimalVessel.decision_score} />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <MetricTile
            icon={<DollarSign className="w-3.5 h-3.5" />}
            label="Landed Cost"
            main={`$${costPerMt}`}
            sub={`₹${(Number(costPerMt) * marketData.usd_inr_rate).toFixed(0)}/MT`}
            subClass="text-slate-400"
          />
          <MetricTile
            icon={<Wallet className="w-3.5 h-3.5" />}
            label="Voyage Outlay"
            main={`₹${totalCostLakhs} L`}
            sub={`$${optimalVessel.total_cost_usd.toLocaleString()}`}
          />
          <MetricTile
            icon={<Timer className="w-3.5 h-3.5" />}
            label="Transit"
            main={`${voyageDays} d`}
            sub={`${optimalVessel.fuel_burned_mt} MT fuel`}
          />
          <MetricTile
            icon={<Boxes className="w-3.5 h-3.5" />}
            label="Availability"
            main={optimalVessel.availability.replace(' vessels', '') + ' units'}
            sub={optimalVessel.is_feasible ? 'Physical: Cleared' : 'Physical: Draft Blocked'}
            subClass={optimalVessel.is_feasible ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}
          />
        </div>
      </div>

      {/* Market timing signal (5 cols) */}
      <div
        className={`lg:col-span-5 rounded-xl p-5 shadow-xl flex flex-col justify-between reveal reveal-d2 ${
          isCharterNow ? 'border-rose-500/35' : (isNeutral ? 'border-amber-500/30' : 'border-emerald-500/30')
        }`}
        style={{
          background: isCharterNow
            ? 'linear-gradient(150deg, rgba(60,12,24,0.65), rgba(14,6,10,0.95) 60%)'
            : isNeutral
              ? 'linear-gradient(150deg, rgba(56,40,8,0.5), rgba(16,12,6,0.95) 60%)'
              : 'linear-gradient(150deg, rgba(6,44,36,0.6), rgba(5,16,14,0.95) 60%)',
          boxShadow: isCharterNow
            ? '0 20px 50px -18px rgba(2,8,20,0.95), 0 0 40px -14px rgba(251,113,133,0.35), inset 0 1px 0 rgba(255,255,255,0.05)'
            : isNeutral
              ? '0 20px 50px -18px rgba(2,8,20,0.95), 0 0 40px -14px rgba(251,191,36,0.25), inset 0 1px 0 rgba(255,255,255,0.05)'
              : '0 20px 50px -18px rgba(2,8,20,0.95), 0 0 40px -14px rgba(52,211,153,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <div>
          <div className="flex items-center justify-between mb-3.5 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              {isCharterNow ? (
                <AlertTriangle className="w-4 h-4 text-rose-300" />
              ) : isNeutral ? (
                <Scale className="w-4 h-4 text-amber-300" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              )}
              <span className={`text-xs font-mono font-bold tracking-wider uppercase ${isCharterNow ? 'text-rose-300' : (isNeutral ? 'text-amber-300' : 'text-emerald-300')}`}>
                Market Timing Signal
              </span>
            </div>
            <span
              className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border ${
                isCharterNow
                  ? 'bg-rose-500/15 border-rose-400/45 text-rose-200'
                  : isNeutral
                    ? 'bg-amber-500/15 border-amber-400/45 text-amber-200'
                    : 'bg-emerald-500/15 border-emerald-400/45 text-emerald-200'
              }`}
            >
              {isCharterNow ? 'CHARTER NOW' : (isNeutral ? 'NO CLEAR SIGNAL' : 'HOLD / WAIT')}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            {isCharterNow ? (
              <TrendingUp className="w-6 h-6 text-rose-300 self-center" />
            ) : isNeutral ? (
              <Scale className="w-6 h-6 text-amber-300 self-center" />
            ) : (
              <TrendingDown className="w-6 h-6 text-emerald-300 self-center" />
            )}
            <span className={`text-3xl font-bold num ${isCharterNow ? 'text-rose-200 text-glow-rose' : (isNeutral ? 'text-amber-200' : 'text-emerald-200 text-glow-emerald')}`}>
              {pctChange > 0 ? `+${pctChange}%` : `${pctChange}%`}
            </span>
            <span className="text-xs text-slate-400 font-mono">30-day</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            {isCharterNow
              ? 'Upward rate pressure projected beyond the measured error bar — securing tonnage in the current tender window protects against 30-day escalation.'
              : isNeutral
                ? 'Projected 30-day move is inside the measured error bar (±' + (signalThresholdPct?.toFixed(2) ?? '—') + '% typical 30-day error). No statistically defensible timing edge — treat release timing as a scenario choice.'
                : 'Softening conditions projected beyond the measured error bar — holding tender release can capture lower spot fixtures.'}
          </p>

          <div className="space-y-1.5 text-xs font-mono inset-well p-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Spot rate</span>
              <span className="text-slate-100 font-bold num">${forecast.spot_rate_pmt.toFixed(2)}/MT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">30-day projected</span>
              <span className="text-slate-100 font-bold num">${forecast.forecast_30d_pmt.toFixed(2)}/MT</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-white/10">
              <span className="text-slate-500">Value impact</span>
              <span className={`font-bold num ${isCharterNow ? 'text-rose-300' : (isNeutral ? 'text-slate-400' : 'text-emerald-300')}`}>
                {isNeutral ? 'Within error bar ' : isCharterNow ? 'Protects ' : 'Saves '}₹{forecastSavingsInrLakhs.toFixed(1)} L
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Empirical error band (measured)
          </span>
          <span className="font-mono">Signal: trend delta</span>
        </div>
      </div>

    </div>
  );
};
