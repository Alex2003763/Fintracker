import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';

export const THEMES = [
  { id: 'theme-light', name: 'Light' },
  { id: 'theme-dark-slate', name: 'Dark Slate' },
  { id: 'theme-dark-green', name: 'Dark Green' },
  { id: 'theme-dark-crimson', name: 'Dark Crimson' },
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