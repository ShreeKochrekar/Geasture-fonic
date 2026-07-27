import type { TrackingResult } from '../tracking/handLandmarker';
import { mapThereminLandmarks } from './theremin';
import { mapDrumsLandmarks } from './drums';
import { mapPianoLandmarks } from './piano';
import { mapGuitarLandmarks } from './guitar';
import { mapTablaLandmarks } from './tabla';
import { useAppStore } from '../store/appStore';

export function routeLandmarksToAudio(result: TrackingResult) {
  const { activeInstrument, isAudioStarted, calibrationStep } = useAppStore.getState();

  // If audio is not started, or if we are calibrating, don't play notes
  if (!isAudioStarted || calibrationStep !== 'none') {
    return;
  }

  switch (activeInstrument) {
    case 'theremin':
      mapThereminLandmarks(result);
      break;
    case 'drums':
      mapDrumsLandmarks(result);
      break;
    case 'piano':
      mapPianoLandmarks(result);
      break;
    case 'guitar':
      mapGuitarLandmarks(result);
      break;
    case 'tabla':
      mapTablaLandmarks(result);
      break;
    default:
      break;
  }
}
