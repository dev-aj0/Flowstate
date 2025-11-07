// EEG Data Types
export interface EEGReading {
  timestamp: number;
  alpha: number;
  beta: number;
  gamma: number;
  delta: number;
  theta: number;
}

export interface FocusState {
  isFocused: boolean;
  confidence: number;
  alertTriggered: boolean;
}

export interface SessionData {
  id: string;
  name: string; // Add name field for session
  date: number;
  duration: number; // in seconds
  focusPercentage: number;
  distractionEvents: number;
  averageBeta: number;
  averageAlpha: number;
}

export interface UserProfile {
  name: string;
  diagnosis?: string;
  calibrated: boolean;
  focusThreshold: number;
  distractionThreshold: number;
}

export interface CalibrationData {
  focusBaseline: {
    beta: number;
    alpha: number;
  };
  distractionBaseline: {
    beta: number;
    alpha: number;
  };
}

export interface AppSettings {
  soundEnabled: boolean;
  alertStyle: 'popup' | 'flash' | 'chime' | 'all';
  mode: 'dark' | 'light';
  sessionDuration: number; // in minutes
  theme?: 'default' | 'ocean' | 'forest';
}