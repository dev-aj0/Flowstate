"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Brain, CheckCircle2, Hourglass, Info, PauseCircle, Play, RefreshCw, Sparkles, Timer } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { saveCalibration, saveUserProfile, getUserProfile, saveSettings, getSettings } from '@/lib/storage';
import { CalibrationData, UserProfile, EEGReading } from '@/types';
import { wsManager } from '@/lib/websocket-manager';
import { useEEGStream } from '@/hooks/use-eeg-stream';
import { getLLMOptimizedTimer } from '@/lib/timer-optimizer';

type CalibrationPhase = 'intro' | 'focus' | 'relax' | 'processing' | 'complete' | 'error';

type CalibrationPresetKey = 'standard' | 'quick' | 'diagnosis';

const CALIBRATION_PRESETS: Record<CalibrationPresetKey, { focus: number; relax: number; label: string; description: string }> = {
  standard: {
    focus: 300,
    relax: 300,
    label: 'Standard (5 min / phase)',
    description: 'Best accuracy. Each phase runs for 5 minutes.',
  },
  quick: {
    focus: 90,
    relax: 90,
    label: 'Quick (90 sec / phase)',
    description: 'Use when testing or short on time.',
  },
  diagnosis: {
    focus: 3600, // 1 hour
    relax: 300, // Still 5 min for relax phase
    label: 'Diagnosis (1 hour focus + 5 min relax)',
    description: 'Comprehensive analysis. AI will analyze patterns and set optimal Pomodoro timer after completion.',
  },
};

interface CalibrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (calibration: CalibrationData & { thresholds: { focusRatio: number; relaxRatio: number; ratioThreshold: number } }) => void;
}

interface CalibrationSnapshot {
  focus: {
    alpha: number[];
    beta: number[];
  };
  relax: {
    alpha: number[];
    beta: number[];
  };
}

export function CalibrationDialog({ open, onOpenChange, onComplete }: CalibrationDialogProps) {
  const [phase, setPhase] = useState<CalibrationPhase>('intro');
  const [preset, setPreset] = useState<CalibrationPresetKey>('standard');
  const [timeLeft, setTimeLeft] = useState(CALIBRATION_PRESETS.standard.focus);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>(() => getUserProfile());
  const [calibrationResult, setCalibrationResult] = useState<CalibrationData & { thresholds: { focusRatio: number; relaxRatio: number; ratioThreshold: number } } | null>(null);
  const [saving, setSaving] = useState(false);
  const completionNotified = useRef(false);

  const durations = useMemo(() => CALIBRATION_PRESETS[preset], [preset]);

  const samplesRef = useRef<CalibrationSnapshot>({
    focus: { alpha: [], beta: [] },
    relax: { alpha: [], beta: [] },
  });

  // For diagnosis sessions, track all readings and focus history
  const diagnosisReadingsRef = useRef<EEGReading[]>([]);
  const diagnosisFocusHistoryRef = useRef<number[]>([]);

  const activePhase = phase === 'focus' || phase === 'relax';
  const { currentReading, focusState, museConnected, connectionError } = useEEGStream(open && activePhase);

  useEffect(() => {
    if (!open) {
      setPhase('intro');
      setTimeLeft(durations.focus);
      setError(null);
      samplesRef.current = {
        focus: { alpha: [], beta: [] },
        relax: { alpha: [], beta: [] },
      };
      diagnosisReadingsRef.current = [];
      diagnosisFocusHistoryRef.current = [];
      setCalibrationResult(null);
      return;
    }
    setProfile(getUserProfile());
    completionNotified.current = false;
  }, [open, durations.focus]);

  useEffect(() => {
    if (!open || !activePhase) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [open, activePhase]);

  useEffect(() => {
    if (!open || !activePhase) return;
    const snapshot = samplesRef.current;

    if (currentReading && currentReading.alpha > 0 && currentReading.beta > 0) {
      if (phase === 'focus') {
        snapshot.focus.alpha.push(currentReading.alpha);
        snapshot.focus.beta.push(currentReading.beta);
        
        // Track full readings and focus history for diagnosis sessions
        if (preset === 'diagnosis') {
          diagnosisReadingsRef.current.push(currentReading);
          if (focusState && focusState.confidence > 0) {
            diagnosisFocusHistoryRef.current.push(focusState.confidence * 100);
          }
        }
      } else if (phase === 'relax') {
        snapshot.relax.alpha.push(currentReading.alpha);
        snapshot.relax.beta.push(currentReading.beta);
      }
    }
  }, [currentReading.timestamp, currentReading.alpha, currentReading.beta, open, activePhase, phase, preset, focusState]);

  useEffect(() => {
    if (!open) return;
    if ((phase === 'focus' || phase === 'relax') && timeLeft === 0) {
      if (phase === 'focus') {
        advanceToRelax();
      } else if (phase === 'relax') {
        finalizeCalibration();
      }
    }
  }, [timeLeft, phase, open]);

  const beginCalibration = () => {
    setError(null);
    samplesRef.current = {
      focus: { alpha: [], beta: [] },
      relax: { alpha: [], beta: [] },
    };
    setPhase('focus');
    setTimeLeft(durations.focus);
  };

  const advanceToRelax = () => {
    const snapshot = samplesRef.current.focus;
    if (snapshot.alpha.length < 30 || snapshot.beta.length < 30) {
      setError('Not enough data captured during focus phase. Try again or extend the calibration.');
      setPhase('error');
      return;
    }
    setPhase('relax');
    setTimeLeft(durations.relax);
  };

  const finalizeCalibration = () => {
    const focusSamples = samplesRef.current.focus;
    const relaxSamples = samplesRef.current.relax;

    if (focusSamples.alpha.length < 30 || relaxSamples.alpha.length < 30) {
      setError('Calibration needs more data. Make sure your headset is streaming and try again.');
      setPhase('error');
      return;
    }

    setPhase('processing');
    setSaving(true);

    const average = (values: number[]) =>
      values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);

    const focusAlphaAvg = average(focusSamples.alpha);
    const focusBetaAvg = average(focusSamples.beta);
    const relaxAlphaAvg = average(relaxSamples.alpha);
    const relaxBetaAvg = average(relaxSamples.beta);

    const focusRatio = focusBetaAvg / Math.max(focusAlphaAvg, 0.001);
    const relaxRatio = relaxBetaAvg / Math.max(relaxAlphaAvg, 0.001);
    const ratioThreshold = (focusRatio + relaxRatio) / 2;

    const calibration: CalibrationData & {
      thresholds: { focusRatio: number; relaxRatio: number; ratioThreshold: number };
    } = {
      focusBaseline: {
        beta: focusBetaAvg,
        alpha: focusAlphaAvg,
      },
      distractionBaseline: {
        beta: relaxBetaAvg,
        alpha: relaxAlphaAvg,
      },
      thresholds: {
        focusRatio,
        relaxRatio,
        ratioThreshold,
      },
    };

    try {
      saveCalibration(calibration);
      const nextProfile: UserProfile = {
        ...profile,
        calibrated: true,
        focusThreshold: Number(ratioThreshold.toFixed(3)),
        distractionThreshold: Number(relaxRatio.toFixed(3)),
      };
      saveUserProfile(nextProfile);
      setProfile(nextProfile);
      setCalibrationResult(calibration);

      wsManager.send({
        type: 'calibration_update',
        calibration,
      });

      // If diagnosis session, analyze with LLM and update Pomodoro timer settings
      if (preset === 'diagnosis' && diagnosisReadingsRef.current.length > 30 && diagnosisFocusHistoryRef.current.length > 30) {
        // Calculate total time (focus + relax phases)
        const totalTimeSeconds = durations.focus + durations.relax;
        
        getLLMOptimizedTimer(
          diagnosisReadingsRef.current,
          diagnosisFocusHistoryRef.current,
          totalTimeSeconds,
          profile
        ).then(llmResult => {
          if (llmResult && llmResult.source === 'llm') {
            // Update settings with LLM-optimized timer
            const currentSettings = getSettings();
            saveSettings({
              ...currentSettings,
              sessionDuration: llmResult.focusDuration,
            });
            
            // Save optimized break duration to profile or settings
            const updatedProfile = {
              ...nextProfile,
            };
            saveUserProfile(updatedProfile);
            
            console.log('🤖 AI Analysis complete:', llmResult.reasoning);
            console.log(`Optimal Timer: ${llmResult.focusDuration} min focus, ${llmResult.breakDuration} min break`);
          }
        }).catch(err => {
          console.warn('LLM analysis failed, using calibration only:', err);
        });
      }
      
      setPhase('complete');
    } catch (err) {
      console.error('Failed to save calibration', err);
      setError('Could not save calibration. Please try again.');
      setPhase('error');
    } finally {
      setSaving(false);
    }
  };

  const closeDialog = () => {
    onOpenChange(false);
  };

  const retry = () => {
    setError(null);
    setPhase('intro');
    setCalibrationResult(null);
  };

  const currentDuration = phase === 'focus' ? durations.focus : durations.relax;
  const progressValue = currentDuration
    ? Math.round(((currentDuration - timeLeft) / currentDuration) * 100)
    : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (phase === 'complete' && calibrationResult && onComplete && !completionNotified.current) {
      onComplete(calibrationResult);
      completionNotified.current = true;
    }
  }, [phase, calibrationResult, onComplete]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Brain className="w-6 h-6 text-[#3b82f6]" />
            Calibration Wizard
          </DialogTitle>
          <DialogDescription>
            We&apos;ll capture your focus and relaxation baselines to personalize distraction alerts.
          </DialogDescription>
        </DialogHeader>

        {phase === 'intro' && (
          <div className="space-y-5">
            <div className="glass-card-strong p-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Calibration runs in two phases: maintain deep focus, then relax completely. Stay still and avoid
                speaking for best results.
              </p>
              <div className="flex items-center gap-2 text-sm text-[#3b82f6]">
                <Timer className="w-4 h-4" />
                <span>{CALIBRATION_PRESETS[preset].label}</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Duration</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(Object.keys(CALIBRATION_PRESETS) as CalibrationPresetKey[]).map((key) => {
                  const option = CALIBRATION_PRESETS[key];
                  const isActive = preset === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setPreset(key)}
                      className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                        isActive
                          ? 'border-[#3b82f6] bg-[#3b82f6]/10 text-[#3b82f6]'
                          : 'border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20'
                      }`}
                    >
                      <p className="text-sm font-semibold">{option.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/20 p-4 text-sm text-foreground space-y-2">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-[#3b82f6] mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Heads-up</p>
                  <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 pl-1">
                    <li>Muse connection is {museConnected ? 'active ✅' : 'not detected ⚠️ — mock data will be used'}.</li>
                    <li>Find a quiet spot and sit comfortably with your eyes open.</li>
                    <li>Have a simple focus task (reading, breathing) for the first phase.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {(phase === 'focus' || phase === 'relax') && (
          <div className="space-y-5">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Hourglass className="w-4 h-4 text-[#3b82f6]" />
                  {phase === 'focus' ? 'Focus Phase' : 'Relax Phase'}
                </span>
                <span className="text-sm font-semibold text-foreground">{formatTime(timeLeft)}</span>
              </div>
              <Progress value={progressValue} className="h-3 bg-white/10" />
              <p className="text-xs text-muted-foreground mt-3">
                {phase === 'focus'
                  ? 'Concentrate on a single task. Keep movement minimal.'
                  : 'Close your eyes or look softly ahead. Let your mind wander gently.'}
              </p>
            </div>

            <div className="rounded-lg glass-card-strong p-4 text-sm">
              <p className="font-medium mb-2">Live status</p>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Muse</span>
                <span className={`font-medium ${museConnected ? 'text-[#22c55e]' : 'text-[#f97316]'}`}>
                  {museConnected ? 'Connected' : 'Mock Mode'}
                </span>
              </div>
              {connectionError && (
                <p className="text-xs text-[#f97316] mt-2 border-t border-white/10 pt-2">{connectionError}</p>
              )}
            </div>
          </div>
        )}

        {phase === 'processing' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <RefreshCw className="w-8 h-8 text-[#3b82f6] animate-spin" />
            <p className="text-sm text-muted-foreground text-center">
              Crunching the numbers to tune your focus thresholds...
            </p>
          </div>
        )}

        {phase === 'complete' && calibrationResult && (
          <div className="space-y-5">
            <div className="rounded-lg border border-[#22c55e]/30 bg-[#22c55e]/10 p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#22c55e] mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Calibration saved</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your distraction alerts will now use personalized thresholds.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="glass-card-strong p-4">
                <p className="text-xs uppercase text-muted-foreground mb-2">Focus Baseline</p>
                <div className="text-sm text-foreground">
                  <p>Beta: {calibrationResult.focusBaseline.beta.toFixed(2)}</p>
                  <p>Alpha: {calibrationResult.focusBaseline.alpha.toFixed(2)}</p>
                  <p>Ratio: {calibrationResult.thresholds.focusRatio.toFixed(3)}</p>
                </div>
              </div>
              <div className="glass-card-strong p-4">
                <p className="text-xs uppercase text-muted-foreground mb-2">Relax Baseline</p>
                <div className="text-sm text-foreground">
                  <p>Beta: {calibrationResult.distractionBaseline.beta.toFixed(2)}</p>
                  <p>Alpha: {calibrationResult.distractionBaseline.alpha.toFixed(2)}</p>
                  <p>Ratio: {calibrationResult.thresholds.relaxRatio.toFixed(3)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#3b82f6]/30 bg-[#3b82f6]/10 p-4 text-sm">
              <p className="font-semibold text-foreground">Detection Threshold</p>
              <p className="text-xs text-muted-foreground mt-1">
                Focus detected when β/α ≥ {calibrationResult.thresholds.ratioThreshold.toFixed(3)}
              </p>
            </div>
          </div>
        )}

        {phase === 'error' && error && (
          <div className="space-y-4">
            <div className="rounded-lg border border-[#f97316]/40 bg-[#f97316]/10 p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-[#f97316] mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Calibration interrupted</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              • Ensure the headset is streaming (or keep mock mode active). <br />
              • Stay still during each phase for cleaner readings.
            </div>
          </div>
        )}

        <DialogFooter className="mt-6">
          {phase === 'intro' && (
            <>
              <Button variant="secondary" onClick={closeDialog}>
                Cancel
              </Button>
              <Button onClick={beginCalibration} className="bg-gradient-to-r from-[#3b82f6] to-[#22c55e] text-white">
                <Play className="w-4 h-4" />
                Begin Calibration
              </Button>
            </>
          )}

          {(phase === 'focus' || phase === 'relax') && (
            <>
              <Button variant="ghost" onClick={closeDialog}>
                <PauseCircle className="w-4 h-4" />
                Stop
              </Button>
              <Button
                variant="secondary"
                onClick={phase === 'focus' ? advanceToRelax : finalizeCalibration}
                disabled={saving}
              >
                Skip Phase
              </Button>
            </>
          )}

          {phase === 'processing' && (
            <Button disabled className="opacity-75">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Saving...
            </Button>
          )}

          {phase === 'complete' && (
            <Button onClick={closeDialog}>
              <CheckCircle2 className="w-4 h-4" />
              Done
            </Button>
          )}

          {phase === 'error' && (
            <>
              <Button variant="ghost" onClick={closeDialog}>
                Cancel
              </Button>
              <Button onClick={retry}>
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

