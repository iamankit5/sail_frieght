// frontend/src/components/weather/PortWeatherCard.tsx
import React from 'react';
import { DailyWeather } from '../../types';
import { CloudRain, Sun, Cloud, AlertCircle, Compass, Anchor } from 'lucide-react';
import { ProvenanceBadge } from '../provenance/ProvenanceBadge';

interface PortWeatherCardProps {
  portName: string;
  weather: DailyWeather[];
  isOrigin?: boolean;
}

export const PortWeatherCard: React.FC<PortWeatherCardProps> = ({
  portName,
  weather,
  isOrigin = false
}) => {
  const avgRain = weather.length > 0 
    ? weather.reduce((acc, curr) => acc + curr.rain, 0) / weather.length 
    : 0;

  const isSevere = avgRain > 15;
  const isModerate = avgRain > 5 && avgRain <= 15;

  return (
    <div className="terminal-card p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#182942]">
          <div className="flex items-center gap-2">
            {isOrigin ? (
              <Compass className="w-4 h-4 text-amber-400" />
            ) : (
              <Anchor className="w-4 h-4 text-emerald-400" />
            )}
            <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">
              {isOrigin ? 'Origin Port Meteorological Window' : 'Destination Port Meteorological Window'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-300 font-semibold">{portName}</span>
            <ProvenanceBadge type="LIVE" />
          </div>
        </div>

        {/* 5-day Forecast Grid */}
        <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono">
          {weather.map((day, idx) => {
            const dateObj = new Date(day.date);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = dateObj.getDate();

            return (
              <div key={day.date} className="p-2 rounded bg-[#070c17] border border-[#16253c]">
                <div className="text-[11px] text-slate-400 uppercase font-sans">
                  {idx === 0 ? 'Today' : `${dayName} ${dayNum}`}
                </div>

                <div className="my-1.5 flex justify-center text-sky-400">
                  {day.rain > 5 ? (
                    <CloudRain className="w-4 h-4 text-blue-400" />
                  ) : day.maxTemp > 30 ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Cloud className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                <div className="font-bold text-slate-200">
                  {day.maxTemp}° <span className="text-slate-500 font-normal">/ {day.minTemp}°</span>
                </div>

                <div className="text-[10px] text-slate-400 mt-1">
                  {day.rain > 0 ? `${day.rain}mm` : 'Dry'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Operational Maritime Interpretation */}
      <div className={`mt-3 p-2 rounded text-xs border ${
        isSevere 
          ? 'bg-rose-950/20 border-rose-600/40 text-rose-300' 
          : (isModerate ? 'bg-amber-950/20 border-amber-600/40 text-amber-300' : 'bg-[#08101d] border-[#16273e] text-slate-300')
      }`}>
        <div className="flex items-center gap-1.5 font-bold mb-0.5">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Operational Impact Analysis:</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          {isSevere ? (
            <>Heavy precipitation forecast may trigger crane suspension and hatch cover closure at berth. Potential demurrage risk elevated.</>
          ) : isModerate ? (
            <>Intermittent sea swell and rain predicted. Moderate stevedoring slowdown possible but berthing schedule remains viable.</>
          ) : (
            <>Clear meteorological corridor. Optimal sea conditions for bulk loading/unloading without weather-related turnaround delays.</>
          )}
        </p>
      </div>
    </div>
  );
};
