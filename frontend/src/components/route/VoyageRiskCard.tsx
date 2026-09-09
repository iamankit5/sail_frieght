// frontend/src/components/route/VoyageRiskCard.tsx
import React from 'react';
import { RouteRiskProfile } from '../../types';
import { AlertCircle, Clock, Wind, Activity, CheckCircle2 } from 'lucide-react';
import { ProvenanceBadge } from '../provenance/ProvenanceBadge';

interface VoyageRiskCardProps {
  riskProfile: RouteRiskProfile;
  origin: string;
  destination: string;
}

export const VoyageRiskCard: React.FC<VoyageRiskCardProps> = ({
  riskProfile,
  origin,
  destination
}) => {
  return (
    <div className="terminal-card p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#182942]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">
              Voyage Risk Profile & Port Delays
            </h3>
          </div>
          <ProvenanceBadge type="ESTIMATED" />
        </div>

        <div className="space-y-2.5 text-xs font-mono">
          <div className="flex items-center justify-between p-2 rounded bg-[#070d17] border border-[#142236]">
            <span className="text-slate-400 flex items-center gap-1.5 font-sans">
              <Wind className="w-3.5 h-3.5 text-sky-400" />
              Origin Weather Disruption:
            </span>
            <span className={`font-bold ${
              riskProfile["Origin Weather"] === 'High' ? 'text-rose-400' : 
              (riskProfile["Origin Weather"] === 'Medium' ? 'text-amber-400' : 'text-emerald-400')
            }`}>
              {riskProfile["Origin Weather"]}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[#070d17] border border-[#142236]">
            <span className="text-slate-400 flex items-center gap-1.5 font-sans">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              {origin} Congestion:
            </span>
            <span className={`font-bold ${
              riskProfile["Port Congestion"] === 'High' ? 'text-rose-400' : 
              (riskProfile["Port Congestion"] === 'Medium' ? 'text-amber-400' : 'text-emerald-400')
            }`}>
              {riskProfile["Port Congestion"]}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[#070d17] border border-[#142236]">
            <span className="text-slate-400 flex items-center gap-1.5 font-sans">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              Est. Discharge Waiting Time:
            </span>
            <span className="font-bold text-slate-200">
              {riskProfile["Waiting Time at Dest"]}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[#070d17] border border-[#142236]">
            <span className="text-slate-400 flex items-center gap-1.5 font-sans">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              Ocean Freight Volatility:
            </span>
            <span className="font-bold text-amber-400">
              {riskProfile["Freight Volatility"]}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 p-2.5 rounded bg-emerald-950/30 border border-emerald-500/30 text-xs">
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-0.5">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Overall Lane Status: {riskProfile["Overall Route Risk"]}</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-normal">
          Corridor parameters within seasonal historical tolerance. No major cyclone or passage blockage flagged for {destination}.
        </p>
      </div>
    </div>
  );
};
