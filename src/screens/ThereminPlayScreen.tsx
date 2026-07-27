import React, { useState } from 'react';
import type { TrackingResult } from '../tracking/handLandmarker';
import { useAppStore } from '../store/appStore';
import { thereminAudio } from '../audio/toneEngine';
import { InstrumentSwitcherDock } from '../components/InstrumentSwitcherDock';
import { MotionReticle } from '../components/MotionReticle';
import { GestureGuide } from '../components/GestureGuide';
import { 
  getCurrentMood, 
  getCurrentPattern, 
  MOOD_NAMES, 
  MOOD_COLORS, 
  PATTERN_NAMES,
  isRightHandArmed
} from '../tracking/moodGestures';

interface ThereminPlayScreenProps {
  trackingResult: TrackingResult | null;
  onOpenSettings: () => void;
}

export const ThereminPlayScreen: React.FC<ThereminPlayScreenProps> = ({ trackingResult, onOpenSettings }) => {
  const [waveform, setWaveform] = useState<'sine' | 'sawtooth' | 'square' | 'triangle'>('sine');
  const [showGuide, setShowGuide] = useState(false);
  const { rightHandRange } = useAppStore();

  const handleWaveformChange = (type: 'sine' | 'sawtooth' | 'square' | 'triangle') => {
    setWaveform(type);
    thereminAudio.setWaveform(type);
  };

  // Find hands
  const rightHand = trackingResult?.hands.find((h) => h.handedness === 'Right');
  const leftHand = trackingResult?.hands.find((h) => h.handedness === 'Left');

  // Get current mood, pattern, armed state
  const mood = getCurrentMood();
  const pattern = getCurrentPattern();
  const moodColor = MOOD_COLORS[mood];
  const moodName = MOOD_NAMES[mood];
  const patternName = PATTERN_NAMES[pattern];
  const isArmed = isRightHandArmed(rightHand);

  let rReticleX = 50;
  let rReticleY = 50;
  let rVisible = false;
  let lReticleX = 50;
  let lReticleY = 50;
  let lVisible = false;

  let playheadTop = 50;
  let currentVol = 0;

  if (leftHand && leftHand.landmarks.length > 0) {
    const tip = leftHand.landmarks[8];
    lReticleX = (1 - tip.x) * 100;
    lReticleY = tip.y * 100;
    lVisible = true;
  }

  if (rightHand && rightHand.landmarks.length > 0) {
    const indexTip = rightHand.landmarks[8];
    rReticleX = (1 - indexTip.x) * 100;
    rReticleY = indexTip.y * 100;
    rVisible = true;

    const range = rightHandRange;
    const rangeY = range.maxY - range.minY;
    const normY = rangeY > 0 ? (indexTip.y - range.minY) / rangeY : indexTip.y;
    const clampedY = Math.max(0, Math.min(1, normY));

    // Pitch visualizer playhead is controlled by the Y position (height) of the right hand
    playheadTop = clampedY * 100;
    currentVol = isArmed ? 85 : 0;
  }

  return (
    <div className="relative w-screen h-screen bg-background text-on-background select-none overflow-hidden font-body-lg">
      
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter py-unit bg-gradient-to-b from-surface-dim to-transparent">
        <div className="font-display-mobile text-display-mobile font-bold tracking-tighter text-primary drop-shadow-[0_0_8px_rgba(0,219,231,0.6)]">
          GestureFonic
        </div>
        <div className="flex items-center gap-gutter">
          <div className="hidden md:flex gap-stack-md font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest text-[10px]">
            <span className="text-primary">Engine: v2.4.0</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse shadow-[0_0_8px_#00f2ff]"></span> 
              Tracking Active
            </span>
          </div>
          <div className="flex gap-stack-md">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className={`hover:text-primary-container transition-colors active:scale-95 duration-100 ${showGuide ? 'text-primary-container' : ''}`}
              title="Gesture Guide"
            >
              <span className="material-symbols-outlined">gesture</span>
            </button>
            <button 
              onClick={onOpenSettings}
              className="hover:text-primary-container transition-colors active:scale-95 duration-100"
            >
              <span className="material-symbols-outlined text-primary">tune</span>
            </button>
            <button className="hover:text-primary-container transition-colors active:scale-95 duration-100">
              <span className="material-symbols-outlined text-primary">account_circle</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 w-full h-full flex items-center justify-center pt-20 pb-20">
        
        {/* LEFT: Mood & Waveform Panel */}
        <div className="absolute left-zone-padding top-1/2 -translate-y-1/2 flex flex-col gap-gutter z-20">
          {/* MOOD Panel */}
          <div className="glass-panel p-gutter min-w-[160px] relative">
            <div className="bracket-tl l-bracket"></div>
            <div className="bracket-tr l-bracket"></div>
            <div className="bracket-bl l-bracket"></div>
            <div className="bracket-br l-bracket"></div>
            <h3 className="font-label-mono text-[10px] text-on-surface-variant mb-unit tracking-widest uppercase">MOOD</h3>
            <p className="font-label-mono text-[28px] font-bold leading-none mt-1" style={{ color: moodColor }}>
              {moodName}
            </p>
            <div className="flex flex-col gap-1.5 mt-2.5 font-label-mono text-[10px]">
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

          {/* WAVEFORM Panel */}
          <div className="glass-panel p-gutter relative">
            <div className="bracket-tl l-bracket"></div>
            <div className="bracket-tr l-bracket"></div>
            <div className="bracket-bl l-bracket"></div>
            <div className="bracket-br l-bracket"></div>
            <h3 className="font-label-mono text-[10px] text-on-surface-variant mb-stack-sm tracking-widest uppercase">WAVEFORM</h3>
            <div className="flex flex-col gap-stack-sm mt-1">
              <button onClick={() => handleWaveformChange('sine')}
                className={`px-3 py-1.5 border font-label-mono text-[10px] text-left transition-colors ${waveform === 'sine' ? 'border-primary text-primary bg-primary-container/10' : 'border-outline-variant text-on-surface-variant hover:bg-surface-variant/20'}`}>SINE</button>
              <button onClick={() => handleWaveformChange('sawtooth')}
                className={`px-3 py-1.5 border font-label-mono text-[10px] text-left transition-colors ${waveform === 'sawtooth' ? 'border-primary text-primary bg-primary-container/10' : 'border-outline-variant text-on-surface-variant hover:bg-surface-variant/20'}`}>SAW</button>
              <button onClick={() => handleWaveformChange('square')}
                className={`px-3 py-1.5 border font-label-mono text-[10px] text-left transition-colors ${waveform === 'square' ? 'border-primary text-primary bg-primary-container/10' : 'border-outline-variant text-on-surface-variant hover:bg-surface-variant/20'}`}>SQUARE</button>
              <button onClick={() => handleWaveformChange('triangle')}
                className={`px-3 py-1.5 border font-label-mono text-[10px] text-left transition-colors ${waveform === 'triangle' ? 'border-primary text-primary bg-primary-container/10' : 'border-outline-variant text-on-surface-variant hover:bg-surface-variant/20'}`}>TRI</button>
            </div>
          </div>
        </div>

        {/* CENTER: PITCH LANE */}
        <div id="pitch-container" className="relative w-72 h-[68%] glass-panel flex flex-col items-center justify-between overflow-hidden z-10">
          <div className="absolute inset-0 opacity-10 pointer-events-none grid-lines"></div>
          <div className="absolute inset-0 pitch-lane-gradient pointer-events-none"></div>

          {/* Mood color wash */}
          <div className="absolute inset-0 pointer-events-none opacity-10" style={{ background: `linear-gradient(to bottom, ${moodColor}22, transparent)` }}></div>

          {/* Pitch indicator (abstract visual) */}
          <div className="relative w-full h-full flex flex-col justify-around py-gutter pointer-events-none z-10 opacity-20 select-none">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="border-b border-outline-variant/30 w-full text-right pr-gutter font-label-mono text-[8px] text-on-surface-variant">
                {['▁','▂','▃','▄','▅','▆','▇','█'][i]}
              </div>
            ))}
          </div>

          {/* Dynamic Playhead */}
          <div id="playhead" style={{ top: `${playheadTop}%` }} className="absolute left-0 w-full flex items-center justify-center transition-all duration-75 pointer-events-none z-20">
            <div className="w-full h-[1.5px]" style={{ backgroundColor: moodColor, boxShadow: `0 0 8px ${moodColor}88` }}></div>
            <div className="absolute bg-[#131315]/95 border px-6 py-3" style={{ borderColor: moodColor, boxShadow: `0 0 15px ${moodColor}44` }}>
              <span className="font-display-lg text-4xl font-bold tracking-tighter" style={{ color: moodColor }} id="note-display">
                ●
              </span>
            </div>
            <div className="absolute -top-10 -bottom-10 w-[1px]" style={{ backgroundColor: `${moodColor}33` }}></div>
          </div>
        </div>

        {/* RIGHT: VOLUME METER */}
        <div className="absolute right-zone-padding top-1/2 -translate-y-1/2 flex flex-col items-center gap-stack-md z-20">
          <h3 className="font-label-mono text-[10px] text-on-surface-variant [writing-mode:vertical-lr] rotate-180 mb-stack-md uppercase tracking-widest">AMPLITUDE</h3>
          <div className="relative w-12 h-64 bg-surface-container/60 border border-outline-variant overflow-hidden">
            <div id="volume-fill" style={{ height: `${currentVol}%`, backgroundColor: moodColor, boxShadow: `0 0 15px ${moodColor}66` }} className="absolute bottom-0 left-0 w-full transition-all duration-100"></div>
            <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: "linear-gradient(0deg, transparent 90%, #131315 90%)", backgroundSize: "100% 12px;" }}></div>
          </div>
          <span className="font-label-mono text-[11px] font-bold mt-1" style={{ color: moodColor }} id="volume-val">
            {!isArmed ? 'SILENT' : 'PLAY ARMED'}
          </span>
        </div>

        <MotionReticle x={rReticleX} y={rReticleY} visible={rVisible} colorClass="text-surface-tint" label="R-PLAY" />
        <MotionReticle x={lReticleX} y={lReticleY} visible={lVisible} colorClass="text-[#d600ff]" label="L-MOOD" />
      </main>

      <InstrumentSwitcherDock />
      {showGuide && (
        <div className="fixed right-4 top-24 z-[60] w-72 max-h-[70vh] overflow-y-auto">
          <GestureGuide instrument="theremin" />
        </div>
      )}
    </div>
  );
};
