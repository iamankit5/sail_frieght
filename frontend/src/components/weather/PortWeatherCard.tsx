// frontend/src/components/weather/PortWeatherCard.tsx
import React from 'react';
import { DailyWeather } from '../../types';
import { CloudRain, Sun, Cloud, AlertCircle, Compass, Anchor } from 'lucide-react';
import { ProvenanceBadge } from '../provenance/ProvenanceBadge';
import { CardHeader, Skeleton } from '../ui/Primitives';

interface PortWeatherCardProps {
  portName: string;
  weather: DailyWeather[];
  isOrigin?: boolean;
}

/** Skeleton shown while the 5-day forecast loads. */
export const PortWeatherSkeleton: React.FC = () => (
  <div className="terminal-card p-4">
    <div className="flex items-center justify-between pb-3 mb-4">
      <Skeleton className="h-5 w-64" />
      <Skeleton className="h-5 w-20" />
    </div>
    <div className="grid grid-cols-5 gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-20" />
      ))}
    </div>
    <Skeleton className="h-16 mt-3" />
  </div>
);

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
        <CardHeader
          icon={isOrigin ? <Compass className="w-4 h-4 text-amber-400" /> : <Anchor className="w-4 h-4 text-emerald-400" />}
          title={isOrigin ? 'Load Port Window' : 'Discharge Port Window'}
          subtitle="5-day meteorological forecast"
          right={
            <>
              <span className="text-xs font-mono text-slate-200 font-semibold">{portName}</span>
              <ProvenanceBadge type="LIVE" />
            </>
          }
        />

        {/* 5-day Forecast Grid */}
        <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono">
          {weather.map((day, idx) => {
            const dateObj = new Date(day.date);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = dateObj.getDate();
            const isToday = idx === 0;

            return (
              <div
                key={day.date}
                className={`p-2.5 rounded-lg border transition-colors ${
                  isToday
                    ? 'bg-sky-500/10 border-sky-400/40 shadow-[0_0_14px_-4px_rgba(56,189,248,0.5)]'
                    : 'inset-well hover:border-[rgba(56,189,248,0.3)]'
                }`}
              >
                <div className={`text-[10px] uppercase font-sans tracking-wide ${isToday ? 'text-sky-300 font-bold' : 'text-slate-500'}`}>
                  {isToday ? 'Today' : `${dayName} ${dayNum}`}
                </div>

                <div className="my-1.5 flex justify-center">
                  {day.rain > 5 ? (
                    <CloudRain className="w-4 h-4 text-blue-300" />
                  ) : day.maxTemp > 30 ? (
                    <Sun className="w-4 h-4 text-amber-300" />
                  ) : (
                    <Cloud className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                <div className="font-bold text-slate-100 num">
                  {day.maxTemp}° <span className="text-slate-500 font-normal">/ {day.minTemp}°</span>
                </div>

                <div className="text-[10px] text-slate-500 mt-0.5">
                  {day.rain > 0 ? `${day.rain}mm` : 'Dry'}
                </div>
              </div>
            );
          })}
          {weather.length === 0 && (
            <div className="col-span-5 text-center text-slate-500 text-[11px] font-sans py-4">
              Weather feed unavailable — non-critical enrichment.
            </div>
          )}
        </div>
      </div>

      {/* Operational Maritime Interpretation */}
      <div className={`mt-3 p-2.5 rounded-lg text-xs border ${
        isSevere
          ? 'bg-rose-500/8 border-rose-400/35 text-rose-200'
          : (isModerate ? 'bg-amber-500/8 border-amber-400/35 text-amber-200' : 'inset-well text-slate-300')
      }`}>
        <div className="flex items-center gap-1.5 font-bold mb-0.5">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Operational Impact:</span>
        </div>
        <p className="text-[11px] leading-relaxed opacity-90">
          {isSevere ? (
            <>Heavy precipitation may trigger crane suspension and hatch closure at berth. Demurrage risk elevated.</>
          ) : isModerate ? (
            <>Intermittent swell and rain. Moderate stevedoring slowdown possible; berthing schedule remains viable.</>
          ) : (
            <>Clear meteorological corridor. Optimal conditions for bulk loading/unloading without weather delays.</>
          )}
        </p>
      </div>
    </div>
  );
};
