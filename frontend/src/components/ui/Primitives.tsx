// frontend/src/components/ui/Primitives.tsx
import React from 'react';

/** Shimmering skeleton block for loading states. */
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton ${className}`} aria-hidden="true" />
);

/** Decision-score meter with animated fill. Score 0-99. */
export const ScoreMeter: React.FC<{ score: number; className?: string }> = ({ score, className = '' }) => (
  <div className={`score-meter ${className}`} role="presentation">
    <div style={{ width: `${Math.max(2, Math.min(100, score))}%` }} />
  </div>
);

/** Section header used across terminal cards: icon + title + right slot. */
export const CardHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  accent?: string;
  right?: React.ReactNode;
  subtitle?: string;
}> = ({ icon, title, accent = 'text-sky-400', right, subtitle }) => (
  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[rgba(56,116,187,0.16)]">
    <div className="flex items-center gap-2.5 min-w-0">
      <span className={`p-1.5 rounded-lg bg-[#0a1526] border border-[rgba(56,116,187,0.28)] ${accent} shrink-0`}>
        {icon}
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-bold tracking-wide uppercase text-slate-100 truncate">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-500 truncate">{subtitle}</p>}
      </div>
    </div>
    {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
  </div>
);
