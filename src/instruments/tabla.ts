import type { TrackingResult } from '../tracking/handLandmarker';
import { tablaAudio } from '../audio/toneEngine';
import { useAppStore } from '../store/appStore';
import { 
  detectMoodAndPattern, 
  isRightHandArmed, 
  TABLA_MOOD_CONFIGS 
} from '../tracking/moodGestures';

// Module-level tracking state for right-hand hits
let prevRightY: number | null = null;
let lastHitTime = 0;

export function mapTablaLandmarks(trackingResult: TrackingResult) {
  const { rightHandRange } = useAppStore.getState();
  const currentTimestamp = trackingResult.timestamp;

  const leftHand = trackingResult.hands.find((h) => h.handedness === 'Left');
  const rightHand = trackingResult.hands.find((h) => h.handedness === 'Right');

  // Detect mood and pattern
  const [mood, pattern] = detectMoodAndPattern(leftHand, rightHand);
  const moodConfig = TABLA_MOOD_CONFIGS[mood];

  // Apply mood reverb/tuning
  tablaAudio.setReverb(moodConfig.reverbWet);

  // Right Hand: play-armed check
  const rightArmed = isRightHandArmed(rightHand);

  // Auto backing tabla loops based on tilt (pattern)
  if (rightArmed && pattern !== 'sparse') {
    const autoProb = pattern === 'busy' ? 0.12 : 0.06;
    if (Math.random() < autoProb) {
      // Play a subtle background bass note (Bayan)
      tablaAudio.triggerBayan('na', 0.2, moodConfig.bayanPitch);
    }
    if (pattern === 'busy' && Math.random() < 0.08) {
      // Play a subtle background treble note (Dayan)
      tablaAudio.triggerDayan('tin', 0.25, moodConfig.dayanPitch);
    }
  }

  // Trigger hit on downward movement while armed
  if (rightHand && rightArmed && rightHand.landmarks.length > 0) {
    const indexTip = rightHand.landmarks[8];
    const range = rightHandRange;
    const rangeY = range.maxY - range.minY;
    const normY = rangeY > 0 ? (indexTip.y - range.minY) / rangeY : 0.5;
    const clampedY = Math.max(0, Math.min(1, normY));

    // screenX (mirrored)
    const screenX = 1 - indexTip.x;

    if (prevRightY !== null) {
      const dy = clampedY - prevRightY;
      const speed = dy / 0.016;
      const isDownwardStrike = dy > 0.06 || speed > 3.0;

      const now = currentTimestamp;
      if (isDownwardStrike && (now - lastHitTime > 180)) {
        // Calculate velocity based on strike speed
        const velocity = Math.max(0.3, Math.min(1.0, 0.4 + (dy - 0.06) * 5.0));

        if (screenX < 0.5) {
          // Left half: Bayan (bass stroke)
          tablaAudio.triggerBayan('dha', velocity, moodConfig.bayanPitch);
        } else {
          // Right half: Dayan (treble stroke)
          tablaAudio.triggerDayan('dhin', velocity, moodConfig.dayanPitch);
        }
        lastHitTime = now;
      }
    }
    prevRightY = clampedY;
  } else {
    prevRightY = null;
  }
}
