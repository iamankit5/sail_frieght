// frontend/src/components/forecasting/FreightForecastChart.tsx
import React, { useState } from 'react';
import { FreightForecast } from '../../types';
import { AlertTriangle, BarChart3 } from 'lucide-react';
import { ProvenanceBadge } from '../provenance/ProvenanceBadge';

interface FreightForecastChartProps {
  forecast: FreightForecast;
}

export const FreightForecastChart: React.FC<FreightForecastChartProps> = ({ forecast }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    rate: number;
    type: 'historical' | 'forecast';
    lower?: number;
    upper?: number;
  } | null>(null);

  // Combine historical slice (last 30 days) and 30-day forecast
  const histSlice = forecast.history.slice(-30);
  const forecastTimeline = forecast.timeline_30d;

  // Find min and max for Y scale
  const allRates = [
    ...histSlice.map(h => h.rate_pmt),
    ...forecastTimeline.map(f => f.upper_rate_pmt),
    ...forecastTimeline.map(f => f.lower_rate_pmt)
  ];
  const minRate = Math.floor(Math.min(...allRates) * 0.95);
  const maxRate = Math.ceil(Math.max(...allRates) * 1.05);
  const rangeY = maxRate - minRate || 10;

  // ViewBox dimensions
  const width = 860;
  const height = 280;
  const padL = 45;
  const padR = 25;
  const padT = 25;
  const padB = 35;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const totalPoints = histSlice.length + forecastTimeline.length;

  const getY = (val: number) => {
    return padT + plotH - ((val - minRate) / rangeY) * plotH;
  };

  const getX = (index: number) => {
    return padL + (index / (totalPoints - 1)) * plotW;
  };

  // Build SVG paths
  // 1. Historical line
  let histPath = '';
  histSlice.forEach((h, i) => {
    const x = getX(i);
    const y = getY(h.rate_pmt);
    histPath += `${i === 0 ? 'M' : 'L'} ${x} ${y} `;
  });

  // 2. Forecast line
  const startIdx = histSlice.length - 1;
  const lastHist = histSlice[histSlice.length - 1];
  let forecastPath = `M ${getX(startIdx)} ${getY(lastHist.rate_pmt)} `;
  forecastTimeline.forEach((f, i) => {
    const x = getX(startIdx + 1 + i);
    const y = getY(f.predicted_rate_pmt);
    forecastPath += `L ${x} ${y} `;
  });

  // 3. Confidence Band polygon
  let upperPath = `M ${getX(startIdx)} ${getY(lastHist.rate_pmt)} `;
  let lowerPath = '';
  forecastTimeline.forEach((f, i) => {
    const x = getX(startIdx + 1 + i);
    upperPath += `L ${x} ${getY(f.upper_rate_pmt)} `;
  });
  for (let i = forecastTimeline.length - 1; i >= 0; i--) {
    const x = getX(startIdx + 1 + i);
    lowerPath += `L ${x} ${getY(forecastTimeline[i].lower_rate_pmt)} `;
  }
  lowerPath += `L ${getX(startIdx)} ${getY(lastHist.rate_pmt)} Z`;
  const confidenceBandPath = upperPath + lowerPath;

  const splitX = getX(startIdx);

  return (
    <div className="terminal-card p-4 mb-5">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-3 border-b border-[#182942]">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">
            Multi-Horizon Freight Rate Forecast & 95% Confidence Corridor
          </h3>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-sky-400">
            <span className="w-2.5 h-0.5 bg-sky-400"></span>
            <span>Historical Observed</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-0.5 bg-amber-400 border-dashed"></span>
            <span>Forecast Projection</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-500/70">
            <span className="w-2.5 h-2 bg-amber-500/20 border border-amber-500/40 rounded-sm"></span>
            <span>95% Confidence Band</span>
          </div>
          <ProvenanceBadge type="ESTIMATED" />
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-hidden bg-[#070c17] rounded border border-[#16253c] p-2">
        <svg className="w-full h-[260px]" viewBox={`0 0 ${width} ${height}`}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const val = minRate + pct * rangeY;
            const y = getY(val);
            return (
              <g key={pct}>
                <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#132034" strokeWidth="1" strokeDasharray="3,3" />
                <text x={padL - 6} y={y + 3} textAnchor="end" fill="#64748b" fontSize="10" fontFamily="JetBrains Mono">
                  ${val.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Dividing Marker between Past and Forecast */}
          <line x1={splitX} y1={padT} x2={splitX} y2={padT + plotH} stroke="#2a4365" strokeWidth="1.5" strokeDasharray="4,4" />
          <text x={splitX - 6} y={padT + 12} textAnchor="end" fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono">
            T-0 Spot
          </text>
          <text x={splitX + 6} y={padT + 12} textAnchor="start" fill="#f59e0b" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
            +30D Forward
          </text>

          {/* Shaded Confidence Band */}
          <path d={confidenceBandPath} fill="rgba(245, 158, 11, 0.12)" stroke="none" />

          {/* Historical Series */}
          <path d={histPath} fill="none" stroke="#38bdf8" strokeWidth="2.5" />

          {/* Forecast Series */}
          <path d={forecastPath} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="5,4" />

          {/* Interactive Point Markers */}
          {histSlice.map((h, i) => {
            const x = getX(i);
            const y = getY(h.rate_pmt);
            return (
              <circle
                key={`h-${h.date}`}
                cx={x}
                cy={y}
                r={3.5}
                fill="#070c17"
                stroke="#38bdf8"
                strokeWidth="1.5"
                className="cursor-pointer hover:r-5 transition-all"
                onMouseEnter={() => setHoveredPoint({ date: h.date, rate: h.rate_pmt, type: 'historical' })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}

          {forecastTimeline.map((f, i) => {
            const x = getX(startIdx + 1 + i);
            const y = getY(f.predicted_rate_pmt);
            return (
              <circle
                key={`f-${f.date}`}
                cx={x}
                cy={y}
                r={3.5}
                fill="#070c17"
                stroke="#f59e0b"
                strokeWidth="1.5"
                className="cursor-pointer hover:r-5 transition-all"
                onMouseEnter={() => setHoveredPoint({
                  date: f.date,
                  rate: f.predicted_rate_pmt,
                  type: 'forecast',
                  lower: f.lower_rate_pmt,
                  upper: f.upper_rate_pmt
                })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div className="absolute top-4 right-4 bg-[#09111e]/95 border border-[#1e3350] p-2.5 rounded text-xs font-mono shadow-xl animate-fadeIn">
            <div className="text-slate-400 text-[10px] uppercase font-sans mb-1">
              {hoveredPoint.type === 'historical' ? 'Historical Recorded' : 'Forward AI Projection'} • {hoveredPoint.date}
            </div>
            <div className="text-sm font-bold text-slate-100">
              Rate: <span className={hoveredPoint.type === 'historical' ? 'text-sky-400' : 'text-amber-400'}>${hoveredPoint.rate.toFixed(2)}/MT</span>
            </div>
            {hoveredPoint.lower !== undefined && hoveredPoint.upper !== undefined && (
              <div className="text-[11px] text-slate-400 mt-0.5">
                95% Corridor: [${hoveredPoint.lower.toFixed(2)} – ${hoveredPoint.upper.toFixed(2)}]
              </div>
            )}
          </div>
        )}
      </div>

      {/* Honest Methodology Callout */}
      <div className="mt-3 p-2.5 rounded bg-[#0b1322] border border-[#182942] text-xs flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-slate-300 leading-relaxed text-[11px]">
          <strong className="text-amber-300">Methodology & Baseline Transparency:</strong> Multi-horizon Dry Bulk Index (BDRY) models exhibit high $R^2$ driven by strong time-series autocorrelation. As documented in our verified ML benchmark audit, statistical regression does not consistently beat a zero-ML naive persistence baseline. Forecast bands reflect empirical volatility rather than guaranteed certainty.
        </div>
      </div>
    </div>
  );
};
