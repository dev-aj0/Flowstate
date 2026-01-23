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

  const averageBeta = betas.reduce((sum, v) => sum + v, 0) / betas.length;
  const averageAlpha = alphas.reduce((sum, v) => sum + v, 0) / alphas.length;
  const averageGamma = gammas.reduce((sum, v) => sum + v, 0) / gammas.length;

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
    ? `The user has a diagnosis of ${diagnosis.toUpperCase()}, which may affect attention patterns.`
    : 'No specific diagnosis recorded.';

  return `You are a neuroscientist and focus coach analyzing EEG brainwave data to optimize Pomodoro timer settings.

**User Context:**
${diagnosisContext}
Historical sessions completed: ${historicalSessions}

**Current Session EEG Data (${Math.round(eegSummary.sessionLength / 60)} minutes):**
- Average Beta waves (focus): ${eegSummary.averageBeta.toFixed(1)}%
- Average Alpha waves (relaxation): ${eegSummary.averageAlpha.toFixed(1)}%
- Average Gamma waves (active thinking): ${eegSummary.averageGamma.toFixed(1)}%
- Beta variability (consistency): ${eegSummary.betaVariability.toFixed(1)}%
- Alpha spikes (distraction events): ${eegSummary.alphaSpikes}
- Average focus percentage: ${eegSummary.focusPercentage.toFixed(1)}%
- Sustained focus duration: ${Math.round(eegSummary.sustainedFocusTime / 60)} minutes
${eegSummary.decayPoint ? `- Focus decay point: ${Math.round(eegSummary.decayPoint / 60)} minutes` : '- No significant decay detected yet'}

**Analysis Required:**
Analyze these brainwave patterns and provide optimal Pomodoro timer settings. Consider:
1. How long the user can maintain focus before attention decays
2. When alpha spikes (distraction) occur most frequently
3. Beta/Alpha ratio patterns indicating optimal work duration
4. Individual differences (diagnosis, variability patterns)
5. Recovery time needed between sessions (break duration)

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
