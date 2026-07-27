import { create } from 'zustand';

export type InstrumentType = 'theremin' | 'drums' | 'piano' | 'guitar' | 'tabla';
export type GuitarSubMode = 'strum' | 'fingerpick' | 'arpeggio';
export type GuitarTone = 'acoustic' | 'electric' | 'nylon' | 'steel' | 'twelve_string';
export type GuitarChordProgression = 'none' | 'I_IV_V' | 'ii_V_I' | 'blues_12_bar';
export type PianoScale = 'major' | 'natural_minor' | 'harmonic_minor' | 'pentatonic' | 'blues' | 'chromatic';
export type ArpPattern = 'up' | 'down' | 'up_down' | 'random';
export type ThereminScale = 'major' | 'minor' | 'pentatonic' | 'chromatic' | 'whole_tone' | 'blues';
export type TaalCycle = 'teental' | 'ektaal' | 'jhaptaal';

export interface HandRange {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface AppState {
  activeInstrument: InstrumentType;
  isAudioStarted: boolean;
  isModelLoaded: boolean;
  showDebug: boolean;
  
  // Calibration State
  isCalibrated: boolean;
  calibrationStep: 'none' | 'high' | 'low';
  leftHandRange: HandRange;
  rightHandRange: HandRange;

  // Guitar Specific State
  guitarSubMode: GuitarSubMode;
  guitarTone: GuitarTone;
  guitarProgression: GuitarChordProgression;
  guitarProgressionIndex: number;

  // Piano Specific State
  pianoScale: PianoScale;
  pianoOctave: number;
  pianoSustain: boolean;
  pianoArpPattern: ArpPattern;
  pianoArpSpeed: number;

  // Theremin Specific State
  thereminScale: ThereminScale;
  thereminVibratoDepth: number;
  thereminVibratoSpeed: number;
  thereminGlideTime: number;
  thereminSubOscLevel: number;

  // Tabla Specific State
  tablaTaal: TaalCycle;
  tablaBayanTuning: number;
  tablaDayanTuning: number;

  // Actions
  setInstrument: (instrument: InstrumentType) => void;
  startAudio: () => void;
  setModelLoaded: (loaded: boolean) => void;
  toggleDebug: () => void;
  
  // Guitar Actions
  setGuitarSubMode: (mode: GuitarSubMode) => void;
  setGuitarTone: (tone: GuitarTone) => void;
  setGuitarProgression: (prog: GuitarChordProgression) => void;
  advanceGuitarProgression: () => void;

  // Piano Actions
  setPianoScale: (scale: PianoScale) => void;
  setPianoOctave: (oct: number) => void;
  setPianoSustain: (on: boolean) => void;
  setPianoArpPattern: (pat: ArpPattern) => void;
  setPianoArpSpeed: (speed: number) => void;

  // Theremin Actions
  setThereminScale: (scale: ThereminScale) => void;
  setThereminVibratoDepth: (depth: number) => void;
  setThereminVibratoSpeed: (speed: number) => void;
  setThereminGlideTime: (time: number) => void;
  setThereminSubOscLevel: (level: number) => void;

  // Tabla Actions
  setTablaTaal: (taal: TaalCycle) => void;
  setTablaBayanTuning: (tune: number) => void;
  setTablaDayanTuning: (tune: number) => void;

  // Calibration Actions
  startCalibration: () => void;
  setCalibrationStep: (step: 'none' | 'high' | 'low') => void;
  saveCalibrationPoint: (
    step: 'high' | 'low',
    leftCoords: { x: number; y: number } | null,
    rightCoords: { x: number; y: number } | null
  ) => void;
  resetCalibration: () => void;
}

const defaultRange = (): HandRange => ({
  minX: 0.1,
  maxX: 0.9,
  minY: 0.1,
  maxY: 0.9,
});

export const useAppStore = create<AppState>((set) => ({
  activeInstrument: 'theremin',
  isAudioStarted: false,
  isModelLoaded: false,
  showDebug: true,

  isCalibrated: false,
  calibrationStep: 'none',
  leftHandRange: defaultRange(),
  rightHandRange: defaultRange(),

  // Guitar Defaults
  guitarSubMode: 'strum',
  guitarTone: 'acoustic',
  guitarProgression: 'none',
  guitarProgressionIndex: 0,

  // Piano Defaults
  pianoScale: 'major',
  pianoOctave: 4,
  pianoSustain: false,
  pianoArpPattern: 'up',
  pianoArpSpeed: 4,

  // Theremin Defaults
  thereminScale: 'pentatonic',
  thereminVibratoDepth: 0,
  thereminVibratoSpeed: 5,
  thereminGlideTime: 0.08,
  thereminSubOscLevel: 0,

  // Tabla Defaults
  tablaTaal: 'teental',
  tablaBayanTuning: 0,
  tablaDayanTuning: 0,

  setInstrument: (instrument) => set({ activeInstrument: instrument }),
  
  startAudio: () => set({ isAudioStarted: true }),
  
  setModelLoaded: (loaded) => set({ isModelLoaded: loaded }),
  
  toggleDebug: () => set((state) => ({ showDebug: !state.showDebug })),

  setGuitarSubMode: (mode) => set({ guitarSubMode: mode }),
  
  setGuitarTone: (tone) => set({ guitarTone: tone }),

  setGuitarProgression: (prog) => set({ guitarProgression: prog, guitarProgressionIndex: 0 }),

  advanceGuitarProgression: () => set((state) => ({ 
    guitarProgressionIndex: state.guitarProgressionIndex + 1 
  })),

  setPianoScale: (scale) => set({ pianoScale: scale }),

  setPianoOctave: (oct) => set({ pianoOctave: Math.max(2, Math.min(6, oct)) }),

  setPianoSustain: (on) => set({ pianoSustain: on }),

  setPianoArpPattern: (pat) => set({ pianoArpPattern: pat }),

  setPianoArpSpeed: (speed) => set({ pianoArpSpeed: Math.max(1, Math.min(10, speed)) }),

  setThereminScale: (scale) => set({ thereminScale: scale }),

  setThereminVibratoDepth: (depth) => set({ thereminVibratoDepth: Math.max(0, Math.min(1, depth)) }),

  setThereminVibratoSpeed: (speed) => set({ thereminVibratoSpeed: Math.max(1, Math.min(10, speed)) }),

  setThereminGlideTime: (time) => set({ thereminGlideTime: Math.max(0, Math.min(1, time)) }),

  setThereminSubOscLevel: (level) => set({ thereminSubOscLevel: Math.max(0, Math.min(1, level)) }),

  setTablaTaal: (taal) => set({ tablaTaal: taal }),

  setTablaBayanTuning: (tune) => set({ tablaBayanTuning: Math.max(-12, Math.min(12, tune)) }),

  setTablaDayanTuning: (tune) => set({ tablaDayanTuning: Math.max(-12, Math.min(12, tune)) }),

  startCalibration: () => set({
    calibrationStep: 'high',
    isCalibrated: false,
    leftHandRange: defaultRange(),
    rightHandRange: defaultRange(),
  }),

  setCalibrationStep: (step) => set({ calibrationStep: step }),

  saveCalibrationPoint: (step, leftCoords, rightCoords) => {
    set((state) => {
      const nextLeft = { ...state.leftHandRange };
      const nextRight = { ...state.rightHandRange };

      if (step === 'high') {
        if (leftCoords) {
          nextLeft.minY = Math.max(0.01, leftCoords.y - 0.05);
          nextLeft.minX = Math.max(0.01, leftCoords.x - 0.2);
          nextLeft.maxX = Math.min(0.99, leftCoords.x + 0.2);
        }
        if (rightCoords) {
          nextRight.minY = Math.max(0.01, rightCoords.y - 0.05);
          nextRight.minX = Math.max(0.01, rightCoords.x - 0.2);
          nextRight.maxX = Math.min(0.99, rightCoords.x + 0.2);
        }
        
        return {
          leftHandRange: nextLeft,
          rightHandRange: nextRight,
          calibrationStep: 'low',
        };
      } else if (step === 'low') {
        if (leftCoords) {
          nextLeft.maxY = Math.min(0.99, leftCoords.y + 0.05);
          if (nextLeft.minY >= nextLeft.maxY) {
            nextLeft.minY = Math.max(0.01, nextLeft.maxY - 0.4);
          }
        }
        if (rightCoords) {
          nextRight.maxY = Math.min(0.99, rightCoords.y + 0.05);
          if (nextRight.minY >= nextRight.maxY) {
            nextRight.minY = Math.max(0.01, nextRight.maxY - 0.4);
          }
        }

        return {
          leftHandRange: nextLeft,
          rightHandRange: nextRight,
          calibrationStep: 'none',
          isCalibrated: true,
        };
      }

      return {};
    });
  },

  resetCalibration: () => set({
    isCalibrated: false,
    calibrationStep: 'none',
    leftHandRange: defaultRange(),
    rightHandRange: defaultRange(),
  }),
}));
