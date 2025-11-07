"use client";

import { SessionData, UserProfile, AppSettings, CalibrationData } from '@/types';

const STORAGE_KEYS = {
  USER_PROFILE: 'neuro_coach_user_profile',
  SESSIONS: 'neuro_coach_sessions',
  SETTINGS: 'neuro_coach_settings',
  CALIBRATION: 'neuro_coach_calibration',
};

// User Profile
export function getUserProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
  return data ? JSON.parse(data) : null;
}

export function saveUserProfile(profile: UserProfile) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
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
    return {
      soundEnabled: true,
      alertStyle: 'all',
      mode: 'dark',
      sessionDuration: 25,
      theme: 'default',
    };
  }
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return data ? JSON.parse(data) : {
    soundEnabled: true,
    alertStyle: 'all',
    mode: 'dark',
    sessionDuration: 25,
    theme: 'default',
  };
}

export function saveSettings(settings: AppSettings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
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