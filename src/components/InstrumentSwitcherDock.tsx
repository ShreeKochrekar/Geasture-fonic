import React from 'react';
import { useAppStore } from '../store/appStore';
import type { InstrumentType } from '../store/appStore';
import { pianoAudio, thereminAudio, guitarAudio } from '../audio/toneEngine';

export const InstrumentSwitcherDock: React.FC = () => {
  const { activeInstrument, setInstrument, guitarTone } = useAppStore();

  const handleSelect = (id: InstrumentType) => {
    // Release active audio synths
    pianoAudio.releaseAll();
    thereminAudio.stop();

    if (id === 'guitar') {
      guitarAudio.setToneEffect(guitarTone);
    }
    setInstrument(id);
  };

  const navItems: { id: InstrumentType; label: string; icon: string; glow: string }[] = [
    { id: 'theremin', label: 'Synth', icon: 'waves', glow: 'rgba(0, 219, 231, 0.8)' },
    { id: 'drums', label: 'Beats', icon: 'grid_view', glow: 'rgba(253, 139, 0, 0.8)' },
    { id: 'piano', label: 'Piano', icon: 'piano', glow: 'rgba(0, 219, 231, 0.8)' },
    { id: 'guitar', label: 'Strings', icon: 'straighten', glow: 'rgba(214, 0, 255, 0.8)' },
    { id: 'tabla', label: 'Bass', icon: 'graphic_eq', glow: 'rgba(253, 139, 0, 0.8)' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 px-zone-padding pb-safe bg-surface-container-lowest/40 backdrop-blur-md border-t border-outline-variant/20 shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
      {navItems.map((item) => {
        const isActive = activeInstrument === item.id;
        const colorClass = isActive 
          ? 'text-primary scale-110' 
          : 'text-on-surface-variant opacity-60 hover:opacity-100 hover:text-primary-fixed';

        return (
          <button
            key={item.id}
            onClick={() => handleSelect(item.id)}
            className={`flex flex-col items-center justify-center transition-all duration-150 active:transform active:scale-90 ${colorClass}`}
          >
            <span 
              className="material-symbols-outlined" 
              style={isActive ? { filter: `drop-shadow(0 0 8px ${item.glow})` } : {}}
            >
              {item.icon}
            </span>
            <span className="font-label-bold text-[10px] mt-1 uppercase tracking-wider">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
