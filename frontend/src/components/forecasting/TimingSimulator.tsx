// frontend/src/components/forecasting/TimingSimulator.tsx
import React from 'react';
import { FreightForecast, MarketData } from '../../types';
import { Clock, Calendar, AlertCircle } from 'lucide-react';
import { ProvenanceBadge } from '../provenance/ProvenanceBadge';

interface TimingSimulatorProps {
  forecast: FreightForecast;
  cargoQty: number;
  marketData: MarketData;
}

export const TimingSimulator: React.FC<TimingSimulatorProps> = ({
  forecast,
  cargoQty,
  marketData
}) => {
  const spotRate = forecast.spot_rate_pmt;
  const f7 = forecast.forecast_7d_pmt;
  const f14 = forecast.forecast_14d_pmt;
  const f30 = forecast.forecast_30d_pmt;

  const f7Item = forecast.timeline_30d[6] || { lower_rate_pmt: f7 - 1, upper_rate_pmt: f7 + 1 };
  const f14Item = forecast.timeline_30d[13] || { lower_rate_pmt: f14 - 1.5, upper_rate_pmt: f14 + 1.5 };
  const f30Item = forecast.timeline_30d[29] || { lower_rate_pmt: f30 - 2.5, upper_rate_pmt: f30 + 2.5 };

  const computeExpenseLakhs = (rate: number) => {
    return ((rate * cargoQty * marketData.usd_inr_rate) / 100000).toFixed(1);
  };

  const computeVariance = (rate: number) => {
    const diff = rate - spotRate;
    const diffLakhs = Math.abs((diff * cargoQty * marketData.usd_inr_rate) / 100000).toFixed(1);
    if (Math.abs(diff) < 0.05) return "— Baseline —";
    if (diff > 0) return `📈 Added Cost: ₹${diffLakhs} L (+${((diff/spotRate)*100).toFixed(1)}%)`;
    return `📉 Estimated Savings: ₹${diffLakhs} L (${((diff/spotRate)*100).toFixed(1)}%)`;
  };

  const rows = [
    {
      window: "Charter Today",
      days: 0,
      expectedRate: `$${spotRate.toFixed(2)}/MT`,
      confidenceBand: "Baseline Spot (Fixed)",
      totalExpense: `₹${computeExpenseLakhs(spotRate)} Lakhs`,
      variance: "— Baseline Reference —",
      isRecommended: forecast.pct_change_30d > 1.0
    },
    {
      window: "Wait 7 Days",
      days: 7,
      expectedRate: `$${f7.toFixed(2)}/MT`,
      confidenceBand: `[$${f7Item.lower_rate_pmt.toFixed(2)} – $${f7Item.upper_rate_pmt.toFixed(2)}]`,
      totalExpense: `₹${computeExpenseLakhs(f7)} Lakhs`,
      variance: computeVariance(f7),
      isRecommended: false
    },
    {
      window: "Wait 14 Days",
      days: 14,
      expectedRate: `$${f14.toFixed(2)}/MT`,
      confidenceBand: `[$${f14Item.lower_rate_pmt.toFixed(2)} – $${f14Item.upper_rate_pmt.toFixed(2)}]`,
      totalExpense: `₹${computeExpenseLakhs(f14)} Lakhs`,
      variance: computeVariance(f14),
      isRecommended: false
    },
    {
      window: "Wait 30 Days",
      days: 30,
      expectedRate: `$${f30.toFixed(2)}/MT`,
      confidenceBand: `[$${f30Item.lower_rate_pmt.toFixed(2)} – $${f30Item.upper_rate_pmt.toFixed(2)}]`,
      totalExpense: `₹${computeExpenseLakhs(f30)} Lakhs`,
      variance: computeVariance(f30),
      isRecommended: forecast.pct_change_30d <= -1.0
    }
  ];

  return (
    <div className="terminal-card p-4 mb-5">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-3 border-b border-[#182942]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">
            Procurement Timing Analysis (What Happens If I Postpone Tender Release?)
          </h3>
        </div>
        <ProvenanceBadge type="ESTIMATED" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-[#17253b] text-slate-400 bg-[#070c17]/60 uppercase text-[11px] tracking-wider">
              <th className="py-2.5 px-3">Tender Release Window</th>
              <th className="py-2.5 px-3">Expected Landed Rate</th>
              <th className="py-2.5 px-3">95% Uncertainty Corridor</th>
              <th className="py-2.5 px-3">Total Freight Outlay</th>
              <th className="py-2.5 px-3">Projected Cost Delta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#132034]">
            {rows.map((r) => (
              <tr 
                key={r.window}
                className={`transition-colors ${r.isRecommended ? 'bg-sky-950/30 text-slate-100 font-semibold' : 'hover:bg-[#0e1728] text-slate-300'}`}
              >
                <td className="py-3 px-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{r.window}</span>
                    {r.isRecommended && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-sky-600 text-white">
                        Recommended
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-200">
                  {r.expectedRate}
                </td>
                <td className="py-3 px-3 whitespace-nowrap text-slate-400">
                  {r.confidenceBand}
                </td>
                <td className="py-3 px-3 whitespace-nowrap text-slate-100">
                  {r.totalExpense}
                </td>
                <td className="py-3 px-3 whitespace-nowrap">
                  <span className={r.variance.includes('Added') ? 'text-rose-400' : (r.variance.includes('Savings') ? 'text-emerald-400' : 'text-slate-400')}>
                    {r.variance}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 p-2 rounded bg-[#09111e] border border-[#16253c] text-xs text-slate-300 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-sky-400 shrink-0" />
        <span>
          <strong>Operational Strategy:</strong> {forecast.pct_change_30d > 1.0 
            ? 'Rising freight momentum suggests fixing vessel fixture today avoids cost inflation over 7-30 days.' 
            : 'Downward or stable rate pressure suggests staging tender release into the +14d window.'}
        </span>
      </div>
    </div>
  );
};
