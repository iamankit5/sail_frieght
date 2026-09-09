// frontend/src/components/provenance/ProvenanceBadge.tsx
import React from 'react';
import { ProvenanceType } from '../../types';
import { PROVENANCE_DEFINITIONS } from '../../data/defaultMarket';

interface ProvenanceBadgeProps {
  type: ProvenanceType | string;
  className?: string;
  size?: 'sm' | 'md';
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({ type, className = '', size = 'sm' }) => {
  const normalized = (type.toUpperCase() in PROVENANCE_DEFINITIONS 
    ? type.toUpperCase() 
    : 'ESTIMATED') as ProvenanceType;
    
  const def = PROVENANCE_DEFINITIONS[normalized];

  const sizeClasses = size === 'sm' 
    ? 'text-[10px] px-1.5 py-0.5' 
    : 'text-xs px-2 py-0.5';

  return (
    <span
      title={def.description}
      className={`inline-flex items-center gap-1 font-mono font-bold tracking-wider rounded border ${def.color} ${sizeClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80"></span>
      {def.label}
    </span>
  );
};
