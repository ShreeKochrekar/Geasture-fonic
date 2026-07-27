import React, { useState } from 'react';
import type { TrackingResult } from '../tracking/handLandmarker';
import { InstrumentSwitcherDock } from '../components/InstrumentSwitcherDock';
import { MotionReticle } from '../components/MotionReticle';
import { PerformanceZone } from '../components/PerformanceZone';
import { GestureGuide } from '../components/GestureGuide';
import { 
  getCurrentMood, 
  getCurrentPattern, 
  MOOD_NAMES, 
  MOOD_COLORS, 
  PATTERN_NAMES,
  DRUM_MOOD_CONFIGS,
  isRightHandArmed
} from '../tracking/moodGestures';

interface AirDrumsPlayScreenProps {
  trackingResult: TrackingResult | null;
  onOpenSettings: () => void;
}

export const AirDrumsPlayScreen: React.FC<AirDrumsPlayScreenProps> = ({ trackingResult, onOpenSettings }) => {
  const [showGuide, setShowGuide] = useState(false);

  const leftHand = trackingResult?.hands.find((h) => h.handedness === 'Left');
  const rightHand = trackingResult?.hands.find((h) => h.handedness === 'Right');

  let lReticleX = 50;
  let lReticleY = 50;
  let lVisible = false;
  let rReticleX = 50;
  let rReticleY = 50;
  let rVisible = false;

  let crashActive = false;
  let hihatActive = false;
  let snareActive = false;
  let kickActive = false;

  const mood = getCurrentMood();
  const pattern = getCurrentPattern();
  const moodColor = MOOD_COLORS[mood];
  const moodName = MOOD_NAMES[mood];
  const patternName = PATTERN_NAMES[pattern];
  const drumConfig = DRUM_MOOD_CONFIGS[mood];
  const isArmed = isRightHandArmed(rightHand);

  if (leftHand && leftHand.landmarks.length > 0) {
    const tip = leftHand.landmarks[8];
    lReticleX = (1 - tip.x) * 100;
    lReticleY = tip.y * 100;
    lVisible = true;
  }

  // Only the right hand triggers sounds and visual quadrant highlights when armed
  if (rightHand && rightHand.landmarks.length > 0 && isArmed) {
    const tip = rightHand.landmarks[8];
    rReticleX = (1 - tip.x) * 100;
    rReticleY = tip.y * 100;
    rVisible = true;
    
    const screenX = 1 - tip.x;
    const screenY = tip.y;
    const isLeft = screenX < 0.5;
    const isTop = screenY < 0.5;

    if (isLeft && isTop) snareActive = true;
    else if (!isLeft && isTop) hihatActive = true;
    else if (isLeft && !isTop) kickActive = true;
    else crashActive = true;
  }

  return (
    <div className="bg-background text-on-background overflow-hidden font-body-lg h-screen w-screen selection:bg-secondary-container select-none relative">
      
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter py-unit bg-gradient-to-b from-surface-dim to-transparent">
        <div className="flex items-center gap-stack-md">
          <h1 className="font-display-mobile text-display-mobile font-bold tracking-tighter text-primary drop-shadow-[0_0_8px_rgba(0,219,231,0.6)]">
            GestureFonic
          </h1>
          <div className="bg-surface-container px-stack-sm py-1 rounded-sm border border-outline-variant/30">
            <p className="font-label-mono text-label-mono text-secondary-container">VIRTUAL_ENGINE_V2.4</p>
          </div>
        </div>
        <div className="flex items-center gap-stack-md">
          <div className="flex items-center gap-2 px-stack-md py-1 bg-secondary-container/10 border border-secondary-container/40 rounded-full">
            <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse shadow-[0_0_8px_#fd8b00]"></span>
            <span className="font-label-mono text-label-mono text-secondary-container">LIVE READY</span>
          </div>
          <div className="flex gap-stack-sm">
            <button onClick={() => setShowGuide(!showGuide)}
              className={`p-2 transition-colors ${showGuide ? 'text-primary-container' : 'text-on-surface-variant hover:text-primary'}`}
              title="Gesture Guide">
              <span className="material-symbols-outlined">gesture</span>
            </button>
            <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">account_circle</span>
            </button>
            <button onClick={onOpenSettings} className="p-2 text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">tune</span>
            </button>
          </div>
        </div>
      </header>

      {/* Side HUD — Mood & Kit */}
      <aside className="fixed right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-6 items-end">
        <div className="glass-panel p-4 rounded-lg flex flex-col gap-2.5 w-48 relative">
          <div className="l-bracket-tr"></div>
          <div className="l-bracket-bl"></div>
          <p className="font-label-mono text-[9px] text-outline uppercase tracking-wider font-bold">HUD READOUT</p>
          
          <div className="flex flex-col gap-1.5 mt-1 font-label-mono text-[10px]">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">MOOD:</span>
              <span className="font-bold" style={{ color: moodColor }}>{moodName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">KIT:</span>
              <span className="font-bold" style={{ color: moodColor }}>{drumConfig.kitName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">PATTERN:</span>
              <span style={{ color: moodColor }}>{patternName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">STATE:</span>
              <span style={{ color: moodColor }}>{isArmed ? 'PLAY ARMED' : 'SILENT'}</span>
            </div>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-lg w-48 relative overflow-hidden">
          <div className="l-bracket-tr"></div>
          <div className="l-bracket-bl"></div>
          <p className="font-label-mono text-[10px] text-outline uppercase mb-2 tracking-wider">Motion Input</p>
          <div className="flex justify-center py-2">
            <div className="relative w-16 h-16 border border-outline-variant/30 rounded-full flex items-center justify-center">
              <div className="absolute inset-0 border-t-2 rounded-full reticle-spin opacity-40" style={{ borderColor: moodColor }}></div>
              <span className="material-symbols-outlined text-2xl" style={{ color: moodColor }}>gesture</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Performance Canvas */}
      <main className="relative z-20 w-full h-full flex items-center justify-center pt-20 pb-20">
        <div className="grid grid-cols-2 grid-rows-2 gap-x-24 gap-y-16 max-w-5xl w-full px-zone-padding select-none">
          {/* Zone: SNARE (Top Left) */}
          <PerformanceZone accentColor="orange" isPressed={snareActive} className="aspect-square flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-secondary-container text-4xl mb-2 drop-shadow-[0_0_10px_#fd8b00]">fiber_manual_record</span>
            <span className="font-display-lg text-secondary-container text-xl font-bold tracking-widest uppercase">SNARE</span>
            <div className="absolute bottom-4 right-4 font-label-mono text-[10px] text-on-surface-variant opacity-50">ZONE_01</div>
          </PerformanceZone>
          {/* Zone: HI-HAT (Top Right) */}
          <PerformanceZone accentColor="orange" isPressed={hihatActive} className="aspect-square flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-secondary-container text-4xl mb-2 drop-shadow-[0_0_10px_#fd8b00]">close</span>
            <span className="font-display-lg text-secondary-container text-xl font-bold tracking-widest uppercase">HI-HAT</span>
            <div className="absolute bottom-4 right-4 font-label-mono text-[10px] text-on-surface-variant opacity-50">ZONE_02</div>
          </PerformanceZone>
          {/* Zone: KICK (Bottom Left) */}
          <PerformanceZone accentColor="orange" isPressed={kickActive} className="aspect-square flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-secondary-container text-4xl mb-2 drop-shadow-[0_0_10px_#fd8b00]">change_history</span>
            <span className="font-display-lg text-secondary-container text-xl font-bold tracking-widest uppercase">KICK</span>
            <div className="absolute bottom-4 right-4 font-label-mono text-[10px] text-on-surface-variant opacity-50">ZONE_03</div>
          </PerformanceZone>
          {/* Zone: CRASH (Bottom Right) */}
          <PerformanceZone accentColor="orange" isPressed={crashActive} className="aspect-square flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-secondary-container text-4xl mb-2 drop-shadow-[0_0_10px_#fd8b00]">radio_button_unchecked</span>
            <span className="font-display-lg text-secondary-container text-xl font-bold tracking-widest uppercase">CRASH</span>
            <div className="absolute bottom-4 right-4 font-label-mono text-[10px] text-on-surface-variant opacity-50">ZONE_04</div>
          </PerformanceZone>
        </div>

        <MotionReticle x={lReticleX} y={lReticleY} visible={lVisible} colorClass="text-[#fd8b00]" label="L-MOOD" />
        <MotionReticle x={rReticleX} y={rReticleY} visible={rVisible} colorClass="text-[#fd8b00]" label="R-PLAY" />
      </main>

      <InstrumentSwitcherDock />
      {showGuide && (
        <div className="fixed right-4 top-24 z-[60] w-72 max-h-[70vh] overflow-y-auto">
          <GestureGuide instrument="drums" />
        </div>
      )}
    </div>
  );
};
