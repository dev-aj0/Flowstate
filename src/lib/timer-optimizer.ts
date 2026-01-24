/**
 * Timer Optimizer
 * Optimizes Pomodoro timer durations based on:
 * 1. User self-reported condition (ADHD, Anxiety, etc.) - for timer optimization only, not diagnosis
 * 2. EEG focus patterns (how long user can maintain focus)
 * 3. Historical session data
 */

import { UserProfile, EEGReading } from '@/types';
import { getSessions } from './storage';
import { getLLMOptimizedTimer as analyzeWithLLM } from './llm-analyzer';

export interface OptimizedTimerSettings {
  focusDuration: number; // minutes
  breakDuration: number; // minutes
  recommendedCycles: number;
  reason: string;
  source?: 'llm' | 'rule-based'; // How optimization was determined
  llmReasoning?: string; // LLM's detailed reasoning
  confidence?: number; // LLM confidence (0-1)
}

/**
 * Get optimized timer settings based on user self-reported condition
 * (Used for timer optimization only, not for medical diagnosis)
 */
export function getDiagnosisBasedTimer(profile: UserProfile | null): OptimizedTimerSettings {
  const diagnosis = profile?.diagnosis || '';
  
  switch (diagnosis) {
    case 'adhd':
      // ADHD: Shorter focus sessions (15-20 min), longer breaks (10-15 min)
      return {
        focusDuration: 15,
        breakDuration: 10,
        recommendedCycles: 4,
        reason: 'ADHD-optimized: Shorter focus periods with longer breaks for better attention management',
      };
    
    case 'anxiety':
      // Anxiety: Moderate sessions (20-25 min), gentle breaks (5-10 min)
      return {
        focusDuration: 20,
        breakDuration: 7,
        recommendedCycles: 3,
        reason: 'Anxiety-optimized: Moderate sessions with calming breaks to reduce stress',
      };
    
    case 'both':
      // ADHD + Anxiety: Very short sessions (10-15 min), frequent breaks (8-10 min)
      return {
        focusDuration: 12,
        breakDuration: 8,
        recommendedCycles: 5,
        reason: 'ADHD + Anxiety-optimized: Very short sessions with frequent breaks for maximum effectiveness',
      };
    
    default:
      // Default: Standard Pomodoro (25 min focus, 5 min break)
      return {
        focusDuration: 25,
        breakDuration: 5,
        recommendedCycles: 4,
        reason: 'Standard Pomodoro: Classic 25-minute focus sessions',
      };
  }
}

/**
 * Analyze EEG focus patterns to determine optimal focus duration
 * Looks at how long user maintains focus before attention drops
 */
export function analyzeFocusPatterns(
  focusHistory: number[],
  timeElapsed: number
): { optimalDuration: number; averageFocus: number; focusDecayTime: number } {
  if (focusHistory.length === 0) {
    return {
      optimalDuration: 25, // default
      averageFocus: 0,
      focusDecayTime: 0,
    };
  }

  const averageFocus = focusHistory.reduce((sum, val) => sum + val, 0) / focusHistory.length;
  
  // Find when focus starts to decay (drop below 70% of peak)
  const peakFocus = Math.max(...focusHistory);
  const decayThreshold = peakFocus * 0.7;
  
  let focusDecayTime = timeElapsed; // Default to current time if no decay
  for (let i = focusHistory.length - 1; i >= 0; i--) {
    if (focusHistory[i] < decayThreshold && i > focusHistory.length * 0.3) {
      // Focus dropped significantly after at least 30% of session
      const timePerSample = timeElapsed / focusHistory.length;
      focusDecayTime = i * timePerSample;
      break;
    }
  }

  // Optimal duration: Time until focus decays, with safety margin
  // If focus maintained well (>80% average), can extend
  // If focus decays early, shorten duration
  let optimalDuration = 25; // default
  
  if (averageFocus > 80 && focusDecayTime > timeElapsed * 0.8) {
    // Excellent focus - can extend to 30-45 min
    optimalDuration = Math.min(45, Math.max(30, focusDecayTime / 60));
  } else if (averageFocus > 60 && focusDecayTime > timeElapsed * 0.6) {
    // Good focus - standard 20-25 min
    optimalDuration = 25;
  } else if (averageFocus > 40 && focusDecayTime > 0) {
    // Moderate focus - shorten to 15-20 min
    optimalDuration = Math.max(15, Math.min(20, focusDecayTime / 60));
  } else {
    // Low focus - very short sessions 10-15 min
    optimalDuration = Math.max(10, Math.min(15, Math.max(focusDecayTime / 60, 10)));
  }

  return {
    optimalDuration: Math.round(optimalDuration),
    averageFocus,
    focusDecayTime,
  };
}

/**
 * Get optimized timer settings combining diagnosis and EEG patterns (synchronous)
 */
export function getOptimizedTimer(
  profile: UserProfile | null,
  focusHistory: number[],
  currentTimeElapsed: number
): OptimizedTimerSettings {
  // Start with diagnosis-based settings
  const diagnosisSettings = getDiagnosisBasedTimer(profile);
  
  // If we have EEG data, adapt based on actual focus patterns
  if (focusHistory.length > 10) {
    const patternAnalysis = analyzeFocusPatterns(focusHistory, currentTimeElapsed);
    
    // Blend user-reported condition recommendation with actual EEG data
    // Weight: 60% condition-based settings, 40% EEG patterns (if EEG shows different pattern)
    const eegDuration = patternAnalysis.optimalDuration;
    const diagnosisDuration = diagnosisSettings.focusDuration;
    
    // If EEG suggests significantly different duration, adapt
    const durationDiff = Math.abs(eegDuration - diagnosisDuration);
    if (durationDiff > 5 || patternAnalysis.averageFocus < 50) {
      // Significant difference or poor focus - trust EEG more
      const blendedDuration = Math.round(diagnosisDuration * 0.4 + eegDuration * 0.6);
      
      // Adjust break duration proportionally (usually 20-40% of focus duration)
      const breakRatio = diagnosisSettings.breakDuration / diagnosisSettings.focusDuration;
      const optimizedBreak = Math.max(5, Math.round(blendedDuration * breakRatio));
      
      return {
        focusDuration: Math.max(10, Math.min(60, blendedDuration)),
        breakDuration: Math.max(5, Math.min(20, optimizedBreak)),
        recommendedCycles: diagnosisSettings.recommendedCycles,
        reason: `Adaptive: Based on your focus patterns (${patternAnalysis.averageFocus.toFixed(0)}% avg focus, optimal: ${eegDuration}min) combined with ${diagnosisSettings.reason.split(':')[0].toLowerCase()}`,
      };
    }
  }
  
  return diagnosisSettings;
}

/**
 * Get optimized timer settings using LLM analysis (async)
 * Falls back to rule-based system if LLM unavailable
 */
export async function getLLMOptimizedTimer(
  readings: EEGReading[],
  focusHistory: number[],
  currentTimeElapsed: number,
  profile: UserProfile | null
): Promise<OptimizedTimerSettings & { source: 'llm' | 'rule-based'; llmReasoning?: string; confidence?: number }> {
  const sessions = getSessions();
  const historicalSessions = sessions.length;

  // Try LLM analysis first (if enough data)
  if (readings.length >= 10 && focusHistory.length >= 10) {
    const llmResult = await analyzeWithLLM(
      readings,
      focusHistory,
      currentTimeElapsed,
      profile,
      historicalSessions
    );

    if (llmResult && llmResult.source === 'llm') {
      // LLM analysis successful
      return {
        focusDuration: llmResult.focusDuration,
        breakDuration: llmResult.breakDuration,
        recommendedCycles: 4,
        reason: `AI Analysis: ${llmResult.reasoning}`,
        source: 'llm',
        llmReasoning: llmResult.reasoning,
        confidence: llmResult.confidence,
      };
    }
  }

  // Fallback to rule-based system
  const ruleBased = getOptimizedTimer(profile, focusHistory, currentTimeElapsed);
  return {
    ...ruleBased,
    source: 'rule-based',
  };
}

/**
 * Get adaptive break duration based on focus intensity
 * Longer focus sessions or higher intensity = longer break needed
 */
export function getAdaptiveBreakDuration(
  focusDuration: number,
  averageFocus: number,
  diagnosis: string | undefined
): number {
  // Base break duration
  let baseBreak = Math.max(5, Math.round(focusDuration * 0.2));
  
  // Adjust for diagnosis
  if (diagnosis === 'adhd' || diagnosis === 'both') {
    baseBreak = Math.round(baseBreak * 1.5); // Longer breaks for ADHD
  }
  
  // Adjust for focus intensity
  if (averageFocus > 80) {
    baseBreak = Math.round(baseBreak * 1.2); // High focus needs more recovery
  } else if (averageFocus < 50) {
    baseBreak = Math.round(baseBreak * 0.9); // Low focus, shorter break OK
  }
  
  return Math.max(5, Math.min(20, baseBreak));
}

/**
 * Learn from historical sessions to improve recommendations
 */
export function getHistoricalOptimization(profile: UserProfile | null): Partial<OptimizedTimerSettings> {
  const sessions = getSessions();
  if (sessions.length === 0) {
    return {};
  }

  // Analyze successful sessions (focus > 60%)
  const successfulSessions = sessions.filter(s => s.focusPercentage > 60);
  
  if (successfulSessions.length === 0) {
    return {};
  }

  // Average duration of successful sessions
  const avgDuration = successfulSessions.reduce((sum, s) => sum + s.duration, 0) / successfulSessions.length;
  const optimalDuration = Math.round(avgDuration / 60); // Convert to minutes

  // Find sessions with fewest distractions
  const leastDistractions = successfulSessions.reduce((min, s) => 
    s.distractionEvents < min.distractionEvents ? s : min, 
    successfulSessions[0]
  );

  return {
    focusDuration: Math.max(10, Math.min(60, optimalDuration)),
    recommendedCycles: successfulSessions.length > 3 ? 4 : 3,
    reason: `Based on ${successfulSessions.length} successful historical sessions`,
  };
}
