'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const settings = useSettingsStore((state) => state.settings);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--game-bg', settings.themeBgColor);
    root.style.setProperty('--game-accent', settings.themeAccentColor);
    root.style.setProperty('--game-target', settings.themeTargetColor);
    root.style.setProperty('--game-hit', settings.themeHitColor);
    root.style.setProperty('--game-ui', settings.themeUiColor);
    root.style.setProperty('--game-crosshair', settings.themeCrosshairColor);
  }, [settings]);

  return <>{children}</>;
}
