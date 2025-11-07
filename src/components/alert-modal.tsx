"use client";

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertModalProps {
  show: boolean;
  onDismiss: () => void;
  soundEnabled?: boolean;
}

export function AlertModal({ show, onDismiss, soundEnabled = true }: AlertModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      
      // Play sound if enabled
      if (soundEnabled && typeof window !== 'undefined') {
        // Create a simple beep sound
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 528; // C note
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      }

      // Auto dismiss after 5 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [show, soundEnabled]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  if (!show && !isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0"
      )}
      style={{ backgroundColor: 'rgba(37, 40, 49, 0.8)' }}
    >
      <div
        className={cn(
          "glass-card-strong p-8 max-w-md w-full text-center transform transition-all duration-300",
          isVisible ? "scale-100" : "scale-95"
        )}
      >
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#ffb347] to-[#ff6b6b] flex items-center justify-center animate-pulse">
          <Bell className="w-8 h-8 text-white" />
        </div>
        
        <h3 className="text-2xl font-bold text-[#f8f9fa] mb-3">
          Let's Refocus 🧘
        </h3>
        
        <p className="text-[#a8b2c1] mb-6">
          Your attention seems to be drifting. Take a deep breath and return to your task.
        </p>
        
        <button
          onClick={handleDismiss}
          className="w-full px-6 py-3 rounded-lg bg-[#65c3ff] text-[#252831] font-medium hover:bg-[#7ee8a4] transition-colors duration-200"
        >
          Got it, thanks!
        </button>
      </div>
    </div>
  );
}
