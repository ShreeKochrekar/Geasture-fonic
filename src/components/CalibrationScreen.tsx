import React, { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import type { TrackingResult } from '../tracking/handLandmarker';

interface CalibrationScreenProps {
  trackingResult: TrackingResult | null;
}

export const CalibrationScreen: React.FC<CalibrationScreenProps> = ({ trackingResult }) => {
  const {
    calibrationStep,
    saveCalibrationPoint,
    setCalibrationStep,
  } = useAppStore();

  const leftHand = trackingResult?.hands.find((h) => h.handedness === 'Left');
  const rightHand = trackingResult?.hands.find((h) => h.handedness === 'Right');

  // Handle save action
  const handleSave = () => {
    if (calibrationStep === 'high' || calibrationStep === 'low') {
      const leftCoords = leftHand ? { x: leftHand.landmarks[8].x, y: leftHand.landmarks[8].y } : null;
      const rightCoords = rightHand ? { x: rightHand.landmarks[8].x, y: rightHand.landmarks[8].y } : null;
      saveCalibrationPoint(calibrationStep, leftCoords, rightCoords);
    }
  };

  const handleSkip = () => {
    setCalibrationStep('none');
  };

  // Keyboard shortcut: Spacebar triggers the calibration capture
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleSave();
      } else if (e.code === 'Escape') {
        setCalibrationStep('none');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [calibrationStep, leftHand, rightHand]);

  if (calibrationStep === 'none') return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-between p-margin-safe bg-[#0a0a0c]/90 backdrop-blur-xl text-center border border-outline-variant/30 select-none">
      
      {/* Top skip options */}
      <div className="w-full flex justify-end">
        <button
          onClick={handleSkip}
          className="px-4 py-2 border border-outline-variant/30 hover:border-primary text-on-surface-variant hover:text-primary font-label-mono text-[10px] tracking-wider uppercase transition-colors"
        >
          [ SKIP CALIBRATION ]
        </button>
      </div>

      {/* Step Header */}
      <div className="w-full flex flex-col items-center">
        <span className="font-label-mono text-[10px] font-bold tracking-widest text-primary border border-primary/20 bg-primary/5 px-3 py-1 uppercase mb-4">
          SYSTEM CALIBRATION // STEP {calibrationStep === 'high' ? '01_HIGH' : '02_LOW'}
        </span>
        <h2 className="font-display-lg text-headline-md text-primary drop-shadow-[0_0_8px_rgba(0,219,231,0.5)]">
          {calibrationStep === 'high' ? 'Calibrate Your High Point' : 'Calibrate Your Low Point'}
        </h2>
        <p className="font-body-lg text-on-surface-variant text-sm max-w-md mt-3 leading-relaxed opacity-80">
          {calibrationStep === 'high'
            ? 'Raise your hand(s) to the top of your comfortable physical range (e.g. shoulder height).'
            : 'Now lower your hand(s) to the bottom of your comfortable range (e.g. chest height).'}
        </p>
      </div>

      {/* Telemetry Visualizer */}
      <div className="w-full max-w-sm flex flex-col gap-4 p-5 bg-surface-container/20 backdrop-blur-xl border border-outline-variant/30 corner-bracket relative">
        {/* Corner Brackets */}
        <div className="absolute top-[-1px] left-[-1px] w-2.5 h-2.5 border-t-2 border-l-2 border-primary pointer-events-none"></div>
        <div className="absolute top-[-1px] right-[-1px] w-2.5 h-2.5 border-t-2 border-r-2 border-primary pointer-events-none"></div>
        <div className="absolute bottom-[-1px] left-[-1px] w-2.5 h-2.5 border-b-2 border-l-2 border-primary pointer-events-none"></div>
        <div className="absolute bottom-[-1px] right-[-1px] w-2.5 h-2.5 border-b-2 border-r-2 border-primary pointer-events-none"></div>

        <div className="flex justify-between items-center font-label-mono text-[9px] text-on-surface-variant tracking-wider uppercase">
          <span>LEFT_TRACKER_Y</span>
          <span>RIGHT_TRACKER_Y</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Left Hand Indicator */}
          <div className="flex flex-col items-center p-4 bg-surface-container-lowest/80 border border-outline-variant/20">
            <span className={`w-2.5 h-2.5 rounded-full mb-3 block ${
              leftHand ? 'bg-[#00dbe7] shadow-[0_0_8px_#00dbe7]' : 'bg-rose-500'
            }`} />
            <span className="font-label-mono text-[10px] text-zinc-300">
              {leftHand ? `Y: ${(leftHand.landmarks[8].y * 100).toFixed(1)}%` : 'OFFLINE'}
            </span>
          </div>

          {/* Right Hand Indicator */}
          <div className="flex flex-col items-center p-4 bg-surface-container-lowest/80 border border-outline-variant/20">
            <span className={`w-2.5 h-2.5 rounded-full mb-3 block ${
              rightHand ? 'bg-[#00dbe7] shadow-[0_0_8px_#00dbe7]' : 'bg-rose-500'
            }`} />
            <span className="font-label-mono text-[10px] text-zinc-300">
              {rightHand ? `Y: ${(rightHand.landmarks[8].y * 100).toFixed(1)}%` : 'OFFLINE'}
            </span>
          </div>
        </div>

        {(!leftHand && !rightHand) && (
          <div className="font-label-mono text-[9px] text-rose-400 mt-2 border border-rose-500/20 bg-rose-500/5 p-3">
            WARNING: NO SPATIAL INPUT DETECTED. POSITION HANDS IN VIEWPORT.
          </div>
        )}
      </div>

      {/* Action CTA */}
      <div className="w-full flex flex-col items-center gap-3 mt-4">
        <button
          onClick={handleSave}
          disabled={!leftHand && !rightHand}
          className="w-full max-w-xs py-4 bg-primary-container text-on-primary-container font-label-bold text-sm tracking-wider rounded-none hover:shadow-[0_0_20px_rgba(0,219,231,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all uppercase"
        >
          {calibrationStep === 'high' ? '[ SET HIGH BOUND ]' : '[ SET LOW BOUND ]'}
        </button>

        <div className="font-label-mono text-[10px] text-on-surface-variant opacity-60 mt-2">
          PRESS <kbd className="px-1 py-0.5 bg-surface-container border border-outline-variant/25 text-white font-mono text-[9px]">SPACEBAR</kbd> TO CAPTURE // <kbd className="px-1 py-0.5 bg-surface-container border border-outline-variant/25 text-white font-mono text-[9px]">ESC</kbd> TO EXIT
        </div>
      </div>
    </div>
  );
};
