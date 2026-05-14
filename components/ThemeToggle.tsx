'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type ThemePreference = 'system' | 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'tutovera-theme';
const THEME_EVENT = 'tutovera-theme-change';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === 'system' ? getSystemTheme() : preference;
}

function applyResolvedTheme(theme: ResolvedTheme) {
  if (typeof document === 'undefined') return;

  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
  document.body?.setAttribute('data-theme', theme);
}

function getSavedPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    return saved;
  }

  return 'system';
}

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [preference, setPreference] = useState<ThemePreference>('system');
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const savedPreference = getSavedPreference();
    setPreference(savedPreference);
    applyResolvedTheme(resolveTheme(savedPreference));
    setMounted(true);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');

    function handleSystemChange() {
      const currentPreference = getSavedPreference();
      if (currentPreference === 'system') {
        applyResolvedTheme(getSystemTheme());
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;

      const nextPreference = getSavedPreference();
      setPreference(nextPreference);
      applyResolvedTheme(resolveTheme(nextPreference));
    }

    function handleThemeEvent() {
      const nextPreference = getSavedPreference();
      setPreference(nextPreference);
      applyResolvedTheme(resolveTheme(nextPreference));
    }

    mediaQuery.addEventListener('change', handleSystemChange);
    window.addEventListener('storage', handleStorage);
    window.addEventListener(THEME_EVENT, handleThemeEvent);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(THEME_EVENT, handleThemeEvent);
    };
  }, []);

  async function savePreferenceToSupabase(nextPreference: ThemePreference) {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) return;

      const nextMetadata = {
        ...(user.user_metadata || {}),
        preferences: {
          ...(user.user_metadata?.preferences || {}),
          themePreference: nextPreference
        }
      };

      await supabase.auth.updateUser({
        data: nextMetadata
      });
    } catch {
      // local theme change should still work even if account save fails
    }
  }

  function setThemePreference(nextPreference: ThemePreference) {
    setPreference(nextPreference);
    window.localStorage.setItem(STORAGE_KEY, nextPreference);

    const resolved = resolveTheme(nextPreference);

    applyResolvedTheme(resolved);

    requestAnimationFrame(() => {
      applyResolvedTheme(resolved);
    });

    window.dispatchEvent(new Event(THEME_EVENT));
    void savePreferenceToSupabase(nextPreference);
  }

  const options: Array<{ value: ThemePreference; label: string }> = useMemo(
    () => [
      { value: 'system', label: 'System' },
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' }
    ],
    []
  );

  if (!mounted) {
    return (
      <div
        style={{
          display: 'grid',
          gap: 8
        }}
      >
        <p className="small" style={{ margin: 0 }}>
          <strong>Theme</strong>
        </p>

        <div className="themeSwitcher" role="group" aria-label="Theme selection">
          {options.map((option) => (
            <button key={option.value} type="button" className="themeOption">
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gap: 8
      }}
    >
      <p className="small" style={{ margin: 0 }}>
        <strong>Theme</strong>
      </p>

      <div className="themeSwitcher" role="group" aria-label="Theme selection">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setThemePreference(option.value)}
            className={preference === option.value ? 'themeOption active' : 'themeOption'}
            aria-pressed={preference === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}