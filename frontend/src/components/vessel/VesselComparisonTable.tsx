// frontend/src/components/vessel/VesselComparisonTable.tsx
import React from 'react';
import { VesselEvaluation, MarketData } from '../../types';
import { Ship, AlertOctagon, CheckCircle2, ShieldAlert, Award } from 'lucide-react';
import { ProvenanceBadge } from '../provenance/ProvenanceBadge';

interface VesselComparisonTableProps {
  evaluations: VesselEvaluation[];
  destination: string;
  marketData: MarketData;
}

export const VesselComparisonTable: React.FC<VesselComparisonTableProps> = ({
  evaluations,
  destination,
  marketData,
}) => {
  return (
    <div className="terminal-card p-4 mb-5">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[#182942]">
        <div className="flex items-center gap-2">
          <Ship className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold tracking-wide uppercase text-slate-200">
            Vessel Fleet Suitability & Landed Cost Breakdown
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">
            {destination} Berth Limit: <strong className="text-slate-200">{evaluations[0]?.port_draft_limit_m}m</strong>
          </span>
          <ProvenanceBadge type="BENCHMARK" />
        </div>
      </div>

      {/* Desktop / Tablet Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-[#17253b] text-slate-400 bg-[#070c17]/60 uppercase text-[11px] tracking-wider">
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
          <tbody className="divide-y divide-[#132034]">
            {evaluations.map((v, idx) => {
              const isRank1 = idx === 0 && v.is_feasible;
              const isInfeasible = !v.is_feasible;

              return (
                <tr
                  key={v.vessel}
                  className={`transition-colors ${
                    isInfeasible 
                      ? 'bg-rose-950/15 text-slate-300' 
                      : (isRank1 ? 'bg-sky-950/25 text-slate-100 font-medium' : 'hover:bg-[#0e1728]')
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {isInfeasible ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950 border border-rose-600/50 text-rose-400">
                        <AlertOctagon className="w-3 h-3" /> BLOCKED
                      </span>
                    ) : isRank1 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-sky-600 text-white shadow-sm">
                        <Award className="w-3 h-3" /> #1 OPTIMAL
                      </span>
                    ) : (
                      <span className="text-slate-400 font-bold">#{idx + 1}</span>
                    )}
                  </td>

                  {/* Vessel Class */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-bold text-slate-100 flex items-center gap-1.5">
                      <span>{v.vessel}</span>
                      <span className="text-[10px] text-slate-500 font-normal">({v.capacity})</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans">
                      {v.availability} ({v.risk})
                    </div>
                  </td>

                  {/* Feasibility Status */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {isInfeasible ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950/80 border border-rose-500/60 text-rose-300">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>INFEASIBLE: Draft Exceeds Limit</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Cleared for Berth</span>
                      </span>
                    )}
                  </td>

                  {/* Draft vs Port comparison */}
                  <td className="py-3 px-3 whitespace-nowrap text-center">
                    <div className={`font-bold ${isInfeasible ? 'text-rose-400 font-mono' : 'text-slate-300'}`}>
                      {v.draft_m.toFixed(1)}m <span className="text-slate-500">/</span> {v.port_draft_limit_m.toFixed(1)}m
                    </div>
                    {/* Visual Draft Bar */}
                    <div className="w-20 mx-auto h-1.5 bg-[#172338] rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full ${isInfeasible ? 'bg-rose-500' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.min(100, (v.draft_m / v.port_draft_limit_m) * 100)}%` }}
                      ></div>
                    </div>
                  </td>

                  {/* Capacity Fit */}
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <span className={v.utilization_pct < 50 || v.utilization_pct > 100 ? 'text-amber-400' : 'text-slate-200'}>
                      {v.utilization_pct}%
                    </span>
                  </td>

                  {/* Charter $/MT */}
                  <td className="py-3 px-3 text-right text-slate-300 whitespace-nowrap">
                    ${v.freight_pmt.toFixed(2)}
                  </td>

                  {/* Bunker $/MT */}
                  <td className="py-3 px-3 text-right text-slate-300 whitespace-nowrap">
                    ${v.fuel_pmt.toFixed(2)}
                  </td>

                  {/* Port & Canal Charges */}
                  <td className="py-3 px-3 text-right text-slate-400 whitespace-nowrap">
                    ${(v.port_pmt + v.demurrage_pmt).toFixed(2)}
                  </td>

                  {/* Total Landed Cost $/MT */}
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <div className="text-slate-100 font-bold text-sm">
                      ${v.cost_per_mt.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      ₹{(v.cost_per_mt * marketData.usd_inr_rate).toFixed(0)}/MT
                    </div>
                  </td>

                  {/* AI Score */}
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      isInfeasible 
                        ? 'bg-rose-950 text-rose-400 border border-rose-800/60' 
                        : (isRank1 ? 'bg-sky-600 text-white' : 'bg-[#15233a] text-slate-300')
                    }`}>
                      {v.ai_score}
                    </span>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Decision Footer Note */}
      <div className="mt-3 pt-3 border-t border-[#17253b] text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Physical safety criteria takes precedence over raw spot rate.</span>
        </div>
        <div className="text-slate-500 font-mono text-[11px]">
          Demurrage & Port Charges calibrated to Indian Port Trust Berth Regulations
        </div>
      </div>

    </div>
  );
};
