import React from 'react';

interface PerformanceZoneProps {
  children?: React.ReactNode;
  className?: string;
  isPressed?: boolean;
  accentColor?: 'cyan' | 'orange' | 'magenta';
}

export const PerformanceZone: React.FC<PerformanceZoneProps> = ({
  children,
  className = '',
  isPressed = false,
  accentColor = 'cyan',
}) => {
  const activeClass = 
    accentColor === 'cyan' ? 'bg-[#00dbe7]/10 border-[#00dbe7] shadow-[0_0_25px_rgba(0,219,231,0.4)] text-[#00dbe7]' :
    accentColor === 'orange' ? 'bg-[#fd8b00]/10 border-[#fd8b00] shadow-[0_0_25px_rgba(253,139,0,0.4)] text-[#fd8b00]' :
    'bg-[#d600ff]/10 border-[#d600ff] shadow-[0_0_25px_rgba(214,0,255,0.4)] text-[#d600ff]';

  const idleClass = 
    accentColor === 'cyan' ? 'bg-surface-container/20 border-[#00dbe7]/20 hover:border-[#00dbe7]/40 text-[#00dbe7]/60' :
    accentColor === 'orange' ? 'bg-surface-container/20 border-[#fd8b00]/20 hover:border-[#fd8b00]/40 text-[#fd8b00]/60' :
    'bg-surface-container/20 border-[#d600ff]/20 hover:border-[#d600ff]/40 text-[#d600ff]/60';

  return (
    <div
      style={{
        clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)',
      }}
      className={`relative border transition-all duration-150 flex flex-col items-center justify-center ${
        isPressed ? activeClass : idleClass
      } ${className}`}
    >
      {children}
    </div>
  );
};
