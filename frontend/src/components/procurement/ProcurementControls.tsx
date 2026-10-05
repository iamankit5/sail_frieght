// frontend/src/components/procurement/ProcurementControls.tsx
import React from 'react';
import { Sliders, Anchor, MapPin, Fuel, Package, Zap } from 'lucide-react';
import { ROUTES, PORT_COORDINATES } from '../../lib/procurementEngine';
import { ProvenanceBadge } from '../provenance/ProvenanceBadge';
import { CardHeader } from '../ui/Primitives';

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

const MATERIAL_TYPES = ["Coking Coal", "Thermal Coal", "Iron Ore Pellets", "Limestone"];

const SCENARIO_PRESETS: Array<{ label: string; qty: number; origin: string; destination: string }> = [
  { label: 'Optimal lane', qty: 75000, origin: 'Australia (Newcastle)', destination: 'Paradip' },
  { label: 'Haldia draft-block', qty: 75000, origin: 'Australia (Newcastle)', destination: 'Haldia' },
  { label: 'US Gulf · Suez', qty: 75000, origin: 'USA (New Orleans)', destination: 'Paradip' },
];

/** Fill fraction for the range slider gradient. */
const fill = (value: number, min: number, max: number) =>
  `${Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))}%`;

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
  liveBunkerPrice,
}) => {
  const originList = Object.keys(ROUTES);
  const destList = ROUTES[origin] ? Object.keys(ROUTES[origin]) : ['Paradip', 'Haldia', 'Vizag', 'Dhamra'];

  const applyPreset = (p: (typeof SCENARIO_PRESETS)[number]) => {
    onOriginChange(p.origin);
    onDestinationChange(p.destination);
    onCargoQtyChange(p.qty);
  };

  return (
    <div className="terminal-card p-4 mb-5 reveal reveal-d2">
      <CardHeader
        icon={<Sliders className="w-4 h-4" />}
        title="Scenario Controls"
        right={
          <>
            {/* One-click demo presets */}
            <div className="hidden md:flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-300" />
              {SCENARIO_PRESETS.map((p) => {
                const active = p.origin === origin && p.destination === destination && p.qty === cargoQty;
                return (
                  <button
                    key={p.label}
                    onClick={() => applyPreset(p)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                      active
                        ? 'bg-amber-500/15 border-amber-400/50 text-amber-200 shadow-[0_0_12px_-3px_rgba(251,191,36,0.5)]'
                        : 'bg-[#0a1322] border-[rgba(56,116,187,0.25)] text-slate-400 hover:text-amber-200 hover:border-amber-400/40'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <ProvenanceBadge type="BENCHMARK" />
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* 1. Cargo allocation */}
        <div className="space-y-2.5">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <Package className="w-3.5 h-3.5 text-sky-400" />
            <span>Material & Volume</span>
          </label>

          <select
            value={cargoType}
            onChange={(e) => onCargoTypeChange(e.target.value)}
            className="w-full text-xs p-2.5"
          >
            {MATERIAL_TYPES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-500">Quantity</span>
              <span className="font-bold text-sky-300 num">{cargoQty.toLocaleString()} MT</span>
            </div>
            <input
              type="range"
              min="25000"
              max="150000"
              step="5000"
              value={cargoQty}
              onChange={(e) => onCargoQtyChange(Number(e.target.value))}
              style={{ ['--fill' as string]: fill(cargoQty, 25000, 150000) }}
            />
            <div className="flex justify-between text-[10px] text-slate-600 font-mono mt-1">
              <span>25K</span>
              <span>75K</span>
              <span>150K MT</span>
            </div>
          </div>
        </div>

        {/* 2. Origin port */}
        <div className="space-y-2.5">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Origin Load Port</span>
          </label>

          <select
            value={origin}
            onChange={(e) => {
              const newOrig = e.target.value;
              onOriginChange(newOrig);
              if (ROUTES[newOrig] && !ROUTES[newOrig][destination]) {
                onDestinationChange(Object.keys(ROUTES[newOrig])[0]);
              }
            }}
            className="w-full text-xs p-2.5"
          >
            {originList.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
            <span className="status-led status-led-emerald" style={{ width: 5, height: 5 }} />
            <span>
              {PORT_COORDINATES[origin]?.weather_risk || 'Low'} weather · {PORT_COORDINATES[origin]?.congestion_risk || 'Low'} congestion
            </span>
          </div>
        </div>

        {/* 3. Destination port */}
        <div className="space-y-2.5">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <Anchor className="w-3.5 h-3.5 text-emerald-400" />
            <span>Discharge Port</span>
          </label>

          <select
            value={destination}
            onChange={(e) => onDestinationChange(e.target.value)}
            className="w-full text-xs p-2.5"
          >
            {destList.map((p) => {
              const draft = PORT_COORDINATES[p]?.draft_limit_m;
              return (
                <option key={p} value={p}>
                  {p}{draft ? ` (max draft ${draft}m)` : ''}
                </option>
              );
            })}
          </select>

          <div className="text-[11px] font-mono">
            <span className="text-slate-500">Channel: </span>
            <span
              className={
                (PORT_COORDINATES[destination]?.draft_limit_m ?? 14.5) < 10
                  ? 'text-rose-300 font-bold'
                  : 'text-slate-200 font-semibold'
              }
            >
              {PORT_COORDINATES[destination]?.draft_limit_m ?? '—'}m{' '}
              {(PORT_COORDINATES[destination]?.draft_limit_m ?? 14.5) < 10 ? '(shallow river)' : '(deepwater)'}
            </span>
          </div>
        </div>

        {/* 4. Fuel pricing */}
        <div className="space-y-2.5">
          <label className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-rose-400" />
              <span>Fuel Price Basis</span>
            </span>
            <span className="text-[9px] text-slate-600 font-mono normal-case">VLSFO</span>
          </label>

          <div className="flex rounded-lg p-1 bg-[#080f1c] border border-[rgba(56,116,187,0.22)] gap-1">
            <button
              onClick={() => onPriceModeChange('live')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                priceMode === 'live' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              style={
                priceMode === 'live'
                  ? {
                      background: 'linear-gradient(135deg, #0369a1, #0284c7)',
                      boxShadow: '0 0 14px -3px rgba(56,189,248,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
                    }
                  : undefined
              }
            >
              Live Sync
            </button>
            <button
              onClick={() => onPriceModeChange('manual')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                priceMode === 'manual' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              style={
                priceMode === 'manual'
                  ? {
                      background: 'linear-gradient(135deg, #b45309, #f59e0b)',
                      boxShadow: '0 0 14px -3px rgba(245,158,11,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
                    }
                  : undefined
              }
            >
              Custom
            </button>
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-500">Bunker</span>
              <span className="font-bold text-slate-100 num">${bunkerPrice.toFixed(1)}/MT</span>
            </div>
            {priceMode === 'manual' ? (
              <input
                type="range"
                min="400"
                max="900"
                step="10"
                value={bunkerPrice}
                onChange={(e) => onBunkerPriceChange(Number(e.target.value))}
                style={{ ['--fill' as string]: fill(bunkerPrice, 400, 900) }}
              />
            ) : (
              <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 pt-1">
                <span className="status-led status-led-emerald" style={{ width: 5, height: 5 }} />
                <span>Synced with live market feed · ${liveBunkerPrice.toFixed(0)}/MT</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
