"use client";

import { Brain, LayoutDashboard, Activity, BarChart3, Settings, Zap, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEEGStream } from '@/hooks/use-eeg-stream';

const navItems = [
  { name: 'Instructions', href: '/instructions', icon: BookOpen },
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Session', href: '/session', icon: Activity },
  { name: 'Insights', href: '/insights', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { connected, museConnected } = useEEGStream(false);

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass-card-strong border-r border-white/10 dark:border-white/10 light:border-black/10 p-6 flex flex-col animate-fade-in">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#22c55e] flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">NeuroCoach</h1>
          <p className="text-xs text-muted-foreground">Focus AI</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover-lift",
                isActive
                  ? "bg-[#3b82f6] text-white font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-black/5"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Connection Status */}
      <div className="mt-auto pt-6 border-t border-white/10 dark:border-white/10 light:border-black/10">
        <div className="glass-card p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${museConnected ? 'bg-[#22c55e] animate-pulse' : 'bg-[#f97316]'}`} />
            <span className="text-sm font-medium text-foreground">
              {museConnected ? 'Muse Connected' : 'Muse Not Connected'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {museConnected 
              ? 'Device ready for session' 
              : 'Waiting for Muse headset'}
          </p>
        </div>
      </div>

      {/* Focus Indicator */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Zap className="w-3 h-3 text-[#3b82f6]" />
        <span>Powered by AJ</span>
      </div>
    </aside>
  );
}