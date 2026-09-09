// frontend/src/components/simulator/WhatIfSimulator.tsx
import React, { useState } from 'react';
import { VesselEvaluation, MarketData } from '../../types';
import { evaluateAllVessels } from '../../lib/procurementEngine';
import { FlaskConical, ShieldAlert, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import { ProvenanceBadge } from '../provenance/ProvenanceBadge';

interface WhatIfSimulatorProps {
  baseCargoQty: number;
  origin: string;
  destination: string;
  baseBunkerPrice: number;
  marketData: MarketData;
  optimalVessel: VesselEvaluation;
  cargoType?: string;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  baseCargoQty,
  origin,
  destination,
  baseBunkerPrice,
  marketData,
  optimalVessel,
  cargoType = "Coking Coal"
}) => {
  const [bunkerShockPct, setBunkerShockPct] = useState<number>(0);
  const [freightShockPct, setFreightShockPct] = useState<number>(0);
  const [testCargoQty, setTestCargoQty] = useState<number>(baseCargoQty);

  // Compute simulated parameters
  const simBunker = Math.max(100, baseBunkerPrice * (1 + bunkerShockPct / 100));
  const simFreightMult = Math.max(0.5, 1 + freightShockPct / 100);

  // Run procurement evaluation for simulation scenario
  let simEvaluations: VesselEvaluation[] = [];
  try {
    simEvaluations = evaluateAllVessels(testCargoQty, origin, destination, simBunker, simFreightMult, cargoType);
  } catch {
    simEvaluations = [optimalVessel];
  }

  const simOptimal = simEvaluations[0] || optimalVessel;

  // Before vs After comparisons
  const baseRatePmt = optimalVessel.cost_per_mt;
  const simRatePmt = simOptimal.cost_per_mt;
  const deltaPmt = simRatePmt - baseRatePmt;
  const deltaLakhs = ((simOptimal.total_cost_usd - optimalVessel.total_cost_usd) * marketData.usd_inr_rate) / 100000;

  return (
    <div className="terminal-card p-4 mb-5 border-[#203656]">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-4 border-b border-[#182942]">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">
            What-If Scenario Stress-Test Simulator
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Dynamic Parametric Stress-Test</span>
          <ProvenanceBadge type="ESTIMATED" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Sliders (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-300">Bunker Price Shift:</span>
              <span className={`font-bold ${bunkerShockPct > 0 ? 'text-rose-400' : (bunkerShockPct < 0 ? 'text-emerald-400' : 'text-slate-200')}`}>
                {bunkerShockPct > 0 ? `+${bunkerShockPct}%` : `${bunkerShockPct}%`} (${simBunker.toFixed(0)}/MT)
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="50"
              step="5"
              value={bunkerShockPct}
              onChange={(e) => setBunkerShockPct(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>-30%</span>
              <span>Baseline</span>
              <span>+50%</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-300">Freight Market Shift:</span>
              <span className={`font-bold ${freightShockPct > 0 ? 'text-rose-400' : (freightShockPct < 0 ? 'text-emerald-400' : 'text-slate-200')}`}>
                {freightShockPct > 0 ? `+${freightShockPct}%` : `${freightShockPct}%`} ({simFreightMult.toFixed(2)}x)
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="40"
              step="5"
              value={freightShockPct}
              onChange={(e) => setFreightShockPct(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>-20%</span>
              <span>Baseline</span>
              <span>+40%</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-300">Test Cargo Quantity:</span>
              <span className="font-bold text-sky-400">{testCargoQty.toLocaleString()} MT</span>
            </div>
            <input
              type="range"
              min="25000"
              max="150000"
              step="5000"
              value={testCargoQty}
              onChange={(e) => setTestCargoQty(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>25K</span>
              <span>75K</span>
              <span>150K MT</span>
            </div>
          </div>

          <button
            onClick={() => {
              setBunkerShockPct(0);
              setFreightShockPct(0);
              setTestCargoQty(baseCargoQty);
            }}
            className="text-xs text-slate-400 hover:text-slate-200 underline font-mono cursor-pointer"
          >
            Reset to Baseline Scenario
          </button>
        </div>

        {/* Before vs After Visual Comparison (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div className="grid grid-cols-3 gap-3 text-xs font-mono mb-3">
            
            {/* Current Baseline Box */}
            <div className="p-3 rounded bg-[#070c17] border border-[#16253c]">
              <span className="text-slate-500 block text-[10px] uppercase font-sans">Baseline Scenario</span>
              <div className="text-base font-bold text-slate-200 mt-1">${baseRatePmt.toFixed(2)}/MT</div>
              <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                Vessel: <strong className="text-slate-200">{optimalVessel.vessel}</strong>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Score: {optimalVessel.ai_score}/100
              </div>
            </div>

            {/* Simulated Outcome Box */}
            <div className="p-3 rounded bg-[#0b1322] border border-[#233a5c]">
              <span className="text-sky-400 block text-[10px] uppercase font-sans font-bold">What-If Outcome</span>
              <div className="text-base font-bold text-sky-300 mt-1">${simRatePmt.toFixed(2)}/MT</div>
              <div className="text-[11px] text-slate-300 font-sans mt-0.5">
                Vessel: <strong className="text-sky-400">{simOptimal.vessel}</strong>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Score: {simOptimal.ai_score}/100
              </div>
            </div>

            {/* Delta Box */}
            <div className={`p-3 rounded border ${
              deltaPmt > 0 
                ? 'bg-rose-950/20 border-rose-600/40 text-rose-300' 
                : (deltaPmt < 0 ? 'bg-emerald-950/20 border-emerald-600/40 text-emerald-300' : 'bg-[#070c17] border-[#16253c] text-slate-300')
            }`}>
              <span className="block text-[10px] uppercase font-sans font-bold">Variance (Delta)</span>
              <div className="text-base font-bold mt-1 flex items-center gap-1">
                {deltaPmt > 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-rose-400" />
                    +${deltaPmt.toFixed(2)}
                  </>
                ) : deltaPmt < 0 ? (
                  <>
                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                    -${Math.abs(deltaPmt).toFixed(2)}
                  </>
                ) : (
                  <span>$0.00</span>
                )}
              </div>
              <div className="text-[11px] font-sans mt-0.5">
                {deltaLakhs >= 0 ? `+₹${deltaLakhs.toFixed(1)} L` : `-₹${Math.abs(deltaLakhs).toFixed(1)} L`}
              </div>
              <div className="text-[10px] opacity-80 mt-1">
                {deltaPmt !== 0 ? `${((deltaPmt / baseRatePmt) * 100).toFixed(1)}% shift` : 'No change'}
              </div>
            </div>

          </div>

          {/* Decision Simulation Outcome Commentary */}
          <div className="p-3 rounded bg-[#09111e] border border-[#16273e] text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-200 mb-1">
              {simOptimal.is_feasible ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              )}
              <span>
                Stress-Test Verdict: {simOptimal.vessel} {simOptimal.is_feasible ? 'retains optimal clearance' : 'becomes draft-constrained'}
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Under a {bunkerShockPct >= 0 ? `+${bunkerShockPct}%` : `${bunkerShockPct}%`} bunker shift and {freightShockPct >= 0 ? `+${freightShockPct}%` : `${freightShockPct}%`} market index adjustment for {testCargoQty.toLocaleString()} MT, total voyage cost shifts to ${simOptimal.total_cost_usd.toLocaleString()}. {simOptimal.vessel !== optimalVessel.vessel ? `Notice: Optimal vessel class shifted from ${optimalVessel.vessel} to ${simOptimal.vessel} due to tonnage utilization efficiency.` : `Class selection remains robust.`}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
