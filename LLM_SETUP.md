# 🤖 AI Brainwave Analysis Setup

The app now includes **AI-powered brainwave analysis** using Large Language Models (LLMs) to intelligently analyze EEG patterns and optimize Pomodoro timer settings.

## How It Works

### Flow:
1. **EEG Data Collection** → Muse headset streams brainwave data
2. **Data Summarization** → System extracts key metrics (Beta/Alpha ratios, focus patterns, etc.)
3. **LLM Analysis** → AI analyzes patterns and provides intelligent recommendations
4. **Timer Optimization** → Pomodoro timer adjusts based on AI insights
5. **Fallback System** → If LLM unavailable, uses rule-based optimization

### What the LLM Analyzes:
- **Beta waves (13-30 Hz)**: Focus and concentration levels
- **Alpha waves (8-13 Hz)**: Relaxation and distraction patterns
- **Focus decay patterns**: When attention starts to drop
- **Alpha spikes**: Frequency of distraction events
- **Sustained focus duration**: How long focus can be maintained
- **Individual patterns**: Diagnosis, variability, consistency

### LLM Outputs:
- **Optimal focus duration** (10-60 minutes)
- **Optimal break duration** (5-20 minutes)
- **Reasoning**: 2-3 sentence explanation of the analysis
- **Confidence**: How certain the AI is (0.0-1.0)
- **Patterns detected**: Key observations about brainwave patterns
- **Recommendations**: Actionable suggestions

---

## Setup Instructions

### Option 1: OpenAI API (Recommended)

1. **Get an API Key**:
   - Go to https://platform.openai.com/api-keys
   - Create a new API key
   - Copy the key (starts with `sk-...`)

2. **Add to Environment Variables**:
   - Create a `.env.local` file in the project root (if it doesn't exist)
   - Add your API key:
     ```env
     NEXT_PUBLIC_OPENAI_API_KEY=sk-your-api-key-here
     ```

3. **Restart the Development Server**:
   ```bash
   npm run dev
   ```

### Option 2: Other LLM Providers

To use other LLM providers (Anthropic Claude, Google Gemini, etc.), modify `src/lib/llm-analyzer.ts`:

1. Update the `callLLMAnalysis()` function with your provider's API
2. Adjust the prompt format if needed
3. Ensure JSON response format is maintained

---

## Usage

### Automatic Analysis
- **When**: Every ~1 minute during active Pomodoro sessions with Muse headset
- **Minimum Data**: Requires at least 10 EEG readings and 30 focus data points
- **Status**: Shows "Analyzing brainwaves..." while processing

### Fallback Behavior
If LLM is unavailable (no API key, network error, etc.):
- System automatically falls back to rule-based optimization
- Uses diagnosis-based settings + pattern analysis
- Still provides intelligent timer optimization

### Viewing AI Insights
- **AI Analysis Panel**: Appears during sessions when LLM analysis completes
- **Timer Display**: Shows "🤖 AI Analysis" badge when using LLM recommendations
- **Confidence Score**: Displays AI's confidence level (0-100%)
- **Reasoning**: Shows the AI's explanation for the recommendation

---

## Cost Considerations

### OpenAI GPT-4o-mini (Default)
- **Model**: `gpt-4o-mini` (cost-effective, fast)
- **Average Cost**: ~$0.001-0.002 per analysis
- **Frequency**: ~1 analysis per minute during active sessions
- **Monthly Estimate**: ~$0.50-2.00 for regular use (assuming 4 hours/week)

### Tips to Reduce Costs:
1. Analysis only runs during active Pomodoro sessions
2. Requires minimum data threshold (reduces unnecessary calls)
3. Falls back to rule-based system if API unavailable
4. Consider using cheaper models or local LLMs for development

---

## Example LLM Analysis

**Input Data:**
```
- Average Beta: 58.3%
- Average Alpha: 42.1%
- Focus Percentage: 72%
- Sustained Focus: 18 minutes
- Alpha Spikes: 3
- Diagnosis: ADHD
```

**LLM Response:**
```json
{
  "optimalFocusDuration": 15,
  "optimalBreakDuration": 10,
  "reasoning": "Beta waves are consistently high (58.3%) indicating good focus capacity, but Alpha spikes suggest attention drops around 18 minutes. Given ADHD diagnosis, shorter sessions (15min) with longer breaks (10min) will optimize sustained attention.",
  "confidence": 0.87,
  "patterns": [
    "High beta consistency (58.3%)",
    "Attention decay at 18 minutes",
    "Moderate alpha variability"
  ],
  "recommendations": [
    "Use 15-minute focus blocks",
    "Take 10-minute breaks between sessions",
    "Monitor alpha spike frequency"
  ]
}
```

---

## Technical Details

### Files:
- `src/lib/llm-analyzer.ts`: LLM integration and analysis logic
- `src/lib/timer-optimizer.ts`: Updated to use LLM analysis
- `src/app/session/page.tsx`: UI integration and status display

### Key Functions:
- `summarizeEEGData()`: Extracts key metrics from raw EEG data
- `createAnalysisPrompt()`: Builds LLM prompt with context
- `callLLMAnalysis()`: Makes API call to LLM
- `getLLMOptimizedTimer()`: Main entry point for LLM optimization

### Prompt Structure:
1. **System Context**: Role as neuroscientist/focus coach
2. **User Context**: Diagnosis, historical sessions
3. **EEG Data**: Metrics and patterns
4. **Analysis Requirements**: What to analyze
5. **Response Format**: JSON structure specification

---

## Troubleshooting

### LLM Not Working?
- ✅ Check API key is set in `.env.local`
- ✅ Verify `NEXT_PUBLIC_OPENAI_API_KEY` is correct
- ✅ Restart dev server after adding env variable
- ✅ Check browser console for API errors
- ✅ Verify network connectivity

### Falling Back to Rule-Based?
- Normal behavior if:
  - API key not set
  - Not enough data yet (< 10 readings)
  - Network error
  - API rate limit reached

### High Costs?
- Analysis only runs during active Pomodoro sessions
- Requires minimum data (prevents unnecessary calls)
- Uses `gpt-4o-mini` (cheapest GPT-4 model)
- Consider setting budget alerts on OpenAI dashboard

---

## Future Enhancements

Potential improvements:
- [ ] Local LLM support (Ollama, Llama.cpp)
- [ ] Multi-session learning (track patterns over time)
- [ ] Custom prompt templates
- [ ] Analysis caching (avoid redundant calls)
- [ ] Cost tracking and reporting
- [ ] A/B testing (compare LLM vs rule-based performance)

---

The AI analysis provides **deeper insights** into individual focus patterns than rule-based systems alone, adapting to each user's unique brainwave characteristics! 🧠✨
