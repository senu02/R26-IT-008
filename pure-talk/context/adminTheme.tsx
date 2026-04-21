// app/admin/dashboard/adminTheme.ts
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'space';

export interface ThemeColors {
  primary: {
    main: string;
    light: string;
    dark: string;
    contrast: string;
  };
  secondary: {
    main: string;
    light: string;
    dark: string;
    contrast: string;
  };
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  surface: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
    inverse: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    disabled: string;
    inverse: string;
  };
  border: {
    primary: string;
    secondary: string;
    light: string;
  };
  status: {
    success: string;
    error: string;
    warning: string;
    info: string;
  };
  accent: {
    indigo: string;
    emerald: string;
    rose: string;
    amber: string;
    purple: string;
    cyan: string;
    slate: string;
  };
  chart: {
    primary: string;
    secondary: string;
    tertiary: string;
    quaternary: string;
    quinary: string;
    grid: string;
    text: string;
  };
  gradient: {
    primary: string;
    secondary: string;
    banner: string;
  };
  space?: {
    nebula: string;
    star: string;
    galaxy: string;
    aurora: string;
  };
}

export const lightTheme: ThemeColors = {
  primary: {
    main: '#6366f1',
    light: '#818cf8',
    dark: '#4f46e5',
    contrast: '#ffffff',
  },
  secondary: {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
    contrast: '#ffffff',
  },
  background: {
    primary: '#f8fafc',
    secondary: '#ffffff',
    tertiary: '#f1f5f9',
    inverse: '#0f172a',
  },
  surface: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    elevated: '#ffffff',
    inverse: '#1e293b',
  },
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#94a3b8',
    disabled: '#cbd5e1',
    inverse: '#f8fafc',
  },
  border: {
    primary: '#e2e8f0',
    secondary: '#cbd5e1',
    light: '#f1f5f9',
  },
  status: {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
  accent: {
    indigo: '#6366f1',
    emerald: '#10b981',
    rose: '#f43f5e',
    amber: '#f59e0b',
    purple: '#a855f7',
    cyan: '#06b6d4',
    slate: '#64748b',
  },
  chart: {
    primary: '#6366f1',
    secondary: '#10b981',
    tertiary: '#f59e0b',
    quaternary: '#ec4899',
    quinary: '#8b5cf6',
    grid: '#e2e8f0',
    text: '#64748b',
  },
  gradient: {
    primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    secondary: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    banner: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
  },
};

export const darkTheme: ThemeColors = {
  primary: {
    main: '#818cf8',
    light: '#a5b4fc',
    dark: '#6366f1',
    contrast: '#0f172a',
  },
  secondary: {
    main: '#34d399',
    light: '#6ee7b7',
    dark: '#10b981',
    contrast: '#0f172a',
  },
  background: {
    primary: '#0f172a',
    secondary: '#1e293b',
    tertiary: '#334155',
    inverse: '#f8fafc',
  },
  surface: {
    primary: '#1e293b',
    secondary: '#334155',
    tertiary: '#475569',
    elevated: '#1e293b',
    inverse: '#ffffff',
  },
  text: {
    primary: '#f8fafc',
    secondary: '#cbd5e1',
    tertiary: '#94a3b8',
    disabled: '#64748b',
    inverse: '#0f172a',
  },
  border: {
    primary: '#334155',
    secondary: '#475569',
    light: '#1e293b',
  },
  status: {
    success: '#34d399',
    error: '#f87171',
    warning: '#fbbf24',
    info: '#60a5fa',
  },
  accent: {
    indigo: '#818cf8',
    emerald: '#34d399',
    rose: '#fb7185',
    amber: '#fbbf24',
    purple: '#c084fc',
    cyan: '#22d3ee',
    slate: '#94a3b8',
  },
  chart: {
    primary: '#818cf8',
    secondary: '#34d399',
    tertiary: '#fbbf24',
    quaternary: '#fb7185',
    quinary: '#c084fc',
    grid: '#334155',
    text: '#94a3b8',
  },
  gradient: {
    primary: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)',
    secondary: 'linear-gradient(135deg, #34d399 0%, #6ee7b7 100%)',
    banner: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)',
  },
};

export const spaceTheme: ThemeColors = {
  primary: {
    main: '#8b5cf6',
    light: '#a78bfa',
    dark: '#7c3aed',
    contrast: '#ffffff',
  },
  secondary: {
    main: '#06b6d4',
    light: '#22d3ee',
    dark: '#0891b2',
    contrast: '#ffffff',
  },
  background: {
    primary: '#050b14',
    secondary: '#0a1628',
    tertiary: '#0f1a2f',
    inverse: '#f8fafc',
  },
  surface: {
    primary: '#0d1425',
    secondary: '#131c2f',
    tertiary: '#1a253d',
    elevated: '#111a2e',
    inverse: '#ffffff',
  },
  text: {
    primary: '#f0f3fa',
    secondary: '#9ca3d0',
    tertiary: '#6b7280',
    disabled: '#4a5568',
    inverse: '#0f172a',
  },
  border: {
    primary: '#1a2542',
    secondary: '#2a3552',
    light: '#111a30',
  },
  status: {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
  accent: {
    indigo: '#818cf8',
    emerald: '#34d399',
    rose: '#f43f5e',
    amber: '#fbbf24',
    purple: '#c084fc',
    cyan: '#22d3ee',
    slate: '#94a3b8',
  },
  chart: {
    primary: '#8b5cf6',
    secondary: '#06b6d4',
    tertiary: '#ec4899',
    quaternary: '#f59e0b',
    quinary: '#a855f7',
    grid: '#1a2542',
    text: '#9ca3d0',
  },
  gradient: {
    primary: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
    secondary: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    banner: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  },
  space: {
    nebula: '#7c3aed',
    star: '#fbbf24',
    galaxy: '#8b5cf6',
    aurora: '#06b6d4',
  },
};

export const getTheme = (mode: ThemeMode): ThemeColors => {
  if (mode === 'space') return spaceTheme;
  return mode === 'light' ? lightTheme : darkTheme;
};

interface ThemeContextType {
  theme: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [colors, setColors] = useState<ThemeColors>(lightTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem('admin-theme') as ThemeMode;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = savedTheme || systemTheme;
    
    setThemeState(initialTheme);
    setColors(getTheme(initialTheme));
    
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark', 'space');
    document.documentElement.classList.add(initialTheme);
    
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const themes: ThemeMode[] = ['light', 'dark', 'space'];
    const currentIndex = themes.indexOf(theme);
    const newTheme = themes[(currentIndex + 1) % themes.length];
    setThemeState(newTheme);
    setColors(getTheme(newTheme));
    localStorage.setItem('admin-theme', newTheme);
    
    document.documentElement.classList.remove('light', 'dark', 'space');
    document.documentElement.classList.add(newTheme);
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    setColors(getTheme(mode));
    localStorage.setItem('admin-theme', mode);
    
    document.documentElement.classList.remove('light', 'dark', 'space');
    document.documentElement.classList.add(mode);
  };

  // Don't render children until mounted to avoid hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useThemeColors = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeColors must be used within a ThemeProvider');
  }
  return context;
};