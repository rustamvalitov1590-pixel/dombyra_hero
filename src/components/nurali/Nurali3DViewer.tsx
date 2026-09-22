'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Nurali3DViewerProps {
  className?: string;
  autoRotate?: boolean;
  enableControls?: boolean;
  onLoaded?: () => void;
}

export const Nurali3DViewer: React.FC<Nurali3DViewerProps> = ({
  className = 'w-full h-full min-h-[300px]',
  onLoaded,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [headTilt, setHeadTilt] = useState({ rotX: 0, rotY: 0 });
  const [isBlinking, setIsBlinking] = useState(false);

  // Mouse / Touch tracking
  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const normX = Math.max(-1, Math.min(1, (clientX - centerX) / (window.innerWidth / 2)));
      const normY = Math.max(-1, Math.min(1, (clientY - centerY) / (window.innerHeight / 2)));

      setGaze({
        x: normX * 15,
        y: normY * 10,
      });

      setHeadTilt({
        rotY: normX * 12,
        rotX: -normY * 8,
      });
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    if (onLoaded) onLoaded();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [onLoaded]);

  // Natural Blinking Loop
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const loopBlink = () => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
      }, 110);
      timeoutId = setTimeout(loopBlink, 2800 + Math.random() * 3200);
    };
    timeoutId = setTimeout(loopBlink, 2000);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center select-none overflow-hidden ${className}`}
      style={{ perspective: 800 }}
    >
      <div
        className="relative w-full max-w-[320px] aspect-[600/896] transition-transform duration-100 ease-out"
        style={{
          transform: `rotateY(${headTilt.rotY.toFixed(2)}deg) rotateX(${headTilt.rotX.toFixed(2)}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        <svg
          viewBox="0 0 600 896"
          className="w-full h-full"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <radialGradient id="reactScleraGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FCFCFA" />
              <stop offset="70%" stopColor="#F2ECE6" />
              <stop offset="100%" stopColor="#D9C9BE" />
            </radialGradient>
            <linearGradient id="reactEyelidShadow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#381D14" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#381D14" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#381D14" stopOpacity="0" />
            </linearGradient>
            <clipPath id="react-left-socket-clip">
              <path d="M 138 431 C 146 413, 164 400, 188 396 C 212 399, 230 411, 242 433 C 230 448, 210 458, 180 457 C 154 448, 140 440, 138 431 Z" />
            </clipPath>
            <clipPath id="react-right-socket-clip">
              <path d="M 361 431 C 372 418, 390 402, 415 394 C 440 398, 462 408, 472 427 C 460 444, 436 453, 402 453 C 375 444, 364 438, 361 431 Z" />
            </clipPath>
          </defs>

          {/* Sclera (Eyeball Whites) */}
          <ellipse cx="190" cy="427" rx="56" ry="33" fill="url(#reactScleraGrad)" />
          <ellipse cx="416.5" cy="424" rx="58" ry="33" fill="url(#reactScleraGrad)" />

          {/* Left Eye Contents */}
          <g clipPath="url(#react-left-socket-clip)">
            <g transform={`translate(${gaze.x.toFixed(2)}, ${gaze.y.toFixed(2)})`}>
              <image href="/images/nurali_iris.png" x="156" y="393" width="68" height="68" />
            </g>
            <ellipse cx="190" cy="405" rx="56" ry="20" fill="url(#reactEyelidShadow)" pointerEvents="none" />
            <rect
              x="130"
              y="380"
              width="120"
              height="90"
              fill="#DEAB82"
              transform={isBlinking ? 'translate(0, 0)' : 'translate(0, -90)'}
              style={{ transition: 'transform 0.07s ease-in-out' }}
            />
          </g>

          {/* Right Eye Contents */}
          <g clipPath="url(#react-right-socket-clip)">
            <g transform={`translate(${gaze.x.toFixed(2)}, ${gaze.y.toFixed(2)})`}>
              <image href="/images/nurali_iris.png" x="382.5" y="390" width="68" height="68" />
            </g>
            <ellipse cx="416.5" cy="403" rx="58" ry="20" fill="url(#reactEyelidShadow)" pointerEvents="none" />
            <rect
              x="350"
              y="380"
              width="130"
              height="90"
              fill="#DEAB82"
              transform={isBlinking ? 'translate(0, 0)' : 'translate(0, -90)'}
              style={{ transition: 'transform 0.07s ease-in-out' }}
            />
          </g>

          {/* Pixar Face Cutout */}
          <image href="/images/nurali_face_cutout.png" x="0" y="0" width="600" height="896" pointerEvents="none" />
        </svg>
      </div>
    </div>
  );
};

export default Nurali3DViewer;
