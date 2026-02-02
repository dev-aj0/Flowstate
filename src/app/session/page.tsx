"use client";

import { useState, useEffect } from 'react';
import { Play, Pause, Square, Timer, Activity, AlertCircle, Volume2, VolumeX, SkipForward } from 'lucide-react';
import { useEEGStream } from '@/hooks/use-eeg-stream';
import { useSessionTimer } from '@/hooks/use-session-timer';
import { EEGWaveform } from '@/components/eeg-waveform';
import { FocusMeter } from '@/components/focus-meter';
import { AlertModal } from '@/components/alert-modal';
import { addSession, getSettings, saveSettings, getUserProfile } from '@/lib/storage';
import { useRouter } from 'next/navigation';
import { 
  getOptimizedTimer, 
  getDiagnosisBasedTimer,
  getAdaptiveBreakDuration,
  getLLMOptimizedTimer,
  type OptimizedTimerSettings 
} from '@/lib/timer-optimizer';

export default function SessionPage() {
  const router = useRouter();
  const [sessionActive, setSessionActive] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [distractionCount, setDistractionCount] = useState(0);
  const [focusHistory, setFocusHistory] = useState<number[]>([]);
  const [settings, setSettings] = useState(getSettings());
  const [profile] = useState(getUserProfile());
  const [pomodoroEnabled, setPomodoroEnabled] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [optimizedSettings, setOptimizedSettings] = useState<OptimizedTimerSettings | null>(null);
  const [dynamicFocusDuration, setDynamicFocusDuration] = useState<number | null>(null);
  const [llmAnalyzing, setLlmAnalyzing] = useState(false);
  const [lastLlmAnalysis, setLastLlmAnalysis] = useState<{ time: number; reasoning?: string } | null>(null);

  const { currentReading, focusState, history, resetHistory, connected, museConnected, mockMode, connectionError } = useEEGStream(sessionActive);
  
  // Compute current timer duration based on break state and optimizations
  const currentTimerDuration = isBreak 
    ? (optimizedSettings?.breakDuration || 5)
    : (dynamicFocusDuration || optimizedSettings?.focusDuration || settings.sessionDuration);

  const timer = useSessionTimer(currentTimerDuration * 60);

  // Initialize optimized settings when Pomodoro is enabled or profile changes
  useEffect(() => {
    if (pomodoroEnabled || profile?.diagnosis) {
      const optSettings = getDiagnosisBasedTimer(profile);
      setOptimizedSettings(optSettings);
      if (!sessionActive) {
        // Only update duration if session not active
        setDynamicFocusDuration(null);
      }
    }
  }, [pomodoroEnabled, profile?.diagnosis, sessionActive]);

  // Track focus percentage over time and adapt timer dynamically
  useEffect(() => {
    if (sessionActive && focusState) {
      setFocusHistory(prev => [...prev, focusState.confidence * 100]);
      
      // Adapt timer based on EEG patterns during session (every 30 data points, ~1 minute)
      // Use LLM analysis when enough data is available
      if (focusHistory.length > 0 && focusHistory.length % 30 === 0 && museConnected && pomodoroEnabled && !isBreak && !llmAnalyzing) {
        // Try LLM analysis first if we have enough EEG readings
        if (history.length >= 10 && focusHistory.length >= 30) {
          setLlmAnalyzing(true);
          getLLMOptimizedTimer(history, focusHistory, timer.timeElapsed, profile)
            .then(optimized => {
              if (optimized) {
                const currentDuration = dynamicFocusDuration || optimizedSettings?.focusDuration || settings.sessionDuration;
                if (optimized.focusDuration !== currentDuration) {
                  setDynamicFocusDuration(optimized.focusDuration);
                  setOptimizedSettings(optimized);
                  if (optimized.source === 'llm') {
                    setLastLlmAnalysis({
                      time: Date.now(),
                      reasoning: optimized.llmReasoning,
                    });
                  }
                }
              }
            })
            .catch(error => {
              console.warn('LLM analysis failed, using rule-based:', error);
              // Fallback to rule-based
              const optimized = getOptimizedTimer(profile, focusHistory, timer.timeElapsed);
              const currentDuration = dynamicFocusDuration || optimizedSettings?.focusDuration || settings.sessionDuration;
              if (optimized.focusDuration !== currentDuration) {
                setDynamicFocusDuration(optimized.focusDuration);
                setOptimizedSettings({ ...optimized, source: 'rule-based' });
              }
            })
            .finally(() => {
              setLlmAnalyzing(false);
            });
        } else {
          // Not enough data yet, use rule-based analysis
          const optimized = getOptimizedTimer(profile, focusHistory, timer.timeElapsed);
          const currentDuration = dynamicFocusDuration || optimizedSettings?.focusDuration || settings.sessionDuration;
          if (optimized.focusDuration !== currentDuration) {
            setDynamicFocusDuration(optimized.focusDuration);
            setOptimizedSettings({ ...optimized, source: 'rule-based' });
          }
        }
      }
    }
  }, [focusState, sessionActive, museConnected, pomodoroEnabled, focusHistory.length]);

  // Handle distraction alerts
  useEffect(() => {
    if (focusState.alertTriggered && sessionActive) {
      setShowAlert(true);
      setDistractionCount(prev => prev + 1);
    }
  }, [focusState.alertTriggered, sessionActive]);

  // Handle session end
  useEffect(() => {
    const currentDurationSeconds = currentTimerDuration * 60;
    if (timer.timeElapsed >= currentDurationSeconds && sessionActive) {
      if (pomodoroEnabled) {
        if (!isBreak) {
          // Switch to break
          setIsBreak(true);
          setShowAlert(true);
          timer.reset();
          timer.start();
          return;
        } else {
          // End of break -> next focus cycle
          setIsBreak(false);
          timer.reset();
          timer.start();
          return;
        }
      }
      handleEndSession();
    }
  }, [timer.timeElapsed, currentTimerDuration, sessionActive, pomodoroEnabled, isBreak]);

  // Soft chime on cycle switch (focus <-> break)
  useEffect(() => {
    if (!sessionActive || !pomodoroEnabled) return;
    if (!settings.soundEnabled || !(settings.alertStyle === 'chime' || settings.alertStyle === 'all')) return;

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const o1 = ctx.createOscillator();
      const g  = ctx.createGain();
      o1.type = 'sine';
      // Upward two-tone for break start, downward for focus start
      const base = isBreak ? 660 : 880;
      o1.frequency.setValueAtTime(base, now);
      o1.frequency.exponentialRampToValueAtTime(isBreak ? 990 : 660, now + 0.18);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      o1.connect(g).connect(ctx.destination);
      o1.start();
      o1.stop(now + 0.35);
      // Auto close after short time
      setTimeout(() => ctx.close(), 500);
    } catch {}
  }, [isBreak, sessionActive, pomodoroEnabled, settings.soundEnabled, settings.alertStyle]);

  const handleStartSession = () => {
    // Initialize optimized settings if Pomodoro enabled or diagnosis present
    if (pomodoroEnabled || profile?.diagnosis) {
      const optSettings = getOptimizedTimer(profile, [], 0);
      setOptimizedSettings(optSettings);
      setDynamicFocusDuration(null); // Reset dynamic duration at start
    }
    
    setSessionActive(true);
    timer.start();
    resetHistory();
    setDistractionCount(0);
    setFocusHistory([]);
    setIsBreak(false);
  };

  const handlePauseSession = () => {
    if (timer.isPaused) {
      timer.resume();
    } else {
      timer.pause();
    }
  };

  const handleEndSession = () => {
    setSessionActive(false);
    timer.stop();

    // Calculate average focus
    const avgFocus = focusHistory.length > 0
      ? focusHistory.reduce((sum, val) => sum + val, 0) / focusHistory.length
      : 0;

    // Generate session name
    const now = new Date();
    const sessionName = `Focus Session - ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;

    // Save session
    const session = {
      id: `session_${Date.now()}`,
      name: sessionName,
      date: Date.now(),
      duration: timer.timeElapsed,
      focusPercentage: Math.round(avgFocus),
      distractionEvents: distractionCount,
      averageBeta: currentReading.beta,
      averageAlpha: currentReading.alpha,
    };

    addSession(session);

    // Show summary and redirect
    setTimeout(() => {
      router.push('/insights');
    }, 3000);
  };

  // Show live data when Muse connected, backend says mock, or user just enabled mock in Settings (so UI updates immediately)
  const hasLiveData = museConnected || mockMode || !!getSettings().useMockData;
  const currentFocusPercentage = hasLiveData ? focusState.confidence * 100 : 0;
  const avgFocus = focusHistory.length > 0
    ? focusHistory.reduce((sum, val) => sum + val, 0) / focusHistory.length
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Focus Session</h1>
          <p className="text-lg text-muted-foreground">
            {sessionActive ? 'Stay focused on your task' : 'Ready to start your session?'}
          </p>
        </div>
        
        {/* Timer */}
        <div className="glass-card px-8 py-4 animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Timer className="w-6 h-6 text-[#3b82f6]" />
              <span className="text-3xl font-bold text-foreground">{timer.formattedTime}</span>
            </div>
            <button
              onClick={() => {
                const newSettings = { ...settings, soundEnabled: !settings.soundEnabled };
                setSettings(newSettings);
                saveSettings(newSettings);
              }}
              className={`p-2 rounded-lg transition-colors ${
                settings.soundEnabled ? 'bg-[#3b82f6] text-white' : 'glass-card text-muted-foreground hover:text-foreground'
              }`}
              title={settings.soundEnabled ? 'Mute' : 'Unmute'}
            >
              {settings.soundEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="w-full h-1 bg-white/10 dark:bg-white/10 light:bg-black/10 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#3b82f6] to-[#22c55e] transition-all duration-500"
              style={{ width: `${timer.progress}%` }}
            />
          </div>
          {/* Pomodoro status pill */}
          {sessionActive && pomodoroEnabled && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium animate-slide-in-up"
              style={{
                background: isBreak ? 'rgba(249, 115, 22, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                border: `1px solid ${isBreak ? 'rgba(249, 115, 22, 0.25)' : 'rgba(34, 197, 94, 0.25)'}`
              }}
            >
              <span style={{ color: isBreak ? '#f97316' : '#22c55e' }}>{isBreak ? 'Break' : 'Focus'}</span>
              <span className="text-muted-foreground">
                · {(() => {
                  const total = currentTimerDuration * 60;
                  const remaining = Math.max(0, total - timer.timeElapsed);
                  const m = Math.floor(remaining / 60).toString().padStart(2, '0');
                  const s = (remaining % 60).toString().padStart(2, '0');
                  return `${m}:${s}`;
                })()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Focus Meter & Stats */}
        <div className="space-y-6">
          {/* Focus Meter */}
          <div className="glass-card p-6 animate-scale-in stagger-1">
            <h2 className="text-lg font-semibold text-foreground mb-4">Live Focus</h2>
            <FocusMeter percentage={currentFocusPercentage} size="lg" showLabel={false} />
            <div className="mt-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Muse</span>
                <span className={`text-sm font-medium transition-colors ${museConnected ? 'text-[#22c55e]' : 'text-[#f97316]'}`}>
                  {museConnected ? '✓ Connected' : mockMode ? '○ Mock data (no headset)' : '○ Not Connected'}
                </span>
              </div>
              {mockMode && (
                <div className="text-xs text-amber-500 dark:text-amber-400 font-medium">
                  Numbers are simulated — connect Muse + BlueMuse for real brainwaves
                </div>
              )}
              {connectionError && !mockMode && (
                <div className="text-xs text-[#f97316] mt-1">
                  {connectionError}
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={`text-sm font-medium transition-colors ${!hasLiveData ? 'text-muted-foreground' : focusState.isFocused ? 'text-[#22c55e]' : 'text-[#f97316]'}`}>
                  {!hasLiveData ? '— No data' : focusState.isFocused ? '✓ Focused' : '○ Relaxed'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Confidence</span>
                <span className="text-sm font-medium text-foreground">
                  {!hasLiveData ? '—' : `${Math.round(focusState.confidence * 100)}%`}
                </span>
              </div>
            </div>
          </div>

          {/* Session Stats */}
          <div className="glass-card p-6 animate-scale-in stagger-2">
            <h2 className="text-lg font-semibold text-foreground mb-4">Session Stats</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Average Focus</span>
                  <span className="text-foreground font-medium">{Math.round(avgFocus)}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 dark:bg-white/10 light:bg-black/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#3b82f6] transition-all duration-500"
                    style={{ width: `${avgFocus}%` }}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between py-3 border-t border-white/10 dark:border-white/10 light:border-black/10">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#f97316]" />
                  <span className="text-sm text-muted-foreground">Distraction Events</span>
                </div>
                <span className="text-lg font-semibold text-foreground">{distractionCount}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-white/10 dark:border-white/10 light:border-black/10">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#22c55e]" />
                  <span className="text-sm text-muted-foreground">Data Points</span>
                </div>
                <span className="text-lg font-semibold text-foreground">{hasLiveData ? history.length : 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - EEG Waveform & Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* EEG Waveform */}
          <div className="glass-card p-6 animate-scale-in stagger-3">
            <h2 className="text-lg font-semibold text-foreground mb-4">Live EEG Waveform</h2>
            {hasLiveData ? (
              <>
                <EEGWaveform readings={history} height={250} />
                {/* Wave Values */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="glass-card p-4 text-center hover-lift">
                    <div className="text-2xl font-bold text-[#3b82f6] mb-1">
                      {Math.round(currentReading.beta)}
                    </div>
                    <div className="text-xs text-muted-foreground">Beta (Focus)</div>
                  </div>
                  <div className="glass-card p-4 text-center hover-lift">
                    <div className="text-2xl font-bold text-[#f97316] mb-1">
                      {Math.round(currentReading.alpha)}
                    </div>
                    <div className="text-xs text-muted-foreground">Alpha (Relax)</div>
                  </div>
                  <div className="glass-card p-4 text-center hover-lift">
                    <div className="text-2xl font-bold text-[#22c55e] mb-1">
                      {Math.round(currentReading.gamma)}
                    </div>
                    <div className="text-xs text-muted-foreground">Gamma</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5 border border-dashed border-white/10 dark:border-white/10 light:border-black/10">
                <p className="text-sm text-muted-foreground text-center mb-2">No live data</p>
                <p className="text-xs text-muted-foreground text-center max-w-xs">
                  Connect your Muse headset (BlueMuse) or enable mock data in Settings to see the waveform.
                </p>
              </div>
            )}

            {/* Per-channel / LSL-style data (when Muse sends it) */}
            {hasLiveData && (currentReading.channels?.length ?? 0) > 0 && (
              <div className="mt-6 pt-4 border-t border-white/10 dark:border-white/10">
                <h3 className="text-sm font-semibold text-foreground mb-3">Per-channel (LSL)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {currentReading.channels!.map((ch) => (
                    <div key={ch.name} className="glass-card p-3 rounded-lg">
                      <div className="text-xs font-medium text-foreground mb-2">{ch.name}</div>
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <span className="text-muted-foreground">α</span><span>{Math.round(ch.alpha)}</span>
                        <span className="text-muted-foreground">β</span><span>{Math.round(ch.beta)}</span>
                        <span className="text-muted-foreground">γ</span><span>{Math.round(ch.gamma)}</span>
                        <span className="text-muted-foreground">δ</span><span>{Math.round(ch.delta)}</span>
                        <span className="text-muted-foreground">θ</span><span>{Math.round(ch.theta)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {hasLiveData && (currentReading.rawChannels?.length ?? 0) > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">Raw sample (latest)</h3>
                <div className="flex flex-wrap gap-2">
                  {(currentReading.channelNames ?? []).map((name, i) => (
                    <span key={name} className="px-2 py-1 rounded bg-white/10 dark:bg-white/10 text-xs font-mono">
                      {name}: {(currentReading.rawChannels![i] ?? 0).toFixed(4)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Controls + Pomodoro */}
          <div className="glass-card p-6 animate-scale-in stagger-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Session Controls</h2>
            <div className="flex gap-4">
              {!sessionActive ? (
                <button
                  onClick={handleStartSession}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg bg-gradient-to-r from-[#3b82f6] to-[#22c55e] text-white font-medium hover:opacity-90 transition-opacity"
                >
                  <Play className="w-5 h-5" />
                  Start Session
                </button>
              ) : (
                <>
                  {pomodoroEnabled && isBreak && (
                    <button
                      onClick={() => { setIsBreak(false); timer.reset(); timer.start(); }}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg bg-[#f97316] text-white font-medium hover:opacity-90 transition-opacity"
                    >
                      <SkipForward className="w-5 h-5" />
                      Skip Break
                    </button>
                  )}
                  <button
                    onClick={handlePauseSession}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg glass-card-strong text-foreground font-medium hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/10 transition-colors"
                  >
                    {timer.isPaused ? (
                      <>
                        <Play className="w-5 h-5" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="w-5 h-5" />
                        Pause
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleEndSession}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg bg-[#ef4444] text-white font-medium hover:opacity-90 transition-opacity"
                  >
                    <Square className="w-5 h-5" />
                    End Session
                  </button>
                </>
              )}
            </div>
            {/* Pomodoro Controls */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg glass-card-strong">
                <p className="text-sm font-medium mb-2">Pomodoro</p>
                <button
                  onClick={() => setPomodoroEnabled(!pomodoroEnabled)}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    pomodoroEnabled ? 'bg-[#3b82f6] text-white' : 'glass-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {pomodoroEnabled ? 'Enabled' : 'Disabled'}
                </button>
                {pomodoroEnabled && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {isBreak ? 'Break in progress' : 'Focus in progress'}
                  </p>
                )}
              </div>
              <div className="p-3 rounded-lg glass-card-strong">
                <p className="text-sm font-medium mb-2">
                  Focus Duration
                  {pomodoroEnabled && optimizedSettings && (
                    <span className="ml-2 text-xs text-[#22c55e]">(Optimized)</span>
                  )}
                </p>
                {pomodoroEnabled && optimizedSettings ? (
                  <div className="px-3 py-2 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-center">
                    <div className="text-lg font-bold text-[#3b82f6]">
                      {dynamicFocusDuration || optimizedSettings.focusDuration}m
                    </div>
                    {dynamicFocusDuration && dynamicFocusDuration !== optimizedSettings.focusDuration && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Adapted from {optimizedSettings.focusDuration}m
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {optimizedSettings.reason}
                    </div>
                    {optimizedSettings.source === 'llm' && (
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-[#3b82f6]">🤖 AI Analysis</span>
                          {optimizedSettings.confidence && (
                            <span className="text-muted-foreground">
                              ({Math.round(optimizedSettings.confidence * 100)}% confidence)
                            </span>
                          )}
                        </div>
                        {llmAnalyzing && (
                          <div className="text-xs text-[#22c55e] mt-1 animate-pulse">
                            Analyzing brainwaves...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 25, 45, 60].map((d) => (
                      <button
                        key={d}
                        onClick={() => setSettings({ ...settings, sessionDuration: d })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          settings.sessionDuration === d ? 'bg-[#3b82f6] text-white' : 'glass-card text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {d}m
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-3 rounded-lg glass-card-strong">
                <p className="text-sm font-medium mb-2">
                  Break Duration
                  {pomodoroEnabled && optimizedSettings && (
                    <span className="ml-2 text-xs text-[#22c55e]">(Optimized)</span>
                  )}
                </p>
                {pomodoroEnabled && optimizedSettings ? (
                  <div className="px-3 py-2 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20 text-center">
                    <div className="text-lg font-bold text-[#22c55e]">
                      {optimizedSettings.breakDuration}m
                    </div>
                    {museConnected && focusHistory.length > 10 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Adaptive based on focus intensity
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15].map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          const opt = getDiagnosisBasedTimer(profile);
                          if (!pomodoroEnabled || !profile?.diagnosis) {
                            // Only allow manual override if no optimization
                            setOptimizedSettings({ ...opt, breakDuration: d });
                          }
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          (optimizedSettings?.breakDuration || 5) === d ? 'bg-[#22c55e] text-white' : 'glass-card text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {d}m
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {!sessionActive && (
              <div className="text-sm text-muted-foreground text-center mt-4">
                {pomodoroEnabled && optimizedSettings ? (
                  <>
                    <p className="font-medium text-foreground mb-1">
                      Optimized for {profile?.diagnosis ? profile.diagnosis.toUpperCase() : 'your profile'}
                    </p>
                    <p>
                      Focus: {optimizedSettings.focusDuration}m • Break: {optimizedSettings.breakDuration}m
                    </p>
                    {optimizedSettings.reason && (
                      <p className="text-xs mt-2 italic">{optimizedSettings.reason}</p>
                    )}
                  </>
                ) : (
                  <p>Your session will run for {settings.sessionDuration} minutes</p>
                )}
              </div>
            )}
            {pomodoroEnabled && !profile?.diagnosis && (
              <div className="mt-4 p-3 rounded-lg bg-[#f97316]/10 border border-[#f97316]/20">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Tip:</strong> Set your diagnosis in Settings to get optimized timer durations based on your needs (ADHD, Anxiety, etc.)
                </p>
              </div>
            )}
          </div>

          {/* AI Analysis Insights */}
          {sessionActive && lastLlmAnalysis && optimizedSettings?.source === 'llm' && (
            <div className="glass-card p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20 animate-slide-in-up">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🤖</span>
                <h3 className="text-sm font-semibold text-foreground">AI Brainwave Analysis</h3>
                <span className="text-xs text-muted-foreground ml-auto">
                  {Math.round((Date.now() - lastLlmAnalysis.time) / 1000)}s ago
                </span>
              </div>
              {lastLlmAnalysis.reasoning && (
                <p className="text-sm text-muted-foreground mb-3 italic">
                  {lastLlmAnalysis.reasoning}
                </p>
              )}
              {optimizedSettings.confidence && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Confidence: {Math.round(optimizedSettings.confidence * 100)}%</span>
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                      style={{ width: `${optimizedSettings.confidence * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tips */}
          {sessionActive && (
            <div className="glass-card p-6 bg-[#3b82f6]/5 border-[#3b82f6]/20 animate-slide-in-up">
              <h3 className="text-sm font-semibold text-[#3b82f6] mb-2">💡 Focus Tip</h3>
              <p className="text-sm text-muted-foreground">
                If you feel your attention drifting, take a deep breath and gently return your focus to the task. The system will alert you if your brain waves indicate distraction.
                {museConnected && history.length >= 10 && (
                  <span className="block mt-2 text-xs">
                    <strong>🤖 AI Analysis:</strong> {llmAnalyzing 
                      ? 'Analyzing your brainwave patterns in real-time...' 
                      : optimizedSettings?.source === 'llm' 
                        ? 'Timer optimized using AI analysis of your focus patterns.' 
                        : 'Timer adapts based on your EEG data every minute.'}
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Alert Modal */}
      <AlertModal
        show={showAlert}
        onDismiss={() => setShowAlert(false)}
        soundEnabled={settings.soundEnabled}
      />
    </div>
  );
}