import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/tauri-api';

// Check if running in Tauri
const isElectron = typeof window !== 'undefined' && api?.settings;

/**
 * Custom hook for managing settings with electron-store or localStorage fallback
 * @param key - Setting key
 * @param defaultValue - Default value if setting doesn't exist
 */
export function useSettings<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load setting on mount
  useEffect(() => {
    const loadSetting = async () => {
      try {
        setLoading(true);
        setError(null);

        if (isElectron) {
          // Use electron-store in Electron
          const stored = await api.settings.get<T>(key);
          if (stored !== null && stored !== undefined) {
            setValue(stored);
          } else {
            setValue(defaultValue);
          }
        } else {
          // Fallback to localStorage for web
          const stored = localStorage.getItem(key);
          if (stored) {
            try {
              setValue(JSON.parse(stored));
            } catch {
              setValue(stored as T);
            }
          } else {
            setValue(defaultValue);
          }
        }
      } catch (err) {
        console.error(`Failed to load setting ${key}:`, err);
        setError(err instanceof Error ? err : new Error('Failed to load setting'));
        setValue(defaultValue);
      } finally {
        setLoading(false);
      }
    };

    loadSetting();
  }, [key, defaultValue]);

  // Save setting
  const setSetting = useCallback(
    async (newValue: T) => {
      try {
        setError(null);

        if (isElectron) {
          // Use electron-store in Electron
          await api.settings.set(key, newValue);
          setValue(newValue);
        } else {
          // Fallback to localStorage for web
          const serialized = typeof newValue === 'string' ? newValue : JSON.stringify(newValue);
          localStorage.setItem(key, serialized);
          setValue(newValue);
        }
      } catch (err) {
        console.error(`Failed to save setting ${key}:`, err);
        setError(err instanceof Error ? err : new Error('Failed to save setting'));
        throw err;
      }
    },
    [key]
  );

  // Delete setting
  const deleteSetting = useCallback(async () => {
    try {
      setError(null);

      if (isElectron) {
        // Use electron-store in Electron
        await api.settings.delete(key);
      } else {
        // Fallback to localStorage for web
        localStorage.removeItem(key);
      }
      setValue(defaultValue);
    } catch (err) {
      console.error(`Failed to delete setting ${key}:`, err);
      setError(err instanceof Error ? err : new Error('Failed to delete setting'));
      throw err;
    }
  }, [key, defaultValue]);

  return {
    value,
    setValue: setSetting,
    deleteSetting,
    loading,
    error,
  };
}

/**
 * Hook for getting all settings
 */
export function useAllSettings() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);

        if (isElectron) {
          const all = await api.settings.getAll();
          setSettings(all);
        } else {
          // Fallback: get all from localStorage
          const all: Record<string, any> = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
              const value = localStorage.getItem(key);
              if (value) {
                try {
                  all[key] = JSON.parse(value);
                } catch {
                  all[key] = value;
                }
              }
            }
          }
          setSettings(all);
        }
      } catch (err) {
        console.error('Failed to load all settings:', err);
        setError(err instanceof Error ? err : new Error('Failed to load settings'));
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const resetSettings = useCallback(async () => {
    try {
      setError(null);

      if (isElectron) {
        await api.settings.reset();
        const all = await api.settings.getAll();
        setSettings(all);
      } else {
        localStorage.clear();
        setSettings({});
      }
    } catch (err) {
      console.error('Failed to reset settings:', err);
      setError(err instanceof Error ? err : new Error('Failed to reset settings'));
      throw err;
    }
  }, []);

  return {
    settings,
    resetSettings,
    loading,
    error,
  };
}
