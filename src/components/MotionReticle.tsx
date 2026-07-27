import React from 'react';

interface MotionReticleProps {
  x: number; // percentage X (0 to 100)
  y: number; // percentage Y (0 to 100)
  visible: boolean;
  colorClass?: string;
  label?: string;
}

export const MotionReticle: React.FC<MotionReticleProps> = ({
  x,
  y,
  visible,
  colorClass = 'text-surface-tint',
  label = 'TRACKING',
}) => {
  if (!visible) return null;

  return (
    <div
      style={{ left: `${x}%`, top: `${y}%` }}
      className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[100] transition-all duration-75 ${colorClass}`}
    >
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="absolute border-2 border-current w-full h-full rounded-full opacity-20 animate-ping"></div>
        <div className="absolute border border-current w-4 h-4 rounded-full bg-current shadow-[0_0_8px_currentColor]"></div>
        <div className="absolute w-[1px] h-20 bg-current/20"></div>
        <div className="absolute w-20 h-[1px] bg-current/20"></div>
        
        {/* Coordinate Readout */}
        <div className="absolute top-8 left-8 bg-[#0a0a0c]/85 backdrop-blur-md border border-current/20 px-2.5 py-1 flex flex-col font-label-mono text-[9px] uppercase tracking-wider min-w-[75px] gap-0.5">
          <span className="text-current font-bold text-[8px]">{label}</span>
          <span className="text-on-surface-variant font-mono">X: {x.toFixed(1)}%</span>
          <span className="text-on-surface-variant font-mono">Y: {y.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};
