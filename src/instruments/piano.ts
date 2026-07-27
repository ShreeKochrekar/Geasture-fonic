import type { TrackingResult } from '../tracking/handLandmarker';
import { pianoAudio } from '../audio/toneEngine';
import { useAppStore } from '../store/appStore';
import { 
  detectMoodAndPattern, 
  detectLeftHandTrigger
} from '../tracking/moodGestures';
import type { Mood } from '../tracking/moodGestures';

// Piano chord definitions (4-note voicings)
const PIANO_CHORDS: Record<string, string[]> = {
  C:      ['C3', 'E3', 'G3', 'C4'],
  G:      ['G3', 'B3', 'D4', 'G4'],
  Am:     ['A3', 'C4', 'E4', 'A4'],
  F:      ['F3', 'A3', 'C4', 'F4'],
  Dm:     ['D3', 'F3', 'A3', 'D4'],
  E:      ['E3', 'G#3', 'B3', 'E4'],
  Em:     ['E3', 'G3', 'B3', 'E4'],
  "F#dim":  ['F#3', 'A3', 'C4', 'Eb4'],
  G7:     ['G3', 'B3', 'D4', 'F4'],
  Bb:     ['Bb3', 'D4', 'F4', 'Bb4'],
  Fmaj7:  ['F3', 'A3', 'C4', 'E4'],
  G6:     ['G3', 'B3', 'D4', 'E4'],
  Em7:    ['E3', 'G3', 'B3', 'D4'],
  A7:     ['A3', 'C#4', 'E4', 'G4'],
};

// Mood progressions
const PIANO_PROGRESSIONS: Record<Mood, string[]> = {
  happy:  ['C', 'G', 'Am', 'F'],
  sad:    ['Am', 'Dm', 'F', 'E'],
  tense:  ['Em', 'F#dim', 'G7', 'Bb'],
  dreamy: ['Fmaj7', 'G6', 'Em7', 'A7'],
};

// Module-level state
let prevLeftArmed = false;
let chordIndex = -1;
let prevMood: Mood | null = null;
let currentlyPlayingNotes: string[] = [];
let arpIndex = 0;
let lastArpTime = 0;
let lastActiveChordName = '';

export function mapPianoLandmarks(trackingResult: TrackingResult) {
  const { leftHandRange } = useAppStore.getState();
  const currentTimestamp = trackingResult.timestamp;

  const leftHand = trackingResult.hands.find((h) => h.handedness === 'Left');

  // Detect mood and pattern from left hand
  const [mood, pattern] = detectMoodAndPattern(leftHand, undefined);
  const progression = PIANO_PROGRESSIONS[mood];

  // Reset index on mood change so the next trigger starts at progression index 0
  if (mood !== prevMood) {
    chordIndex = -1;
    prevMood = mood;
  }

  // Expose left hand open/close trigger and active state
  const { isArmed, justOpened } = detectLeftHandTrigger(leftHand);

  // Apply continuous timbre updates
  pianoAudio.setTimbre(mood, pattern);

  // If left hand is open, advance chord on initial transition
  if (isArmed && justOpened) {
    chordIndex = (chordIndex + 1) % progression.length;
    arpIndex = 0; // Reset arpeggiator index
  }

  const currentChordName = progression[chordIndex % progression.length];
  const currentChordNotes = PIANO_CHORDS[currentChordName] || PIANO_CHORDS.C;

  if (leftHand && isArmed) {
    const indexTip = leftHand.landmarks[8];
    const range = leftHandRange;
    const rangeY = range.maxY - range.minY;
    const normY = rangeY > 0 ? (indexTip.y - range.minY) / rangeY : 0.5;
    const clampedY = Math.max(0, Math.min(1, normY));
    const heightNorm = 1 - clampedY; // 0.0 at bottom, 1.0 at top

    // Height maps to volume velocity
    const velocity = Math.max(0.15, Math.min(1.0, 0.25 + heightNorm * 0.75));
    pianoAudio.setVolume(heightNorm);

    // Handle patterns
    if (pattern === 'standard') {
      // 1. Full block chord pad
      // Play block chord if chord changed or wasn't armed previously
      const chordNotesChanged = lastActiveChordName !== currentChordName || !prevLeftArmed;
      if (chordNotesChanged) {
        // Stop current notes
        currentlyPlayingNotes.forEach(n => pianoAudio.noteOff(n));
        
        // Play new notes
        currentChordNotes.forEach(n => pianoAudio.noteOn(n, velocity));
        currentlyPlayingNotes = [...currentChordNotes];
        lastActiveChordName = currentChordName;
      }
    } else {
      // 2. Arpeggiator (slow arpeggio or fast arpeggio-tremolo)
      const interval = pattern === 'sparse' ? 380 : 80; // 380ms (SLOW) vs 80ms (FAST)
      
      // Stop block chords if transitioning from standard
      if (currentlyPlayingNotes.length > 1) {
        currentlyPlayingNotes.forEach(n => pianoAudio.noteOff(n));
        currentlyPlayingNotes = [];
        lastActiveChordName = '';
      }

      if (currentTimestamp - lastArpTime > interval) {
        const noteToPlay = currentChordNotes[arpIndex % currentChordNotes.length];
        
        // Stop previous arpeggio note if not sustaining
        if (currentlyPlayingNotes.length > 0) {
          currentlyPlayingNotes.forEach(n => pianoAudio.noteOff(n));
        }

        pianoAudio.noteOn(noteToPlay, velocity);
        currentlyPlayingNotes = [noteToPlay];
        
        arpIndex++;
        lastArpTime = currentTimestamp;
      }
    }
  } else {
    // When left hand is closed, stop all notes immediately or let decay
    if (prevLeftArmed || currentlyPlayingNotes.length > 0) {
      currentlyPlayingNotes.forEach(n => pianoAudio.noteOff(n));
      currentlyPlayingNotes = [];
      lastActiveChordName = '';
    }
  }

  prevLeftArmed = isArmed;
}

export function getCurrentHeldNotes(): string[] {
  return currentlyPlayingNotes;
}
