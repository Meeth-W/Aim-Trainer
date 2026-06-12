import { create } from 'zustand';

export interface UserSettings {
  valorantSensitivity: number;
  dpi: number;
  pollingRate: number;
  mouseAcceleration: boolean;
  mouseAccelExponent: number;
  rawInput: boolean;
  
  themeBgColor: string;
  themeAccentColor: string;
  themeTargetColor: string;
  themeHitColor: string;
  themeUiColor: string;
  themeCrosshairColor: string;
  
  crosshairCode: string;
}

interface SettingsState {
  settings: UserSettings;
  isLoading: boolean;
  initialized: boolean;
  setSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  setSettings: (settings: Partial<UserSettings>) => void;
  loadSettings: () => Promise<void>;
  saveSettings: (settings: Partial<UserSettings>) => Promise<void>;
  resetToDefault: () => Promise<void>;
}

export const DEFAULT_SETTINGS: UserSettings = {
  valorantSensitivity: 0.35,
  dpi: 1600,
  pollingRate: 1000,
  mouseAcceleration: false,
  mouseAccelExponent: 1.05,
  rawInput: true,
  themeBgColor: '#09090b',
  themeAccentColor: '#06b6d4',
  themeTargetColor: '#f43f5e',
  themeHitColor: '#10b981',
  themeUiColor: '#f4f4f5',
  themeCrosshairColor: '#00ff00',
  crosshairCode: '0;p;0;c;1;s;1;P;c;8;u;6E92FFFF;b;1;f;0;0t;1;0l;2;0v;2;0o;2;0a;1;0f;0;1b;0',
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  initialized: false,
  
  setSetting: (key, value) => {
    set((state) => {
      const newSettings = { ...state.settings, [key]: value };
      // Apply theme CSS variables dynamically
      if (typeof window !== 'undefined') {
        const root = document.documentElement;
        if (key === 'themeBgColor') root.style.setProperty('--game-bg', value as string);
        if (key === 'themeAccentColor') root.style.setProperty('--game-accent', value as string);
        if (key === 'themeTargetColor') root.style.setProperty('--game-target', value as string);
        if (key === 'themeHitColor') root.style.setProperty('--game-hit', value as string);
        if (key === 'themeUiColor') root.style.setProperty('--game-ui', value as string);
        if (key === 'themeCrosshairColor') root.style.setProperty('--game-crosshair', value as string);
      }
      return { settings: newSettings };
    });
  },

  setSettings: (newSettings) => {
    set((state) => {
      const merged = { ...state.settings, ...newSettings };
      if (typeof window !== 'undefined') {
        const root = document.documentElement;
        if (newSettings.themeBgColor) root.style.setProperty('--game-bg', newSettings.themeBgColor);
        if (newSettings.themeAccentColor) root.style.setProperty('--game-accent', newSettings.themeAccentColor);
        if (newSettings.themeTargetColor) root.style.setProperty('--game-target', newSettings.themeTargetColor);
        if (newSettings.themeHitColor) root.style.setProperty('--game-hit', newSettings.themeHitColor);
        if (newSettings.themeUiColor) root.style.setProperty('--game-ui', newSettings.themeUiColor);
        if (newSettings.themeCrosshairColor) root.style.setProperty('--game-crosshair', newSettings.themeCrosshairColor);
      }
      return { settings: merged };
    });
  },

  loadSettings: async () => {
    if (get().initialized) return;
    set({ isLoading: true });
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          get().setSettings(data);
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      set({ isLoading: false, initialized: true });
    }
  },

  saveSettings: async (updatedFields) => {
    get().setSettings(updatedFields);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(get().settings),
      });
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  },

  resetToDefault: async () => {
    set({ isLoading: true });
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(DEFAULT_SETTINGS),
      });
      get().setSettings(DEFAULT_SETTINGS);
    } catch (err) {
      console.error('Failed to reset settings:', err);
    } finally {
      set({ isLoading: false });
    }
  },
}));
