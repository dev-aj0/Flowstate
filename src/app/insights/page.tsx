"use client";

import { useEffect, useState } from 'react';
import { TrendingUp, Calendar, Clock, Target, Download, Eye, Trash2, Edit2, X, Save } from 'lucide-react';
import { StatCard } from '@/components/stat-card';
import { getSessions, deleteSession, updateSession } from '@/lib/storage';
import { SessionData } from '@/types';

export default function InsightsPage() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [totalTime, setTotalTime] = useState(0);
  const [avgFocus, setAvgFocus] = useState(0);
  const [bestSession, setBestSession] = useState<SessionData | null>(null);
  const [totalDistractions, setTotalDistractions] = useState(0);
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    const allSessions = getSessions();
    setSessions(allSessions);

    if (allSessions.length > 0) {
      // Calculate stats
      const total = allSessions.reduce((sum, s) => sum + s.duration, 0);
      setTotalTime(total);

      const avg = allSessions.reduce((sum, s) => sum + s.focusPercentage, 0) / allSessions.length;
      setAvgFocus(Math.round(avg));

      const best = allSessions.reduce((prev, current) => 
        current.focusPercentage > prev.focusPercentage ? current : prev
      );
      setBestSession(best);

      const distractions = allSessions.reduce((sum, s) => sum + s.distractionEvents, 0);
      setTotalDistractions(distractions);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const exportData = () => {
    const csv = [
      ['Date', 'Duration (min)', 'Focus %', 'Distractions', 'Avg Beta', 'Avg Alpha'],
      ...sessions.map(s => [
        new Date(s.date).toLocaleDateString(),
        Math.floor(s.duration / 60),
        s.focusPercentage,
        s.distractionEvents,
        s.averageBeta.toFixed(2),
        s.averageAlpha.toFixed(2),
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neurocoach-sessions-${Date.now()}.csv`;
    a.click();
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
    loadSessions();
    if (selectedSession?.id === sessionId) {
      setSelectedSession(null);
    }
  };

  const handleStartEdit = (session: SessionData) => {
    setEditingSessionId(session.id);
    setEditingName(session.name);
  };

  const handleSaveEdit = (sessionId: string) => {
    if (editingName.trim()) {
      updateSession(sessionId, { name: editingName.trim() });
      loadSessions();
    }
    setEditingSessionId(null);
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditingName('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Insights & Analytics</h1>
          <p className="text-lg text-muted-foreground">Track your focus patterns over time</p>
        </div>
        <button
          onClick={exportData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg glass-card-strong text-foreground hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/10 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Sessions"
          value={sessions.length}
          subtitle="Completed"
          icon={Target}
          className="animate-fade-in stagger-1"
        />
        <StatCard
          title="Total Time"
          value={formatDuration(totalTime)}
          subtitle="In focus mode"
          icon={Clock}
          className="animate-fade-in stagger-2"
        />
        <StatCard
          title="Average Focus"
          value={`${avgFocus}%`}
          subtitle="All sessions"
          icon={TrendingUp}
          className="animate-fade-in stagger-3"
        />
        <StatCard
          title="Total Distractions"
          value={totalDistractions}
          subtitle="Alerts triggered"
          icon={Calendar}
          className="animate-fade-in stagger-4"
        />
      </div>

      {/* Best Session Highlight */}
      {bestSession && (
        <div className="glass-card p-6 bg-gradient-to-br from-[#3b82f6]/10 to-[#22c55e]/10 border-[#3b82f6]/20 animate-scale-in">
          <h2 className="text-lg font-semibold text-foreground mb-4">🏆 Best Session</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Date</p>
              <p className="text-lg font-semibold text-foreground">
                {new Date(bestSession.date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Focus Level</p>
              <p className="text-lg font-semibold text-[#22c55e]">{bestSession.focusPercentage}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Duration</p>
              <p className="text-lg font-semibold text-foreground">
                {formatDuration(bestSession.duration)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Distractions</p>
              <p className="text-lg font-semibold text-foreground">{bestSession.distractionEvents}</p>
            </div>
          </div>
        </div>
      )}

      {/* Session History */}
      <div className="glass-card p-6 animate-scale-in">
        <h2 className="text-xl font-semibold text-foreground mb-6">Session History</h2>
        
        {sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.slice().reverse().map((session, index) => (
              <div
                key={session.id}
                className={`flex items-center justify-between p-4 rounded-lg glass-card-strong hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/10 transition-all hover-lift animate-slide-in-up`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-[#3b82f6]">
                      #{sessions.length - index}
                    </span>
                  </div>
                  <div className="flex-1">
                    {editingSessionId === session.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="px-3 py-1 bg-white/10 dark:bg-white/10 light:bg-black/10 border border-white/20 dark:border-white/20 light:border-black/20 rounded text-foreground focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(session.id)}
                          className="p-1 hover:bg-[#22c55e]/20 rounded transition-colors"
                        >
                          <Save className="w-4 h-4 text-[#22c55e]" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 hover:bg-[#ef4444]/20 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-[#ef4444]" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium text-foreground">{session.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })} • {formatDuration(session.duration)} • {session.distractionEvents} alerts
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Beta/Alpha</p>
                    <p className="text-sm font-medium text-foreground">
                      {(session.averageBeta / session.averageAlpha).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Focus</p>
                    <p className="text-2xl font-bold text-[#3b82f6]">{session.focusPercentage}%</p>
                  </div>
                  <div className="w-16 h-16">
                    <svg viewBox="0 0 36 36" className="transform -rotate-90">
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="3"
                        className="dark:stroke-[rgba(255,255,255,0.1)] light:stroke-[rgba(0,0,0,0.1)]"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeDasharray={`${session.focusPercentage}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedSession(session)}
                      className="p-2 hover:bg-[#3b82f6]/20 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4 text-[#3b82f6]" />
                    </button>
                    <button
                      onClick={() => handleStartEdit(session)}
                      className="p-2 hover:bg-[#f97316]/20 rounded-lg transition-colors"
                      title="Rename Session"
                    >
                      <Edit2 className="w-4 h-4 text-[#f97316]" />
                    </button>
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="p-2 hover:bg-[#ef4444]/20 rounded-lg transition-colors"
                      title="Delete Session"
                    >
                      <Trash2 className="w-4 h-4 text-[#ef4444]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No sessions yet</p>
            <p className="text-sm text-muted-foreground mt-2">Start a focus session to see your insights</p>
          </div>
        )}
      </div>

      {/* Focus Patterns */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-foreground mb-4">Focus Trends</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Excellent (70%+)</span>
                  <span className="text-foreground">
                    {sessions.filter(s => s.focusPercentage >= 70).length}
                  </span>
                </div>
                <div className="w-full h-2 bg-white/10 dark:bg-white/10 light:bg-black/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#22c55e] transition-all duration-500"
                    style={{
                      width: `${(sessions.filter(s => s.focusPercentage >= 70).length / sessions.length) * 100}%`
                    }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Good (50-69%)</span>
                  <span className="text-foreground">
                    {sessions.filter(s => s.focusPercentage >= 50 && s.focusPercentage < 70).length}
                  </span>
                </div>
                <div className="w-full h-2 bg-white/10 dark:bg-white/10 light:bg-black/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#3b82f6] transition-all duration-500"
                    style={{
                      width: `${(sessions.filter(s => s.focusPercentage >= 50 && s.focusPercentage < 70).length / sessions.length) * 100}%`
                    }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Needs Improvement (&lt;50%)</span>
                  <span className="text-foreground">
                    {sessions.filter(s => s.focusPercentage < 50).length}
                  </span>
                </div>
                <div className="w-full h-2 bg-white/10 dark:bg-white/10 light:bg-black/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#f97316] transition-all duration-500"
                    style={{
                      width: `${(sessions.filter(s => s.focusPercentage < 50).length / sessions.length) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recommendations</h3>
            <div className="space-y-3">
              {avgFocus >= 70 ? (
                <div className="p-3 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20">
                  <p className="text-sm text-foreground">
                    🎉 <span className="font-medium">Excellent work!</span> Your focus levels are consistently high.
                  </p>
                </div>
              ) : avgFocus >= 50 ? (
                <div className="p-3 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/20">
                  <p className="text-sm text-foreground">
                    💪 <span className="font-medium">Good progress!</span> Try reducing distractions for even better results.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-[#f97316]/10 border border-[#f97316]/20">
                  <p className="text-sm text-foreground">
                    🎯 <span className="font-medium">Keep practicing!</span> Consider shorter sessions to build focus stamina.
                  </p>
                </div>
              )}
              
              <div className="p-3 rounded-lg bg-white/5 dark:bg-white/5 light:bg-black/5">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Tip:</span> Your best focus times appear to be in the morning. Schedule important tasks then.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      {selectedSession && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setSelectedSession(null)}
        >
          <div 
            className="glass-card-strong p-8 max-w-2xl w-full animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{selectedSession.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedSession.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })} at {new Date(selectedSession.date).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-2 hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4">
                  <p className="text-sm text-muted-foreground mb-1">Duration</p>
                  <p className="text-2xl font-bold text-foreground">{formatDuration(selectedSession.duration)}</p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-sm text-muted-foreground mb-1">Focus Score</p>
                  <p className="text-2xl font-bold text-[#3b82f6]">{selectedSession.focusPercentage}%</p>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="glass-card p-4 space-y-4">
                <h3 className="font-semibold text-foreground mb-3">Detailed Metrics</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Distraction Events</span>
                    <span className="text-sm font-medium text-foreground">{selectedSession.distractionEvents}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Average Beta Waves</span>
                    <span className="text-sm font-medium text-[#3b82f6]">{selectedSession.averageBeta.toFixed(2)} Hz</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Average Alpha Waves</span>
                    <span className="text-sm font-medium text-[#f97316]">{selectedSession.averageAlpha.toFixed(2)} Hz</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Beta/Alpha Ratio</span>
                    <span className="text-sm font-medium text-foreground">
                      {(selectedSession.averageBeta / selectedSession.averageAlpha).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance Badge */}
              <div className={`p-4 rounded-lg text-center ${
                selectedSession.focusPercentage >= 70 
                  ? 'bg-[#22c55e]/10 border border-[#22c55e]/20' 
                  : selectedSession.focusPercentage >= 50
                    ? 'bg-[#3b82f6]/10 border border-[#3b82f6]/20'
                    : 'bg-[#f97316]/10 border border-[#f97316]/20'
              }`}>
                <p className="text-lg font-semibold text-foreground mb-1">
                  {selectedSession.focusPercentage >= 70 
                    ? '🏆 Excellent Performance' 
                    : selectedSession.focusPercentage >= 50
                      ? '👍 Good Performance'
                      : '💪 Room for Improvement'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedSession.focusPercentage >= 70 
                    ? 'You maintained exceptional focus throughout this session!' 
                    : selectedSession.focusPercentage >= 50
                      ? 'You showed good focus. Keep it up!'
                      : 'Keep practicing to improve your focus levels.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}