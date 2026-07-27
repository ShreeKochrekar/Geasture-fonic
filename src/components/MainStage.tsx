import React, { useRef, useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { initHandLandmarker, startTracking, stopTracking } from '../tracking/handLandmarker';
import type { TrackingResult } from '../tracking/handLandmarker';
import { DebugOverlay } from './DebugOverlay';
import { CalibrationScreen } from './CalibrationScreen';
import { InstrumentSelector } from './InstrumentSelector';
import { Volume2, Sliders, ShieldAlert, Sparkles, Radio, Drum, Keyboard, Music, Disc } from 'lucide-react';
import { initAudioEngine, guitarAudio, setMasterVolume } from '../audio/toneEngine';
import { routeLandmarksToAudio } from '../instruments';

export const MainStage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const {
    activeInstrument,
    isModelLoaded,
    showDebug,
    startAudio,
    toggleDebug,
    startCalibration,
    guitarSubMode,
    guitarTone,
    setGuitarSubMode,
    setGuitarTone,
  } = useAppStore();

  const [volume, setVolume] = useState<number>(-6);

  // Screen/Webcam dimensions
  const width = 640;
  const height = 480;

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      if (/android|ipad|iphone|ipod/i.test(userAgent)) {
        setIsMobile(true);
      }
    };
    checkMobile();
  }, []);

  // Load MediaPipe hand landmarker
  useEffect(() => {
    const loadModel = async () => {
      try {
        await initHandLandmarker();
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to download hand tracking assets. Please check your internet connection.');
      }
    };
    loadModel();

    return () => {
      stopTracking();
    };
  }, []);

  const handleStart = async () => {
    // 1. Initialize Tone.js (Web Audio Context)
    try {
      await initAudioEngine();
      startAudio();
    } catch (err) {
      console.error('Audio engine start failed:', err);
      setErrorMsg('Failed to initialize Tone.js Audio Engine. Please check your browser audio support.');
      return;
    }

    // 2. Request webcam
    if (!videoRef.current) return;

    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: 'user',
        },
        audio: false,
      });

      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play();
        setCameraActive(true);
        // Start tracking landmarks
        if (videoRef.current) {
          startTracking(videoRef.current, (result) => {
            setTrackingResult(result);
            routeLandmarksToAudio(result);
          });
        }
      };
    } catch (err) {
      console.error('Webcam access error:', err);
      setErrorMsg('Could not access webcam. Please ensure camera permissions are granted.');
    }
  };

  const handleStopCamera = () => {
    stopTracking();
    setCameraActive(false);
    setTrackingResult(null);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // ==================== SCREEN 1: LANDING / START SCREEN ====================
  if (!cameraActive) {
    return (
      <div className="min-h-screen bg-[#070709] text-white flex flex-col justify-between px-6 py-12 relative overflow-hidden font-sans">
        
        {/* Subtle decorative futuristic grid backgrounds */}
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-cyan-500/10 to-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Top Header */}
        <header className="max-w-7xl w-full mx-auto flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f2fe] to-[#e056fd] flex items-center justify-center shadow-lg shadow-cyan-500/10 border border-white/10">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div>
              <span className="text-base font-bold tracking-wider font-mono bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">GESTUREFONIC</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full block" style={{
              backgroundColor: isModelLoaded ? '#00b894' : '#ffa800',
              boxShadow: isModelLoaded ? '0 0 10px #00b894' : '0 0 10px #ffa800'
            }} />
            <span className="text-zinc-400 font-medium">
              {isModelLoaded ? 'READY' : 'LOADING DETECTOR...'}
            </span>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-5xl w-full mx-auto flex flex-col items-center text-center my-auto z-10 pt-10">
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tighter bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent uppercase font-mono">
            Play music with <br className="hidden md:inline" />
            <span className="bg-gradient-to-r from-[#00f2fe] via-[#a855f7] to-[#e056fd] bg-clip-text text-transparent">your hands</span>
          </h1>
          <p className="text-zinc-400 max-w-md text-base mt-4 font-medium leading-relaxed">
            A high-performance virtual gesture synthesizer. Wave, strum, strike, and pluck notes in thin air using your webcam.
          </p>

          {/* CTA & Error */}
          <div className="mt-8 flex flex-col items-center gap-4 w-full">
            {isMobile && (
              <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-300 text-xs max-w-sm flex items-start gap-3 text-left">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <strong className="font-semibold block mb-0.5">Mobile Warning</strong>
                  High-speed vision models require high CPU performance. For a lag-free experience, a laptop/desktop is recommended.
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs max-w-md">
                {errorMsg}
              </div>
            )}

            <button
              disabled={!isModelLoaded}
              onClick={handleStart}
              className="px-10 py-4.5 rounded-2xl font-bold bg-gradient-to-r from-[#00f2fe] via-[#0984e3] to-[#e056fd] text-black shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/35 hover:scale-[1.02] active:scale-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 uppercase tracking-widest border border-cyan-400/20"
            >
              {!isModelLoaded ? 'LOADING ENGINE...' : 'Start Session'}
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-16 w-full">
            {[
              { name: 'Theremin', desc: 'Space synth', icon: Radio, gestures: 'Left hand selects mood. Right hand open glides pitch vertically; tilt controls vibrato.', color: 'border-cyan-500/30' },
              { name: 'Air Drums', desc: 'Percussion pads', icon: Drum, gestures: 'Left hand selects kit. Right hand open strikes quadrants to play; tilt adds auto layer.', color: 'border-orange-500/30' },
              { name: 'Air Piano', desc: 'Chord Pad Synth', icon: Keyboard, gestures: 'Left hand selects mood chord voicing. Opening left hand plays and sustains pad; wrist tilt shapes pattern.', color: 'border-purple-500/30' },
              { name: 'Guitar', desc: 'Strum Synthesizer', icon: Music, gestures: 'Left hand selects mood progression. Opening left hand strums; wrist tilt shapes strum speed.', color: 'border-rose-500/30' },
              { name: 'Tabla', desc: 'Bayan & Dayan', icon: Disc, gestures: 'Left hand selects tuning mood. Right hand open strikes left/right half for Bayan/Dayan.', color: 'border-emerald-500/30' }
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className={`glass-panel p-5 text-left border ${card.color} flex flex-col justify-between h-[150px] hover:bg-white/5`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{card.desc}</span>
                    <Icon className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-100 text-sm tracking-wide mb-1">{card.name}</h3>
                    <p className="text-[11px] text-zinc-400 font-medium leading-normal">{card.gestures}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        <footer className="w-full text-center text-xs text-zinc-500 z-10 pt-8 border-t border-white/5">
          GestureFonic is 100% client-side. Hand tracking via MediaPipe. Audio synth via Tone.js.
        </footer>
      </div>
    );
  }

  // ==================== SCREEN 2: MAIN PLAY SCREEN ====================
  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col font-sans">
      
      {/* Header */}
      <header className="border-b border-white/5 px-8 py-3.5 flex items-center justify-between bg-black/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00f2fe] to-[#e056fd] flex items-center justify-center border border-white/10 shadow-lg">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wider font-mono bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent uppercase">
              GestureFonic
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isMobile && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/5 border border-amber-500/20 text-amber-400 text-[10px] font-semibold uppercase tracking-wider">
              <ShieldAlert className="w-3 h-3" />
              <span>LOW FPS RISK</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 block shadow-lg shadow-emerald-500/25" />
            <span className="text-zinc-400 font-semibold tracking-wider uppercase text-[10px]">TRACKER ACTIVE</span>
          </div>
        </div>
      </header>

      {/* Main performance UI grid */}
      <main className="flex-1 container grid grid-cols-1 lg:grid-cols-12 gap-8 items-start py-8">
        
        {/* Left Column: Viewport (mirrored webcam + canvas) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="relative aspect-[4/3] w-full max-w-[720px] mx-auto rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center bg-zinc-950 shadow-2xl">
            
            {/* Webcam video feed, styled as a dark background layer */}
            <video
              ref={videoRef}
              width={width}
              height={height}
              className="absolute w-full h-full object-cover scale-x-[-1] opacity-35 filter brightness-90 contrast-110"
              playsInline
              muted
            />

            {/* Glowing skeletal landmarks and virtual hit zones */}
            {cameraActive && (
              <DebugOverlay
                trackingResult={trackingResult}
                width={width}
                height={height}
              />
            )}

            {/* Calibration Wizard overlay */}
            {cameraActive && (
              <CalibrationScreen trackingResult={trackingResult} />
            )}
          </div>

          {/* Viewport controls (debug view, recalibrate, stop) */}
          {cameraActive && (
            <div className="flex items-center justify-between glass-panel px-6 py-3 max-w-[720px] mx-auto w-full border border-white/5 bg-zinc-900/10">
              <div className="flex gap-3">
                <button
                  onClick={toggleDebug}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider border transition-all ${
                    showDebug
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {showDebug ? 'Hide skeleton' : 'Show skeleton'}
                </button>

                <button
                  onClick={startCalibration}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-all"
                >
                  Recalibrate
                </button>
              </div>

              <button
                onClick={handleStopCamera}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider bg-zinc-950 border border-zinc-900 text-zinc-500 hover:border-rose-500/20 hover:text-rose-400 transition-all"
              >
                End Session
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Engine Controls & Instrument Switcher */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full">
          {/* Card 1: Mixer & Parameters */}
          <div className="glass-panel p-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold flex items-center gap-2 border-b border-white/5 pb-3 font-mono uppercase tracking-wider text-zinc-400">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Engine Setup
            </h3>

            <div className="flex flex-col gap-3">
              <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider flex items-center justify-between">
                <span>MASTER OUTPUT VOLUME</span>
                <span className="font-mono">{volume === -40 ? 'MUTED' : `${volume} dB`}</span>
              </label>
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-zinc-500" />
                <input
                  type="range"
                  min="-40"
                  max="0"
                  step="1"
                  value={volume}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setVolume(val);
                    setMasterVolume(val === -40 ? -Infinity : val);
                  }}
                  className="flex-1 h-1.5 rounded-full bg-zinc-800 accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Conditionally Render Guitar sub-controls */}
            {activeInstrument === 'guitar' && (
              <div className="flex flex-col gap-4 border-t border-white/5 pt-4">
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Guitar Mode</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setGuitarSubMode('strum')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        guitarSubMode === 'strum'
                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      Strum
                    </button>
                    <button
                      onClick={() => setGuitarSubMode('fingerpick')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        guitarSubMode === 'fingerpick'
                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      Fingerpick
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Guitar Tone</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setGuitarTone('acoustic');
                        guitarAudio.setToneEffect('acoustic');
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        guitarTone === 'acoustic'
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      Acoustic
                    </button>
                    <button
                      onClick={() => {
                        setGuitarTone('electric');
                        guitarAudio.setToneEffect('electric');
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        guitarTone === 'electric'
                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      Electric Dist
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="text-[10px] text-zinc-500 mt-2 bg-zinc-950 p-3 rounded-lg border border-white/5 leading-relaxed font-mono">
              LATENCY CONTROL: ACTIVE<br />
              BUFFER SIZE: 0 MS
            </div>
          </div>

          {/* Card 2: Instrument Switcher Dock */}
          <div className="glass-panel p-6">
            <InstrumentSelector />
          </div>
        </div>
      </main>
    </div>
  );
};
