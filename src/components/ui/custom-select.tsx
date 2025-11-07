"use client";

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const selectRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Update position when opening or window changes
  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };

    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        selectRef.current && 
        !selectRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  const dropdownContent = isOpen && (
    <div
      ref={selectRef}
      className="fixed z-[9999] animate-in fade-in slide-in-from-top-2"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
      }}
    >
      <div className="glass-card-strong rounded-lg shadow-xl overflow-hidden">
        <div className="py-1 max-h-60 overflow-auto">
          {options.map((option) => {
            const isSelected = value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-4 py-3 text-left flex items-center justify-between gap-2",
                  "transition-colors duration-150",
                  "hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/10",
                  isSelected && "bg-[#3b82f6]/20 dark:bg-[#3b82f6]/20 light:bg-[#3b82f6]/30"
                )}
              >
                <span className={cn(
                  "text-sm font-semibold",
                  isSelected 
                    ? "text-[#3b82f6] dark:text-[#3b82f6] light:text-[#3b82f6]" 
                    : "text-foreground dark:text-white light:text-gray-900"
                )}>
                  {option.label}
                </span>
                {isSelected && (
                  <Check className="w-4 h-4 text-[#3b82f6] flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn("relative w-full", className)}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-3 rounded-lg glass-card text-foreground",
          "flex items-center justify-between gap-2",
          "focus:outline-none focus:ring-2 focus:ring-[#3b82f6]",
          "transition-all duration-200 hover-lift",
          isOpen && "ring-2 ring-[#3b82f6]"
        )}
      >
        <span className={cn(
          "text-left flex-1",
          !selectedOption && "text-muted-foreground"
        )}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0",
            isOpen && "transform rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu - Rendered via Portal */}
      {typeof window !== 'undefined' && createPortal(dropdownContent, document.body)}
    </div>
  );
}

