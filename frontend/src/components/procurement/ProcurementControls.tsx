// frontend/src/components/procurement/ProcurementControls.tsx
import React from 'react';
import { Sliders, Anchor, MapPin, Fuel, Package } from 'lucide-react';
import { ROUTES, PORT_COORDINATES } from '../../lib/procurementEngine';
import { ProvenanceBadge } from '../provenance/ProvenanceBadge';

interface ProcurementControlsProps {
  cargoType: string;
  onCargoTypeChange: (val: string) => void;
  cargoQty: number;
  onCargoQtyChange: (val: number) => void;
  origin: string;
  onOriginChange: (val: string) => void;
  destination: string;
  onDestinationChange: (val: string) => void;
  priceMode: 'live' | 'manual';
  onPriceModeChange: (val: 'live' | 'manual') => void;
  bunkerPrice: number;
  onBunkerPriceChange: (val: number) => void;
  liveBunkerPrice: number;
}

const MATERIAL_TYPES = [
  "Coking Coal",
  "Thermal Coal",
  "Iron Ore Pellets",
  "Limestone"
];

export const ProcurementControls: React.FC<ProcurementControlsProps> = ({
  cargoType,
  onCargoTypeChange,
  cargoQty,
  onCargoQtyChange,
  origin,
  onOriginChange,
  destination,
  onDestinationChange,
  priceMode,
  onPriceModeChange,
  bunkerPrice,
  onBunkerPriceChange,
  liveBunkerPrice
}) => {
  const originList = Object.keys(ROUTES);
  const destList = ROUTES[origin] ? Object.keys(ROUTES[origin]) : ["Paradip", "Haldia", "Vizag", "Dhamra"];

  return (
    <div className="terminal-card p-4 mb-5">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#182942]">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold tracking-wide uppercase text-slate-200">
            Procurement Parameters & Scenario Controls
          </h2>
        </div>
        <ProvenanceBadge type="BENCHMARK" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Cargo Allocation */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Package className="w-3.5 h-3.5 text-sky-400" />
            <span>Material & Volume</span>
          </label>

          <select
            value={cargoType}
            onChange={(e) => onCargoTypeChange(e.target.value)}
            className="w-full bg-[#070c17] border border-[#1b2b42] text-xs rounded p-2 text-slate-100 focus:outline-none focus:border-sky-500"
          >
            {MATERIAL_TYPES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <div className="pt-1">
            <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
              <span>Quantity:</span>
              <span className="font-bold text-sky-400">{cargoQty.toLocaleString()} MT</span>
            </div>
            <input
              type="range"
              min="25000"
              max="150000"
              step="5000"
              value={cargoQty}
              onChange={(e) => onCargoQtyChange(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>25K</span>
              <span>75K</span>
              <span>150K MT</span>
            </div>
          </div>
        </div>

        {/* 2. Origin Port */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Origin Load Port</span>
          </label>

          <select
            value={origin}
            onChange={(e) => {
              const newOrig = e.target.value;
              onOriginChange(newOrig);
              // ensure destination is valid for new origin
              if (ROUTES[newOrig] && !ROUTES[newOrig][destination]) {
                onDestinationChange(Object.keys(ROUTES[newOrig])[0]);
              }
            }}
            className="w-full bg-[#070c17] border border-[#1b2b42] text-xs rounded p-2 text-slate-100 focus:outline-none focus:border-sky-500"
          >
            {originList.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <div className="text-[11px] text-slate-400 font-mono pt-1">
            <span>Risk Index: </span>
            <span className="text-slate-200">
              {PORT_COORDINATES[origin]?.weather_risk || 'Low'} Weather, {PORT_COORDINATES[origin]?.congestion_risk || 'Low'} Congestion
            </span>
          </div>
        </div>

        {/* 3. Destination Port */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Anchor className="w-3.5 h-3.5 text-emerald-400" />
            <span>Destination Discharge Port</span>
          </label>

          <select
            value={destination}
            onChange={(e) => onDestinationChange(e.target.value)}
            className="w-full bg-[#070c17] border border-[#1b2b42] text-xs rounded p-2 text-slate-100 focus:outline-none focus:border-sky-500"
          >
            {destList.map((p) => {
              const draft = PORT_COORDINATES[p]?.draft_limit_m;
              return (
                <option key={p} value={p}>
                  {p} {draft ? `(Max draft: ${draft}m)` : ''}
                </option>
              );
            })}
          </select>

          <div className="text-[11px] font-mono pt-1">
            <span className="text-slate-400">Channel Limit: </span>
            <span className={PORT_COORDINATES[destination]?.draft_limit_m! < 10 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
              {PORT_COORDINATES[destination]?.draft_limit_m}m {PORT_COORDINATES[destination]?.draft_limit_m! < 10 ? '(Shallow River)' : '(Deepwater)'}
            </span>
          </div>
        </div>

        {/* 4. Fuel Market Pricing Mode */}
        <div className="space-y-2">
          <label className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-rose-400" />
              <span>Fuel Price Basis</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">VLSFO</span>
          </label>

          <div className="flex rounded bg-[#070c17] p-0.5 border border-[#1b2b42]">
            <button
              onClick={() => onPriceModeChange('live')}
              className={`flex-1 py-1 text-xs font-semibold rounded transition-colors ${
                priceMode === 'live' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Live Sync (${liveBunkerPrice.toFixed(0)})
            </button>
            <button
              onClick={() => onPriceModeChange('manual')}
              className={`flex-1 py-1 text-xs font-semibold rounded transition-colors ${
                priceMode === 'manual' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Custom
            </button>
          </div>

          <div className="pt-1">
            <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
              <span>Bunker Price:</span>
              <span className="font-bold text-slate-100">${bunkerPrice.toFixed(1)} / MT</span>
            </div>
            {priceMode === 'manual' ? (
              <input
                type="range"
                min="400"
                max="900"
                step="10"
                value={bunkerPrice}
                onChange={(e) => onBunkerPriceChange(Number(e.target.value))}
                className="w-full"
              />
            ) : (
              <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Active CL=F Crude conversion proxy</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
