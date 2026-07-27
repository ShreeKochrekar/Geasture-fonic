import type { TrackingResult } from '../tracking/handLandmarker';
import { guitarAudio, GUITAR_CHORDS } from '../audio/toneEngine';
import { useAppStore } from '../store/appStore';
import { 
  detectMoodAndPattern, 
  detectLeftHandTrigger
} from '../tracking/moodGestures';
import type { Mood, PatternIntensity } from '../tracking/moodGestures';

// Chord progressions mapped to moods
const GUITAR_PROGRESSIONS_BY_MOOD: Record<Mood, string[]> = {
  happy: ['C', 'F', 'G', 'C'],
  sad: ['Am', 'F', 'C', 'G'],
  tense: ['Em', 'Bdim', 'C7', 'Em'],
  dreamy: ['C7', 'Am7', 'Em7', 'G7'],
};

// Module-level state
let lastStrumTime = 0;
let chordIndex = -1;
let prevMood: Mood | null = null;

// Helper to strum a chord with note spacing
function playStrum(chord: string[], velocity: number, pattern: PatternIntensity) {
  // Strum string spacing based on pattern
  const noteSpacing = pattern === 'sparse' ? 60 : pattern === 'busy' ? 18 : 30; // ms
  
  chord.forEach((note, idx) => {
    setTimeout(() => {
      guitarAudio.triggerString(idx, note, velocity);
      
      // Extra rapid double-hit for fast pattern
      if (pattern === 'busy') {
        setTimeout(() => {
          guitarAudio.triggerString(idx, note, velocity * 0.35);
        }, 70);
      }
    }, idx * noteSpacing);
  });
}

export function mapGuitarLandmarks(trackingResult: TrackingResult) {
  const { guitarTone } = useAppStore.getState();
  const currentTimestamp = trackingResult.timestamp;

  const leftHand = trackingResult.hands.find((h) => h.handedness === 'Left');

  // Detect mood and tilt pattern from left hand
  const [mood, pattern] = detectMoodAndPattern(leftHand, undefined);
  const progression = GUITAR_PROGRESSIONS_BY_MOOD[mood];

  // Reset index on mood change so the next trigger starts at progression index 0
  if (mood !== prevMood) {
    chordIndex = -1;
    prevMood = mood;
  }

  // Sync tone effects (ensuring tone matches selection)
  guitarAudio.setToneEffect(guitarTone);

  // Expose left hand open/close trigger and active state
  const { isArmed, justOpened } = detectLeftHandTrigger(leftHand);

  // Apply continuous timbre shaping based on mood and pattern
  guitarAudio.setTimbre(mood, pattern);

  if (leftHand && isArmed) {
    // Advance chord progression on closed-to-open transition
    if (justOpened) {
      chordIndex = (chordIndex + 1) % progression.length;
      const currentChordName = progression[chordIndex];
      const currentChord = GUITAR_CHORDS[currentChordName];
      playStrum(currentChord, 0.85, pattern);
      lastStrumTime = currentTimestamp;
      return;
    }

    // Determine repeating strum interval based on pattern speed
    const strumInterval = pattern === 'sparse' ? 1400 : pattern === 'busy' ? 380 : 750; // ms

    if (currentTimestamp - lastStrumTime > strumInterval) {
      const currentChordName = progression[chordIndex % progression.length];
      const currentChord = GUITAR_CHORDS[currentChordName];
      // Quiet down sparse/slow, build up busy/fast
      const velocity = pattern === 'sparse' ? 0.65 : pattern === 'busy' ? 0.95 : 0.8;
      playStrum(currentChord, velocity, pattern);
      lastStrumTime = currentTimestamp;
    }
  } else {
    // When left hand is closed, we don't strum.
    // The warm envelope handles natural release decay.
  }
}
