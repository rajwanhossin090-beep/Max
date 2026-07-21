import React, { useEffect, useRef } from 'react';
import { MaxState } from '../types';

interface MaxOrbCanvasProps {
  state: MaxState;
  audioLevel?: number; // 0.0 to 1.0
  onClick?: () => void;
}

export const MaxOrbCanvas: React.FC<MaxOrbCanvasProps> = ({ state, audioLevel = 0.5, onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let rotation = 0;
    let pulsePhase = 0;

    // Particle system
    const particles: { x: number; y: number; size: number; speedX: number; speedY: number; opacity: number; hue: number }[] = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: (Math.random() - 0.5) * 0.8,
        opacity: Math.random() * 0.8 + 0.2,
        hue: Math.random() > 0.5 ? 330 : 190, // Neon pink or cyan
      });
    }

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      rotation += 0.02;
      pulsePhase += 0.04;

      const baseRadius = Math.min(width, height) * 0.28;
      const pulse = Math.sin(pulsePhase) * 12 + (audioLevel * 30);

      // Render Particles
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (Math.hypot(p.x, p.y) > baseRadius * 1.8) {
          p.x = (Math.random() - 0.5) * 60;
          p.y = (Math.random() - 0.5) * 60;
        }
        ctx.beginPath();
        ctx.arc(centerX + p.x, centerY + p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${p.opacity * (state === 'speaking' ? 1 : 0.6)})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.hue === 330 ? '#ff2a85' : '#00f2fe';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      if (state === 'idle') {
        // Soft, breathing glow
        const gradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, baseRadius + pulse);
        gradient.addColorStop(0, 'rgba(0, 242, 254, 0.9)');
        gradient.addColorStop(0.4, 'rgba(255, 42, 133, 0.7)');
        gradient.addColorStop(0.8, 'rgba(127, 0, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius + pulse, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Inner Core
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#00f2fe';
        ctx.fill();
        ctx.shadowBlur = 0;

      } else if (state === 'listening') {
        // Active Listening Waveform Rings
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);

        const barCount = 32;
        for (let i = 0; i < barCount; i++) {
          const angle = (i / barCount) * Math.PI * 2;
          const barHeight = 15 + Math.sin(rotation * 4 + i) * 20 + (audioLevel * 45);
          const x1 = Math.cos(angle) * (baseRadius * 0.8);
          const y1 = Math.sin(angle) * (baseRadius * 0.8);
          const x2 = Math.cos(angle) * (baseRadius * 0.8 + barHeight);
          const y2 = Math.sin(angle) * (baseRadius * 0.8 + barHeight);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = i % 2 === 0 ? '#00f2fe' : '#ff2a85';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
        ctx.restore();

        // Center Pulsing Orb
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 0.6 + (audioLevel * 15), 0, Math.PI * 2);
        ctx.fillStyle = '#00f2fe';
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#00f2fe';
        ctx.fill();
        ctx.shadowBlur = 0;

      } else if (state === 'thinking') {
        // Pulsing Neon Multi-Layer Rings
        ctx.save();
        ctx.translate(centerX, centerY);

        // Ring 1
        ctx.rotate(rotation * 2);
        ctx.beginPath();
        ctx.arc(0, 0, baseRadius * 1.1, 0, Math.PI * 1.5);
        ctx.strokeStyle = '#ff2a85';
        ctx.lineWidth = 6;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff2a85';
        ctx.stroke();

        // Ring 2
        ctx.rotate(-rotation * 3);
        ctx.beginPath();
        ctx.arc(0, 0, baseRadius * 0.85, 0, Math.PI * 1.2);
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 5;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f2fe';
        ctx.stroke();

        ctx.restore();

        // Glowing center
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#7f00ff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff2a85';
        ctx.fill();

      } else if (state === 'speaking') {
        // Dynamic Audio Waveform
        const waveCount = 5;
        for (let w = 0; w < waveCount; w++) {
          const waveRadius = baseRadius + (w * 18) + (audioLevel * 30);
          const alpha = 0.9 - (w * 0.18);

          ctx.beginPath();
          ctx.arc(centerX, centerY, Math.max(10, waveRadius), 0, Math.PI * 2);
          ctx.strokeStyle = w % 2 === 0 ? `rgba(255, 42, 133, ${alpha})` : `rgba(0, 242, 254, ${alpha})`;
          ctx.lineWidth = 5 - (w * 0.8);
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#ff2a85';
          ctx.stroke();
        }

        // Vibrant Core
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = '#ff2a85';
        ctx.shadowBlur = 35;
        ctx.shadowColor = '#ff2a85';
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, audioLevel]);

  return (
    <div
      onClick={onClick}
      className="relative flex items-center justify-center cursor-pointer group selection:bg-none select-none"
    >
      <canvas
        ref={canvasRef}
        width={340}
        height={340}
        className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 drop-shadow-[0_0_12px_rgba(255,42,133,0.8)] uppercase">
          MAX
        </span>
        <span className="text-xs font-semibold tracking-wider text-cyan-300/80 uppercase mt-1">
          {state === 'idle' && 'Tap to Speak'}
          {state === 'listening' && 'Listening...'}
          {state === 'thinking' && 'Processing...'}
          {state === 'speaking' && 'MAX Speaking'}
          {state === 'error' && 'Tap to Retry'}
        </span>
      </div>
    </div>
  );
};
