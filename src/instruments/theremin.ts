import type { TrackingResult } from '../tracking/handLandmarker';
import { thereminAudio, getScaleNotes } from '../audio/toneEngine';
import { useAppStore } from '../store/appStore';
import { 
  detectMoodAndPattern, 
  isRightHandArmed,
  THEREMIN_MOOD_CONFIGS 
} from '../tracking/moodGestures';

export function mapThereminLandmarks(trackingResult: TrackingResult) {
  const { rightHandRange, thereminGlideTime } = useAppStore.getState();

  const leftHand = trackingResult.hands.find((h) => h.handedness === 'Left');
  const rightHand = trackingResult.hands.find((h) => h.handedness === 'Right');

  // Detect mood and pattern
  const [mood, pattern] = detectMoodAndPattern(leftHand, rightHand);
  const moodConfig = THEREMIN_MOOD_CONFIGS[mood];

  // Apply mood configuration
  thereminAudio.setGlide(thereminGlideTime);
  thereminAudio.setSubOscLevel(moodConfig.subOscLevel);
  thereminAudio.setTimbre(mood, pattern);

  // Right Hand: play-armed check
  const rightArmed = isRightHandArmed(rightHand);

  // Set vibrato speed & depth based on pattern (tilt)
  let vibratoDepth = 0.2;
  let vibratoSpeed = 5.0;

  if (pattern === 'sparse') {
    // SLOW pattern: slow wide vibrato
    vibratoDepth = 0.8;
    vibratoSpeed = 2.5;
  } else if (pattern === 'busy') {
    // FAST pattern: fast fluttery vibrato
    vibratoDepth = 0.45;
    vibratoSpeed = 11.0;
  }

  thereminAudio.setVibrato(vibratoDepth, vibratoSpeed);

  if (rightHand && rightArmed && rightHand.landmarks.length > 0) {
    const indexTip = rightHand.landmarks[8];
    const range = rightHandRange;
    const rangeY = range.maxY - range.minY;
    const normY = rangeY > 0 ? (indexTip.y - range.minY) / rangeY : 0.5;
    const clampedY = Math.max(0, Math.min(1, normY));

    // Y position (height) controls pitch
    const finalY = 1 - clampedY; // 0.0 at bottom, 1.0 at top

    // Map Y position to the mood's pitch range
    const [lowPitch, highPitch] = moodConfig.pitchRange;
    const pitchPos = lowPitch + finalY * (highPitch - lowPitch);

    // Get scale notes for the current mood
    const SCALE = getScaleNotes('C', moodConfig.baseOctave, moodConfig.scaleType);
    const noteIdx = Math.floor(pitchPos * SCALE.length);
    const note = SCALE[Math.max(0, Math.min(SCALE.length - 1, noteIdx))];

    // Trigger and update synth
    thereminAudio.start(note, 0.85, 0.8);
    thereminAudio.update(note, 0.85, 0.8, false);
  } else {
    thereminAudio.stop();
  }
}
