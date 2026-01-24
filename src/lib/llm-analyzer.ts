/**
 * LLM Brainwave Analyzer
 * Uses AI/LLM to analyze EEG patterns and provide intelligent timer recommendations
 */

import { UserProfile, EEGReading } from '@/types';

export interface LLMAnalysis {
  optimalFocusDuration: number;
  optimalBreakDuration: number;
  reasoning: string;
  confidence: number;
  patterns: string[];
  recommendations: string[];
}

export interface EEGDataSummary {
  averageBeta: number;
  averageAlpha: number;
  averageGamma: number;
  averageDelta: number;
  averageTheta: number;
  betaVariability: number;
  alphaSpikes: number;
  focusPercentage: number;
  sustainedFocusTime: number;
  decayPoint?: number;
  sessionLength: number;
}

/**
 * Summarize EEG data for LLM analysis
 */
export function summarizeEEGData(
  readings: EEGReading[],
  focusHistory: number[],
  timeElapsed: number
): EEGDataSummary {
  if (readings.length === 0) {
    return {
      averageBeta: 0,
      averageAlpha: 0,
      averageGamma: 0,
      averageDelta: 0,
      averageTheta: 0,
      betaVariability: 0,
      alphaSpikes: 0,
      focusPercentage: 0,
      sustainedFocusTime: 0,
      sessionLength: timeElapsed,
    };
  }

  const betas = readings.map(r => r.beta);
  const alphas = readings.map(r => r.alpha);
  const gammas = readings.map(r => r.gamma);
  const deltas = readings.map(r => r.delta);
  const thetas = readings.map(r => r.theta);

  const averageBeta = betas.reduce((sum, v) => sum + v, 0) / betas.length;
  const averageAlpha = alphas.reduce((sum, v) => sum + v, 0) / alphas.length;
  const averageGamma = gammas.reduce((sum, v) => sum + v, 0) / gammas.length;
  const averageDelta = deltas.reduce((sum, v) => sum + v, 0) / deltas.length;
  const averageTheta = thetas.reduce((sum, v) => sum + v, 0) / thetas.length;

  // Calculate variability (standard deviation)
  const betaMean = averageBeta;
  const betaVariance = betas.reduce((sum, v) => sum + Math.pow(v - betaMean, 2), 0) / betas.length;
  const betaVariability = Math.sqrt(betaVariance);

  // Count alpha spikes (>40% above average)
  const alphaMean = averageAlpha;
  const alphaThreshold = alphaMean * 1.4;
  const alphaSpikes = alphas.filter(a => a > alphaThreshold).length;

  // Calculate focus percentage
  const avgFocus = focusHistory.length > 0
    ? focusHistory.reduce((sum, v) => sum + v, 0) / focusHistory.length
    : 0;

  // Find sustained focus time (time before first significant drop)
  let sustainedFocusTime = timeElapsed;
  if (focusHistory.length > 0) {
    const peakFocus = Math.max(...focusHistory);
    const decayThreshold = peakFocus * 0.75;
    
    for (let i = 0; i < focusHistory.length; i++) {
      if (focusHistory[i] < decayThreshold && i > focusHistory.length * 0.2) {
        sustainedFocusTime = (i / focusHistory.length) * timeElapsed;
        break;
      }
    }
  }

  // Find decay point (when focus drops below 70% of peak)
  let decayPoint: number | undefined;
  if (focusHistory.length > 0) {
    const peakFocus = Math.max(...focusHistory);
    const decayThreshold = peakFocus * 0.7;
    
    for (let i = focusHistory.length - 1; i >= 0; i--) {
      if (focusHistory[i] < decayThreshold && i > focusHistory.length * 0.3) {
        decayPoint = (i / focusHistory.length) * timeElapsed;
        break;
      }
    }
  }

  return {
    averageBeta,
    averageAlpha,
    averageGamma,
    averageDelta,
    averageTheta,
    betaVariability,
    alphaSpikes,
    focusPercentage: avgFocus,
    sustainedFocusTime,
    decayPoint,
    sessionLength: timeElapsed,
  };
}

/**
 * Create prompt for LLM analysis
 */
function createAnalysisPrompt(
  eegSummary: EEGDataSummary,
  profile: UserProfile | null,
  historicalSessions: number
): string {
  const diagnosis = profile?.diagnosis || 'none';
  const diagnosisContext = diagnosis !== 'none' 
    ? `User has self-reported: ${diagnosis.toUpperCase()} (used for timer optimization only, not for diagnosis)`
    : 'No user-reported condition.';

  return `You are a neuroscientist analyzing EEG brainwave patterns to optimize Pomodoro timer settings.

**Primary Analysis - Brainwave Patterns:**
Analyze the following EEG data to determine when focus drops and optimal work duration:

**EEG Brainwave Metrics:**
- Beta waves (focus/alertness): ${eegSummary.averageBeta.toFixed(1)}% average
- Alpha waves (relaxation/distraction): ${eegSummary.averageAlpha.toFixed(1)}% average
- Gamma waves (active thinking): ${eegSummary.averageGamma.toFixed(1)}% average
- Theta waves (drowsiness/daydreaming): ${eegSummary.averageTheta.toFixed(1)}% average
- Delta waves (deep relaxation/sleep): ${eegSummary.averageDelta.toFixed(1)}% average
- Beta/Alpha ratio: ${(eegSummary.averageBeta / (eegSummary.averageAlpha || 1)).toFixed(2)} (higher = more focused)
- Beta variability: ${eegSummary.betaVariability.toFixed(1)}% (consistency of focus)

**Focus Decay Analysis:**
- Average focus percentage: ${eegSummary.focusPercentage.toFixed(1)}%
- Sustained focus duration: ${Math.round(eegSummary.sustainedFocusTime / 60)} minutes (how long focus was maintained)
${eegSummary.decayPoint ? `- Focus decay point: ${Math.round(eegSummary.decayPoint / 60)} minutes (when focus dropped significantly)` : '- No significant decay detected yet'}
- Alpha spikes (distraction events): ${eegSummary.alphaSpikes} (alpha waves spiking >40% above average)

**Session Context:**
- Session length: ${Math.round(eegSummary.sessionLength / 60)} minutes
${diagnosisContext !== 'No user-reported condition.' ? `- User context: ${diagnosisContext}` : ''}
- Historical sessions: ${historicalSessions}

**Analysis Instructions:**
PRIMARY: Analyze the brainwave patterns above to determine optimal timer settings:

1. **Optimal focus duration**: 
   - When do Beta waves drop significantly? (indicates focus loss)
   - When do Alpha spikes occur? (indicates distraction)
   - When do Theta/Delta waves increase? (indicates drowsiness/over-relaxation)
   - Use the "sustained focus duration" and "focus decay point" as key indicators

2. **Beta/Alpha ratio analysis**: 
   - What Beta/Alpha ratio indicates focused state vs distracted?
   - Higher Beta relative to Alpha = more focused
   - When Alpha exceeds Beta = distraction/relaxation

3. **Focus sustainability**: 
   - How long can focus be maintained before decay? (use sustained focus duration)
   - When does focus drop below 70% of peak? (decay point)

4. **Distraction patterns**: 
   - Count of Alpha spikes indicates distraction frequency
   - High Theta/Delta may indicate drowsiness during focus sessions

5. **Break duration**: 
   - Based on focus intensity (Beta levels) and decay patterns
   - Higher focus intensity = longer recovery needed
   - More Alpha spikes = may need longer breaks

**CRITICAL**: Base your recommendations primarily on the brainwave data patterns above. The user context is only secondary reference.

**Response Format (JSON only):**
{
  "optimalFocusDuration": <number in minutes, 10-60>,
  "optimalBreakDuration": <number in minutes, 5-20>,
  "reasoning": "<2-3 sentence explanation of the analysis>",
  "confidence": <0.0-1.0, how confident you are in this recommendation>,
  "patterns": ["<pattern 1>", "<pattern 2>", "<pattern 3>"],
  "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}

Respond ONLY with valid JSON, no other text.`;
}

/**
 * Call LLM API to analyze brainwave data
 */
async function callLLMAnalysis(prompt: string): Promise<LLMAnalysis | null> {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  const useOpenAI = apiKey && apiKey.length > 0;

  if (!useOpenAI) {
    console.warn('OpenAI API key not found. LLM analysis disabled.');
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Fast and cost-effective for this use case
        messages: [
          {
            role: 'system',
            content: 'You are a neuroscientist specializing in attention and focus patterns. Provide only valid JSON responses.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent, analytical responses
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in LLM response');
    }

    // Parse JSON response
    const analysis = JSON.parse(content) as LLMAnalysis;

    // Validate and clamp values
    analysis.optimalFocusDuration = Math.max(10, Math.min(60, analysis.optimalFocusDuration));
    analysis.optimalBreakDuration = Math.max(5, Math.min(20, analysis.optimalBreakDuration));
    analysis.confidence = Math.max(0, Math.min(1, analysis.confidence));

    return analysis;
  } catch (error) {
    console.error('LLM analysis error:', error);
    return null;
  }
}

/**
 * Analyze brainwave patterns using LLM
 */
export async function analyzeWithLLM(
  readings: EEGReading[],
  focusHistory: number[],
  timeElapsed: number,
  profile: UserProfile | null,
  historicalSessions: number = 0
): Promise<LLMAnalysis | null> {
  // Need minimum data for meaningful analysis
  if (readings.length < 10 || focusHistory.length < 10) {
    return null;
  }

  const eegSummary = summarizeEEGData(readings, focusHistory, timeElapsed);
  const prompt = createAnalysisPrompt(eegSummary, profile, historicalSessions);

  return await callLLMAnalysis(prompt);
}

/**
 * Use LLM analysis to optimize timer settings
 */
export async function getLLMOptimizedTimer(
  readings: EEGReading[],
  focusHistory: number[],
  timeElapsed: number,
  profile: UserProfile | null,
  historicalSessions: number = 0
): Promise<{
  focusDuration: number;
  breakDuration: number;
  reasoning: string;
  confidence: number;
  source: 'llm' | 'fallback';
} | null> {
  const analysis = await analyzeWithLLM(
    readings,
    focusHistory,
    timeElapsed,
    profile,
    historicalSessions
  );

  if (analysis) {
    return {
      focusDuration: analysis.optimalFocusDuration,
      breakDuration: analysis.optimalBreakDuration,
      reasoning: analysis.reasoning,
      confidence: analysis.confidence,
      source: 'llm',
    };
  }

  return null; // Return null to trigger fallback to rule-based system
}
