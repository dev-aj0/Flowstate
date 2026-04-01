"use client";

import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Bell, Moon, Sun, Clock, User, Bluetooth, Cpu, Watch } from 'lucide-react';
import { getSettings, saveSettings, getUserProfile, saveUserProfile, getCalibration } from '@/lib/storage';
import { AppSettings, CalibrationData, UserProfile } from '@/types';
import { CalibrationDialog } from '@/components/calibration-dialog';
import { CustomSelect } from '@/components/ui/custom-select';
import { Switch } from '@/components/ui/switch';
import { useEEGStream } from '@/hooks/use-eeg-stream';
import { wsManager } from '@/lib/websocket-manager';
import {
  connectArduinoSerial,
  disconnectArduinoSerial,
  isArduinoSerialConnected,
  isWebSerialSupported,
  sendArduinoVibrate,
} from '@/lib/arduino-serial';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [saved, setSaved] = useState(false);
  const [calibrationOpen, setCalibrationOpen] = useState(false);
  const [calibrationData, setCalibrationData] = useState<CalibrationData | null>(getCalibration());
  const { museConnected, connectionError } = useEEGStream(false);
  const [wristSerialConnected, setWristSerialConnected] = useState(false);
  const [wristSerialBusy, setWristSerialBusy] = useState(false);
  const [wristSerialError, setWristSerialError] = useState<string | null>(null);
  const [wristSimulateBusy, setWristSimulateBusy] = useState(false);
  const [wristBuzzFeedback, setWristBuzzFeedback] = useState<string | null>(null);

  useEffect(() => {
    setWristSerialConnected(isArduinoSerialConnected());
  }, []);

  // Apply initial mode on mount
  useEffect(() => {
    const currentSettings = getSettings();
    if (currentSettings.mode === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, []);

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
    
    // Apply mode immediately
    if (key === 'mode') {
      if (value === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
      // Trigger storage event for layout
      window.dispatchEvent(new Event('storage'));
    }
    
    // Apply theme preset immediately
    if (key === 'theme') {
      if (value && value !== 'default') {
        document.documentElement.setAttribute('data-theme', value);
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    }
    
    showSavedMessage();
  };

  const handleProfileChange = (key: string, value: any) => {
    const newProfile = { ...profile, [key]: value } as UserProfile;
    setProfile(newProfile);
    saveUserProfile(newProfile);
    showSavedMessage();
  };

  const showSavedMessage = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCalibrationComplete = (data: CalibrationData) => {
    setCalibrationData(data);
    const updatedProfile = getUserProfile();
    setProfile(updatedProfile);
    showSavedMessage();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-lg text-muted-foreground">Customize your focus coaching experience</p>
      </div>

      {/* Saved Indicator */}
      {saved && (
        <div className="fixed top-8 right-8 glass-card-strong px-6 py-3 rounded-lg border-[#22c55e]/50 animate-in fade-in slide-in-from-top-2">
          <p className="text-sm font-medium text-[#22c55e]">✓ Settings saved</p>
        </div>
      )}

      {/* Profile Settings */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-[#3b82f6]" />
          <h2 className="text-xl font-semibold">Profile</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={profile?.name || ''}
              onChange={(e) => handleProfileChange('name', e.target.value)}
              className="w-full px-4 py-3 rounded-lg glass-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Diagnosis (Optional)
            </label>
            <CustomSelect
              value={profile?.diagnosis || ''}
              onChange={(value) => handleProfileChange('diagnosis', value)}
              placeholder="Select diagnosis..."
              options={[
                { value: '', label: 'None' },
                { value: 'adhd', label: 'ADHD' },
                { value: 'anxiety', label: 'Anxiety' },
                { value: 'both', label: 'ADHD + Anxiety' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Optional: Self-report if you have a condition to optimize timer settings (not for diagnosis)
            </p>
          </div>
        </div>
      </div>

      {/* Device / Mock data */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Cpu className="w-5 h-5 text-[#3b82f6]" />
          <h2 className="text-xl font-semibold">Device</h2>
        </div>
        <div className="flex items-center justify-between p-4 rounded-lg glass-card-strong">
          <div>
            <p className="font-medium">Use mock data</p>
            <p className="text-sm text-muted-foreground">
              Simulate brainwave data when no Muse headset is connected
            </p>
          </div>
          <Switch
            checked={!!settings.useMockData}
            onCheckedChange={(checked) => {
              const newSettings = { ...settings, useMockData: checked };
              setSettings(newSettings);
              saveSettings(newSettings);
              wsManager.send({ type: 'set_mock_mode', enabled: checked });
              showSavedMessage();
            }}
          />
        </div>
      </div>

      {/* Session Settings */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-5 h-5 text-[#3b82f6]" />
          <h2 className="text-xl font-semibold">Session</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Default Session Duration
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[15, 25, 45, 60].map((duration) => (
                <button
                  key={duration}
                  onClick={() => handleSettingChange('sessionDuration', duration)}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                    settings.sessionDuration === duration
                      ? 'bg-[#3b82f6] text-white'
                      : 'glass-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {duration}m
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Alert Settings */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 text-[#3b82f6]" />
          <h2 className="text-xl font-semibold">Alerts</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg glass-card-strong">
            <div>
              <p className="font-medium">Sound Alerts</p>
              <p className="text-sm text-muted-foreground">Play audio when distraction detected</p>
            </div>
            <button
              onClick={() => handleSettingChange('soundEnabled', !settings.soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                settings.soundEnabled ? 'bg-[#3b82f6] text-white' : 'glass-card text-muted-foreground'
              }`}
            >
              {settings.soundEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Alert Style</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'popup', label: 'Popup Only' },
                { value: 'chime', label: 'Sound Only' },
                { value: 'flash', label: 'Screen Flash' },
                { value: 'all', label: 'All Alerts' },
              ].map((style) => (
                <button
                  key={style.value}
                  onClick={() => handleSettingChange('alertStyle', style.value)}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                    settings.alertStyle === style.value
                      ? 'bg-[#3b82f6] text-white'
                      : 'glass-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg glass-card-strong overflow-hidden">
            <div className="flex items-center justify-between p-4 gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <Watch className="w-5 h-5 text-[#3b82f6] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Wrist vibration (Seeed XIAO)</p>
                  <p className="text-sm text-muted-foreground">
                    USB serial buzz when focus drops and the distraction alert fires (same as the on-screen alert).
                  </p>
                </div>
              </div>
              <Switch
                checked={!!settings.wristBandEnabled}
                onCheckedChange={(checked) => handleSettingChange('wristBandEnabled', checked)}
              />
            </div>
            {settings.wristBandEnabled && (
              <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-4">
                {!isWebSerialSupported() ? (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Web Serial needs Chrome or Edge on desktop. It is not available in Safari or Firefox.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={wristSerialBusy || wristSerialConnected}
                        onClick={async () => {
                          setWristSerialBusy(true);
                          setWristSerialError(null);
                          setWristBuzzFeedback(null);
                          try {
                            await connectArduinoSerial();
                            setWristSerialConnected(true);
                            showSavedMessage();
                          } catch (e) {
                            setWristSerialError(e instanceof Error ? e.message : 'Could not connect');
                          } finally {
                            setWristSerialBusy(false);
                          }
                        }}
                        className="min-h-10 px-4 py-2 rounded-lg text-sm font-medium bg-[#3b82f6] text-white cursor-pointer select-none transition active:scale-[0.98] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
                      >
                        {wristSerialBusy ? 'Connecting…' : 'Connect USB device'}
                      </button>
                      <button
                        type="button"
                        disabled={wristSerialBusy || !wristSerialConnected}
                        onClick={async () => {
                          setWristSerialBusy(true);
                          setWristSerialError(null);
                          setWristBuzzFeedback(null);
                          try {
                            await disconnectArduinoSerial();
                            setWristSerialConnected(false);
                            showSavedMessage();
                          } catch (e) {
                            setWristSerialError(e instanceof Error ? e.message : 'Disconnect failed');
                          } finally {
                            setWristSerialBusy(false);
                          }
                        }}
                        className="min-h-10 px-4 py-2 rounded-lg text-sm font-medium glass-card text-foreground cursor-pointer select-none transition active:scale-[0.98] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Disconnect
                      </button>
                      <button
                        type="button"
                        disabled={wristSerialBusy || wristSimulateBusy}
                        onClick={async () => {
                          setWristSerialError(null);
                          setWristBuzzFeedback(null);
                          setWristSimulateBusy(true);
                          try {
                            await sendArduinoVibrate();
                            setWristBuzzFeedback(
                              `Buzz command sent at ${new Date().toLocaleTimeString()} — you should feel one pulse.`
                            );
                            showSavedMessage();
                          } catch (e) {
                            setWristSerialError(e instanceof Error ? e.message : 'Test failed');
                          } finally {
                            setWristSimulateBusy(false);
                          }
                        }}
                        className="min-h-10 px-4 py-2 rounded-lg text-sm font-semibold bg-[#22c55e]/20 border-2 border-[#22c55e]/50 text-foreground cursor-pointer select-none transition shadow-sm active:scale-[0.98] hover:bg-[#22c55e]/30 hover:border-[#22c55e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60 disabled:cursor-wait"
                      >
                        {wristSimulateBusy ? 'Sending…' : 'Simulate distraction alert'}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Plug in the XIAO, upload the sketch, then click <strong className="text-foreground">Connect USB device</strong> here — that is separate from Arduino IDE. Close Arduino IDE (or Serial Monitor) before connecting in the browser, or the COM port will be busy. Pick the same board in the browser popup.
                    </p>
                    {wristSerialConnected && (
                      <p className="text-sm text-[#22c55e]">Serial link ready — wrist buzz will match session alerts.</p>
                    )}
                    {!wristSerialConnected && settings.wristBandEnabled && isWebSerialSupported() && (
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        Click <strong className="text-foreground">Connect USB device</strong> first — the green button only works after the browser has the port.
                      </p>
                    )}
                    {wristBuzzFeedback && (
                      <p className="text-sm font-medium text-[#22c55e] border border-[#22c55e]/40 rounded-lg px-3 py-2 bg-[#22c55e]/10">
                        {wristBuzzFeedback}
                      </p>
                    )}
                    {wristSerialError && (
                      <p className="text-sm text-destructive border border-destructive/30 rounded-lg px-3 py-2">{wristSerialError}</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          {settings.mode === 'light' ? (
            <Sun className="w-5 h-5 text-[#3b82f6]" />
          ) : (
            <Moon className="w-5 h-5 text-[#3b82f6]" />
          )}
          <h2 className="text-xl font-semibold">Appearance</h2>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg glass-card-strong">
          <div>
            <p className="font-medium">Light Mode</p>
            <p className="text-sm text-muted-foreground">Switch between dark and light theme</p>
          </div>
          <button
            onClick={() => handleSettingChange('mode', settings.mode === 'dark' ? 'light' : 'dark')}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              settings.mode === 'light' ? 'bg-[#3b82f6]' : 'bg-white/20'
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                settings.mode === 'light' ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Theme Presets */}
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Theme Preset</p>
          <div className="grid grid-cols-3 gap-3">
            {([
              { key: 'default', label: 'Default' },
              { key: 'ocean', label: 'Ocean' },
              { key: 'forest', label: 'Forest' },
            ] as const).map(preset => (
              <button
                key={preset.key}
                onClick={() => handleSettingChange('theme', preset.key as any)}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  (settings.theme || 'default') === preset.key
                    ? 'bg-[#3b82f6] text-white'
                    : 'glass-card text-muted-foreground hover:text-foreground'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Presets subtly adjust primary and accent hues.</p>
        </div>
      </div>

      {/* Device Settings */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bluetooth className="w-5 h-5 text-[#3b82f6]" />
          <h2 className="text-xl font-semibold">Device</h2>
        </div>

        <div className="space-y-4">
          <div className={`flex items-center justify-between p-4 rounded-lg border ${
            museConnected 
              ? 'bg-[#22c55e]/10 border-[#22c55e]/20' 
              : 'bg-[#f97316]/10 border-[#f97316]/20'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${museConnected ? 'bg-[#22c55e] animate-pulse' : 'bg-[#f97316]'}`} />
              <div>
                <p className="font-medium">Muse 2 Headset</p>
                <p className="text-sm text-muted-foreground">
                  {museConnected ? 'Connected via Bluetooth' : ''}
                </p>
              </div>
            </div>
            {connectionError && (
              <div className="text-xs text-[#f97316] max-w-xs text-right">
                {connectionError}
              </div>
            )}
          </div>

          <div className="p-4 rounded-lg glass-card-strong">
            <h3 className="text-sm font-medium mb-2">Device Guidelines</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Ensure headset is properly positioned on your head</li>
              <li>• Keep sensors clean for accurate readings</li>
              <li>• Battery should be charged before sessions</li>
              <li>• Avoid excessive movement during readings</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Calibration */}
      <div className="glass-card p-6 bg-[#3b82f6]/5 border-[#3b82f6]/20">
        <h3 className="text-lg font-semibold mb-4">⚙️ Calibration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Personalize distraction alerts with a guided focus + relaxation calibration. Run it anytime you feel your
          thresholds need a refresh.
        </p>
        <div className="space-y-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Status</span>
            <span className={`font-semibold ${profile.calibrated ? 'text-[#22c55e]' : 'text-[#f97316]'}`}>
              {profile.calibrated ? 'Calibrated' : 'Not calibrated'}
            </span>
          </div>
          {calibrationData?.thresholds && (
            <div className="grid grid-cols-2 gap-3 mt-2 text-[11px] text-muted-foreground">
              <div className="p-3 rounded-lg glass-card-strong">
                <p className="font-medium text-foreground mb-1">Focus baseline</p>
                <p>β: {calibrationData.focusBaseline.beta.toFixed(1)}</p>
                <p>α: {calibrationData.focusBaseline.alpha.toFixed(1)}</p>
              </div>
              <div className="p-3 rounded-lg glass-card-strong">
                <p className="font-medium text-foreground mb-1">Relax baseline</p>
                <p>β: {calibrationData.distractionBaseline.beta.toFixed(1)}</p>
                <p>α: {calibrationData.distractionBaseline.alpha.toFixed(1)}</p>
              </div>
              <div className="p-3 rounded-lg glass-card-strong col-span-2">
                <p className="font-medium text-foreground mb-1">Detection threshold</p>
                <p>β/α ≥ {(calibrationData.thresholds?.ratioThreshold ?? profile.focusThreshold ?? 1.2).toFixed(3)}</p>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => setCalibrationOpen(true)}
          className="mt-4 px-6 py-3 rounded-lg bg-[#3b82f6] text-white font-medium hover:opacity-90 transition-opacity"
        >
          Start Calibration
        </button>
      </div>

      <CalibrationDialog
        open={calibrationOpen}
        onOpenChange={setCalibrationOpen}
        onComplete={handleCalibrationComplete}
      />
    </div>
  );
}