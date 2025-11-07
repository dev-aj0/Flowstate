"use client";

import { cn } from '@/lib/utils';

interface FocusMeterProps {
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function FocusMeter({ percentage, size = 'md', showLabel = true }: FocusMeterProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const getFocusColor = (pct: number) => {
    if (pct >= 70) return '#22c55e'; // Green - Excellent focus
    if (pct >= 50) return '#3b82f6'; // Blue - Good focus
    if (pct >= 30) return '#f97316'; // Orange - Moderate focus
    return '#ef4444'; // Red - Low focus
  };

  const color = getFocusColor(percentage);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn("relative", sizeClasses[size])}>
        <svg className="transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="8"
            className="dark:stroke-[rgba(255,255,255,0.1)] light:stroke-[rgba(0,0,0,0.1)]"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
            style={{
              filter: `drop-shadow(0 0 8px ${color}40)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold", textSizeClasses[size])} style={{ color }}>
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      {showLabel && (
        <span className="text-sm text-muted-foreground">Focus Level</span>
      )}
    </div>
  );
}