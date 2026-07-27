import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { TrackingResult } from '../tracking/handLandmarker';

interface SelfViewCameraProps {
  trackingResult: TrackingResult | null;
}

// MediaPipe hand connections for skeleton drawing
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

export const SelfViewCamera: React.FC<SelfViewCameraProps> = ({ trackingResult }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 96 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const WIDTH = 200;
  const HEIGHT = 150;

  // Get the active video stream from the hidden video element
  useEffect(() => {
    const hiddenVideo = document.querySelector<HTMLVideoElement>('video');
    if (hiddenVideo && hiddenVideo.srcObject) {
      videoRef.current = hiddenVideo;
    }
    
    // Also check for the main video element by ref
    const checkForVideo = setInterval(() => {
      const videoEl = document.querySelector<HTMLVideoElement>('video[playsInline]');
      if (videoEl && videoEl.readyState >= 2) {
        videoRef.current = videoEl;
        clearInterval(checkForVideo);
      }
    }, 500);

    return () => clearInterval(checkForVideo);
  }, []);

  // Draw on canvas whenever tracking result updates
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isCollapsed) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Draw the mirrored video frame
    const video = videoRef.current;
    if (video && video.readyState >= 2) {
      ctx.save();
      // Mirror the video horizontally
      ctx.translate(WIDTH, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, WIDTH, HEIGHT);
      ctx.restore();
    }

    // Draw skeleton overlay if enabled
    if (showSkeleton && trackingResult) {
      const scaleX = WIDTH;
      const scaleY = HEIGHT;

      trackingResult.hands.forEach((hand) => {
        const isLeft = hand.handedness === 'Left';
        const strokeColor = isLeft ? 'rgba(0, 242, 254, 0.7)' : 'rgba(224, 86, 253, 0.7)';
        const fillColor = isLeft ? '#00f2fe' : '#e056fd';

        // Draw connection lines
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 4;
        ctx.shadowColor = isLeft ? '#00f2fe' : '#e056fd';

        HAND_CONNECTIONS.forEach(([start, end]) => {
          const p1 = hand.landmarks[start];
          const p2 = hand.landmarks[end];
          ctx.beginPath();
          ctx.moveTo(p1.x * scaleX, p1.y * scaleY);
          ctx.lineTo(p2.x * scaleX, p2.y * scaleY);
          ctx.stroke();
        });

        // Draw landmark dots
        ctx.shadowBlur = 0;
        hand.landmarks.forEach((lm, idx) => {
          const isFingertip = [4, 8, 12, 16, 20].includes(idx);
          ctx.beginPath();
          ctx.arc(lm.x * scaleX, lm.y * scaleY, isFingertip ? 4 : 2.5, 0, 2 * Math.PI);
          ctx.fillStyle = isFingertip ? fillColor : '#ffffff';
          ctx.fill();
          ctx.lineWidth = 1;
          ctx.strokeStyle = '#121214';
          ctx.stroke();
        });
      });
    }
  }, [trackingResult, showSkeleton, isCollapsed]);

  // Dragging handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - WIDTH, e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - HEIGHT, e.clientY - dragOffset.current.y)),
      });
    };
    
    const handleMouseUp = () => setIsDragging(false);
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        style={{ left: 16, bottom: 96 }}
        className="fixed z-50 w-10 h-10 glass-panel rounded-full flex items-center justify-center border border-outline-variant/30 hover:border-primary/50 transition-all cursor-pointer"
        title="Show camera view"
      >
        <span className="material-symbols-outlined text-primary text-lg">videocam</span>
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ left: position.x, top: position.y }}
      className="fixed z-50 select-none"
    >
      <div className="glass-panel rounded-lg border border-outline-variant/20 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.5)] bg-background/80 backdrop-blur-md">
        {/* Header bar - draggable */}
        <div
          onMouseDown={handleMouseDown}
          className="flex items-center justify-between px-2 py-1 bg-surface-container/40 cursor-grab active:cursor-grabbing border-b border-outline-variant/10"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_4px_#00dbe7]"></div>
            <span className="font-label-mono text-[8px] text-on-surface-variant uppercase tracking-wider">CAM</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSkeleton(!showSkeleton)}
              className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${
                showSkeleton ? 'text-primary' : 'text-on-surface-variant/50 hover:text-on-surface-variant'
              }`}
              title={showSkeleton ? 'Hide skeleton' : 'Show skeleton'}
            >
              <span className="material-symbols-outlined text-[11px]">accessibility_new</span>
            </button>
            <button
              onClick={() => setIsCollapsed(true)}
              className="w-5 h-5 flex items-center justify-center rounded text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
              title="Minimize"
            >
              <span className="material-symbols-outlined text-[11px]">close</span>
            </button>
          </div>
        </div>

        {/* Canvas area */}
        <div className="relative" style={{ width: WIDTH, height: HEIGHT }}>
          <canvas
            ref={canvasRef}
            width={WIDTH}
            height={HEIGHT}
            className="w-full h-full"
          />
          
          {/* L-bracket corners */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary/40 pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary/40 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary/40 pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary/40 pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
};

