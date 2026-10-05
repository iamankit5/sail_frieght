// frontend/src/components/route/VoyageRiskCard.tsx
import React from 'react';
import { RouteRiskProfile } from '../../types';
import { AlertCircle, Clock, Wind, Activity, CheckCircle2 } from 'lucide-react';
import { ProvenanceBadge } from '../provenance/ProvenanceBadge';

interface VoyageRiskCardProps {
  riskProfile: RouteRiskProfile;
  destination: string;
}

export const VoyageRiskCard: React.FC<VoyageRiskCardProps> = ({
  riskProfile,
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
          <div className="flex items-center justify-between p-2.5 rounded-lg inset-well">
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

          <div className="flex items-center justify-between p-2.5 rounded-lg inset-well">
            <span className="text-slate-400 flex items-center gap-1.5 font-sans">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              {destination} Congestion:
            </span>
            <span className={`font-bold ${
              riskProfile["Port Congestion"] === 'High' ? 'text-rose-400' : 
              (riskProfile["Port Congestion"] === 'Medium' ? 'text-amber-400' : 'text-emerald-400')
            }`}>
              {riskProfile["Port Congestion"]}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg inset-well">
            <span className="text-slate-400 flex items-center gap-1.5 font-sans">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              Est. Discharge Waiting Time:
            </span>
            <span className="font-bold text-slate-200">
              {riskProfile["Waiting Time at Dest"]}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 p-3 rounded-lg bg-emerald-500/8 border border-emerald-400/25 text-xs" style={{ boxShadow: '0 0 20px -8px rgba(52,211,153,0.4)' }}>
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-0.5">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Overall Lane Status: {riskProfile["Overall Route Risk"]}</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-normal">
          Derived from load-port weather, discharge-port congestion and berth delay assumptions for {destination}.
        </p>
      </div>
    </div>
  );
};
