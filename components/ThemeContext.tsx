import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';

export const THEMES = [
  { id: 'theme-light', name: 'Light' },
  { id: 'theme-dark-slate', name: 'Dark Slate' },
  { id: 'theme-dark-blue', name: 'Dark Blue' },
  { id: 'theme-dark-crimson', name: 'Dark Crimson' },
];

interface ThemeContextType {
  theme: string;
  setTheme: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<string>(() => {
    if (typeof window === 'undefined' || !window.localStorage) return 'theme-light';
    const storedTheme = localStorage.getItem('financeFlowTheme');
    if (storedTheme && THEMES.some(t => t.id === storedTheme)) return storedTheme;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'theme-dark-slate';
    return 'theme-light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.className = theme;
    localStorage.setItem('financeFlowTheme', theme);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

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