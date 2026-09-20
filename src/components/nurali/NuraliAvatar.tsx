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
      <img
        src="/images/nurali-avatar.png"
        alt="ИИ Нұрәлі - Домбыра Тәлімгері"
        className={`w-full h-full object-cover select-none pointer-events-none transition-transform duration-300 ${
          isTalking ? 'scale-105' : 'scale-100'
        }`}
      />
      {isTalking && (
        <span className="absolute bottom-0 inset-x-0 h-1 bg-amber-400 animate-pulse z-20" />
      )}
    </div>
  );
};

export default NuraliAvatar;
