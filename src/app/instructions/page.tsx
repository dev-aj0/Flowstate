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
        <p className="text-lg text-muted-foreground mb-3">
          Complete step-by-step guide to get NeuroCoach running
        </p>
        <div className="p-3 rounded-lg bg-[#f97316]/10 border border-[#f97316]/20 inline-flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-[#f97316]" />
          <p className="text-sm text-foreground">
            <strong>Note:</strong> This repository is currently <strong>private</strong> and will be made publicly available soon.
          </p>
        </div>
      </div>

      {/* Prerequisites Card */}
      <div className="glass-card p-8 animate-scale-in">
        <div className="flex items-center gap-3 mb-6">
          <Download className="w-6 h-6 text-[#3b82f6]" />
          <h2 className="text-2xl font-semibold text-foreground">Prerequisites</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Before starting, make sure you have all required software installed. Check your versions with the commands below.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Code className="w-5 h-5 text-[#22c55e]" />
              <h3 className="font-semibold text-foreground">Node.js & npm</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2">Node.js 18+ and npm/bun</p>
            <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-2 font-mono text-xs mb-2">
              <code className="text-foreground">node --version</code>
            </div>
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
            <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-2 font-mono text-xs mb-2">
              <code className="text-foreground">python --version</code>
            </div>
            <a 
              href="https://www.python.org/downloads/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-[#3b82f6] hover:underline"
            >
              Download Python →
            </a>
            <p className="text-xs text-muted-foreground mt-2">
              ⚠️ Important: Check "Add Python to PATH" during installation
            </p>
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
            <p className="text-sm text-muted-foreground mb-2">For cloning the repository</p>
            <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-2 font-mono text-xs mb-2">
              <code className="text-foreground">git --version</code>
            </div>
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
          {/* Step 0 - Clone Repository */}
          <div className="p-6 rounded-lg bg-gradient-to-br from-[#f97316]/10 to-[#3b82f6]/10 border border-[#f97316]/20">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#f97316] text-white flex items-center justify-center font-bold">
                0
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">Clone or Download the Repository</h3>
                <div className="p-3 rounded-lg bg-[#f97316]/10 border border-[#f97316]/20 mb-4">
                  <p className="text-sm text-foreground flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#f97316]" />
                    <strong>Note:</strong> This repository is currently <strong>private</strong> and not publicly available yet. It will be made available soon. If you have access, follow the steps below.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Get the code from GitHub to your local machine
                </p>
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                      Option A: Clone with Git (Recommended)
                    </h4>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground mb-2">1. Get the repository URL from GitHub (if you have access):</p>
                      <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-3 font-mono text-sm">
                        <code className="text-foreground"># Click the green "Code" button on GitHub</code><br />
                        <code className="text-foreground"># Copy the HTTPS or SSH URL</code>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">2. Clone the repository:</p>
                      <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-3 font-mono text-sm">
                        <code className="text-foreground">git clone https://github.com/YOUR_USERNAME/hosa_project.git</code>
                      </div>
                      <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-3 font-mono text-sm">
                        <code className="text-foreground">cd hosa_project</code>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Or with SSH:</p>
                      <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-3 font-mono text-sm">
                        <code className="text-foreground">git clone git@github.com:YOUR_USERNAME/hosa_project.git</code>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                      Option B: Download ZIP
                    </h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-6">
                      <li>Go to your GitHub repository (if you have access)</li>
                      <li>Click the green "Code" button</li>
                      <li>Select "Download ZIP"</li>
                      <li>Extract the ZIP file to your desired location</li>
                      <li>Open a terminal in the extracted folder</li>
                    </ol>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5 border border-[#f97316]/20">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#f97316]" />
                      Don't have access yet?
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      The repository will be made publicly available soon. Check back later or contact the repository owner for access.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                  <code className="text-foreground">npm install --legacy-peer-deps</code>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This may take 2-5 minutes depending on your internet connection
                </p>
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
                  Create a virtual environment and install Python packages. Make sure you're in the project root directory.
                </p>
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5">
                    <h4 className="font-semibold text-foreground mb-2">Windows (PowerShell):</h4>
                    <div className="space-y-2">
                      <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-3 font-mono text-sm">
                        <code className="text-foreground">cd backend</code>
                      </div>
                      <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-3 font-mono text-sm">
                        <code className="text-foreground">python -m venv venv</code>
                      </div>
                      <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-3 font-mono text-sm">
                        <code className="text-foreground">.\venv\Scripts\Activate.ps1</code>
                      </div>
                      <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-3 font-mono text-sm">
                        <code className="text-foreground">pip install -r requirements.txt</code>
                      </div>
                      <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-3 font-mono text-sm">
                        <code className="text-foreground">cd ..</code>
                        <span className="text-muted-foreground ml-2"># Return to project root</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      If you get an execution policy error, run: <code className="bg-black/20 px-1 rounded">Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser</code>
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5">
                    <h4 className="font-semibold text-foreground mb-2">Mac/Linux:</h4>
                    <div className="space-y-2">
                      <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-3 font-mono text-sm">
                        <code className="text-foreground">cd backend</code>
                      </div>
                      <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-3 font-mono text-sm">
                        <code className="text-foreground">python3 -m venv venv</code>
                      </div>
                      <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-3 font-mono text-sm">
                        <code className="text-foreground">source venv/bin/activate</code>
                      </div>
                      <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-3 font-mono text-sm">
                        <code className="text-foreground">pip install -r requirements.txt</code>
                      </div>
                      <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-3 font-mono text-sm">
                        <code className="text-foreground">cd ..</code>
                        <span className="text-muted-foreground ml-2"># Return to project root</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20">
                    <p className="text-xs text-foreground">
                      <strong>✅ Success:</strong> You should see packages installing. This may take 1-3 minutes. When done, you'll see "(venv)" in your terminal prompt.
                    </p>
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

          {/* Step 4 - Environment Variables (Optional) */}
          <div className="p-6 rounded-lg bg-gradient-to-br from-[#22c55e]/10 to-[#3b82f6]/10 border border-[#22c55e]/20">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#22c55e] text-white flex items-center justify-center font-bold">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">Configure Environment Variables (Optional)</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Set up AI analysis and custom WebSocket URL (optional but recommended)
                </p>
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5">
                    <h4 className="font-semibold text-foreground mb-2">For AI Brainwave Analysis:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-3">
                      <li>Create a file named <code className="bg-black/20 px-1 rounded">.env.local</code> in the project root</li>
                      <li>Add your OpenAI API key:</li>
                    </ol>
                    <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-3 font-mono text-sm">
                      <code className="text-foreground">NEXT_PUBLIC_OPENAI_API_KEY=sk-your-api-key-here</code>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Get your API key from: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-[#3b82f6] hover:underline">platform.openai.com/api-keys</a>
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>Note:</strong> Without this, the app uses rule-based optimization (still works great!)
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5">
                    <h4 className="font-semibold text-foreground mb-2">For Network Access (Optional):</h4>
                    <p className="text-sm text-muted-foreground mb-2">If running backend on a different machine:</p>
                    <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-3 font-mono text-sm">
                      <code className="text-foreground">NEXT_PUBLIC_WS_URL=ws://192.168.1.100:8000/ws</code>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Replace with your backend machine's IP address. Default is <code className="bg-black/20 px-1 rounded">ws://localhost:8000/ws</code>
                    </p>
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
                <h3 className="text-lg font-semibold text-foreground mb-2">Start the Application</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Run both backend and frontend servers. You need <strong>two terminals</strong> running simultaneously.
                </p>
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Play className="w-4 h-4 text-[#22c55e]" />
                      Quick Start - Windows (Recommended)
                    </h4>
                    <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-4 font-mono text-sm mb-2">
                      <code className="text-foreground">.\start-dev.ps1</code>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This PowerShell script automatically starts both servers in separate windows. Perfect for Windows users!
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5">
                    <h4 className="font-semibold text-foreground mb-2">Manual Start (All Platforms)</h4>
                    <p className="text-xs text-muted-foreground mb-3">Open two separate terminal windows:</p>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-1">Terminal 1 - Backend (Windows):</p>
                        <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-3 font-mono text-sm">
                          <code className="text-foreground">cd backend</code><br />
                          <code className="text-foreground">..\venv\Scripts\Activate.ps1</code><br />
                          <code className="text-foreground">python main.py</code>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-1">Terminal 1 - Backend (Mac/Linux):</p>
                        <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-3 font-mono text-sm">
                          <code className="text-foreground">cd backend</code><br />
                          <code className="text-foreground">source ../venv/bin/activate</code><br />
                          <code className="text-foreground">python3 main.py</code>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-1">Terminal 2 - Frontend (All Platforms):</p>
                        <div className="bg-black/20 dark:bg-white/5 light:bg-black/10 rounded-lg p-3 font-mono text-sm">
                          <code className="text-foreground">npm run dev</code>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20 mt-3">
                      <p className="text-xs text-foreground">
                        <strong>✅ Expected Output:</strong><br />
                        Backend: <code className="bg-black/20 px-1 rounded">Uvicorn running on http://0.0.0.0:8000</code><br />
                        Frontend: <code className="bg-black/20 px-1 rounded">Local: http://localhost:3000</code>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 6 */}
          <div className="p-6 rounded-lg bg-gradient-to-br from-[#3b82f6]/10 to-[#22c55e]/10 border border-[#3b82f6]/20">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3b82f6] text-white flex items-center justify-center font-bold">
                6
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">Access the Application</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Once both servers are running, open your browser and navigate to the frontend URL
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5">
                    <h4 className="font-semibold text-foreground mb-2">Frontend (Main App)</h4>
                    <p className="text-sm text-muted-foreground mb-2">Open this URL in your browser:</p>
                    <a 
                      href="http://localhost:3000" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#3b82f6] hover:underline font-mono text-lg block mb-2"
                    >
                      http://localhost:3000
                    </a>
                    <p className="text-xs text-muted-foreground">
                      This is where you'll use the app
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5">
                    <h4 className="font-semibold text-foreground mb-2">Backend API (Status Check)</h4>
                    <p className="text-sm text-muted-foreground mb-2">Verify backend is running:</p>
                    <a 
                      href="http://localhost:8000" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#3b82f6] hover:underline font-mono text-lg block mb-2"
                    >
                      http://localhost:8000
                    </a>
                    <p className="text-xs text-muted-foreground">
                      Should show: <code className="bg-black/20 px-1 rounded">{"{status: 'running'}"}</code>
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20">
                  <p className="text-sm text-foreground mb-2">
                    <strong>✅ What to Expect:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                    <li>Frontend connects to backend automatically via WebSocket</li>
                    <li>If Muse is connected: You'll see "Muse Connected" status</li>
                    <li>If no Muse: App uses "Mock Mode" (fully functional for testing)</li>
                    <li>WebSocket connection status shown in the UI</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Step 7 - First Time Usage */}
          <div className="p-6 rounded-lg bg-gradient-to-br from-[#22c55e]/10 to-[#3b82f6]/10 border border-[#22c55e]/20">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#22c55e] text-white flex items-center justify-center font-bold">
                7
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">First-Time Setup</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure your profile and settings before starting your first session
                </p>
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5">
                    <h4 className="font-semibold text-foreground mb-2">1. Go to Settings</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Click "Settings" in the sidebar or navigate to <code className="bg-black/20 px-1 rounded">/settings</code>
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                      <li>Set your name (optional)</li>
                      <li>Optionally set a self-reported condition (for timer optimization only)</li>
                      <li>Check Muse connection status</li>
                      <li>Configure alert preferences</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5">
                    <h4 className="font-semibold text-foreground mb-2">2. Optional: Run Calibration</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Personalize distraction detection with a guided focus/relaxation sequence
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                      <li>Click "Start Calibration" in Settings</li>
                      <li>Follow the guided sequence (takes 2-3 minutes)</li>
                      <li>This improves accuracy of focus detection</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5">
                    <h4 className="font-semibold text-foreground mb-2">3. Start Your First Session</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Go to "Session" page and click "Start Session"
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                      <li>Watch your brainwaves in real-time</li>
                      <li>Enable Pomodoro mode for focus/break cycles</li>
                      <li>Get alerts when distraction is detected</li>
                      <li>View insights after completing sessions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stopping the Application */}
      <div className="glass-card p-8 animate-scale-in">
        <div className="flex items-center gap-3 mb-6">
          <AlertCircle className="w-6 h-6 text-[#f97316]" />
          <h2 className="text-2xl font-semibold text-foreground">Stopping the Application</h2>
        </div>
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5 border border-white/10">
            <h3 className="font-semibold text-foreground mb-2">To Stop the Servers:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
              <li><strong>Backend:</strong> Press <code className="bg-black/20 px-1 rounded">Ctrl+C</code> in Terminal 1</li>
              <li><strong>Frontend:</strong> Press <code className="bg-black/20 px-1 rounded">Ctrl+C</code> in Terminal 2</li>
              <li><strong>Windows Script:</strong> Close the PowerShell windows</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5 border border-white/10">
            <h3 className="font-semibold text-foreground mb-2">To Restart:</h3>
            <p className="text-sm text-muted-foreground">
              Simply run the start commands again. The app will reconnect automatically.
            </p>
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
            <p className="text-sm text-muted-foreground mb-2">
              The app works perfectly without a Muse headset using mock data. If you want to use a real Muse:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
              <li>Ensure BlueMuse or Muse Direct is running and streaming</li>
              <li>Start the LSL stream before starting the backend</li>
              <li>Check that Muse is connected via Bluetooth</li>
              <li>Verify BlueMuse shows "Streaming..." status</li>
            </ul>
          </div>
          
          <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5 border border-white/10">
            <h3 className="font-semibold text-foreground mb-2">"python is not recognized" (Windows)</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Try using <code className="bg-black/20 px-1 rounded">python3</code> instead, or reinstall Python and check "Add Python to PATH" during installation.
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5 border border-white/10">
            <h3 className="font-semibold text-foreground mb-2">AI Analysis not working</h3>
            <p className="text-sm text-muted-foreground mb-2">
              If AI analysis isn't working:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
              <li>Check <code className="bg-black/20 px-1 rounded">.env.local</code> has <code className="bg-black/20 px-1 rounded">NEXT_PUBLIC_OPENAI_API_KEY</code> set</li>
              <li>Verify API key is valid (starts with <code className="bg-black/20 px-1 rounded">sk-</code>)</li>
              <li>Restart frontend after adding API key</li>
              <li>App will use rule-based optimization if LLM unavailable (this is normal)</li>
            </ul>
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

