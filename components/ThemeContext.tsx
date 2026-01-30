import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';

export type ThemeCategory = 'light' | 'dark';

export interface Theme {
  id: string;
  name: string;
  category: ThemeCategory;
  accentColor: string;
}

export const THEMES: Theme[] = [
  // Light themes
  { id: 'theme-light', name: 'Light', category: 'light', accentColor: '#3b82f6' },
  { id: 'theme-light-rose', name: 'Rose', category: 'light', accentColor: '#f43f5e' },
  { id: 'theme-light-mint', name: 'Mint', category: 'light', accentColor: '#10b981' },
  { id: 'theme-light-amber', name: 'Amber', category: 'light', accentColor: '#f59e0b' },
  { id: 'theme-light-violet', name: 'Violet', category: 'light', accentColor: '#8b5cf6' },
  { id: 'theme-light-sky', name: 'Sky', category: 'light', accentColor: '#0ea5e9' },
  { id: 'theme-light-coral', name: 'Coral', category: 'light', accentColor: '#f97316' },
  // Dark themes
  { id: 'theme-dark-slate', name: 'Slate', category: 'dark', accentColor: '#3b82f6' },
  { id: 'theme-dark-green', name: 'Forest', category: 'dark', accentColor: '#10b981' },
  { id: 'theme-dark-crimson', name: 'Crimson', category: 'dark', accentColor: '#f43f5e' },
  { id: 'theme-dark-purple', name: 'Purple', category: 'dark', accentColor: '#a855f7' },
  { id: 'theme-dark-ocean', name: 'Ocean', category: 'dark', accentColor: '#06b6d4' },
  { id: 'theme-dark-amber', name: 'Gold', category: 'dark', accentColor: '#f59e0b' },
  { id: 'theme-dark-pink', name: 'Pink', category: 'dark', accentColor: '#ec4899' },
  { id: 'theme-dark-lime', name: 'Lime', category: 'dark', accentColor: '#84cc16' },
  { id: 'theme-amoled', name: 'AMOLED Black', category: 'dark', accentColor: '#3b82f6' },
];

interface ThemeContextType {
  theme: string;
  setTheme: (themeId: string) => void;
  customBackground: string | null;
  setCustomBackground: (backgroundUrl: string | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<string>(() => {
    if (typeof window === 'undefined' || !window.localStorage) return 'theme-light';
    // Migration: Check for old key first
    const oldTheme = localStorage.getItem('financeFlowTheme');
    if (oldTheme && THEMES.some(t => t.id === oldTheme)) {
      // Migrate to new key
      localStorage.setItem('fintrackTheme', oldTheme);
      localStorage.removeItem('financeFlowTheme');
      return oldTheme;
    }
    const storedTheme = localStorage.getItem('fintrackTheme');
    if (storedTheme && THEMES.some(t => t.id === storedTheme)) return storedTheme;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'theme-dark-slate';
    return 'theme-light';
  });

  const [customBackground, setCustomBackground] = useState<string | null>(() => {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    // Migration: Check for old key first
    const oldBackground = localStorage.getItem('financeFlowCustomBackground');
    if (oldBackground) {
      // Migrate to new key
      localStorage.setItem('fintrackCustomBackground', oldBackground);
      localStorage.removeItem('financeFlowCustomBackground');
      return oldBackground;
    }
    return localStorage.getItem('fintrackCustomBackground') || null;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.className = theme;
    localStorage.setItem('fintrackTheme', theme);
  }, [theme]);

  useEffect(() => {
    if (customBackground) {
      localStorage.setItem('fintrackCustomBackground', customBackground);
    } else {
      localStorage.removeItem('fintrackCustomBackground');
    }
  }, [customBackground]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    customBackground,
    setCustomBackground
  }), [theme, customBackground]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};