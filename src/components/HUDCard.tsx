import React from 'react';

interface HUDCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'orange' | 'magenta' | 'none';
  accentBorderColor?: string;
}

export const HUDCard: React.FC<HUDCardProps> = ({
  children,
  className = '',
  glowColor = 'none',
  accentBorderColor = '',
}) => {
  const glowClass = 
    glowColor === 'cyan' ? 'shadow-[0_0_20px_rgba(0,219,231,0.15)] border-[#00dbe7]/20 text-[#00dbe7]' :
    glowColor === 'orange' ? 'shadow-[0_0_20px_rgba(253,139,0,0.15)] border-[#fd8b00]/20 text-[#fd8b00]' :
    glowColor === 'magenta' ? 'shadow-[0_0_20px_rgba(214,0,255,0.15)] border-[#d600ff]/20 text-[#d600ff]' :
    'border-[#b9cacb]/10 text-on-surface-variant';

  return (
    <div className={`relative bg-surface-container/20 backdrop-blur-xl border corner-bracket ${glowClass} ${accentBorderColor} ${className}`}>
      {/* Corner brackets */}
      <div className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t-2 border-l-2 border-current pointer-events-none"></div>
      <div className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t-2 border-r-2 border-current pointer-events-none"></div>
      <div className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b-2 border-l-2 border-current pointer-events-none"></div>
      <div className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b-2 border-r-2 border-current pointer-events-none"></div>
      {children}
    </div>
  );
};
