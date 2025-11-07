"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { useEffect, useState } from "react";
import { getSettings } from "@/lib/storage";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mode, setMode] = useState("dark");

  useEffect(() => {
    const settings = getSettings();
    setMode(settings.mode || "dark");
    
    // Apply mode to document
    if (settings.mode === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, []);

  // Listen for mode changes
  useEffect(() => {
    const handleStorageChange = () => {
      const settings = getSettings();
      setMode(settings.mode || "dark");
      
      if (settings.mode === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Subtle animated gradient orbs background */}
        <div aria-hidden className="zen-orbs">
          <div className="zen-orb w-[420px] h-[420px] -top-10 -left-10 bg-[#3b82f6]/30" />
          <div className="zen-orb w-[360px] h-[360px] bottom-10 right-10 bg-[#22c55e]/25" />
          <div className="zen-orb w-[300px] h-[300px] top-1/3 right-1/4 bg-[#f97316]/20" />
        </div>

        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-64 p-8 animate-fade-in">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}