// frontend/src/components/layout/AppHeader.tsx
import React from 'react';
import { Ship, Cpu, Activity, RefreshCw, BookOpen } from 'lucide-react';
import { MarketData } from '../../types';

interface AppHeaderProps {
  marketData: MarketData;
  backendConnected: boolean;
  activeTab: 'procurement' | 'audit';
  onTabChange: (tab: 'procurement' | 'audit') => void;
  onOpenProvenance: () => void;
  isRefreshing: boolean;
  onRefresh: () => void;
}

const StatPill: React.FC<{
  label: string;
  value: string;
  badge?: { text: string; tone: 'live' | 'est' };
}> = ({ label, value, badge }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0a1220]/80 border border-[rgba(56,116,187,0.2)] backdrop-blur-sm">
    <span className="text-[11px] text-slate-400 font-sans">{label}</span>
    <span className="text-[13px] text-slate-50 font-semibold num">{value}</span>
    {badge && (
      <span
        className={`text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider border ${
          badge.tone === 'live'
            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
            : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
        }`}
      >
        {badge.text}
      </span>
    )}
  </div>
);

export const AppHeader: React.FC<AppHeaderProps> = ({
  marketData,
  backendConnected,
  activeTab,
  onTabChange,
  onOpenProvenance,
  isRefreshing,
  onRefresh,
}) => {
  const fxOnline = backendConnected && marketData.usd_inr_rate > 0;
  const bunkerOnline = backendConnected && marketData.bunker_price_usd_mt > 0;

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(56,116,187,0.18)] bg-[#060b15]/85 backdrop-blur-xl">
      {/* Hairline gradient under the header */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.4), rgba(99,102,241,0.25), transparent)' }}
      />

      <div className="max-w-[1700px] mx-auto px-4 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-2">

        {/* Brand */}
        <div className="flex items-center gap-3 mr-auto">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sky-300 shadow-lg shrink-0"
            style={{
              background: 'linear-gradient(135deg, #0c2237, #0a1728)',
              border: '1px solid rgba(56,189,248,0.35)',
              boxShadow: '0 0 18px -4px rgba(56,189,248,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            <Ship className="w-5 h-5" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[15px] tracking-wide text-slate-50 uppercase">
                Freight Procurement Terminal
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-400/30 text-sky-300 font-mono">
                v3.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Vessel–Port Feasibility · Landed Cost · Market Timing
            </p>
          </div>
        </div>

        {/* Live market strip */}
        <div className="hidden xl:flex items-center gap-2.5">
          <StatPill
            label="USD/INR"
            value={fxOnline ? `₹${marketData.usd_inr_rate.toFixed(2)}` : '—'}
            badge={fxOnline ? { text: 'LIVE', tone: 'live' } : undefined}
          />
          <StatPill
            label="Bunker est."
            value={bunkerOnline ? `$${marketData.bunker_price_usd_mt.toFixed(1)}/MT` : '—'}
            badge={
              bunkerOnline
                ? marketData.bunker_provenance === 'LIVE'
                  ? { text: 'LIVE', tone: 'live' }
                  : { text: 'EST', tone: 'est' }
                : undefined
            }
          />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0a1220]/80 border border-[rgba(56,116,187,0.2)]">
            <span className={`status-led ${backendConnected ? 'status-led-emerald' : 'status-led-rose'}`} />
            <span className={`text-[11px] font-semibold tracking-wide ${backendConnected ? 'text-emerald-300' : 'text-rose-300'}`}>
              {backendConnected ? 'ENGINE LIVE' : 'ENGINE OFFLINE'}
            </span>
          </div>
        </div>

        {/* Actions + view switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh market and weather data"
            className="p-2 text-slate-400 hover:text-sky-300 rounded-lg hover:bg-[#0e1a2c] border border-transparent hover:border-[rgba(56,116,187,0.3)] transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          <button
            onClick={onOpenProvenance}
            className="px-3 py-2 rounded-lg bg-[#0b1526] border border-[rgba(56,116,187,0.25)] text-xs text-slate-300 hover:text-sky-200 hover:border-sky-400/40 flex items-center gap-1.5 transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Data Provenance</span>
          </button>

          <div className="flex items-center p-1 rounded-xl bg-[#080f1c] border border-[rgba(56,116,187,0.22)] gap-1">
            {(
              [
                { key: 'procurement', label: 'Terminal', icon: <Activity className="w-3.5 h-3.5" /> },
                { key: 'audit', label: 'Methodology', icon: <Cpu className="w-3.5 h-3.5" /> },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => onTabChange(t.key)}
                className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === t.key
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {activeTab === t.key && (
                  <span
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, #0369a1, #0284c7)',
                      boxShadow: '0 0 16px -2px rgba(56,189,248,0.55), inset 0 1px 0 rgba(255,255,255,0.15)',
                    }}
                  />
                )}
                <span className="relative flex items-center gap-1.5">
                  {t.icon}
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </header>
  );
};
