import React, { useState, useEffect } from 'react';
import type { TrackingResult } from '../tracking/handLandmarker';
import { useAppStore } from '../store/appStore';
import { InstrumentSwitcherDock } from '../components/InstrumentSwitcherDock';
import { MotionReticle } from '../components/MotionReticle';
import { GestureGuide } from '../components/GestureGuide';
import { 
  getCurrentMood, 
  getCurrentPattern, 
  MOOD_NAMES, 
  MOOD_COLORS, 
  PATTERN_NAMES,
  TABLA_MOOD_CONFIGS,
  isRightHandArmed
} from '../tracking/moodGestures';

interface TablaPlayScreenProps {
  trackingResult: TrackingResult | null;
  onOpenSettings: () => void;
}

interface HitLog {
  id: string;
  time: string;
  zone: 'BAYAN' | 'DAYAN';
  velocity: number;
}

export const TablaPlayScreen: React.FC<TablaPlayScreenProps> = ({ trackingResult, onOpenSettings }) => {
  const { showDebug, toggleDebug } = useAppStore();
  const [hitLogs, setHitLogs] = useState<HitLog[]>([]);
  const [showGuide, setShowGuide] = useState(false);

  const leftHand = trackingResult?.hands.find((h) => h.handedness === 'Left');
  const rightHand = trackingResult?.hands.find((h) => h.handedness === 'Right');

  let lReticleX = 33;
  let lReticleY = 60;
  let lVisible = false;
  let rReticleX = 67;
  let rReticleY = 60;
  let rVisible = false;

  const BAYAN_CX = 33;
  const BAYAN_CY = 60;
  const DAYAN_CX = 67;
  const DAYAN_CY = 60;

  let bayanActive = false;
  let bayanVel = 0;
  let dayanActive = false;
  let dayanVel = 0;

  // Mood & Pattern & State
  const mood = getCurrentMood();
  const pattern = getCurrentPattern();
  const moodColor = MOOD_COLORS[mood];
  const moodName = MOOD_NAMES[mood];
  const patternName = PATTERN_NAMES[pattern];
  const tablaConfig = TABLA_MOOD_CONFIGS[mood];
  const isArmed = isRightHandArmed(rightHand);

  if (leftHand && leftHand.landmarks.length > 0) {
    const tip = leftHand.landmarks[8];
    lReticleX = (1 - tip.x) * 100;
    lReticleY = tip.y * 100;
    lVisible = true;
  }

  // Only the right hand triggers playing and visual active zones when armed
  if (rightHand && rightHand.landmarks.length > 0 && isArmed) {
    const tip = rightHand.landmarks[8];
    rReticleX = (1 - tip.x) * 100;
    rReticleY = tip.y * 100;
    rVisible = true;
    
    const screenX = 1 - tip.x;
    const distBayan = Math.sqrt(Math.pow(rReticleX - BAYAN_CX, 2) + Math.pow(rReticleY - BAYAN_CY, 2));
    const distDayan = Math.sqrt(Math.pow(rReticleX - DAYAN_CX, 2) + Math.pow(rReticleY - DAYAN_CY, 2));

    if (screenX < 0.5) {
      bayanActive = true;
      bayanVel = Math.round(92 - distBayan * 1.2);
    } else {
      dayanActive = true;
      dayanVel = Math.round(96 - distDayan * 1.5);
    }
  }

  const prevBayanActive = React.useRef(false);
  const prevDayanActive = React.useRef(false);

  useEffect(() => {
    if (bayanActive && !prevBayanActive.current) addLog('BAYAN', bayanVel || 85);
    prevBayanActive.current = bayanActive;
  }, [bayanActive]);

  useEffect(() => {
    if (dayanActive && !prevDayanActive.current) addLog('DAYAN', dayanVel || 90);
    prevDayanActive.current = dayanActive;
  }, [dayanActive]);

  const addLog = (zone: 'BAYAN' | 'DAYAN', velocity: number) => {
    const now = new Date();
    setHitLogs((prev) => [{
      id: Math.random().toString(),
      time: now.toTimeString().split(' ')[0],
      zone, velocity,
    }, ...prev.slice(0, 4)]);
  };

  return (
    <div className="bg-surface-dim text-on-surface overflow-hidden h-screen w-screen selection:bg-primary-container selection:text-on-primary-container relative font-body-lg select-none">
      
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter py-unit bg-gradient-to-b from-surface-dim to-transparent">
        <div className="flex items-center gap-4">
          <span className="font-display-mobile text-display-mobile font-bold tracking-tighter text-primary drop-shadow-[0_0_8px_rgba(0,219,231,0.6)]">
            GestureFonic
          </span>
          <div className="hidden md:flex gap-gutter items-center border-l border-outline-variant/30 pl-4 text-[10px]">
            <span className="font-label-mono text-label-mono text-on-surface-variant">VIRTUAL_ENGINE_V2.4</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#00dbe7]"></div>
              <span className="font-label-mono text-label-mono text-primary">LIVE READY</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setShowGuide(!showGuide)}
            className={`material-symbols-outlined transition-colors p-2 rounded-full ${showGuide ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
            title="Gesture Guide">gesture</button>
          <button onClick={onOpenSettings}
            className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full">tune</button>
          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full">account_circle</button>
        </div>
      </header>

      {/* Mood HUD */}
      <aside className="fixed top-24 left-gutter z-40 glass-panel p-3 rounded-lg min-w-[160px]">
        <p className="font-label-mono text-[9px] text-on-surface-variant uppercase tracking-wider font-bold">HUD READOUT</p>
        <div className="flex flex-col gap-1.5 mt-1 font-label-mono text-[10px]">
          <div className="flex justify-between">
            <span className="text-on-surface-variant">MOOD:</span>
            <span className="font-bold" style={{ color: moodColor }}>{moodName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">TONE:</span>
            <span className="font-bold" style={{ color: moodColor }}>{tablaConfig.name}</span>
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
      </aside>

      {/* Main performance rings */}
      <main className="relative w-full h-full flex items-center justify-center pt-20 pb-24 z-10">
        <div className="relative w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-zone-padding px-zone-padding h-full items-center">
          
          {/* Left Zone: Bayan */}
          <div className="relative flex flex-col items-center justify-center group" id="zone-bayan">
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-150 ${bayanActive ? 'opacity-100' : 'opacity-0'}`}>
              <div className="w-[80%] h-[80%] rounded-full border-4 border-primary/20 blur-xl"></div>
            </div>
            <div style={{ width: '18rem', height: '18rem' }}
              className={`relative rounded-full border-2 glass-panel flex items-center justify-center transition-all duration-300 ${
                bayanActive ? 'border-primary scale-105 shadow-[inset_0_0_30px_rgba(0,219,231,0.3)] shadow-[0_0_20px_rgba(0,219,231,0.25)]' : 'border-primary/40 hover:scale-102 hover:border-primary/60'
              }`}
            >
              <div className="absolute inset-4 rounded-full border border-primary/20 flex items-center justify-center">
                <div className="text-center">
                  <span className="font-display-lg text-4xl md:text-5xl font-bold text-primary drop-shadow-[0_0_10px_rgba(0,219,231,0.5)]">BAYAN</span>
                  <div className="mt-2 font-label-mono text-[9px] text-on-surface-variant tracking-[0.2em] uppercase">BASS</div>
                </div>
              </div>
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary"></div>
            </div>
          </div>

          {/* Right Zone: Dayan */}
          <div className="relative flex flex-col items-center justify-center group" id="zone-dayan">
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-150 ${dayanActive ? 'opacity-100' : 'opacity-0'}`}>
              <div className="w-[80%] h-[80%] rounded-full border-4 border-secondary/20 blur-xl"></div>
            </div>
            <div style={{ width: '18rem', height: '18rem' }}
              className={`relative rounded-full border-2 glass-panel flex items-center justify-center transition-all duration-300 ${
                dayanActive ? 'border-secondary scale-105 shadow-[inset_0_0_30px_rgba(253,139,0,0.3)] shadow-[0_0_20px_rgba(253,139,0,0.25)]' : 'border-secondary/40 hover:scale-102 hover:border-secondary/60'
              }`}
            >
              <div className="absolute inset-4 rounded-full border border-secondary/20 flex items-center justify-center">
                <div className="text-center">
                  <span className="font-display-lg text-4xl md:text-5xl font-bold text-secondary drop-shadow-[0_0_10px_rgba(253,139,0,0.5)]">DAYAN</span>
                  <div className="mt-2 font-label-mono text-[9px] text-on-surface-variant tracking-[0.2em] uppercase">TREBLE</div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-secondary"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-secondary"></div>
            </div>
          </div>
        </div>

        {/* Side HUD */}
        <aside className="fixed bottom-gutter right-gutter z-50 glass-panel p-gutter rounded-xl w-64 shadow-[0_4px_24px_rgba(0,0,0,0.5)] border border-outline-variant/20 bg-background/80">
          <div className="flex justify-between items-center mb-stack-md border-b border-outline-variant/10 pb-2">
            <span className="font-label-bold text-[10px] text-primary tracking-widest uppercase">Performance HUD</span>
          </div>
          <div className="space-y-gutter mt-3">
            <div>
              <div className="flex justify-between font-label-mono text-[10px] text-on-surface-variant mb-2">
                <span>VOLUME</span>
                <span>84%</span>
              </div>
              <div className="h-[2px] bg-surface-variant relative">
                <div className="absolute left-0 h-full bg-primary shadow-[0_0_10px_#00dbe7]" style={{ width: "84%" }}></div>
                <div className="absolute left-[84%] -top-1 w-2 h-2 rotate-45 bg-primary shadow-[0_0_5px_#00dbe7]"></div>
              </div>
            </div>
            <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between">
              <span className="font-label-mono text-[9px] text-on-surface-variant uppercase tracking-wider">HAND SKELETON</span>
              <button onClick={toggleDebug}
                className={`px-2.5 py-1 border rounded font-label-mono text-[9px] transition-colors ${
                  showDebug ? 'border-primary text-primary bg-primary-container/10 font-bold' : 'border-outline-variant text-on-surface-variant hover:bg-surface-variant'
                }`}>
                {showDebug ? '[ ON ]' : '[ OFF ]'}
              </button>
            </div>
          </div>
        </aside>

        {/* Hit Log */}
        <div className="fixed top-24 right-gutter flex flex-col gap-2 pointer-events-none items-end z-40">
          {hitLogs.map((log) => (
            <div key={log.id} style={{ borderLeftColor: log.zone === 'BAYAN' ? '#00dbe7' : '#fd8b00' }}
              className="glass-panel px-3 py-1.5 rounded border-l-2 animate-pulse flex items-center gap-3 bg-[#0a0a0c]/85 border-outline-variant/10 pointer-events-none">
              <span className="font-label-mono text-[9px] text-on-surface-variant">{log.time}</span>
              <span className={`font-label-bold text-[10px] ${log.zone === 'BAYAN' ? 'text-primary' : 'text-secondary'}`}>{log.zone}</span>
              <span className="font-label-mono text-[9px] text-on-surface-variant">VEL: {log.velocity}</span>
            </div>
          ))}
        </div>

        <InstrumentSwitcherDock />
        {showGuide && (
          <div className="fixed right-4 top-24 z-[60] w-72 max-h-[70vh] overflow-y-auto">
            <GestureGuide instrument="tabla" />
          </div>
        )}

        <MotionReticle x={lReticleX} y={lReticleY} visible={lVisible} colorClass="text-surface-tint" label="L-MOOD" />
        <MotionReticle x={rReticleX} y={rReticleY} visible={rVisible} colorClass="text-secondary-container" label="R-PLAY" />
      </main>
    </div>
  );
};
