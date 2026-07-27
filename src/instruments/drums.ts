import type { TrackingResult } from '../tracking/handLandmarker';
import { drumAudio } from '../audio/toneEngine';
import { useAppStore } from '../store/appStore';
import { 
  detectMoodAndPattern, 
  isRightHandArmed, 
  DRUM_MOOD_CONFIGS 
} from '../tracking/moodGestures';

// Module-level tracking state for right-hand hits
let prevRightY: number | null = null;
let lastHitTime = 0;

export function mapDrumsLandmarks(trackingResult: TrackingResult) {
  const { rightHandRange } = useAppStore.getState();
  const currentTimestamp = trackingResult.timestamp;

  const leftHand = trackingResult.hands.find((h) => h.handedness === 'Left');
  const rightHand = trackingResult.hands.find((h) => h.handedness === 'Right');

  // Detect mood and pattern
  const [mood, pattern] = detectMoodAndPattern(leftHand, rightHand);
  const moodConfig = DRUM_MOOD_CONFIGS[mood];

  // Apply mood kit effects
  drumAudio.setKitEffects(moodConfig.reverbWet, moodConfig.filterCutoff);

  // Right Hand: play-armed check
  const rightArmed = isRightHandArmed(rightHand);

  // Auto-backing layers based on tilt (pattern)
  if (rightArmed && pattern !== 'sparse') {
    const autoProb = pattern === 'busy' ? 0.12 : 0.06;
    // Auto hi-hat layer
    if (Math.random() < autoProb) {
      drumAudio.trigger('hihat', 0.2 * (pattern === 'busy' ? 1.4 : 1.0));
    }
    // Auto snare accent (only in busy mode)
    if (pattern === 'busy' && Math.random() < 0.04) {
      drumAudio.trigger('snare', 0.15);
    }
  }

  // Trigger hit on downward movement while armed
  if (rightHand && rightArmed && rightHand.landmarks.length > 0) {
    const indexTip = rightHand.landmarks[8];
    const range = rightHandRange;
    const rangeY = range.maxY - range.minY;
    const normY = rangeY > 0 ? (indexTip.y - range.minY) / rangeY : 0.5;
    const clampedY = Math.max(0, Math.min(1, normY));

    // screenX (mirrored) and screenY coordinates
    const screenX = 1 - indexTip.x;
    const screenY = indexTip.y;

    if (prevRightY !== null) {
      const dy = clampedY - prevRightY;
      const speed = dy / 0.016; // Speed in coordinate change per frame
      const isDownwardStrike = dy > 0.06 || speed > 3.0;
      
      const now = currentTimestamp;
      if (isDownwardStrike && (now - lastHitTime > 180)) {
        // Trigger pad based on quadrant where hit lands
        const isLeft = screenX < 0.5;
        const isTop = screenY < 0.5;

        let padName: 'snare' | 'hihat' | 'kick' | 'crash' = 'snare';
        let velocityIndex = 1; // Snare velocity index default

        if (isLeft && isTop) {
          padName = 'snare';
          velocityIndex = 1;
        } else if (!isLeft && isTop) {
          padName = 'hihat';
          velocityIndex = 2;
        } else if (isLeft && !isTop) {
          padName = 'kick';
          velocityIndex = 0;
        } else {
          padName = 'crash';
          velocityIndex = 3;
        }

        // Calculate velocity based on strike speed
        let velocity = Math.max(0.3, Math.min(1.0, 0.4 + (dy - 0.06) * 5.0));
        const velMult = moodConfig.velocityMultipliers[velocityIndex] || 1.0;
        velocity = Math.max(0.15, Math.min(1.0, velocity * velMult));

        drumAudio.trigger(padName, velocity);
        lastHitTime = now;
      }
    }
    prevRightY = clampedY;
  } else {
    prevRightY = null;
  }
}
