import React, { useState, useEffect, useRef } from 'react';
import type { TrackingResult } from '../tracking/handLandmarker';
import { useAppStore } from '../store/appStore';
import type { GuitarTone } from '../store/appStore';
import { guitarAudio } from '../audio/toneEngine';
import { InstrumentSwitcherDock } from '../components/InstrumentSwitcherDock';
import { MotionReticle } from '../components/MotionReticle';
import { GestureGuide } from '../components/GestureGuide';
import { 
  getCurrentMood, 
  getCurrentPattern, 
  MOOD_NAMES, 
  MOOD_COLORS, 
  PATTERN_NAMES,
  isLeftHandArmed
} from '../tracking/moodGestures';

interface GuitarPlayScreenProps {
  trackingResult: TrackingResult | null;
  onOpenSettings: () => void;
}

const STRINGS_Y_NORM = [0.42, 0.47, 0.52, 0.57, 0.62, 0.67];

export const GuitarPlayScreen: React.FC<GuitarPlayScreenProps> = ({ trackingResult, onOpenSettings }) => {
  const { guitarTone, setGuitarTone } = useAppStore();

  const [activeStrings, setActiveStrings] = useState<{ [key: number]: boolean }>({});
  const [showGuide, setShowGuide] = useState(false);

  const leftHand = trackingResult?.hands.find((h) => h.handedness === 'Left');

  let lReticleX = 50;
  let lReticleY = 50;
  let lVisible = false;

  // Mood & Pattern & State
  const mood = getCurrentMood();
  const pattern = getCurrentPattern();
  const moodColor = MOOD_COLORS[mood];
  const moodName = MOOD_NAMES[mood];
  const patternName = PATTERN_NAMES[pattern];
  const isArmed = isLeftHandArmed(leftHand);

  // Left Hand tracking reticle
  if (leftHand && leftHand.landmarks.length > 0) {
    const tip = leftHand.landmarks[8];
    lReticleX = (1 - tip.x) * 100;
    lReticleY = tip.y * 100;
    lVisible = true;
  }

  // Trigger visual string pluck animation when left hand transitions to open
  const prevIsArmed = useRef(false);
  useEffect(() => {
    if (isArmed && !prevIsArmed.current) {
      STRINGS_Y_NORM.forEach((_, idx) => {
        setTimeout(() => {
          setActiveStrings((prev) => ({ ...prev, [idx]: true }));
          setTimeout(() => setActiveStrings((prev) => ({ ...prev, [idx]: false })), 150);
        }, idx * 22);
      });
    }
    prevIsArmed.current = isArmed;
  }, [isArmed]);

  return (
    <div className="bg-background text-on-surface font-body-lg overflow-hidden select-none h-screen w-screen relative">
      
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter py-unit bg-gradient-to-b from-surface-dim to-transparent">
        <div className="flex items-center gap-stack-md">
          <span className="font-display-lg text-headline-md font-bold tracking-tighter text-primary drop-shadow-[0_0_8px_rgba(0,219,231,0.6)]">
            GestureFonic
          </span>
          <span className="px-2 py-0.5 border border-primary/30 rounded text-[10px] font-label-mono text-primary/80 uppercase">
            LIVE READY
          </span>
        </div>

        {/* Center Mood, Pattern, and State Readout */}
        <div className="absolute left-1/2 -translate-x-1/2 top-margin-safe flex flex-col items-center z-20">
          <div className="text-[9px] font-label-mono text-on-surface-variant tracking-[0.2em] mb-1">
            CURRENT MOOD
          </div>
          <h1 className="font-display-lg text-3xl font-bold uppercase" style={{ color: moodColor, textShadow: `0 0 15px ${moodColor}66` }}>
            {moodName}
          </h1>
          <div className="w-32 h-[2px] opacity-50 mt-1" style={{ background: `linear-gradient(to right, transparent, ${moodColor}, transparent)` }}></div>
          <div className="font-label-mono text-[9px] text-on-surface-variant mt-1.5 tracking-widest uppercase">
            PATTERN: <span style={{ color: moodColor }}>{patternName}</span> | LEFT HAND: <span style={{ color: moodColor }}>{isArmed ? 'OPEN (PLAY ARMED)' : 'CLOSED (SILENT)'}</span>
          </div>
        </div>

        <div className="flex items-center gap-stack-md">
          <span className="font-label-mono text-on-surface-variant text-[10px] hidden md:inline">VIRTUAL_ENGINE_V2.4</span>
          <button onClick={() => setShowGuide(!showGuide)}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${showGuide ? 'text-[#FF00FF]' : 'hover:bg-surface-variant/20'}`}
            title="Gesture Guide">
            <span className="material-symbols-outlined text-primary">gesture</span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/20 transition-colors">
            <span className="material-symbols-outlined text-primary">account_circle</span>
          </button>
          <button onClick={onOpenSettings} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/20 transition-colors">
            <span className="material-symbols-outlined text-primary">tune</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 w-full h-full flex items-center justify-between pt-24 pb-20 px-margin-safe gap-zone-padding">
        
        {/* Left Hand Mood Display */}
        <div className="w-[38%] h-[68%] flex flex-col justify-center">
          <div className="glass-panel p-zone-padding rounded-xl relative h-full flex flex-col justify-between" style={{ borderLeftColor: moodColor, borderLeftWidth: '4px' }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-label-bold text-xs uppercase mb-1" style={{ color: moodColor }}>Left Hand</h2>
                <p className="text-[10px] font-label-mono text-on-surface-variant">FULL CONTROL (MOOD, STRUM & PATTERN)</p>
              </div>
              <span className="material-symbols-outlined text-xl" style={{ color: moodColor }}>front_hand</span>
            </div>

            {/* Elegant Mood Visualization Box */}
            <div className="flex-1 w-full border border-outline-variant/30 relative bg-black/10 rounded-lg flex flex-col items-center justify-center p-4">
              <div className="w-24 h-24 border rounded-full flex items-center justify-center reticle-pulse mb-4" style={{ borderColor: `${moodColor}44` }}>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: moodColor, boxShadow: `0 0 20px ${moodColor}` }}></div>
              </div>
              
              <div className="text-center">
                <span className="text-[11px] font-label-mono text-on-surface-variant uppercase tracking-wider">LEFT HAND STATE</span>
                <h3 className="font-display-lg text-2xl font-bold uppercase mt-1" style={{ color: moodColor }}>
                  {isArmed ? 'PLAY ARMED (OPEN)' : 'SILENT (CLOSED)'}
                </h3>
              </div>
            </div>

            <div className="mt-4 flex gap-2 items-center">
              <div className="flex-1 h-1 overflow-hidden" style={{ backgroundColor: `${moodColor}33` }}>
                <div className="h-full w-full" style={{ backgroundColor: moodColor, boxShadow: `0 0 5px ${moodColor}` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Strum Visualizer Lane */}
        <div className="w-[50%] h-[68%] flex flex-col justify-center">
          <div className="glass-panel p-zone-padding rounded-xl relative overflow-hidden h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-label-bold text-xs uppercase mb-1" style={{ color: moodColor }}>Strum Lane</h2>
                <p className="text-[10px] font-label-mono text-on-surface-variant">LEFT HAND TRIGGERED</p>
              </div>
              <span className="material-symbols-outlined" style={{ color: moodColor }}>music_note</span>
            </div>

            {/* 6 Guitar String lines */}
            <div className="flex-1 flex flex-col justify-around py-4 relative z-10">
              {[0, 1, 2, 3, 4, 5].map((strIdx) => {
                const isActive = !!activeStrings[strIdx];
                return (
                  <div key={strIdx}
                    className={`w-full ${['h-[1px]', 'h-[1.5px]', 'h-[2px]', 'h-[2.5px]', 'h-[3px]', 'h-[4px]'][strIdx]} relative transition-all ${
                      isActive ? 'string-active' : 'bg-outline-variant/30'
                    }`}
                    style={isActive ? { boxShadow: `0 0 8px ${moodColor}`, backgroundColor: moodColor } : {}}>
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border bg-background flex items-center justify-center" style={{ borderColor: `${moodColor}88` }}>
                      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: moodColor }}></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 opacity-40">
              <span className="text-[9px] font-label-mono uppercase tracking-wider font-bold">FLUID SINGLE-HAND PLAY</span>
            </div>
          </div>
        </div>

        {/* Sidebar indicators */}
        <div className="w-16 h-[68%] flex flex-col justify-between items-center py-4">
          <div className="flex-1 flex flex-col items-center w-full">
            <span className="material-symbols-outlined text-on-surface-variant mb-2">volume_up</span>
            <div className="w-1 flex-1 bg-surface-variant/30 rounded-full relative">
              <div className="absolute bottom-0 w-full rounded-full" style={{ height: '75%', backgroundColor: moodColor, boxShadow: `0 0 10px ${moodColor}` }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 border-2 border-background" style={{ backgroundColor: moodColor }}></div>
              </div>
            </div>
            <span className="font-label-mono text-[9px] mt-2 rotate-90 uppercase tracking-wider text-zinc-400">VOLUME</span>
          </div>
          <div className="flex-1 flex flex-col items-center w-full mt-6">
            <span className="material-symbols-outlined text-on-surface-variant mb-2">sensors</span>
            <div className="w-1 flex-1 bg-surface-variant/30 rounded-full relative">
              <div className="absolute bottom-0 w-full rounded-full" style={{ height: '45%', backgroundColor: moodColor, boxShadow: `0 0 10px ${moodColor}` }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 border-2 border-background" style={{ backgroundColor: moodColor, boxShadow: `0 0 10px ${moodColor}` }}></div>
              </div>
            </div>
            <span className="font-label-mono text-[9px] mt-2 rotate-90 uppercase tracking-wider text-zinc-400">MOOD</span>
          </div>
        </div>
      </main>

      {/* Tone footer selector */}
      <footer className="fixed bottom-24 left-6 flex flex-col gap-stack-md z-20">
        <div className="glass-panel flex p-1 rounded-lg gap-1 border border-outline-variant/30 bg-background/50">
          {(['acoustic', 'electric', 'nylon', 'steel', 'twelve_string'] as GuitarTone[]).map((tone) => (
            <button key={tone} onClick={() => { setGuitarTone(tone); guitarAudio.setToneEffect(tone); }}
              className={`px-3 py-1 font-label-bold text-[9px] rounded uppercase transition-colors ${
                guitarTone === tone ? 'bg-[#FF00FF] text-background font-bold' : 'text-on-surface-variant hover:text-white'
              }`}>
              {tone === 'twelve_string' ? '12-STR' : tone.toUpperCase()}
            </button>
          ))}
        </div>
      </footer>

      <InstrumentSwitcherDock />
      {showGuide && (
        <div className="fixed right-4 top-24 z-[60] w-72 max-h-[70vh] overflow-y-auto">
          <GestureGuide instrument="guitar" />
        </div>
      )}

      <MotionReticle x={lReticleX} y={lReticleY} visible={lVisible} colorClass="text-[#FF00FF]" label="L-HAND" />
    </div>
  );
};
