'use client';

import React from 'react';

interface NuraliAvatarProps {
  isTalking?: boolean;
  className?: string;
  isHovered?: boolean;
}

export const NuraliAvatar: React.FC<NuraliAvatarProps> = ({
  isTalking = false,
  className = 'w-full h-full',
}) => {
  return (
    <div className={`relative rounded-full overflow-hidden select-none bg-[#1A1009] ${className}`}>
      <svg
        className={`w-full h-full transition-transform duration-300 ${isTalking ? 'scale-105' : 'scale-100'}`}
        viewBox="-55 10 700 700"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'hidden', borderRadius: '50%' }}
      >
        <defs>
          <radialGradient id="avatarScleraGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FCFCFA" />
            <stop offset="70%" stopColor="#F2ECE6" />
            <stop offset="100%" stopColor="#D9C9BE" />
          </radialGradient>
          <clipPath id="avatar-left-socket-clip">
            <path d="M 138 431 C 146 413, 164 400, 188 396 C 212 399, 230 411, 242 433 C 230 448, 210 458, 180 457 C 154 448, 140 440, 138 431 Z" />
          </clipPath>
          <clipPath id="avatar-right-socket-clip">
            <path d="M 361 431 C 372 418, 390 402, 415 394 C 440 398, 462 408, 472 427 C 460 444, 436 453, 402 453 C 375 444, 364 438, 361 431 Z" />
          </clipPath>
        </defs>

        {/* Sclera */}
        <ellipse cx="190" cy="427" rx="56" ry="33" fill="url(#avatarScleraGrad)" />
        <ellipse cx="416.5" cy="424" rx="58" ry="33" fill="url(#avatarScleraGrad)" />

        {/* Irises */}
        <g clipPath="url(#avatar-left-socket-clip)">
          <image href="/images/nurali_iris.png" x="156" y="393" width="68" height="68" />
        </g>
        <g clipPath="url(#avatar-right-socket-clip)">
          <image href="/images/nurali_iris.png" x="382.5" y="390" width="68" height="68" />
        </g>

        {/* Face Cutout on Top */}
        <image href="/images/nurali_face_cutout.png" x="0" y="0" width="600" height="896" pointerEvents="none" />
      </svg>
      {isTalking && (
        <span className="absolute bottom-0 inset-x-0 h-1 bg-amber-400 animate-pulse z-20" />
      )}
    </div>
  );
};

export default NuraliAvatar;
