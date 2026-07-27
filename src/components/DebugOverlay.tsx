import React, { useRef, useEffect } from 'react';
import type { TrackingResult } from '../tracking/handLandmarker';
import { analyzeHand, getDistance3D } from '../tracking/gestureDetector';
import { useAppStore } from '../store/appStore';

interface DebugOverlayProps {
  trackingResult: TrackingResult | null;
  width: number;
  height: number;
}

// MediaPipe hand connections definitions
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [5, 9], [9, 10], [10, 11], [11, 12], // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [0, 17] // Palm base
];

interface VisualRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

// Persistent arrays for tracking active states to detect transitions (for ripples)
const prevPadsPressed: { [key: string]: boolean } = {};
const prevKeysPressed: { [key: number]: boolean } = {};
const prevTablaPressed: { [key: string]: boolean } = {};
const prevStringsPressed: { [key: number]: boolean } = {};

let activeRipples: VisualRipple[] = [];

export const DebugOverlay: React.FC<DebugOverlayProps> = ({ trackingResult, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeInstrument = useAppStore((state) => state.activeInstrument);
  const showDebug = useAppStore((state) => state.showDebug);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // 1. Process active ripples (expanding & fading out)
    activeRipples.forEach((ripple) => {
      ripple.radius += 4;
      ripple.alpha -= 0.04;
    });
    // Filter out dead ripples
    activeRipples = activeRipples.filter((r) => r.alpha > 0);

    // 2. Draw active instrument overlay zones (takes tracking results and updates active states)
    drawInstrumentZones(ctx, activeInstrument, width, height, trackingResult);

    // 3. Draw ripples
    ctx.save();
    activeRipples.forEach((ripple) => {
      ctx.strokeStyle = ripple.color;
      ctx.globalAlpha = Math.max(0, ripple.alpha);
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = ripple.color;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, 2 * Math.PI);
      ctx.stroke();
    });
    ctx.restore();

    if (!showDebug || !trackingResult) return;

    // 4. Draw hand landmarks and bones
    trackingResult.hands.forEach((hand) => {
      const handState = analyzeHand(hand.landmarks);
      const isLeft = hand.handedness === 'Left';

      // Draw connection lines
      ctx.lineWidth = 4;
      ctx.strokeStyle = isLeft ? 'rgba(0, 242, 254, 0.6)' : 'rgba(224, 86, 253, 0.6)';
      ctx.shadowBlur = 10;
      ctx.shadowColor = isLeft ? '#00f2fe' : '#e056fd';

      HAND_CONNECTIONS.forEach(([start, end]) => {
        const p1 = hand.landmarks[start];
        const p2 = hand.landmarks[end];
        
        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
      });

      // Reset shadows for dots
      ctx.shadowBlur = 0;

      // Draw landmarks
      hand.landmarks.forEach((lm, idx) => {
        ctx.beginPath();
        const isFingertip = [4, 8, 12, 16, 20].includes(idx);
        ctx.arc(lm.x * width, lm.y * height, isFingertip ? 7 : 4, 0, 2 * Math.PI);
        ctx.fillStyle = isFingertip 
          ? (isLeft ? '#00f2fe' : '#e056fd')
          : '#ffffff';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#121214';
        ctx.stroke();
      });

      // Draw hand shape text near the wrist
      const wrist = hand.landmarks[0];
      ctx.font = 'bold 14px "Outfit", system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#000000';
      
      const label = `${hand.handedness === 'Left' ? 'L' : 'R'}: ${handState.shape.toUpperCase()}`;
      ctx.fillText(label, wrist.x * width - 25, wrist.y * height + 25);
      
      ctx.shadowBlur = 0;
    });

  }, [trackingResult, width, height, activeInstrument, showDebug]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
    />
  );
};

// Draw helper for instrument interaction zones
function drawInstrumentZones(
  ctx: CanvasRenderingContext2D,
  instrument: string,
  w: number,
  h: number,
  trackingResult: TrackingResult | null
) {
  ctx.save();
  const { leftHandRange, rightHandRange } = useAppStore.getState();

  if (instrument === 'drums') {
    const padW = w * 0.25;
    const padH = h * 0.25;
    const pads = [
      { name: 'KICK', key: 'kick', x: w * 0.15, y: h * 0.6, color: 'rgba(255, 75, 75, 0.12)', activeColor: 'rgba(255, 75, 75, 0.35)', border: '#ff4b4b' },
      { name: 'SNARE', key: 'snare', x: w * 0.15, y: h * 0.3, color: 'rgba(255, 168, 0, 0.12)', activeColor: 'rgba(255, 168, 0, 0.35)', border: '#ffa800' },
      { name: 'HI-HAT', key: 'hihat', x: w * 0.6, y: h * 0.3, color: 'rgba(0, 242, 254, 0.12)', activeColor: 'rgba(0, 242, 254, 0.35)', border: '#00f2fe' },
      { name: 'CRASH', key: 'crash', x: w * 0.6, y: h * 0.6, color: 'rgba(155, 89, 182, 0.12)', activeColor: 'rgba(155, 89, 182, 0.35)', border: '#9b59b6' },
    ];

    pads.forEach((pad) => {
      let isPressed = false;
      let strikeX = pad.x + padW / 2;
      let strikeY = pad.y + padH / 2;

      if (trackingResult) {
        isPressed = trackingResult.hands.some((hand) => {
          return [8, 12].some((tipIdx) => {
            const lm = hand.landmarks[tipIdx];
            const screenX = lm.x * w;
            const screenY = lm.y * h;
            const inside = screenX >= pad.x && screenX <= pad.x + padW && screenY >= pad.y && screenY <= pad.y + padH;
            if (inside) {
              strikeX = screenX;
              strikeY = screenY;
            }
            return inside;
          });
        });
      }

      // Detect transition (off -> on) to spawn a ripple
      const wasPressed = !!prevPadsPressed[pad.key];
      if (isPressed && !wasPressed) {
        activeRipples.push({
          x: strikeX,
          y: strikeY,
          radius: 10,
          maxRadius: w * 0.15,
          color: pad.border,
          alpha: 1.0,
        });
      }
      prevPadsPressed[pad.key] = isPressed;

      ctx.fillStyle = isPressed ? pad.activeColor : pad.color;
      ctx.strokeStyle = pad.border;
      ctx.lineWidth = isPressed ? 4.5 : 2.5;

      if (isPressed) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = pad.border;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.roundRect(pad.x, pad.y, padW, padH, 16);
      ctx.fill();
      ctx.stroke();

      // Text
      ctx.font = 'bold 16px "Outfit", system-ui, sans-serif';
      ctx.fillStyle = pad.border;
      ctx.textAlign = 'center';
      ctx.fillText(pad.name, pad.x + padW / 2, pad.y + padH / 2 + 6);
      ctx.shadowBlur = 0;
    });

  } else if (instrument === 'piano') {
    const keyCount = 8;
    const keyW = w / keyCount;
    const keyH = h * 0.25;
    const keyY = h * 0.7;

    for (let i = 0; i < keyCount; i++) {
      const keyX = i * keyW;
      let isPressed = false;
      let strikeX = keyX + keyW / 2;
      let strikeY = keyY + 15;

      if (trackingResult) {
        isPressed = trackingResult.hands.some((hand) => {
          const range = hand.handedness === 'Left' ? leftHandRange : rightHandRange;
          const rangeX = range.maxX - range.minX;
          const rangeY = range.maxY - range.minY;

          return [4, 8, 12, 16, 20].some((tipIdx) => {
            const lm = hand.landmarks[tipIdx];
            const normX = rangeX > 0 ? (lm.x - range.minX) / rangeX : 0.5;
            const normY = rangeY > 0 ? (lm.y - range.minY) / rangeY : 0.5;
            
            const screenX = (1 - Math.max(0, Math.min(1, normX))) * w;
            const keyIdx = Math.floor((screenX / w) * keyCount);
            const inside = normY >= 0.65 && keyIdx === i;
            if (inside) {
              strikeX = screenX;
              strikeY = lm.y * h;
            }
            return inside;
          });
        });
      }

      // Ripple on key press transition
      const wasPressed = !!prevKeysPressed[i];
      if (isPressed && !wasPressed) {
        activeRipples.push({
          x: strikeX,
          y: strikeY,
          radius: 5,
          maxRadius: keyW * 1.5,
          color: '#e056fd',
          alpha: 0.9,
        });
      }
      prevKeysPressed[i] = isPressed;

      ctx.fillStyle = isPressed ? 'rgba(224, 86, 253, 0.25)' : 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = isPressed ? '#e056fd' : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = isPressed ? 2.5 : 1;

      if (isPressed) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#e056fd';
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.rect(keyX, keyY, keyW, keyH);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 14px "Outfit", system-ui, sans-serif';
      ctx.fillStyle = isPressed ? '#ffffff' : 'rgba(255, 255, 255, 0.6)';
      ctx.textAlign = 'center';
      ctx.fillText('●', keyX + keyW / 2, keyY + keyH - 15);
      ctx.shadowBlur = 0;
    }

  } else if (instrument === 'tabla') {
    const drums = [
      { name: 'BAYAN (Bass)', key: 'bayan', cx: w * 0.33, cy: h * 0.6, r: w * 0.12, color: 'rgba(0, 184, 148, 0.12)', activeColor: 'rgba(0, 184, 148, 0.35)', border: '#00b894', hand: 'Left' },
      { name: 'DAYAN (Treble)', key: 'dayan', cx: w * 0.67, cy: h * 0.6, r: w * 0.10, color: 'rgba(9, 132, 227, 0.12)', activeColor: 'rgba(9, 132, 227, 0.35)', border: '#0984e3', hand: 'Right' },
    ];

    drums.forEach((drum) => {
      let isPressed = false;
      let strikeX = drum.cx;
      let strikeY = drum.cy;

      if (trackingResult) {
        const hand = trackingResult.hands.find((h) => h.handedness === drum.hand);
        if (hand) {
          const indexTip = hand.landmarks[8];
          const screenX = (1 - indexTip.x) * w;
          const screenY = indexTip.y * h;
          const dist = Math.sqrt(Math.pow(screenX - drum.cx, 2) + Math.pow(screenY - drum.cy, 2));
          isPressed = dist <= drum.r;
          if (isPressed) {
            strikeX = screenX;
            strikeY = screenY;
          }
        }
      }

      // Ripple on drum zone strike transition
      const wasPressed = !!prevTablaPressed[drum.key];
      if (isPressed && !wasPressed) {
        activeRipples.push({
          x: strikeX,
          y: strikeY,
          radius: 12,
          maxRadius: drum.r * 1.8,
          color: drum.border,
          alpha: 1.0,
        });
      }
      prevTablaPressed[drum.key] = isPressed;

      ctx.fillStyle = isPressed ? drum.activeColor : drum.color;
      ctx.strokeStyle = drum.border;
      ctx.lineWidth = isPressed ? 5 : 3;

      if (isPressed) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = drum.border;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.arc(drum.cx, drum.cy, drum.r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 16px "Outfit", system-ui, sans-serif';
      ctx.fillStyle = drum.border;
      ctx.textAlign = 'center';
      ctx.fillText(drum.name, drum.cx, drum.cy + 6);
      ctx.shadowBlur = 0;
    });

  } else if (instrument === 'guitar') {
    const guitarY = h * 0.5;
    const guitarX = w * 0.25;
    const guitarW = w * 0.5;
    const stringGap = 20;

    let pinchY: number | null = null;
    let isPinch = false;
    let pinchMidX = w * 0.5;

    if (trackingResult) {
      const rightHand = trackingResult.hands.find((h) => h.handedness === 'Right');
      if (rightHand) {
        const thumb = rightHand.landmarks[4];
        const index = rightHand.landmarks[8];
        const dist = getDistance3D(thumb, index);
        isPinch = dist < 0.045;

        const range = rightHandRange;
        const rangeY = range.maxY - range.minY;
        const normY = rangeY > 0 ? (index.y - range.minY) / rangeY : 0.5;
        pinchY = Math.max(0, Math.min(1, normY));

        const rangeX = range.maxX - range.minX;
        const normX = rangeX > 0 ? ((thumb.x + index.x) / 2 - range.minX) / rangeX : 0.5;
        pinchMidX = (1 - Math.max(0, Math.min(1, normX))) * w;
      }
    }

    ctx.fillStyle = 'rgba(211, 84, 0, 0.08)';
    ctx.strokeStyle = 'rgba(211, 84, 0, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(guitarX - 20, guitarY - 30, guitarW + 40, stringGap * 5 + 60, 24);
    ctx.fill();
    ctx.stroke();

    const STRINGS_Y_NORM = [0.42, 0.47, 0.52, 0.57, 0.62, 0.67];

    for (let i = 0; i < 6; i++) {
      const y = guitarY + i * stringGap;
      const stringNormY = STRINGS_Y_NORM[i];
      const isStringPressed = isPinch && pinchY !== null && Math.abs(pinchY - stringNormY) < 0.025;

      // Ripple on string cross transition
      const wasPressed = !!prevStringsPressed[i];
      if (isStringPressed && !wasPressed) {
        activeRipples.push({
          x: pinchMidX,
          y: y,
          radius: 5,
          maxRadius: 80,
          color: '#00f2fe',
          alpha: 0.85,
        });
      }
      prevStringsPressed[i] = isStringPressed;

      ctx.strokeStyle = isStringPressed ? '#ffffff' : `rgba(255, 255, 255, ${0.4 + i * 0.08})`;
      ctx.lineWidth = isStringPressed ? 3.5 : 1 + i * 0.5;

      if (isStringPressed) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f2fe';
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.moveTo(guitarX, y);
      ctx.lineTo(guitarX + guitarW, y);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  ctx.restore();
}
