"use client";

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  className,
}: StatCardProps) {
  const trendColors = {
    up: 'text-[#22c55e]',
    down: 'text-[#ef4444]',
    neutral: 'text-muted-foreground',
  };

  return (
    <div className={cn("glass-card p-6 hover:bg-white/8 dark:hover:bg-white/8 light:hover:bg-black/8 animate-fade-in transition-colors", className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
        </div>
        {Icon && (
          <div className="w-12 h-12 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-[#3b82f6]" />
          </div>
        )}
      </div>
      {(subtitle || trend) && (
        <div className="flex items-center justify-between text-sm">
          {subtitle && <span className="text-muted-foreground">{subtitle}</span>}
          {trend && trendValue && (
            <span className={cn("font-medium", trendColors[trend])}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
            </span>
          )}
        </div>
      )}
    </div>
  );
}