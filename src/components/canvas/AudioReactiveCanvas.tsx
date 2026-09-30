'use client';

import React, { useEffect, useRef } from 'react';
import { soundWave } from '@/utils/soundWave';

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  alpha: number;
  decay: number;
  colorPrefix: string;
}

export default function AudioReactiveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bgRipples: Ripple[] = [];
    let audioEnergy = 0.06;
    let bgTime = 0;
    let animId: number;

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const handleWaveTrigger = (freq = 293, intensity = 1.0, x: number | null = null, y: number | null = null) => {
      const waveX = x !== null ? x : canvas.width * (0.35 + Math.random() * 0.3);
      const waveY = y !== null ? y : canvas.height * (0.35 + Math.random() * 0.3);

      // High pitch (>260Hz) = glowing gold, lower pitch = steppe jade/emerald
      const isGold = freq >= 260;
      const colorPrefix = isGold ? 'rgba(212, 175, 55,' : 'rgba(82, 183, 136,';

      bgRipples.push({
        x: waveX,
        y: waveY,
        radius: 15,
        maxRadius: Math.max(canvas.width, canvas.height) * 0.85,
        speed: 5 + intensity * 6,
        alpha: 0.65 * intensity,
        decay: 0.009,
        colorPrefix,
      });

      audioEnergy = Math.min(1.0, audioEnergy + 0.35 * intensity);
    };

    const unsubscribe = soundWave.subscribe(handleWaveTrigger);

    // Animation render loop
    const render = () => {
      bgTime += 0.009;
      audioEnergy = Math.max(0.04, audioEnergy * 0.965);

      const w = canvas.width;
      const h = canvas.height;

      // Deep obsidian / Steppe palette gradient
      const grad = ctx.createLinearGradient(0, 0, w * 0.4, h);
      grad.addColorStop(0, '#090503');
      grad.addColorStop(0.5, '#150D09');
      grad.addColorStop(1, '#0B0705');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Dynamic plasma glow orbs (silk mesh effect)
      const orb1X = w * 0.3 + Math.sin(bgTime) * w * 0.16;
      const orb1Y = h * 0.28 + Math.cos(bgTime * 0.85) * h * 0.14;
      const orb1R = w * 0.36 * (1 + audioEnergy * 0.55);

      const g1 = ctx.createRadialGradient(orb1X, orb1Y, 0, orb1X, orb1Y, orb1R);
      g1.addColorStop(0, `rgba(196, 145, 56, ${0.14 + audioEnergy * 0.28})`);
      g1.addColorStop(0.5, `rgba(139, 90, 43, ${0.05 + audioEnergy * 0.12})`);
      g1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      const orb2X = w * 0.72 + Math.cos(bgTime * 0.95) * w * 0.14;
      const orb2Y = h * 0.72 + Math.sin(bgTime * 1.1) * h * 0.16;
      const orb2R = w * 0.42 * (1 + audioEnergy * 0.45);

      const g2 = ctx.createRadialGradient(orb2X, orb2Y, 0, orb2X, orb2Y, orb2R);
      g2.addColorStop(0, `rgba(82, 183, 136, ${0.09 + audioEnergy * 0.22})`);
      g2.addColorStop(0.6, `rgba(38, 70, 53, ${0.03 + audioEnergy * 0.08})`);
      g2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      // Soundwave ripples expanding across the screen
      for (let i = bgRipples.length - 1; i >= 0; i--) {
        const r = bgRipples[i];
        r.radius += r.speed;
        r.alpha -= r.decay;

        if (r.alpha <= 0 || r.radius >= r.maxRadius) {
          bgRipples.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `${r.colorPrefix}${r.alpha})`;
        ctx.lineWidth = Math.max(1, 4 * (r.alpha / 0.65));
        ctx.shadowColor = '#D4AF37';
        ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      unsubscribe();
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 w-full h-full"
    />
  );
}
