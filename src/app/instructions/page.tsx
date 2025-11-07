"use client";

import { BookOpen, Download, Server, Brain, Zap, CheckCircle2, AlertCircle, Code, Terminal, Play } from 'lucide-react';
import Link from 'next/link';

export default function InstructionsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="animate-slide-in-down">
        <h1 className="text-4xl font-bold mb-2 text-foreground flex items-center gap-3">
          <BookOpen className="w-10 h-10 text-[#3b82f6]" />
          Setup Instructions
        </h1>
        <p className="text-lg text-muted-foreground">
          Get started with NeuroCoach in just a few steps
        </p>
      </div>

      {/* Prerequisites Card */}
      <div className="glass-card p-8 animate-scale-in">
        <div className="flex items-center gap-3 mb-6">
          <Download className="w-6 h-6 text-[#3b82f6]" />
          <h2 className="text-2xl font-semibold text-foreground">Prerequisites</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Code className="w-5 h-5 text-[#22c55e]" />
              <h3 className="font-semibold text-foreground">Node.js & npm</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2">Node.js 18+ and npm/bun</p>
            <a 
              href="https://nodejs.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-[#3b82f6] hover:underline"
            >
              Download Node.js →
            </a>
          </div>
          
          <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Code className="w-5 h-5 text-[#22c55e]" />
              <h3 className="font-semibold text-foreground">Python 3.9+</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2">Python 3.9 or higher with pip</p>
            <a 
              href="https://www.python.org/downloads/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-[#3b82f6] hover:underline"
            >
              Download Python →
            </a>
          </div>
          
          <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-[#22c55e]" />
              <h3 className="font-semibold text-foreground">Muse 2 Headset</h3>
            </div>
            <p className="text-sm text-muted-foreground">Optional - App works in mock mode without it</p>
          </div>
          
          <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-[#22c55e]" />
              <h3 className="font-semibold text-foreground">Git</h3>
            </div>
            <p className="text-sm text-muted-foreground">For cloning the repository</p>
            <a 
              href="https://git-scm.com/downloads" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-[#3b82f6] hover:underline"
            >
              Download Git →
            </a>
          </div>
        </div>
      </div>

      {/* Installation Steps */}
      <div className="glass-card p-8 animate-scale-in">
        <div className="flex items-center gap-3 mb-6">
          <Terminal className="w-6 h-6 text-[#3b82f6]" />
          <h2 className="text-2xl font-semibold text-foreground">Installation Steps</h2>
        </div>
        
        <div className="space-y-6">
          {/* Step 1 */}
          <div className="p-6 rounded-lg bg-gradient-to-br from-[#3b82f6]/10 to-[#22c55e]/10 border border-[#3b82f6]/20">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3b82f6] text-white flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">Install Frontend Dependencies</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Navigate to the project root and install all Node.js packages
                </p>
                <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-4 font-mono text-sm">
                  <code className="text-foreground">npm install</code>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-lg bg-gradient-to-br from-[#3b82f6]/10 to-[#22c55e]/10 border border-[#3b82f6]/20">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3b82f6] text-white flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">Install Backend Dependencies</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a virtual environment and install Python packages
                </p>
                <div className="space-y-2">
                  <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-4 font-mono text-sm">
                    <code className="text-foreground">python -m venv venv</code>
                  </div>
                  <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-4 font-mono text-sm">
                    <code className="text-foreground">.\venv\Scripts\Activate.ps1</code>
                    <span className="text-muted-foreground ml-2"># Windows PowerShell</span>
                  </div>
                  <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-4 font-mono text-sm">
                    <code className="text-foreground">pip install -r backend/requirements.txt</code>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-lg bg-gradient-to-br from-[#3b82f6]/10 to-[#22c55e]/10 border border-[#3b82f6]/20">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3b82f6] text-white flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">Connect Muse Headset (Optional)</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  If you have a Muse 2 headset, connect it for real EEG data
                </p>
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                      Option A: BlueMuse (Recommended)
                    </h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-6">
                      <li>Download and install <a href="https://github.com/kowalej/BlueMuse" target="_blank" rel="noopener noreferrer" className="text-[#3b82f6] hover:underline">BlueMuse</a></li>
                      <li>Connect Muse headset via Bluetooth</li>
                      <li>Open BlueMuse and select your device</li>
                      <li>Click "Start LSL Stream"</li>
                    </ol>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                      Option B: Muse Direct App
                    </h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-6">
                      <li>Install <a href="https://www.choosemuse.com/muse-direct/" target="_blank" rel="noopener noreferrer" className="text-[#3b82f6] hover:underline">Muse Direct</a></li>
                      <li>Connect your Muse headset via Bluetooth</li>
                      <li>Start streaming in Muse Direct</li>
                    </ol>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5 border border-[#f97316]/20">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#f97316]" />
                      No Muse? No Problem!
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      The app automatically uses mock data if no Muse is detected. Perfect for development and testing!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-6 rounded-lg bg-gradient-to-br from-[#3b82f6]/10 to-[#22c55e]/10 border border-[#3b82f6]/20">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3b82f6] text-white flex items-center justify-center font-bold">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">Start the Application</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Run both backend and frontend servers
                </p>
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Play className="w-4 h-4 text-[#22c55e]" />
                      Quick Start (Recommended)
                    </h4>
                    <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-4 font-mono text-sm mb-2">
                      <code className="text-foreground">.\start-dev.ps1</code>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This will start both servers in separate windows automatically
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5">
                    <h4 className="font-semibold text-foreground mb-2">Manual Start (Two Terminals)</h4>
                    <div className="space-y-2 mb-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Terminal 1 - Backend:</p>
                        <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-3 font-mono text-sm">
                          <code className="text-foreground">.\venv\Scripts\Activate.ps1</code><br />
                          <code className="text-foreground">cd backend</code><br />
                          <code className="text-foreground">python main.py</code>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Terminal 2 - Frontend:</p>
                        <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-3 font-mono text-sm">
                          <code className="text-foreground">npm run dev</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="p-6 rounded-lg bg-gradient-to-br from-[#3b82f6]/10 to-[#22c55e]/10 border border-[#3b82f6]/20">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3b82f6] text-white flex items-center justify-center font-bold">
                5
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">Access the Application</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Open your browser and navigate to the frontend
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5">
                    <h4 className="font-semibold text-foreground mb-2">Frontend</h4>
                    <a 
                      href="http://localhost:3000" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#3b82f6] hover:underline font-mono"
                    >
                      http://localhost:3000
                    </a>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5">
                    <h4 className="font-semibold text-foreground mb-2">Backend API</h4>
                    <a 
                      href="http://localhost:8000" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#3b82f6] hover:underline font-mono"
                    >
                      http://localhost:8000
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="glass-card p-8 animate-scale-in">
        <div className="flex items-center gap-3 mb-6">
          <AlertCircle className="w-6 h-6 text-[#f97316]" />
          <h2 className="text-2xl font-semibold text-foreground">Troubleshooting</h2>
        </div>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5 border border-white/10">
            <h3 className="font-semibold text-foreground mb-2">"Backend disconnected" message</h3>
            <p className="text-sm text-muted-foreground mb-2">
              This means the frontend can't connect to the backend server. Make sure:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
              <li>The backend is running on port 8000</li>
              <li>You've activated the virtual environment before starting the backend</li>
              <li>No firewall is blocking the connection</li>
              <li>Check the backend terminal for any error messages</li>
            </ul>
          </div>
          
          <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5 border border-white/10">
            <h3 className="font-semibold text-foreground mb-2">Port already in use</h3>
            <p className="text-sm text-muted-foreground">
              If port 3000 or 8000 is already in use, either stop the other application or change the port in the configuration files.
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5 border border-white/10">
            <h3 className="font-semibold text-foreground mb-2">Python dependencies not found</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Make sure you've activated the virtual environment:
            </p>
            <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-3 font-mono text-sm">
              <code className="text-foreground">.\venv\Scripts\Activate.ps1</code>
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5 border border-white/10">
            <h3 className="font-semibold text-foreground mb-2">Muse not connecting</h3>
            <p className="text-sm text-muted-foreground">
              The app works perfectly without a Muse headset using mock data. If you want to use a real Muse, ensure BlueMuse or Muse Direct is running and streaming before starting the backend.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="glass-card p-8 animate-scale-in">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="w-6 h-6 text-[#3b82f6]" />
          <h2 className="text-2xl font-semibold text-foreground">Quick Links</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/"
            className="p-4 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#22c55e] hover:opacity-90 transition-opacity hover-lift text-center"
          >
            <Server className="w-6 h-6 text-white mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">Go to Dashboard</p>
          </Link>
          
          <Link
            href="/session"
            className="p-4 rounded-lg glass-card-strong hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/10 transition-colors hover-lift text-center"
          >
            <Brain className="w-6 h-6 text-[#3b82f6] mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">Start Session</p>
          </Link>
          
          <Link
            href="/settings"
            className="p-4 rounded-lg glass-card-strong hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/10 transition-colors hover-lift text-center"
          >
            <Zap className="w-6 h-6 text-[#3b82f6] mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">Settings</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

