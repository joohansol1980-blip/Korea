import { useState, useEffect } from 'react';
import { AppSettings } from '../types';

const DEFAULT_SETTINGS: AppSettings = {
  supabaseUrl: 'https://lvxusbagwcovuxwfdxld.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2eHVzYmFnd2NvdnV4d2ZkeGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMDUxODYsImV4cCI6MjA4NjU4MTE4Nn0.Q6TgvcxBCK6WQn1x_00XXnYaMPUIZ3-Jv9vja7cRysI',
  geminiApiKey: '',
  useSupabase: true,
  enableSystemNotifications: false,
};

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Load Settings
    const savedSettings = localStorage.getItem('app_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      
      // Auto-fill defaults
      if (!parsed.supabaseUrl) parsed.supabaseUrl = DEFAULT_SETTINGS.supabaseUrl;
      if (!parsed.supabaseKey) parsed.supabaseKey = DEFAULT_SETTINGS.supabaseKey;
      if (parsed.useSupabase === undefined) parsed.useSupabase = true;
      if (parsed.enableSystemNotifications === undefined) parsed.enableSystemNotifications = false;

      setSettings(parsed);
    } else {
      setSettings(DEFAULT_SETTINGS);
    }

    // Load Theme (default: light mode)
    if (localStorage.theme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  };

  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('app_settings', JSON.stringify(newSettings));
  };

  return {
    settings,
    isSettingsOpen,
    setIsSettingsOpen,
    isDarkMode,
    toggleTheme,
    saveSettings
  };
};