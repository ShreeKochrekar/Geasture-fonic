import { useRef, useState, useEffect, useCallback } from 'react';
import { useAppStore } from './store/appStore';
import { initHandLandmarker, startTracking, stopTracking } from './tracking/handLandmarker';
import type { TrackingResult } from './tracking/handLandmarker';
import { routeLandmarksToAudio } from './instruments';
import { initAudioEngine } from './audio/toneEngine';

// Import Screens
import { LandingScreen } from './screens/LandingScreen';
import { ThereminPlayScreen } from './screens/ThereminPlayScreen';
import { AirDrumsPlayScreen } from './screens/AirDrumsPlayScreen';
import { AirPianoPlayScreen } from './screens/AirPianoPlayScreen';
import { GuitarPlayScreen } from './screens/GuitarPlayScreen';
import { TablaPlayScreen } from './screens/TablaPlayScreen';

// Import Overlays
import { DebugOverlay } from './components/DebugOverlay';
import { CalibrationScreen } from './components/CalibrationScreen';
import { SettingsDrawer } from './components/SettingsDrawer';
import { SelfViewCamera } from './components/SelfViewCamera';
import { InstrumentSwitchOverlay, detectInstrumentSwitchGesture } from './components/InstrumentSwitchOverlay';

// Mobile detection helper
function detectMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || '';
  return /android|ipad|iphone|ipod/i.test(ua);
}

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isMobile] = useState<boolean>(detectMobile);
  const [showInstrumentSwitch, setShowInstrumentSwitch] = useState(false);
  const [switchGestureState, setSwitchGestureState] = useState<'idle' | 'holding' | 'triggered'>('idle');

  const {
    activeInstrument,
    isAudioStarted,
    startAudio,
    startCalibration,
    calibrationStep,
  } = useAppStore();

  // Track window resizing
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pre-load MediaPipe HandLandmarker
  useEffect(() => {
    const loadModel = async () => {
      try {
        await initHandLandmarker();
      } catch (err) {
        console.error('HandLandmarker load failure:', err);
      }
    };
    loadModel();

    return () => {
      stopTracking();
    };
  }, []);

  // Handle gesture-based instrument switch detection
  const handleTrackingResult = useCallback((result: TrackingResult) => {
    setTrackingResult(result);
    
    // Route landmarks to audio
    routeLandmarksToAudio(result);
    
    // Check for instrument switch gesture
    if (isAudioStarted && calibrationStep === 'none') {
      const leftHand = result.hands.find((h) => h.handedness === 'Left');
      const rightHand = result.hands.find((h) => h.handedness === 'Right');
      
      const gestureState = detectInstrumentSwitchGesture(
        leftHand ? { landmarks: leftHand.landmarks } : undefined,
        rightHand ? { landmarks: rightHand.landmarks } : undefined,
        result.timestamp
      );
      
      setSwitchGestureState(gestureState);
      
      if (gestureState === 'triggered' && !showInstrumentSwitch) {
        setShowInstrumentSwitch(true);
      }
    }
  }, [isAudioStarted, calibrationStep, showInstrumentSwitch]);

  const handleStartSession = async (instrument?: string) => {
    // If an instrument was selected from the landing card, set it
    if (instrument) {
      useAppStore.getState().setInstrument(instrument as any);
    }

    // 1. Initialize Tone.js (Web Audio Context requires user interaction)
    try {
      await initAudioEngine();
      startAudio();
    } catch (err) {
      console.error('Audio engine start failed:', err);
      setErrorMsg('Could not initialize Tone.js. Please check your browser audio support.');
      return;
    }

    // 2. Request webcam access
    if (!videoRef.current) return;

    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play();
        setCameraActive(true);
        // Auto-start calibration flow
        startCalibration();
        // Start tracking landmarks loop
        if (videoRef.current) {
          startTracking(videoRef.current, handleTrackingResult);
        }
      };
    } catch (err) {
      console.error('Webcam access error:', err);
      setErrorMsg('Could not access webcam. Please check camera permissions.');
    }
  };

  // Render play screen based on active selection
  const renderActivePlayScreen = () => {
    const props = {
      trackingResult,
      onOpenSettings: () => setIsSettingsOpen(true),
    };

    switch (activeInstrument) {
      case 'theremin':
        return <ThereminPlayScreen {...props} />;
      case 'drums':
        return <AirDrumsPlayScreen {...props} />;
      case 'piano':
        return <AirPianoPlayScreen {...props} />;
      case 'guitar':
        return <GuitarPlayScreen {...props} />;
      case 'tabla':
        return <TablaPlayScreen {...props} />;
      default:
        return <ThereminPlayScreen {...props} />;
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#0a0a0c] text-white overflow-y-auto overflow-x-hidden">
      
      {/* Global Background grids & scanlines */}
      <div className="fixed inset-0 grid-lines pointer-events-none z-0"></div>
      <div className="fixed inset-0 scanline pointer-events-none z-0 opacity-30"></div>

      {/* Mobile Warning Banner */}
      {isMobile && cameraActive && (
        <div className="fixed top-0 left-0 w-full z-[100] bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-amber-300 font-label-mono text-[10px] text-center tracking-wider">
          ⚠ MOBILE DEVICE DETECTED — Performance may be limited. For best experience, use a desktop/laptop.
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="fixed top-0 left-0 w-full z-[100] bg-rose-500/10 border-b border-rose-500/20 px-4 py-2 text-rose-300 font-label-mono text-[10px] text-center tracking-wider">
          ⚠ {errorMsg}
        </div>
      )}

      {/* Real Live Webcam Feed, grayscale and 20% opacity */}
      <video
        ref={videoRef}
        className="fixed inset-0 w-full h-full object-cover scale-x-[-1] opacity-20 grayscale pointer-events-none z-0"
        playsInline
        muted
      />

      {/* Self-View Camera Window (persistent during play screens) */}
      {isAudioStarted && cameraActive && (
        <SelfViewCamera trackingResult={trackingResult} />
      )}

      {/* Gesture Switch Progress Indicator */}
      {switchGestureState === 'holding' && isAudioStarted && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] flex flex-col items-center gap-2 pointer-events-none">
          <svg className="w-16 h-16" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(0,219,231,0.2)" strokeWidth="4" />
            <circle
              cx="50" cy="50" r="44"
              fill="none"
              stroke="#00dbe7"
              strokeWidth="4"
              strokeDasharray="276.46"
              strokeDashoffset={276.46 * 0.2}
              strokeLinecap="round"
              transform="rotate(-90, 50, 50)"
              className="animate-[spin_2s_linear_infinite]"
            />
          </svg>
          <span className="font-label-mono text-[10px] text-primary uppercase tracking-widest animate-pulse">
            Switch instrument
          </span>
        </div>
      )}

      {/* Instrument Switch Overlay */}
      {showInstrumentSwitch && (
        <InstrumentSwitchOverlay onClose={() => setShowInstrumentSwitch(false)} />
      )}

      {/* Skeletal tracking overlay overlaying full screen */}
      {cameraActive && (
        <DebugOverlay
          trackingResult={trackingResult}
          width={dimensions.width}
          height={dimensions.height}
        />
      )}

      {/* Calibration panel overlay - shows when camera is active and calibrating */}
      {cameraActive && calibrationStep !== 'none' && (
        <CalibrationScreen trackingResult={trackingResult} />
      )}

      {/* Settings Panel sidebar drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Routing switcher */}
      {!isAudioStarted ? (
        <LandingScreen 
          onStartSession={(inst?: string) => { handleStartSession(inst); }} 
          errorMsg={errorMsg}
          isMobile={isMobile}
        />
      ) : (
        renderActivePlayScreen()
      )}
    </div>
  );
}

export default App;
