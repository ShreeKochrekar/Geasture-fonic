import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import type { HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { HandSmoother } from './oneEuroFilter';
import type { Landmark3D } from './oneEuroFilter';
import { useAppStore } from '../store/appStore';

let landmarker: HandLandmarker | null = null;
let animationFrameId: number | null = null;
let isTracking = false;

// Instantiate smoothers for left and right hands
const leftSmoother = new HandSmoother(1.2, 0.04);
const rightSmoother = new HandSmoother(1.2, 0.04);

export async function initHandLandmarker(): Promise<HandLandmarker> {
  if (landmarker) return landmarker;

  try {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm'
    );
    
    landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    useAppStore.getState().setModelLoaded(true);
    return landmarker;
  } catch (error) {
    console.error('Failed to initialize MediaPipe HandLandmarker:', error);
    throw error;
  }
}

export interface ProcessedHand {
  landmarks: Landmark3D[];
  rawLandmarks: Landmark3D[];
  handedness: 'Left' | 'Right';
  score: number;
}

export interface TrackingResult {
  hands: ProcessedHand[];
  timestamp: number;
}

export function startTracking(
  video: HTMLVideoElement,
  onResults: (result: TrackingResult) => void
) {
  if (!landmarker) {
    console.warn('HandLandmarker is not initialized yet.');
    return;
  }

  isTracking = true;
  leftSmoother.reset();
  rightSmoother.reset();

  const trackingLoop = () => {
    if (!isTracking) return;

    const timestamp = performance.now();

    if (video.readyState >= 2) {
      try {
        const rawResult: HandLandmarkerResult = landmarker!.detectForVideo(video, timestamp);
        
        const processedHands: ProcessedHand[] = [];

        if (rawResult.landmarks && rawResult.landmarks.length > 0) {
          rawResult.landmarks.forEach((handLandmarks, index) => {
            const handInfo = rawResult.handednesses[index][0];
            const isLeft = handInfo.categoryName === 'Left';
            const smoother = isLeft ? leftSmoother : rightSmoother;

            // MediaPipe raw coordinates
            const rawLms: Landmark3D[] = handLandmarks.map((lm) => ({
              x: lm.x,
              y: lm.y,
              z: lm.z,
            }));

            // Smooth the coordinates using One Euro Filter
            const smoothedLms = smoother.smooth(rawLms, timestamp);

            processedHands.push({
              landmarks: smoothedLms,
              rawLandmarks: rawLms,
              handedness: isLeft ? 'Left' : 'Right',
              score: handInfo.score,
            });
          });
        }

        onResults({
          hands: processedHands,
          timestamp,
        });

      } catch (err) {
        console.error('Error running HandLandmarker detection:', err);
      }
    }

    animationFrameId = requestAnimationFrame(trackingLoop);
  };

  animationFrameId = requestAnimationFrame(trackingLoop);
}

export function stopTracking() {
  isTracking = false;
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  leftSmoother.reset();
  rightSmoother.reset();
}
