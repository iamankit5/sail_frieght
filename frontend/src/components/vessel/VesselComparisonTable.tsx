// frontend/src/components/vessel/VesselComparisonTable.tsx
import React from 'react';
import { VesselEvaluation, MarketData } from '../../types';
import { Ship, AlertOctagon, CheckCircle2, ShieldAlert, Award } from 'lucide-react';
import { ProvenanceBadge } from '../provenance/ProvenanceBadge';
import { CardHeader } from '../ui/Primitives';

interface VesselComparisonTableProps {
  evaluations: VesselEvaluation[];
  destination: string;
  marketData: MarketData;
}

const scorePillClass = (score: number, infeasible: boolean): string => {
  if (infeasible) return 'bg-rose-500/12 text-rose-300 border border-rose-400/40';
  if (score >= 70) return 'bg-sky-500/15 text-sky-200 border border-sky-400/45';
  if (score >= 40) return 'bg-amber-500/10 text-amber-200 border border-amber-400/35';
  return 'bg-[#122036] text-slate-300 border border-[rgba(56,116,187,0.3)]';
};

export const VesselComparisonTable: React.FC<VesselComparisonTableProps> = ({
  evaluations,
  destination,
  marketData,
}) => {
  return (
    <div className="terminal-card p-4 mb-5 reveal reveal-d3">
      <CardHeader
        icon={<Ship className="w-4 h-4" />}
        title="Fleet Suitability & Landed Cost Breakdown"
        subtitle={`Physical feasibility always outranks raw spot rate`}
        right={
          <>
            <span className="text-xs text-slate-400 font-mono">
              {destination} berth limit: <strong className="text-slate-100 num">{evaluations[0]?.port_draft_limit_m}m</strong>
            </span>
            <ProvenanceBadge type="BENCHMARK" />
          </>
        }
      />

      <div className="overflow-x-auto rounded-lg border border-[rgba(56,116,187,0.12)]">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="text-slate-400 bg-[#081020]/95 uppercase text-[10.5px] tracking-wider border-b border-[rgba(56,116,187,0.2)]">
              <th className="py-2.5 px-3">Rank / Status</th>
              <th className="py-2.5 px-3">Vessel Class</th>
              <th className="py-2.5 px-3">Physical Feasibility</th>
              <th className="py-2.5 px-3 text-center">Draft vs Port</th>
              <th className="py-2.5 px-3 text-right">Capacity Fit</th>
              <th className="py-2.5 px-3 text-right">Charter $/MT</th>
              <th className="py-2.5 px-3 text-right">Bunker $/MT</th>
              <th className="py-2.5 px-3 text-right">Port & Canal</th>
              <th className="py-2.5 px-3 text-right">Total Landed</th>
              <th className="py-2.5 px-3 text-right">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(56,116,187,0.1)]">
            {evaluations.map((v, idx) => {
              const isRank1 = idx === 0 && v.is_feasible;
              const isInfeasible = !v.is_feasible;

              return (
                <tr
                  key={v.vessel}
                  className={`relative transition-colors ${
                    isInfeasible
                      ? 'bg-rose-950/10 text-slate-400'
                      : isRank1
                        ? 'bg-sky-500/[0.07] text-slate-100'
                        : 'hover:bg-[#0d1729]'
                  }`}
                >
                  {/* Rank */}
                  <td
                    className="py-3 px-3 whitespace-nowrap"
                    style={
                      isRank1
                        ? { boxShadow: 'inset 3px 0 0 0 #38bdf8' }
                        : isInfeasible
                          ? { boxShadow: 'inset 3px 0 0 0 rgba(251,113,133,0.7)' }
                          : undefined
                    }
                  >
                    {isInfeasible ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-rose-500/12 border border-rose-400/40 text-rose-300 tracking-wider">
                        <AlertOctagon className="w-3 h-3" /> BLOCKED
                      </span>
                    ) : isRank1 ? (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md text-white tracking-wider"
                        style={{
                          background: 'linear-gradient(135deg, #0369a1, #0284c7)',
                          boxShadow: '0 0 14px -3px rgba(56,189,248,0.6)',
                        }}
                      >
                        <Award className="w-3 h-3" /> #1 OPTIMAL
                      </span>
                    ) : (
                      <span className="text-slate-500 font-bold">#{idx + 1}</span>
                    )}
                  </td>

                  {/* Vessel class */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className={`font-bold flex items-center gap-1.5 ${isInfeasible ? 'text-slate-300' : 'text-slate-50'}`}>
                      <span>{v.vessel}</span>
                      <span className="text-[10px] text-slate-500 font-normal">({v.capacity})</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-sans">
                      {v.availability} · {v.risk} risk
                    </div>
                  </td>

                  {/* Feasibility */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {isInfeasible ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-rose-500/10 border border-rose-400/35 text-rose-300">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                        <span>Draft exceeds limit</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-emerald-500/10 border border-emerald-400/35 text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Cleared for berth</span>
                      </span>
                    )}
                  </td>

                  {/* Draft bar */}
                  <td className="py-3 px-3 whitespace-nowrap text-center">
                    <div className={`font-bold num ${isInfeasible ? 'text-rose-300' : 'text-slate-300'}`}>
                      {v.draft_m.toFixed(1)}m <span className="text-slate-600">/</span> {v.port_draft_limit_m.toFixed(1)}m
                    </div>
                    <div className="w-20 mx-auto h-1.5 bg-[#101c30] rounded-full overflow-hidden mt-1 border border-[rgba(56,116,187,0.15)]">
                      <div
                        className={`h-full rounded-full ${isInfeasible ? 'bg-rose-400' : 'bg-emerald-400'}`}
                        style={{
                          width: `${Math.min(100, (v.draft_m / v.port_draft_limit_m) * 100)}%`,
                          boxShadow: isInfeasible ? '0 0 8px rgba(251,113,133,0.6)' : '0 0 8px rgba(52,211,153,0.5)',
                        }}
                      />
                    </div>
                  </td>

                  {/* Capacity fit */}
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <span className={`num ${v.utilization_pct < 50 || v.utilization_pct > 100 ? 'text-amber-300' : 'text-slate-200'}`}>
                      {v.utilization_pct}%
                    </span>
                  </td>

                  {/* Cost columns */}
                  <td className="py-3 px-3 text-right text-slate-300 whitespace-nowrap num">${v.freight_pmt.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right text-slate-300 whitespace-nowrap num">${v.fuel_pmt.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right text-slate-400 whitespace-nowrap num">${(v.port_pmt + v.demurrage_pmt).toFixed(2)}</td>

                  {/* Total landed */}
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <div className={`font-bold text-sm num ${isRank1 ? 'text-sky-200' : 'text-slate-100'}`}>
                      ${v.cost_per_mt.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500 num">
                      ₹{(v.cost_per_mt * marketData.usd_inr_rate).toFixed(0)}/MT
                    </div>
                  </td>

                  {/* Score */}
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md num ${scorePillClass(v.decision_score, isInfeasible)}`}>
                      {v.decision_score}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 pt-3 border-t border-[rgba(56,116,187,0.12)] text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="status-led status-led-emerald" style={{ width: 6, height: 6 }} />
          <span>Physical safety criteria take precedence over raw spot rate.</span>
        </div>
        <div className="font-mono">
          Port charge & demurrage buffers are operator-configurable planning assumptions
        </div>
      </div>
    </div>
  );
};
