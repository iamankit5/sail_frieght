// frontend/src/components/layout/AppHeader.tsx
import React from 'react';
import { Ship, Cpu, Activity, RefreshCw, BookOpen } from 'lucide-react';
import { MarketData } from '../../types';

interface AppHeaderProps {
  marketData: MarketData;
  backendConnected: boolean;
  judgeMode: boolean;
  onToggleJudgeMode: (val: boolean) => void;
  activeTab: 'procurement' | 'audit';
  onTabChange: (tab: 'procurement' | 'audit') => void;
  onOpenProvenance: () => void;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  marketData,
  backendConnected,
  judgeMode,
  onToggleJudgeMode,
  activeTab,
  onTabChange,
  onOpenProvenance,
  isRefreshing,
  onRefresh,
}) => {
  return (
    <header className="border-b border-[#172439] bg-[#070b14]/95 backdrop-blur sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Brand & Organization */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#0e1c31] border border-[#233857] flex items-center justify-center text-sky-400 shadow-sm">
            <Ship className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-wide text-slate-100 uppercase">
                SAIL Freight Intelligence
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sky-950/70 border border-sky-600/40 text-sky-300 font-mono">
                v2.0 Marine Terminal
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Steel Authority of India Limited • Raw Material Ocean Bulk Procurement System
            </p>
          </div>
        </div>

        {/* Center: System Status & Live Financial Bar */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#0b1220] border border-[#1b2a40]">
            <span className="text-slate-400">USD/INR:</span>
            <span className="text-slate-100 font-semibold">
              {backendConnected && marketData.usd_inr_rate > 0 
                ? `₹${marketData.usd_inr_rate.toFixed(2)}` 
                : 'Offline'}
            </span>
            {backendConnected && marketData.usd_inr_rate > 0 && (
              <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-semibold">
                LIVE
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#0b1220] border border-[#1b2a40]">
            <span className="text-slate-400">Bunker (CL=F × 7.33):</span>
            <span className="text-slate-100 font-semibold">
              {backendConnected && marketData.bunker_price_usd_mt > 0 
                ? `$${marketData.bunker_price_usd_mt.toFixed(1)}/MT` 
                : 'Offline'}
            </span>
            {backendConnected && marketData.bunker_price_usd_mt > 0 && (
              <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-semibold">
                LIVE
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#0b1220] border border-[#1b2a40]">
            <span className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
            <span className={`text-[11px] font-semibold ${backendConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
              {backendConnected ? 'FLASK API CONNECTED' : 'FLASK OFFLINE (REQUIRED)'}
            </span>
          </div>
        </div>

        {/* Right: Controls, Judge Demo Switch & View Tabs */}
        <div className="flex items-center gap-2.5">
          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh market and weather data"
            className="p-1.5 text-slate-400 hover:text-sky-400 rounded hover:bg-[#111c2e] border border-transparent hover:border-[#1e2d42] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          {/* Provenance Explainer Button */}
          <button
            onClick={onOpenProvenance}
            className="px-2.5 py-1.5 rounded bg-[#0e1726] border border-[#1e2d42] text-xs text-slate-300 hover:text-sky-300 hover:border-sky-500/40 flex items-center gap-1.5 transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Data Provenance</span>
          </button>

          {/* Judge Demo Preset Toggle */}
          <label className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded bg-[#101b2d] border border-[#1e324d] cursor-pointer hover:border-sky-500/50 transition-colors select-none">
            <input
              type="checkbox"
              checked={judgeMode}
              onChange={(e) => onToggleJudgeMode(e.target.checked)}
              className="rounded bg-[#070b14] border-slate-600 text-sky-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="font-semibold text-amber-300">Judge Demo Mode</span>
          </label>

          {/* Navigation View Switcher */}
          <div className="flex items-center p-0.5 rounded bg-[#090f1a] border border-[#1a283e]">
            <button
              onClick={() => onTabChange('procurement')}
              className={`px-3 py-1 text-xs font-semibold rounded flex items-center gap-1.5 transition-all ${
                activeTab === 'procurement'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Procurement Terminal</span>
            </button>
            <button
              onClick={() => onTabChange('audit')}
              className={`px-3 py-1 text-xs font-semibold rounded flex items-center gap-1.5 transition-all ${
                activeTab === 'audit'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>ML Honesty & Audit</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
