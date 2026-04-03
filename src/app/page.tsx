"use client";

import { useEffect, useState } from 'react';
import { Brain, Clock, TrendingUp, Target, Watch } from 'lucide-react';
import { StatCard } from '@/components/stat-card';
import { FocusMeter } from '@/components/focus-meter';
import Link from 'next/link';
import { getSessions, getUserProfile, getSettings } from '@/lib/storage';
import {
  sendWristVibrate,
  isWristConnected,
  isWristTransportSupported,
} from '@/lib/wrist-haptic';
import { SessionData, UserProfile } from '@/types';
import { useEEGStream } from '@/hooks/use-eeg-stream';

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [todayFocus, setTodayFocus] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [avgFocus, setAvgFocus] = useState(0);
  const [focusStreak, setFocusStreak] = useState(0);
  const [wristMockHint, setWristMockHint] = useState<string | null>(null);

  // Check backend and Muse connection status (not active session, just checking connection)
  const { connected, museConnected, mockMode, connectionError, focusState, currentReading } = useEEGStream(false);

  useEffect(() => {
    const userProfile = getUserProfile();
    const allSessions = getSessions();
    
    setProfile(userProfile);
    setSessions(allSessions);
    setTotalSessions(allSessions.length);

    // Calculate today's focus
    const today = new Date().setHours(0, 0, 0, 0);
    const todaySessions = allSessions.filter(s => new Date(s.date).setHours(0, 0, 0, 0) === today);
    const todayAvg = todaySessions.length > 0
      ? todaySessions.reduce((sum, s) => sum + s.focusPercentage, 0) / todaySessions.length
      : 0;
    setTodayFocus(Math.round(todayAvg));

    // Calculate overall average
    const overallAvg = allSessions.length > 0
      ? allSessions.reduce((sum, s) => sum + s.focusPercentage, 0) / allSessions.length
      : 0;
    setAvgFocus(Math.round(overallAvg));

    // Calculate real focus streak (consecutive days with at least one session)
    if (allSessions.length > 0) {
      const sortedSessions = [...allSessions].sort((a, b) => b.date - a.date);
      let streak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      for (const session of sortedSessions) {
        const sessionDate = new Date(session.date);
        sessionDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === streak) {
          streak++;
        } else if (daysDiff > streak) {
          break;
        }
      }
      setFocusStreak(streak);
    } else {
      setFocusStreak(0);
    }
  }, []);

  const recentSessions = sessions.slice(-3).reverse();

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="animate-slide-in-down">
        <h1 className="text-4xl font-bold mb-2 text-foreground">
          Welcome back, {profile?.name || 'User'} 👋
        </h1>
        <p className="text-lg text-muted-foreground">
          Ready to focus? Let's make today productive.
        </p>
      </div>

      {/* Wrist band: mock alert (same signal as a real distraction alert) */}
      <div className="glass-card p-5 border border-[#3b82f6]/25 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <Watch className="w-5 h-5 text-[#3b82f6] shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Test wrist vibration</p>
              <p className="text-sm text-muted-foreground">
                Sends the same command as a real distraction alert (USB or BLE). Use this to verify your Seeed XIAO before a session.
              </p>
            </div>
          </div>
          {getSettings().wristBandEnabled ? (
            <button
              type="button"
              onClick={async () => {
                setWristMockHint(null);
                if (!isWristTransportSupported()) {
                  setWristMockHint(
                    'Use Chrome or Edge. USB needs Web Serial; Bluetooth needs Web Bluetooth.'
                  );
                  return;
                }
                if (!isWristConnected()) {
                  setWristMockHint(
                    'Connect the XIAO in Settings → Alerts (USB or Bluetooth, depending on your choice).'
                  );
                  return;
                }
                try {
                  await sendWristVibrate();
                  setWristMockHint('Sent — you should feel one buzz.');
                } catch (e) {
                  setWristMockHint(e instanceof Error ? e.message : 'Could not send to the device.');
                }
              }}
              className="shrink-0 min-h-11 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#3b82f6] text-white cursor-pointer select-none shadow-md transition active:scale-[0.98] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Simulate distraction alert
            </button>
          ) : (
            <Link
              href="/settings"
              className="shrink-0 px-5 py-2.5 rounded-lg text-sm font-medium glass-card text-foreground hover:bg-white/10 transition-colors text-center"
            >
              Enable in Settings first
            </Link>
          )}
        </div>
        {wristMockHint && (
          <p className="text-sm mt-3 text-muted-foreground">{wristMockHint}</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Focus"
          value={`${todayFocus}%`}
          subtitle={todayFocus > 0 ? "Average focus level" : "No sessions today"}
          icon={Brain}
        />
        <StatCard
          title="Total Sessions"
          value={totalSessions}
          subtitle="Completed"
          icon={Clock}
        />
        <StatCard
          title="Average Focus"
          value={`${avgFocus}%`}
          subtitle={avgFocus > 0 ? "All-time average" : "No sessions yet"}
          icon={TrendingUp}
        />
        <StatCard
          title="Focus Streak"
          value={focusStreak > 0 ? `${focusStreak} day${focusStreak !== 1 ? 's' : ''}` : "0 days"}
          subtitle={focusStreak > 0 ? "Consecutive days" : "Start a session to begin"}
          icon={Target}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Focus Meter */}
        <div className="glass-card p-8 animate-scale-in">
          <h2 className="text-xl font-semibold mb-6 text-foreground">Current State</h2>
          <div className="flex flex-col items-center">
            <FocusMeter percentage={(museConnected || mockMode) ? Math.round(focusState.confidence * 100) : todayFocus} size="lg" />
            
            {/* Real-time Focus Info - only when real Muse is connected */}
            {(museConnected || mockMode) && (
              <div className="mt-4 w-full">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Live Focus</span>
                  <span className={`text-lg font-bold transition-colors ${
                    focusState.isFocused ? 'text-[#22c55e]' : 'text-[#f97316]'
                  }`}>
                    {Math.round(focusState.confidence * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-2 h-2 rounded-full ${
                    focusState.isFocused ? 'bg-[#22c55e] animate-pulse' : 'bg-[#f97316]'
                  }`} />
                  <span className="text-sm font-medium text-foreground">
                    {focusState.isFocused ? 'Focused' : 'Not Focused'}
                  </span>
                </div>
              </div>
            )}

            {/* Connection Status */}
            <div className="mt-4 w-full space-y-3 pt-4 border-t border-white/10 dark:border-white/10 light:border-black/10">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Muse</span>
                <span className={`text-sm font-medium transition-colors ${(museConnected || mockMode) ? 'text-[#22c55e]' : 'text-[#f97316]'}`}>
                  {(museConnected || mockMode) ? '✓ Connected' : '○ Not Connected'}
                </span>
              </div>
              
              {/* Wave Bands */}
              {(museConnected || mockMode) && currentReading && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Beta</span>
                    <span className="font-medium text-foreground">{currentReading.beta.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Alpha</span>
                    <span className="font-medium text-foreground">{currentReading.alpha.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Gamma</span>
                    <span className="font-medium text-foreground">{currentReading.gamma.toFixed(1)}%</span>
                  </div>
                </div>
              )}
              
              {connectionError && (
                <div className="text-xs text-[#f97316] mt-2 pt-2 border-t border-white/10 dark:border-white/10 light:border-black/10">
                  {connectionError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-8 lg:col-span-2 animate-scale-in">
          <h2 className="text-xl font-semibold mb-6 text-foreground">Quick Actions</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Link
              href="/session"
              className="p-6 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#22c55e] hover:opacity-90 transition-opacity hover-lift"
            >
              <Brain className="w-8 h-8 text-white mb-3" />
              <h3 className="text-lg font-semibold text-white mb-1">Start Focus Session</h3>
              <p className="text-sm text-white/90">Begin a 25-minute session</p>
            </Link>
            
            <Link
              href="/insights"
              className="glass-card-strong p-6 hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/10 transition-colors hover-lift"
            >
              <TrendingUp className="w-8 h-8 text-[#3b82f6] mb-3" />
              <h3 className="text-lg font-semibold mb-1 text-foreground">View Insights</h3>
              <p className="text-sm text-muted-foreground">Analyze your patterns</p>
            </Link>
          </div>

          {/* Recent Sessions */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent Sessions</h3>
            {recentSessions.length > 0 ? (
              <div className="space-y-2">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/8 dark:bg-white/5 dark:hover:bg-white/8 light:bg-black/5 light:hover:bg-black/10 transition-colors hover-lift"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-[#3b82f6]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {session.name || new Date(session.date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Math.floor(session.duration / 60)} min • {session.distractionEvents} alerts
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-[#3b82f6]">
                        {session.focusPercentage}%
                      </p>
                      <p className="text-xs text-muted-foreground">Focus</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No sessions yet. Start your first session!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">💡 Focus Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Stay Hydrated:</span> Dehydration can reduce focus by up to 10%
            </p>
          </div>
          <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Take Breaks:</span> Use the Pomodoro technique for best results
            </p>
          </div>
          <div className="p-4 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Environment:</span> A quiet, organized space improves concentration
            </p>
          </div>
        </div>
      </div>

      {/* Powered By Footer */}
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">
          Powered by <span className="font-semibold text-foreground">AJ</span>
        </p>
      </div>
    </div>
  );
}