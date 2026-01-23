# How the System Detects Brain Waves and Focus Decay Patterns

## 📡 Part 1: Raw EEG Data Collection

### Step 1: Muse Headset → LSL Stream
- **Muse headset** has 4 EEG electrodes positioned on forehead (TP9, AF7, AF8, TP10)
- These electrodes measure tiny electrical voltages from brain activity (microvolts, ~0.1-100 µV)
- **Sample rate**: 256 Hz (256 measurements per second per channel)
- Data streams via **Lab Streaming Layer (LSL)** protocol
- BlueMuse or Muse Direct app acts as bridge between headset and LSL stream

### Step 2: Backend Receives Raw Samples
```python
# Line 423: Pull raw voltage samples from LSL stream
sample, timestamp = inlet.pull_sample(timeout=1.0)

# Line 428: Average across 4 channels (simplifies processing)
avg_sample = float(np.mean(sample))
# Result: Single voltage value per time point (~256 values/second)
```

**What this looks like**: Raw voltage values like `[0.12, -0.05, 0.23, -0.11, ...]` in microvolts

---

## 🧮 Part 2: Converting Raw Signals to Frequency Bands (FFT)

### Step 3: Buffer and Window
```python
# Line 74-76: Buffer stores last 256 samples (~1 second at 256 Hz)
BUFFER_SIZE = 256
sample_buffer.append(avg_sample)  # Keep rolling window

# Line 124-126: Apply Hann window function (reduces edge artifacts)
samples = np.array(sample_buffer[-BUFFER_SIZE:])
window = np.hanning(len(samples))  # Smooth window function
windowed_samples = samples * window
```

### Step 4: Fast Fourier Transform (FFT)
```python
# Line 90-104: calculate_band_power()
fft = np.fft.fft(windowed_samples)  # Convert time → frequency domain
freqs = np.fft.fftfreq(len(data), 1/fs)  # Get frequency bins

# Example: 256 samples @ 256 Hz gives frequency bins 0-128 Hz
```

**What FFT does**: 
- Raw signal: `[voltage, voltage, voltage, ...]` over time
- After FFT: `{0.5 Hz: power, 8 Hz: power, 13 Hz: power, ...}` 
- Shows which frequencies are present in the signal

### Step 5: Extract Frequency Bands
```python
# Line 129-134: Calculate power in each brain wave band
delta = calculate_band_power(windowed_samples, fs, 0.5, 4.0)   # Deep sleep
theta = calculate_band_power(windowed_samples, fs, 4.0, 8.0)   # Drowsy
alpha = calculate_band_power(windowed_samples, fs, 8.0, 13.0)  # Relaxed/Meditation
beta = calculate_band_power(windowed_samples, fs, 13.0, 30.0)  # Focused/Alert
gamma = calculate_band_power(windowed_samples, fs, 30.0, 100.0) # Active thinking
```

**The Math**:
```python
band_mask = (freqs >= low_freq) & (freqs <= high_freq)  # Find frequencies in range
band_power = np.sum(np.abs(fft[band_mask]) ** 2)        # Sum squared magnitudes
total_power = np.sum(np.abs(fft) ** 2)                  # Total signal power
return (band_power / total_power) * 100                  # Percentage of total power
```

**Result**: Each band becomes a percentage (e.g., `alpha: 45.2%`, `beta: 52.8%`)

---

## 🎯 Part 3: Detecting Focus State

### Step 6: Beta/Alpha Ratio Analysis
```python
# Line 170-173: Focus detection algorithm
ratio = beta / alpha if alpha > 0 else 0
ratio_threshold = 1.2  # Default threshold
is_focused = ratio >= ratio_threshold

# Example:
# Focused:   beta=60%, alpha=40%  → ratio = 1.5  ✓ Focused
# Distracted: beta=35%, alpha=55%  → ratio = 0.64 ✗ Not focused
```

**Why Beta/Alpha ratio?**
- **Beta waves (13-30 Hz)**: Correlate with active concentration, alertness, cognitive engagement
- **Alpha waves (8-13 Hz)**: Correlate with relaxed awareness, meditation, eyes closed
- **When focused**: Beta increases, Alpha decreases → Ratio > 1.2
- **When distracted**: Alpha spikes, Beta drops → Ratio < 1.2

### Step 7: Baseline Tracking (Moving Average)
```python
# Line 167-168: Update baselines gradually (5% weight per sample)
baseline_alpha = baseline_alpha * 0.95 + alpha * 0.05
baseline_beta = baseline_beta * 0.95 + beta * 0.05

# This creates a "normal" reference point for the individual
```

### Step 8: Distraction Alert Detection
```python
# Line 183-186: Detect attention drops
alpha_reference = baseline_alpha  # Your normal relaxed alpha
alpha_spike = alpha > (alpha_reference * 1.4)  # 40% above baseline
alert_triggered = alpha_spike and not is_focused

# Example:
# Baseline alpha: 45%
# Current alpha: 63% (1.4x baseline) + beta/alpha ratio < 1.2
# → Alert triggered! Attention dropped
```

---

## 📉 Part 4: Detecting Focus Decay Patterns

### Step 9: Track Focus Over Time
```typescript
// Frontend: Every time focus state updates (~every 200ms)
setFocusHistory(prev => [...prev, focusState.confidence * 100])
// Result: Array like [85, 82, 78, 75, 72, 68, 65, ...]
```

### Step 10: Find Peak and Decay Point
```typescript
// Line 83-94: analyzeFocusPatterns()
const peakFocus = Math.max(...focusHistory)  // Highest focus value
const decayThreshold = peakFocus * 0.7       // 70% of peak

// Scan backwards through history
for (let i = focusHistory.length - 1; i >= 0; i--) {
  if (focusHistory[i] < decayThreshold && i > focusHistory.length * 0.3) {
    // Found where focus dropped below 70% of peak
    // Must be after first 30% of session (avoid false positives)
    focusDecayTime = i * timePerSample  // Calculate exact time
    break
  }
}
```

**Example**:
```
Time:     0min   5min   10min  15min  20min
Focus:    85%    82%    75%    68%    60%
Peak:     85%
Decay:    70% = 59.5% threshold
Detect:   At 15min (68% < 59.5% is false, but 60% < 59.5% at 20min)

Actually: Looking backwards from end:
  - 60% < 59.5%? No (still above threshold)
  - Wait for more data, or check when it first dropped
  
Better algorithm: Find where it crossed from >70% to <70%
```

### Step 11: Calculate Optimal Duration
```typescript
// Line 101-113: Determine optimal session length
if (averageFocus > 80 && focusDecayTime > timeElapsed * 0.8) {
  // Excellent: Can handle 30-45 min sessions
  optimalDuration = Math.min(45, focusDecayTime / 60)
} else if (averageFocus > 60 && focusDecayTime > timeElapsed * 0.6) {
  // Good: Standard 20-25 min (Pomodoro)
  optimalDuration = 25
} else if (averageFocus > 40) {
  // Moderate: Shorten to 15-20 min
  optimalDuration = Math.max(15, Math.min(20, focusDecayTime / 60))
} else {
  // Low focus: Very short 10-15 min
  optimalDuration = Math.max(10, Math.min(15, 10))
}
```

---

## 🔄 Part 5: Real-Time Adaptation

### Step 12: Dynamic Timer Adjustment
```typescript
// Every 15 data points (~30 seconds), re-analyze
if (focusHistory.length % 15 === 0 && museConnected && pomodoroEnabled) {
  const optimized = getOptimizedTimer(profile, focusHistory, timer.timeElapsed)
  
  if (optimized.focusDuration !== currentDuration) {
    // Timer adapts mid-session if focus patterns change
    setDynamicFocusDuration(optimized.focusDuration)
  }
}
```

**Blending Logic**:
```typescript
// 60% weight on diagnosis recommendation, 40% on EEG patterns
const blendedDuration = Math.round(
  diagnosisDuration * 0.4 + 
  eegDuration * 0.6
)
```

---

## 📊 Summary Flow

```
Muse Headset (4 electrodes)
    ↓
Raw EEG voltages (256 Hz, microvolts)
    ↓
LSL Stream (Lab Streaming Layer)
    ↓
Backend Python (pylsl)
    ↓
Buffer 256 samples (~1 second)
    ↓
FFT (Fast Fourier Transform)
    ↓
Frequency Bands: Delta, Theta, Alpha, Beta, Gamma (% of total power)
    ↓
Beta/Alpha Ratio → Focus State (focused or distracted)
    ↓
Baseline Tracking → Individual calibration
    ↓
Alpha Spike Detection → Distraction alerts
    ↓
WebSocket → Frontend
    ↓
Focus History Array → Track over time
    ↓
Peak Detection + Decay Analysis → Find when focus drops
    ↓
Optimal Duration Calculation → Adaptive timer
```

---

## 🧠 The Science Behind It

### Beta Waves (13-30 Hz) - "Focus Signal"
- **When high**: Active thinking, problem-solving, sustained attention
- **Neuroscience**: Generated in frontal cortex during executive tasks
- **In ADHD**: Often lower baseline, harder to maintain

### Alpha Waves (8-13 Hz) - "Relaxation Signal"  
- **When high**: Relaxed wakefulness, eyes closed, mind-wandering
- **Neuroscience**: Generated in occipital/parietal cortex
- **In attention drops**: Alpha "spikes" indicate attention shift

### Why Ratio Works
- **Beta/Alpha > 1.2**: Brain is engaged, focused on task
- **Beta/Alpha < 1.0**: Brain is relaxed, potentially distracted
- **Calibration**: Adjusts threshold to individual's baseline

### Focus Decay Pattern
- **Sustained focus**: Beta stays high, Alpha stays low → Can work longer
- **Early decay**: Beta drops, Alpha rises quickly → Need shorter sessions
- **The system learns**: "User X can focus 15 min before attention drops"

---

This creates a **neuroadaptive** system that learns from your actual brain activity patterns and optimizes the Pomodoro timer to match your real focus capacity!
