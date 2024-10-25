'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light' | 'foodie';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => null,
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const themes = {
  dark: {
    background: 'from-space-800 to-space-900',
    card: 'bg-space-800/50',
    text: 'text-gray-100',
    accent: 'cyber-primary',
    border: 'border-space-700',
  },
  light: {
    background: 'from-gray-50 to-white',
    card: 'bg-white',
    text: 'text-gray-900',
    accent: 'emerald-500',
    border: 'border-gray-200',
  },
  foodie: {
    background: 'from-orange-50 to-red-50',
    card: 'bg-white/80',
    text: 'text-orange-900',
    accent: 'orange-500',
    border: 'border-orange-200',
  },
} as const;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    // Get theme from localStorage on mount
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && Object.keys(themes).includes(savedTheme)) {
      setTheme(savedTheme);
      document.documentElement.classList.add(`theme-${savedTheme}`);
    }
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update root classes
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-light', 'theme-foodie');
    root.classList.add(`theme-${newTheme}`);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleThemeChange }}>
      {children}
    </ThemeContext.Provider>
  );
}