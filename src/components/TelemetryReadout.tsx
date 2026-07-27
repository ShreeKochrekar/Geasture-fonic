import React from 'react';

interface TelemetryReadoutProps {
  label: string;
  value: string | number;
  glowClass?: string;
  className?: string;
}

export const TelemetryReadout: React.FC<TelemetryReadoutProps> = ({
  label,
  value,
  glowClass = '',
  className = '',
}) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <span className="font-label-mono text-[10px] text-on-surface-variant mb-unit uppercase tracking-widest">
        {label}
      </span>
      <span className={`font-label-mono text-2xl font-bold tracking-wider ${glowClass}`}>
        {value}
      </span>
    </div>
  );
};
