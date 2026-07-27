import React, { useState } from 'react';
import type { TrackingResult } from '../tracking/handLandmarker';
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
import { getCurrentHeldNotes } from '../instruments/piano';

interface AirPianoPlayScreenProps {
  trackingResult: TrackingResult | null;
  onOpenSettings: () => void;
}

export const AirPianoPlayScreen: React.FC<AirPianoPlayScreenProps> = ({ trackingResult, onOpenSettings }) => {
  const [showGuide, setShowGuide] = useState(false);

  const leftHand = trackingResult?.hands.find((h) => h.handedness === 'Left');

  let lReticleX = 50;
  let lReticleY = 50;
  let lVisible = false;

  if (leftHand && leftHand.landmarks.length > 0) {
    const tip = leftHand.landmarks[8];
    lReticleX = (1 - tip.x) * 100;
    lReticleY = tip.y * 100;
    lVisible = true;
  }

  // Mood & Pattern & State (All driven by left hand)
  const mood = getCurrentMood();
  const pattern = getCurrentPattern();
  const moodColor = MOOD_COLORS[mood];
  const moodName = MOOD_NAMES[mood];
  const patternName = PATTERN_NAMES[pattern];
  const isArmed = isLeftHandArmed(leftHand);

  // Get active notes from piano module
  const activeNotes = getCurrentHeldNotes();

  // Map active notes to white keys 0-7
  const isKeyActive = (keyIdx: number): boolean => {
    if (!isArmed) return false;
    const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    return activeNotes.some(note => {
      const match = note.match(/^([A-G]#?b?)(\d+)$/);
      if (!match) return false;
      const name = match[1][0]; // Take letter C, D, E etc
      const idx = noteNames.indexOf(name);
      if (idx === 0) {
        return keyIdx === 0 || keyIdx === 7;
      }
      return idx === keyIdx;
    });
  };

  return (
    <div className="bg-surface text-on-surface overflow-hidden h-screen w-screen selection:bg-secondary-container select-none relative font-body-lg">
      
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter py-unit bg-gradient-to-b from-surface-dim to-transparent">
        <div className="font-display-mobile text-display-mobile font-bold tracking-tighter text-primary drop-shadow-[0_0_8px_rgba(0,219,231,0.6)]">
          GestureFonic
        </div>
        <div className="flex gap-stack-md items-center">
          <button onClick={() => setShowGuide(!showGuide)}
            className={`material-symbols-outlined transition-colors active:scale-95 duration-100 ${showGuide ? 'text-primary-container' : 'text-on-surface-variant hover:text-primary-container'}`}
            title="Gesture Guide">gesture</button>
          <button onClick={onOpenSettings}
            className="material-symbols-outlined text-on-surface-variant hover:text-primary-container transition-colors active:scale-95 duration-100">tune</button>
          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary-container transition-colors active:scale-95 duration-100">account_circle</button>
        </div>
      </header>

      {/* HUD Elements */}
      <div className="fixed inset-0 pointer-events-none z-10 px-zone-padding py-zone-padding mt-16 mb-24">
        <div className="relative w-full h-full">
          {/* Top Left: Mood Panel */}
          <div className="absolute top-0 left-0 w-40 glass-panel p-stack-sm pointer-events-auto border border-outline-variant/10">
            <div className="bracket-tl l-bracket"></div>
            <div className="bracket-tr l-bracket"></div>
            <div className="bracket-bl l-bracket"></div>
            <div className="bracket-br l-bracket"></div>
            <div className="font-label-mono text-[9px] text-on-surface-variant mb-unit tracking-widest uppercase">MOOD</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: moodColor, boxShadow: `0 0 6px ${moodColor}` }}></div>
              <span className="font-label-mono text-sm font-bold" style={{ color: moodColor }}>{moodName}</span>
            </div>
          </div>

          {/* Top Right: Pattern / State Panel */}
          <div className="absolute top-0 right-0 w-48 glass-panel p-stack-sm pointer-events-auto border border-outline-variant/10">
            <div className="bracket-tl l-bracket"></div>
            <div className="bracket-tr l-bracket"></div>
            <div className="bracket-bl l-bracket"></div>
            <div className="bracket-br l-bracket"></div>
            <div className="font-label-mono text-[9px] text-on-surface-variant mb-unit tracking-widest uppercase font-bold">LEFT HAND STATUS</div>
            <div className="flex flex-col gap-1.5 mt-1 font-label-mono text-[10px]">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">PATTERN:</span>
                <span style={{ color: moodColor }}>{patternName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">STATE:</span>
                <span style={{ color: moodColor }}>{isArmed ? 'PLAY ARMED (OPEN)' : 'SILENT (CLOSED)'}</span>
              </div>
            </div>
          </div>

          {/* Center: Mood name display */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-center">
            <div className="font-label-mono text-[10px] text-on-surface-variant tracking-widest mb-unit opacity-50 uppercase">CURRENT MOOD</div>
            <div className="font-display-lg text-4xl md:text-5xl font-bold tracking-tight" style={{ color: moodColor, textShadow: `0 0 20px ${moodColor}66` }}>
              {moodName}
            </div>
            <div className="flex justify-center gap-1 mt-unit">
              <div className="w-12 h-0.5 opacity-30" style={{ backgroundColor: moodColor }}></div>
              <div className="w-2 h-0.5" style={{ backgroundColor: moodColor }}></div>
              <div className="w-12 h-0.5 opacity-30" style={{ backgroundColor: moodColor }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Zone: Air Keyboard */}
      <main className="fixed bottom-24 left-0 w-full px-zone-padding z-20">
        <div className="max-w-6xl mx-auto glass-panel p-unit flex gap-0.5 relative overflow-hidden h-48 border border-outline-variant/10">
          <div className="bracket-tl l-bracket"></div>
          <div className="bracket-tr l-bracket"></div>

          {/* Mood color accent bar */}
          <div className="absolute top-0 left-0 w-full h-0.5" style={{ backgroundColor: moodColor, boxShadow: `0 0 8px ${moodColor}` }}></div>

          {/* Render 8 keys (no note labels) */}
          {Array.from({ length: 8 }).map((_, idx) => {
            const isWhiteActive = isKeyActive(idx);

            return (
              <React.Fragment key={idx}>
                <div className={`flex-1 border-x border-outline-variant/30 flex flex-col justify-end p-2 transition-all group ${
                  isWhiteActive
                    ? 'active-key font-bold'
                    : 'bg-surface-variant/40 hover:bg-surface-variant/60'
                }`}
                style={isWhiteActive ? { backgroundColor: `${moodColor}40`, borderColor: moodColor, boxShadow: `inset 0 0 20px ${moodColor}33, 0 0 15px ${moodColor}22` } : {}}
                >
                  <span className="font-label-mono text-[8px] uppercase tracking-wider text-on-surface-variant">●</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </main>

      <InstrumentSwitcherDock />
      {showGuide && (
        <div className="fixed right-4 top-24 z-[60] w-72 max-h-[70vh] overflow-y-auto">
          <GestureGuide instrument="piano" />
        </div>
      )}

      <MotionReticle x={lReticleX} y={lReticleY} visible={lVisible} colorClass="text-surface-tint" label="L-HAND" />
    </div>
  );
};
