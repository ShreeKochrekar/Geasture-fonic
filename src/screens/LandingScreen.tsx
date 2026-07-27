import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import type { InstrumentType } from '../store/appStore';
import { InstrumentSwitcherDock } from '../components/InstrumentSwitcherDock';
import { GestureGuide, LearningLessons } from '../components/GestureGuide';

interface LandingScreenProps {
  onStartSession: (instrument?: string) => void;
  errorMsg?: string | null;
  isMobile?: boolean;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onStartSession, errorMsg, isMobile }) => {
  const { activeInstrument, setInstrument, isModelLoaded } = useAppStore();
  const [showLessons, setShowLessons] = useState(false);

  const handleSelectInstrument = (inst: InstrumentType) => {
    setInstrument(inst);
  };

  const getBorderClass = (inst: InstrumentType, activeClass: string, defaultClass: string) => {
    return activeInstrument === inst ? activeClass : defaultClass;
  };

  return (
    <div className="relative z-10 pt-32 pb-28 px-zone-padding max-w-7xl mx-auto flex flex-col items-center min-h-screen">
      {/* Mobile Warning */}
      {isMobile && (
        <div className="mb-6 p-3.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-300 text-xs max-w-lg flex items-start gap-3 text-left">
          <span className="text-amber-400 shrink-0 mt-0.5">⚠</span>
          <div>
            <strong className="font-semibold block mb-0.5">Mobile Warning</strong>
            High-speed vision models require high CPU performance. For a lag-free experience, a laptop/desktop is recommended.
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs max-w-lg">
          {errorMsg}
        </div>
      )}

      {/* Hero Section */}
      <header className="text-center mb-8 space-y-stack-md">
        <div className="inline-block px-gutter py-1 rounded-full border border-primary/20 bg-primary/5 font-label-mono text-label-mono text-primary uppercase tracking-widest mb-unit">
          System Online // v2.4.0 Engine
        </div>
        <h1 className="font-display-lg text-display-lg text-primary glow-cyan max-w-4xl mx-auto leading-tight">
          Play music with your hands.
        </h1>
        <p className="font-body-lg text-on-surface-variant max-w-xl mx-auto opacity-80">
          Experience the next evolution of digital instrumentation. Use real-time hand tracking to manipulate synthesis, rhythms, and soundscapes in mid-air.
        </p>
        <div className="pt-stack-md">
          <button
            onClick={() => onStartSession()}
            disabled={!isModelLoaded}
            className="group relative px-10 py-5 bg-primary-container text-on-primary-container font-label-bold text-lg rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,242,255,0.4)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="relative z-10 flex items-center gap-stack-sm text-black">
              {!isModelLoaded ? 'LOADING ENGINE...' : 'START SESSION'}
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                play_arrow
              </span>
            </span>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </div>
      </header>

      {/* Toggle Lessons Button */}
      <div className="flex justify-center gap-3 mb-8">
        <button
          onClick={() => setShowLessons(!showLessons)}
          className={`px-4 py-2 border font-label-mono text-[10px] uppercase tracking-wider transition-colors ${
            showLessons
              ? 'border-amber-400/50 text-amber-400 bg-amber-400/5'
              : 'border-outline-variant/30 text-on-surface-variant hover:border-primary/30'
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">{showLessons ? 'close' : 'school'}</span>
            {showLessons ? 'Hide Guide' : 'Show Gesture Guide & Lessons'}
          </span>
        </button>
      </div>

      {/* Gesture Guide + Learning Lessons Panel */}
      {showLessons && (
        <div className="w-full max-w-5xl mx-auto mb-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GestureGuide instrument={activeInstrument} />
          <LearningLessons />
        </div>
      )}

      {/* Instruments Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter w-full">
        {/* Theremin Card (Cyan/Melodic) */}
        <div
          onClick={() => handleSelectInstrument('theremin')}
          className={`instrument-card group relative aspect-[4/3] p-8 rounded-xl bg-surface-container/20 backdrop-blur-xl border cursor-pointer corner-bracket text-surface-tint ${getBorderClass(
            'theremin',
            'border-primary-container shadow-[0_0_20px_rgba(0,242,255,0.3)]',
            'border-outline-variant/30'
          )}`}
        >
          <div className="flex justify-between items-start mb-auto">
            <span className="font-label-mono text-label-mono opacity-60">ID: TH-01</span>
            <span className="material-symbols-outlined glow-cyan" data-icon="waves">waves</span>
          </div>
          <div className="mt-8">
            <h3 className="font-headline-md text-headline-md text-primary mb-unit">Theremin</h3>
            <p className="font-label-mono text-label-mono text-on-surface-variant">MELODIC // HIGH FREQUENCY</p>
          </div>
          {/* Gesture Visualization Placeholder */}
          <div className="mt-8 flex justify-center">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 border border-primary/20 rounded-full animate-pulse"></div>
              <div className="absolute inset-4 border border-primary/40 rounded-full"></div>
              <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl text-primary" data-icon="back_hand">back_hand</span>
            </div>
          </div>
        </div>

        {/* Air Drums Card (Orange/Percussive) */}
        <div
          onClick={() => handleSelectInstrument('drums')}
          className={`instrument-card group relative aspect-[4/3] p-8 rounded-xl bg-surface-container/20 backdrop-blur-xl border cursor-pointer corner-bracket text-secondary-container ${getBorderClass(
            'drums',
            'border-[#fd8b00] shadow-[0_0_20px_rgba(253,139,0,0.3)]',
            'border-outline-variant/30'
          )}`}
        >
          <div className="flex justify-between items-start mb-auto">
            <span className="font-label-mono text-label-mono opacity-60">ID: DR-02</span>
            <span className="material-symbols-outlined glow-orange" data-icon="grid_view">grid_view</span>
          </div>
          <div className="mt-8">
            <h3 className="font-headline-md text-headline-md text-secondary mb-unit">Air Drums</h3>
            <p className="font-label-mono text-label-mono text-on-surface-variant">PERCUSSIVE // QUADRANTS</p>
          </div>
          <div className="mt-8 flex justify-center gap-gutter">
            <div className="w-16 h-16 border border-secondary/20 rounded-lg flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined" data-icon="front_hand">front_hand</span>
            </div>
            <div className="w-16 h-16 border border-secondary/20 rounded-lg flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined" data-icon="front_hand" style={{ transform: "scaleX(-1)" }}>front_hand</span>
            </div>
          </div>
        </div>

        {/* Air Piano Card (Cyan/Melodic) */}
        <div
          onClick={() => handleSelectInstrument('piano')}
          className={`instrument-card group relative aspect-[4/3] p-8 rounded-xl bg-surface-container/20 backdrop-blur-xl border cursor-pointer corner-bracket text-surface-tint ${getBorderClass(
            'piano',
            'border-primary-container shadow-[0_0_20px_rgba(0,242,255,0.3)]',
            'border-outline-variant/30'
          )}`}
        >
          <div className="flex justify-between items-start mb-auto">
            <span className="font-label-mono text-label-mono opacity-60">ID: PN-03</span>
            <span className="material-symbols-outlined glow-cyan" data-icon="piano">piano</span>
          </div>
          <div className="mt-8">
            <h3 className="font-headline-md text-headline-md text-primary mb-unit">Air Piano</h3>
            <p className="font-label-mono text-label-mono text-on-surface-variant">MELODIC // SUSTAINED PAD</p>
          </div>
          <div className="mt-8 space-y-unit">
            <div className="h-1 bg-primary/10 w-full overflow-hidden">
              <div className="h-full bg-primary w-1/3 animate-[shimmer_2s_infinite]"></div>
            </div>
            <div className="h-1 bg-primary/10 w-3/4"></div>
            <div className="h-1 bg-primary/10 w-full"></div>
          </div>
        </div>

        {/* Guitar Card (Magenta/Melodic) */}
        <div
          onClick={() => handleSelectInstrument('guitar')}
          className={`instrument-card group relative aspect-[4/3] p-8 rounded-xl bg-surface-container/20 backdrop-blur-xl border cursor-pointer corner-bracket text-on-tertiary-container ${getBorderClass(
            'guitar',
            'border-[#d600ff] shadow-[0_0_20px_rgba(214,0,255,0.3)]',
            'border-outline-variant/30'
          )}`}
        >
          <div className="flex justify-between items-start mb-auto">
            <span className="font-label-mono text-label-mono opacity-60">ID: GT-04</span>
            <span className="material-symbols-outlined glow-magenta" data-icon="straighten">straighten</span>
          </div>
          <div className="mt-8">
            <h3 className="font-headline-md text-headline-md text-tertiary-fixed-dim mb-unit">Guitar</h3>
            <p className="font-label-mono text-label-mono text-on-surface-variant">MELODIC // STRUM ONLY</p>
          </div>
          <div className="mt-8 flex flex-col gap-unit">
            <div className="w-full h-[2px] bg-tertiary-fixed-dim/40"></div>
            <div className="w-full h-[2px] bg-tertiary-fixed-dim/40"></div>
            <div className="w-full h-[2px] bg-tertiary-fixed-dim/40"></div>
          </div>
        </div>

        {/* Tabla Card (Orange/Percussive) */}
        <div
          onClick={() => handleSelectInstrument('tabla')}
          className={`instrument-card group relative aspect-[4/3] p-8 rounded-xl bg-surface-container/20 backdrop-blur-xl border cursor-pointer corner-bracket text-secondary-container ${getBorderClass(
            'tabla',
            'border-[#fd8b00] shadow-[0_0_20px_rgba(253,139,0,0.3)]',
            'border-outline-variant/30'
          )}`}
        >
          <div className="flex justify-between items-start mb-auto">
            <span className="font-label-mono text-label-mono opacity-60">ID: TB-05</span>
            <span className="material-symbols-outlined glow-orange" data-icon="graphic_eq">graphic_eq</span>
          </div>
          <div className="mt-8">
            <h3 className="font-headline-md text-headline-md text-secondary mb-unit">Tabla</h3>
            <p className="font-label-mono text-label-mono text-on-surface-variant">PERCUSSIVE // RESONANT</p>
          </div>
          <div className="mt-8 flex justify-center gap-8 relative">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-secondary/40 animate-[spin_10s_linear_infinite]"></div>
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-secondary/40 animate-[spin_15s_linear_infinite_reverse]"></div>
          </div>
        </div>

        {/* Custom Instrument (Neutral) */}
        <div className="instrument-card group relative aspect-[4/3] p-8 rounded-xl bg-surface-container/10 backdrop-blur-xl border border-outline-variant/20 border-dashed corner-bracket">
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4" data-icon="add_circle">add_circle</span>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-unit">Create Mapping</h3>
            <p className="font-label-mono text-label-mono text-on-surface-variant">MAP MIDI TO GESTURE</p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Dock (visible on mobile, hidden on desktop) */}
      <InstrumentSwitcherDock />
    </div>
  );
};
