"use client";

import { useEffect, useRef } from 'react';
import { EEGReading } from '@/types';

interface EEGWaveformProps {
  readings: EEGReading[];
  height?: number;
  showLegend?: boolean;
}

export function EEGWaveform({ readings, height = 200, showLegend = true }: EEGWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || readings.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }

    // Draw waveforms
    const waves = [
      { key: 'beta', color: '#65c3ff', label: 'Beta (Focus)' },
      { key: 'alpha', color: '#ffb347', label: 'Alpha (Relax)' },
      { key: 'gamma', color: '#7ee8a4', label: 'Gamma' },
    ];

    waves.forEach(({ key, color }) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      const maxPoints = Math.min(readings.length, 100);
      const step = rect.width / maxPoints;

      readings.slice(-maxPoints).forEach((reading, index) => {
        const x = index * step;
        const value = reading[key as keyof EEGReading] as number;
        const y = height - (value / 100) * height;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    });
  }, [readings, height]);

  return (
    <div className="w-full">
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg"
        style={{ height: `${height}px` }}
      />
      {showLegend && (
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#65c3ff]" />
            <span className="text-xs text-[#a8b2c1]">Beta (Focus)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ffb347]" />
            <span className="text-xs text-[#a8b2c1]">Alpha (Relax)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#7ee8a4]" />
            <span className="text-xs text-[#a8b2c1]">Gamma</span>
          </div>
        </div>
      )}
    </div>
  );
}
