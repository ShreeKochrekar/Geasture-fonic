/**
 * moodGestures.ts — Theory-Free Mood/Gesture System
 * 
 * ============================================================
 * THE ONE RULE (applies identically to Guitar, Piano, Theremin, Drums, Tabla):
 * ============================================================
 * 
 * LEFT HAND = SELECT
 * Hold up 1 to 4 fingers to pick a mood:
 *   1 finger = Happy
 *   2 fingers = Sad
 *   3 fingers = Tense
 *   4 fingers = Dreamy
 * This mood is the only thing the left hand ever does, on every instrument.
 * 
 * RIGHT HAND = PLAY (Theremin, Drums, Tabla only)
 * - All 5 fingers open/extended = sound is armed and plays.
 * - Hand closed or partially closed = silent, no sound.
 * 
 * NEW RULE FOR GUITAR & PIANO (Single Left-Hand Control):
 * - Left hand does everything. No right hand is tracked.
 * - Left hand finger count (1-4) picks mood when not open.
 * - Left hand open (all 5 fingers extended) is the armed/play trigger.
 * - Closing the left hand stops/releases the sound.
 * - Tilting the open left hand changes the PATTERN:
 *   tilt left = slow/sparse pattern
 *   neutral/upright = standard pattern
 *   tilt right = fast/busy pattern
 */

import { analyzeHand, detectExtendedFingers } from './gestureDetector';
import type { Landmark3D } from './oneEuroFilter';
import { useAppStore } from '../store/appStore';

// ============================================================
// Mood Definitions
// ============================================================

export type Mood = 'happy' | 'sad' | 'tense' | 'dreamy';
export type PatternIntensity = 'sparse' | 'standard' | 'busy';

export const MOOD_NAMES: Record<Mood, string> = {
  happy: 'Happy',
  sad: 'Sad',
  tense: 'Tense',
  dreamy: 'Dreamy',
};

export const MOOD_COLORS: Record<Mood, string> = {
  happy: '#FFD700',   // Gold
  sad: '#4A90D9',     // Blue
  tense: '#FF4444',   // Red
  dreamy: '#BB86FC',  // Purple
};

export const PATTERN_NAMES: Record<PatternIntensity, string> = {
  sparse: 'SLOW',
  standard: 'STANDARD',
  busy: 'FAST',
};

// Map finger count (1-4) to mood
export function fingerCountToMood(count: number): Mood {
  switch (count) {
    case 1: return 'happy';
    case 2: return 'sad';
    case 3: return 'tense';
    case 4: return 'dreamy';
    default: return 'happy';
  }
}

// Map hand tilt to pattern intensity
// Uses wrist (landmark 0) to middle fingertip (landmark 12) angle
export function getPatternFromTilt(landmarks: Landmark3D[]): PatternIntensity {
  if (!landmarks || landmarks.length < 13) return 'standard';
  
  const wrist = landmarks[0];
  const middleTip = landmarks[12];
  
  // Calculate angle: vector from wrist to middle fingertip
  const dx = middleTip.x - wrist.x;
  const dy = middleTip.y - wrist.y;
  
  // In screen coordinates, y increases downward
  // Positive angle = hand tilted right (wrist left, fingers right)
  const angle = Math.atan2(dx, -dy) * (180 / Math.PI);
  
  if (angle < -15) return 'sparse';
  if (angle > 15) return 'busy';
  return 'standard';
}

// Check if right hand is open (all 5 fingers extended)
export function isRightHandArmed(rightHand: { landmarks: Landmark3D[] } | undefined): boolean {
  if (!rightHand || !rightHand.landmarks || rightHand.landmarks.length < 21) return false;
  const extended = detectExtendedFingers(rightHand.landmarks);
  return extended.every(f => f === true);
}

// Check if left hand is open (all 5 fingers extended)
export function isLeftHandArmed(leftHand: { landmarks: Landmark3D[] } | undefined): boolean {
  if (!leftHand || !leftHand.landmarks || leftHand.landmarks.length < 21) return false;
  const extended = detectExtendedFingers(leftHand.landmarks);
  return extended.every(f => f === true);
}

// State machine for Left-Hand play trigger transitions (Guitar & Piano)
let prevLeftArmedState = false;
export function detectLeftHandTrigger(leftHand: { landmarks: Landmark3D[] } | undefined): {
  isArmed: boolean;
  justOpened: boolean;
  justClosed: boolean;
} {
  const isArmed = isLeftHandArmed(leftHand);
  const justOpened = isArmed && !prevLeftArmedState;
  const justClosed = !isArmed && prevLeftArmedState;
  prevLeftArmedState = isArmed;
  
  return { isArmed, justOpened, justClosed };
}

// ============================================================
// Theremin: Mood-to-Scale & Pitch Range Mapping
// ============================================================

export interface ThereminMoodConfig {
  scaleType: 'major' | 'natural_minor' | 'chromatic' | 'pentatonic';
  baseOctave: number;
  pitchRange: [number, number]; // [low, high] normalized Y position
  reverbWet: number;
  subOscLevel: number;
  vibratoBase: number;
}

export const THEREMIN_MOOD_CONFIGS: Record<Mood, ThereminMoodConfig> = {
  happy:  { scaleType: 'pentatonic',  baseOctave: 5, pitchRange: [0.2, 0.9], reverbWet: 0.15, subOscLevel: 0.2, vibratoBase: 0.3 },
  sad:    { scaleType: 'natural_minor', baseOctave: 3, pitchRange: [0.1, 0.7], reverbWet: 0.4,  subOscLevel: 0.5, vibratoBase: 0.6 },
  tense:  { scaleType: 'chromatic',    baseOctave: 4, pitchRange: [0.1, 0.8], reverbWet: 0.1,  subOscLevel: 0.1, vibratoBase: 0.8 },
  dreamy: { scaleType: 'major',        baseOctave: 5, pitchRange: [0.3, 1.0], reverbWet: 0.7,  subOscLevel: 0.8, vibratoBase: 0.5 },
};

// ============================================================
// Drums: Mood-to-Kit Mapping
// ============================================================

export interface DrumMoodConfig {
  kitName: string;
  description: string;
  velocityMultipliers: [number, number, number, number]; // kick, snare, hihat, crash
  reverbWet: number;
  filterCutoff: number; // Hz
}

export const DRUM_MOOD_CONFIGS: Record<Mood, DrumMoodConfig> = {
  happy:  { kitName: 'Pop Kit',      description: 'Bright pop sound set',      velocityMultipliers: [1.0, 1.1, 1.0, 1.2], reverbWet: 0.1, filterCutoff: 8000 },
  sad:    { kitName: 'Lo-Fi Kit',    description: 'Muted lo-fi beats',         velocityMultipliers: [0.7, 0.6, 0.5, 0.5], reverbWet: 0.5, filterCutoff: 3000 },
  tense:  { kitName: 'Trap Kit',     description: 'Hard aggressive trap kit',  velocityMultipliers: [1.3, 1.2, 0.8, 1.4], reverbWet: 0.2, filterCutoff: 10000 },
  dreamy: { kitName: 'Ambient Kit',  description: 'Soft ambient soundscapes',  velocityMultipliers: [0.5, 0.5, 0.4, 0.7], reverbWet: 0.8, filterCutoff: 4000 },
};

// ============================================================
// Tabla: Mood-to-Tuning Mapping
// ============================================================

export interface TablaMoodConfig {
  name: string;
  bayanPitch: number;  // semitone offset
  dayanPitch: number;
  reverbWet: number;
  description: string;
}

export const TABLA_MOOD_CONFIGS: Record<Mood, TablaMoodConfig> = {
  happy:  { name: 'Bright',   bayanPitch: 4,  dayanPitch: 5,  reverbWet: 0.2, description: 'Bright resonant' },
  sad:    { name: 'Deep',     bayanPitch: -3, dayanPitch: -2, reverbWet: 0.5, description: 'Deep muted' },
  tense:  { name: 'Sharp',    bayanPitch: 6,  dayanPitch: 7,  reverbWet: 0.1, description: 'Sharp metallic' },
  dreamy: { name: 'Reverb',   bayanPitch: -5, dayanPitch: -3, reverbWet: 0.8, description: 'Soft reverb' },
};

// ============================================================
// Piano: Mood-to-Scale Mapping
// ============================================================

export interface PianoMoodConfig {
  scaleType: 'major' | 'natural_minor' | 'harmonic_minor' | 'pentatonic' | 'blues' | 'chromatic';
  baseOctave: number;
  moodLabel: string;
}

export const PIANO_MOOD_CONFIGS: Record<Mood, PianoMoodConfig> = {
  happy:  { scaleType: 'pentatonic',  baseOctave: 4, moodLabel: 'Happy' },
  sad:    { scaleType: 'natural_minor', baseOctave: 3, moodLabel: 'Sad' },
  tense:  { scaleType: 'chromatic',   baseOctave: 4, moodLabel: 'Tense' },
  dreamy: { scaleType: 'major',       baseOctave: 5, moodLabel: 'Dreamy' },
};

// ============================================================
// Global state for mood tracking
// ============================================================

let currentMood: Mood = 'happy';
let currentPattern: PatternIntensity = 'standard';

export function getCurrentMood(): Mood {
  return currentMood;
}

export function getCurrentPattern(): PatternIntensity {
  return currentPattern;
}

export function setCurrentMood(mood: Mood) {
  currentMood = mood;
}

/**
 * Detect mood and pattern from both hands.
 * 
 * @param leftHand - Left hand tracking data (or undefined)
 * @param rightHand - Right hand tracking data (or undefined)
 * @returns [mood, pattern]
 */
export function detectMoodAndPattern(
  leftHand: { landmarks: Landmark3D[] } | undefined,
  rightHand: { landmarks: Landmark3D[] } | undefined
): [Mood, PatternIntensity] {
  const activeInstrument = useAppStore.getState().activeInstrument;
  
  if (activeInstrument === 'guitar' || activeInstrument === 'piano') {
    // Single Hand (Left Hand only)
    if (leftHand) {
      const state = analyzeHand(leftHand.landmarks);
      // Lock mood to last 1-4 finger selection when hand is not open
      if (state.fingerCount >= 1 && state.fingerCount <= 4) {
        currentMood = fingerCountToMood(state.fingerCount);
      }
      // Pattern is continuously driven by left hand tilt
      currentPattern = getPatternFromTilt(leftHand.landmarks);
    }
  } else {
    // Dual Hands / Right-Hand-Play instruments
    if (leftHand) {
      const state = analyzeHand(leftHand.landmarks);
      if (state.fingerCount >= 1 && state.fingerCount <= 4) {
        currentMood = fingerCountToMood(state.fingerCount);
      }
    }
    
    if (rightHand) {
      currentPattern = getPatternFromTilt(rightHand.landmarks);
    }
  }
  
  return [currentMood, currentPattern];
}
