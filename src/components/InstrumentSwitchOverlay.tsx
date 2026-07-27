import React, { useEffect, useRef, useState } from 'react';
import type { InstrumentType } from '../store/appStore';
import { useAppStore } from '../store/appStore';
import { analyzeHand } from '../tracking/gestureDetector';

interface InstrumentSwitchOverlayProps {
  onClose: () => void;
}

const INSTRUMENTS: { id: InstrumentType; name: string; color: string; icon: string }[] = [
  { id: 'theremin', name: 'Theremin', color: 'border-l-[#00dbe7] text-[#00dbe7]', icon: 'waves' },
  { id: 'drums', name: 'Air Drums', color: 'border-l-[#fd8b00] text-[#fd8b00]', icon: 'grid_view' },
  { id: 'piano', name: 'Air Piano', color: 'border-l-[#00dbe7] text-[#00dbe7]', icon: 'piano' },
  { id: 'guitar', name: 'Guitar', color: 'border-l-[#d600ff] text-[#d600ff]', icon: 'straighten' },
  { id: 'tabla', name: 'Tabla', color: 'border-l-[#fd8b00] text-[#fd8b00]', icon: 'graphic_eq' },
];

// Zone boundaries for each instrument card (5 cards in a horizontal row)
const CARD_ZONES = INSTRUMENTS.map((_, i) => ({
  minX: (i / 5),
  maxX: ((i + 1) / 5),
}));

export const InstrumentSwitchOverlay: React.FC<InstrumentSwitchOverlayProps> = ({ onClose }) => {
  const { setInstrument, activeInstrument } = useAppStore();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [dwellProgress, setDwellProgress] = useState(0);
  const dwellTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const DWELL_TIME = 1500; // ms to dwell on a card to select
  const AUTO_CLOSE_TIME = 3000; // ms to auto-close if no selection

  // Auto-close timer
  useEffect(() => {
    autoCloseTimer.current = setTimeout(() => {
      onClose();
    }, AUTO_CLOSE_TIME);
    return () => {
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    };
  }, [onClose]);

  // Listen for global mouse/touch events to detect which card is hovered
  // This would be driven by tracked hand position in production
  useEffect(() => {
    const handleHandTracking = (e: MouseEvent) => {
      // For now, use mouse position to simulate hand-based selection
      // In the real implementation, this will be driven by trackingResult hand positions
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect) return;

      const relX = (e.clientX - rect.left) / rect.width;
      const relY = (e.clientY - rect.top) / rect.height;

      // Only check if within the card grid area (upper 70% of overlay)
      if (relY < 0.7) {
        const idx = CARD_ZONES.findIndex((z) => relX >= z.minX && relX < z.maxX);
        setHoveredIndex(idx >= 0 ? idx : null);
      } else {
        setHoveredIndex(null);
      }
    };

    window.addEventListener('mousemove', handleHandTracking);
    return () => window.removeEventListener('mousemove', handleHandTracking);
  }, []);

  // Dwell timer for hovered card
  useEffect(() => {
    if (hoveredIndex === null) {
      setDwellProgress(0);
      if (dwellTimer.current) {
        clearInterval(dwellTimer.current);
        dwellTimer.current = null;
      }
      return;
    }

    const startTime = Date.now();
    dwellTimer.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / DWELL_TIME);
      setDwellProgress(progress);

      if (progress >= 1) {
        // Select the instrument
        const instrument = INSTRUMENTS[hoveredIndex];
        if (instrument) {
          setInstrument(instrument.id);
          onClose();
        }
        if (dwellTimer.current) {
          clearInterval(dwellTimer.current);
          dwellTimer.current = null;
        }
      }
    }, 50);

    return () => {
      if (dwellTimer.current) {
        clearInterval(dwellTimer.current);
        dwellTimer.current = null;
      }
    };
  }, [hoveredIndex, setInstrument, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <div
        ref={overlayRef}
        className="w-full max-w-4xl mx-auto px-zone-padding"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-6 py-2 glass-panel rounded-full border border-primary/20">
            <span className="material-symbols-outlined text-primary">gesture</span>
            <span className="font-label-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
              Gesture detected — select instrument
            </span>
            <div className="w-24 h-1 bg-surface-variant/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-100"
                style={{ width: `${(1 - dwellProgress) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Instrument Cards Grid */}
        <div className="grid grid-cols-5 gap-4">
          {INSTRUMENTS.map((inst, idx) => {
            const isHovered = hoveredIndex === idx;
            const isActive = activeInstrument === inst.id;

            return (
              <div
                key={inst.id}
                onClick={() => {
                  setInstrument(inst.id);
                  onClose();
                }}
                className={`relative aspect-[3/4] rounded-xl glass-panel border cursor-pointer transition-all duration-200 flex flex-col items-center justify-center text-center p-4 ${inst.color} ${
                  isHovered
                    ? 'scale-105 shadow-[0_0_30px_rgba(0,219,231,0.3)] border-primary/50'
                    : 'border-outline-variant/20 hover:border-outline-variant/40'
                } ${isActive ? 'ring-2 ring-primary' : ''}`}
              >
                {/* Progress ring for dwell selection */}
                {isHovered && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r="44"
                      fill="none"
                      stroke="rgba(0,219,231,0.2)"
                      strokeWidth="2"
                    />
                    <circle
                      cx="50" cy="50" r="44"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={`${dwellProgress * 276.46} 276.46`}
                      strokeLinecap="round"
                      transform="rotate(-90, 50, 50)"
                      className="transition-all duration-100"
                    />
                  </svg>
                )}

                {/* Icon */}
                <span className="material-symbols-outlined text-3xl mb-3">{inst.icon}</span>
                
                {/* Name */}
                <span className="font-label-bold text-[10px] uppercase tracking-wider">{inst.name}</span>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_rgba(0,219,231,0.8)]"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Dismiss hint */}
        <div className="text-center mt-8">
          <span className="font-label-mono text-[9px] text-on-surface-variant/50 uppercase tracking-wider">
            Move hand to select • Hover to dwell • Auto-dismiss in 3s
          </span>
        </div>
      </div>
    </div>
  );
};

// Gesture detector for both hands open + raised
let holdStartTime = 0;
let isHolding = false;
const HOLD_DURATION = 800; // ms
const UPPER_THIRD_Y = 0.33; // Upper third of frame

export function detectInstrumentSwitchGesture(
  leftHand: { landmarks: any[] } | undefined,
  rightHand: { landmarks: any[] } | undefined,
  timestamp: number
): 'idle' | 'holding' | 'triggered' {
  const bothHandsPresent = leftHand && rightHand;
  if (!bothHandsPresent) {
    holdStartTime = 0;
    isHolding = false;
    return 'idle';
  }

  // Check if both hands are open (4+ fingers extended)
  const leftState = analyzeHand(leftHand!.landmarks);
  const rightState = analyzeHand(rightHand!.landmarks);
  
  const leftOpen = leftState.fingerCount >= 4;
  const rightOpen = rightState.fingerCount >= 4;

  // Check if both hands are in the upper third of the frame
  const leftWrist = leftHand!.landmarks[0];
  const rightWrist = rightHand!.landmarks[0];
  const leftRaised = leftWrist.y < UPPER_THIRD_Y;
  const rightRaised = rightWrist.y < UPPER_THIRD_Y;

  const bothOpenAndRaised = leftOpen && rightOpen && leftRaised && rightRaised;

  if (bothOpenAndRaised) {
    if (!isHolding) {
      holdStartTime = timestamp;
      isHolding = true;
    }
    const elapsed = timestamp - holdStartTime;
    if (elapsed >= HOLD_DURATION) {
      holdStartTime = 0;
      isHolding = false;
      return 'triggered';
    }
    return 'holding';
  } else {
    holdStartTime = 0;
    isHolding = false;
    return 'idle';
  }
}
