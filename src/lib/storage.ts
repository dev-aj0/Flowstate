"use client";

import { SessionData, UserProfile, AppSettings, CalibrationData } from '@/types';

const STORAGE_KEYS = {
  USER_PROFILE: 'neuro_coach_user_profile',
  SESSIONS: 'neuro_coach_sessions',
  SETTINGS: 'neuro_coach_settings',
  CALIBRATION: 'neuro_coach_calibration',
};

// Defaults
const defaultProfile: UserProfile = {
  name: '',
  calibrated: false,
  focusThreshold: 1.2,
  distractionThreshold: 0.9,
};

const defaultSettings: AppSettings = {
  soundEnabled: true,
  alertStyle: 'all',
  mode: 'dark',
  sessionDuration: 25,
  theme: 'default',
};

// User Profile
export function getUserProfile(): UserProfile {
  if (typeof window === 'undefined') return { ...defaultProfile };
  const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
  if (!data) {
    return { ...defaultProfile };
  }
  try {
    const parsed = JSON.parse(data);
    return { ...defaultProfile, ...parsed };
  } catch (error) {
    console.warn('Failed to parse stored user profile. Resetting to defaults.', error);
    return { ...defaultProfile };
  }
}

export function saveUserProfile(profile: Partial<UserProfile>) {
  if (typeof window === 'undefined') return;
  const merged = { ...defaultProfile, ...(profile || {}) };
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(merged));
}

// Sessions
export function getSessions(): SessionData[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  return data ? JSON.parse(data) : [];
}

export function addSession(session: SessionData) {
  if (typeof window === 'undefined') return;
  const sessions = getSessions();
  sessions.push(session);
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
}

export function updateSession(sessionId: string, updates: Partial<SessionData>) {
  if (typeof window === 'undefined') return;
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === sessionId);
  if (index !== -1) {
    sessions[index] = { ...sessions[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }
}

export function deleteSession(sessionId: string) {
  if (typeof window === 'undefined') return;
  const sessions = getSessions();
  const filtered = sessions.filter(s => s.id !== sessionId);
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(filtered));
}

export function clearSessions() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.SESSIONS);
}

// Settings
export function getSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return { ...defaultSettings };
  }
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!data) {
    return { ...defaultSettings };
  }
  try {
    return { ...defaultSettings, ...JSON.parse(data) };
  } catch (error) {
    console.warn('Failed to parse settings. Resetting to defaults.', error);
    return { ...defaultSettings };
  }
}

export function saveSettings(settings: AppSettings) {
  if (typeof window === 'undefined') return;
  const merged = { ...defaultSettings, ...settings };
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
}

// Calibration
export function getCalibration(): CalibrationData | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEYS.CALIBRATION);
  return data ? JSON.parse(data) : null;
}

export function saveCalibration(calibration: CalibrationData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CALIBRATION, JSON.stringify(calibration));
}