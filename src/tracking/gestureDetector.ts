import type { Landmark3D } from './oneEuroFilter';

export interface GestureState {
  isPinch: boolean;
  pinchDist: number;
  extendedFingers: boolean[];
  fingerCount: number;
  shape: 'fist' | 'open' | 'peace' | 'thumb_up' | 'pointer' | 'unknown';
}

// Math helper for 3D distance
export function getDistance3D(p1: Landmark3D, p2: Landmark3D): number {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) +
    Math.pow(p1.y - p2.y, 2) +
    Math.pow(p1.z - p2.z, 2)
  );
}

// Math helper for 2D distance
export function getDistance2D(p1: Landmark3D, p2: Landmark3D): number {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) +
    Math.pow(p1.y - p2.y, 2)
  );
}

// Pinch detection: returns distance between thumb tip (4) and index tip (8)
export function getPinchDistance(landmarks: Landmark3D[]): number {
  if (landmarks.length < 9) return 999;
  return getDistance3D(landmarks[4], landmarks[8]);
}

// Calculate velocity between two frames (units per second)
export function calculateVelocity(
  current: Landmark3D,
  previous: Landmark3D,
  dtSeconds: number
): number {
  if (dtSeconds <= 0) return 0;
  const dist = getDistance3D(current, previous);
  return dist / dtSeconds;
}

// Determine which fingers are extended
export function detectExtendedFingers(landmarks: Landmark3D[]): boolean[] {
  if (landmarks.length < 21) return [false, false, false, false, false];

  const wrist = landmarks[0];

  // Helper: true if tip is further from wrist than the joint below it
  const isFingerExtended = (tipIdx: number, jointIdx: number, threshold = 1.15): boolean => {
    const tipDist = getDistance3D(landmarks[tipIdx], wrist);
    const jointDist = getDistance3D(landmarks[jointIdx], wrist);
    return tipDist > jointDist * threshold;
  };

  // Thumb is trickier since it moves sideways.
  // We check distance from thumb tip (4) to thumb MCP (2) and to pinky base (17) to see if it's spread out.
  const thumbTip = landmarks[4];
  const thumbBase = landmarks[2];
  const indexBase = landmarks[5];

  const thumbLength = getDistance3D(thumbTip, thumbBase);
  const thumbToIndexBase = getDistance3D(thumbTip, indexBase);
  // If thumb is spread wide, it should be far from index base
  const isThumbExtended = getDistance3D(thumbTip, wrist) > getDistance3D(thumbBase, wrist) * 1.1 && 
                         thumbToIndexBase > thumbLength * 1.0;

  const isIndexExtended = isFingerExtended(8, 6);
  const isMiddleExtended = isFingerExtended(12, 10);
  const isRingExtended = isFingerExtended(16, 14);
  const isPinkyExtended = isFingerExtended(20, 18);

  return [isThumbExtended, isIndexExtended, isMiddleExtended, isRingExtended, isPinkyExtended];
}

// Classify hand shape from the list of extended fingers
export function classifyHandShape(extended: boolean[]): 'fist' | 'open' | 'peace' | 'thumb_up' | 'pointer' | 'unknown' {
  const [thumb, index, middle, ring, pinky] = extended;
  const extCount = extended.filter(Boolean).length;

  // Fist: no fingers (or only thumb slightly)
  if (extCount === 0 || (extCount === 1 && thumb)) {
    return 'fist';
  }

  // Open Hand: 4 or 5 fingers
  if (extCount >= 4) {
    return 'open';
  }

  // Peace: index and middle only
  if (extCount === 2 && index && middle && !ring && !pinky) {
    return 'peace';
  }

  // Thumbs Up: thumb extended, others folded
  if (thumb && !index && !middle && !ring && !pinky) {
    return 'thumb_up';
  }

  // Pointer: index finger only
  if (index && !middle && !ring && !pinky) {
    return 'pointer';
  }

  return 'unknown';
}

// Parse entire hand state
export function analyzeHand(landmarks: Landmark3D[]): GestureState {
  const pDist = getPinchDistance(landmarks);
  const extended = detectExtendedFingers(landmarks);
  const fingerCount = extended.filter(Boolean).length;
  const shape = classifyHandShape(extended);

  return {
    isPinch: pDist < 0.04, // empirical threshold for pinch
    pinchDist: pDist,
    extendedFingers: extended,
    fingerCount,
    shape,
  };
}
