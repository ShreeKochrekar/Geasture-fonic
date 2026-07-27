import React from 'react';
import { useAppStore } from '../store/appStore';
import type { InstrumentType } from '../store/appStore';
import { pianoAudio, thereminAudio, guitarAudio } from '../audio/toneEngine';
import { Radio, Drum, Keyboard, Music, Disc } from 'lucide-react';

interface InstrumentInfo {
  id: InstrumentType;
  name: string;
  description: string;
  gestures: string;
  icon: React.ComponentType<any>;
  color: string;
}

const INSTRUMENTS: InstrumentInfo[] = [
  {
    id: 'theremin',
    name: 'Wave Theremin',
    description: 'A classic hands-free space synth.',
    gestures: 'Right: X = Pitch, Y = Filter. Left: Fist = Mute.',
    icon: Radio,
    color: 'border-l-[#00f2fe] text-[#00f2fe]',
  },
  {
    id: 'drums',
    name: 'Air Drums',
    description: 'Trigger 4 drum pads in mid-air.',
    gestures: 'Strike Index/Middle fingers into the 4 screen quadrants.',
    icon: Drum,
    color: 'border-l-[#ffa800] text-[#ffa800]',
  },
  {
    id: 'piano',
    name: 'Air Piano',
    description: 'Play a virtual 8-key piano keyboard.',
    gestures: 'Poke fingers downward below Y-threshold. Supports chords.',
    icon: Keyboard,
    color: 'border-l-[#e056fd] text-[#e056fd]',
  },
  {
    id: 'guitar',
    name: 'Acoustic/Electric Guitar',
    description: 'Strum chords or pluck individual strings.',
    gestures: 'Left: Fist=Em, Open=G, Peace=C, ThumbsUp=D. Right: Pinch & swipe.',
    icon: Music,
    color: 'border-l-[#ff4b4b] text-[#ff4b4b]',
  },
  {
    id: 'tabla',
    name: 'Virtual Tabla',
    description: 'Play traditional Indian Bayan & Dayan drums.',
    gestures: 'Left = Bayan, Right = Dayan. Strike shape picks the sound.',
    icon: Disc,
    color: 'border-l-[#00b894] text-[#00b894]',
  },
];

export const InstrumentSelector: React.FC = () => {
  const { activeInstrument, setInstrument, guitarTone } = useAppStore();

  const handleSelect = (id: InstrumentType) => {
    // 1. Release all active synthesizers to prevent hanging notes
    pianoAudio.releaseAll();
    thereminAudio.stop();

    // 2. If guitar is selected, sync the tone routing
    if (id === 'guitar') {
      guitarAudio.setToneEffect(guitarTone);
    }

    // 3. Switch instrument in store
    setInstrument(id);
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-1">
        Select Instrument
      </h3>
      
      <div className="grid grid-cols-1 gap-3.5">
        {INSTRUMENTS.map((inst) => {
          const Icon = inst.icon;
          const isActive = activeInstrument === inst.id;

          return (
            <button
              key={inst.id}
              onClick={() => handleSelect(inst.id)}
              className={`w-full text-left p-4 rounded-xl border-l-4 glass-panel transition-all duration-300 ${inst.color} ${
                isActive
                  ? 'bg-white/10 border-r border-t border-b border-white/20 scale-[1.01] shadow-lg shadow-white/5'
                  : 'bg-zinc-900/40 border-zinc-800/80 border-r border-t border-b hover:bg-zinc-900/80 hover:translate-x-1'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg bg-white/5 flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-zinc-100 text-sm tracking-wide">
                      {inst.name}
                    </span>
                    {isActive && (
                      <span className="text-[10px] bg-white/10 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 truncate">
                    {inst.description}
                  </p>
                </div>
              </div>
              
              <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-col gap-0.5">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  How to Play:
                </span>
                <span className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                  {inst.gestures}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
