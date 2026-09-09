// frontend/src/components/provenance/ProvenanceDrawer.tsx
import React from 'react';
import { X, ShieldCheck, Database, FileSpreadsheet, Anchor, Compass } from 'lucide-react';
import { PROVENANCE_DEFINITIONS } from '../../data/defaultMarket';

interface ProvenanceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProvenanceDrawer: React.FC<ProvenanceDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0b1220] border border-[#1e324d] rounded-lg max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#17253b] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-sky-950 border border-sky-600/40 text-sky-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide">
                Maritime Data Provenance & Methodological Audit
              </h2>
              <p className="text-xs text-slate-400">
                Transparent verification of external feeds, benchmark calibrations, and mathematical conversions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[#152338] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Breakdown */}
        <div className="space-y-4 mb-6">
          <h3 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
            Data Quality Classification Tiers
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {Object.entries(PROVENANCE_DEFINITIONS).map(([key, item]) => (
              <div key={key} className="p-3 rounded bg-[#070c17] border border-[#172439] flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded font-mono font-bold tracking-wider border ${item.color}`}>
                    {item.label}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Tier: {key}</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Item Citations */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
            Audited Engineering Specifications & Formulas
          </h3>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded bg-[#090f1d] border border-[#192b42] flex items-start gap-3">
              <Anchor className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">Port Draft Limits & Operational Feasibility:</span>
                <p className="text-slate-400 mt-0.5">
                  Calibrated to published Indian Major Ports Authority berth parameters (Haldia riverine channel max draft ~8.5m; Paradip/Vizag ~14.5m; Dhamra deepwater ~18.0m). Ships physically exceeding depth are flagged as <span className="text-rose-400 font-bold">🔴 INFEASIBLE</span>.
                </p>
              </div>
            </div>

            <div className="p-3 rounded bg-[#090f1d] border border-[#192b42] flex items-start gap-3">
              <Compass className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">Nautical Ocean Distances:</span>
                <p className="text-slate-400 mt-0.5">
                  Extracted from operational Sea-Distances.org routing tables (e.g. Newcastle to Paradip = 4,580 NM; Samarinda to Paradip = 2,180 NM). Voyage duration calculated as: <code className="text-amber-300 font-mono">Distance / (Speed_Knots × 24)</code>.
                </p>
              </div>
            </div>

            <div className="p-3 rounded bg-[#090f1d] border border-[#192b42] flex items-start gap-3">
              <Database className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">Bunker Fuel & Crude Conversion Factor:</span>
                <p className="text-slate-400 mt-0.5">
                  Marine VLSFO $/MT estimate is derived from WTI/Brent crude oil spot (<code className="text-emerald-300 font-mono">CL=F</code>) via standard maritime conversion ratio of <code className="text-emerald-300 font-mono">7.33 bbl/MT</code>. If market API is offline, fallback is the validated Clarksons spot benchmark ($625.0/MT).
                </p>
              </div>
            </div>

            <div className="p-3 rounded bg-[#090f1d] border border-[#192b42] flex items-start gap-3">
              <FileSpreadsheet className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">Vessel Fleet Specifications & Hire Benchmarks:</span>
                <p className="text-slate-400 mt-0.5">
                  Daily hire rates, speeds, and average deadweight tonnages (Handysize 35k MT @ $11.5k/d; Supramax 55k MT @ $14.5k/d; Panamax 75k MT @ $16.5k/d; Capesize 180k MT @ $24.5k/d) reflect Clarksons Research 2024 spot dry bulk market ranges.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#17253b] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors"
          >
            Acknowledge & Close Audit
          </button>
        </div>

      </div>
    </div>
  );
};
