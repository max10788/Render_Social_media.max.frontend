// src/app/theme-provider.tsx
'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useThemeStore } from '@/lib/stores/themeStore';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

export function ThemeProvider({ 
  children, 
  attribute = 'class',
  defaultTheme = 'system',
  enableSystem = true,
  disableTransitionOnChange = false 
}: ThemeProviderProps) {
  const { theme: storedTheme, toggleTheme: storeToggleTheme } = useThemeStore();
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Wenn ein gespeichertes Theme im Store vorhanden ist, verwende es
    if (storedTheme) {
      setThemeState(storedTheme);
    }
  }, [storedTheme]);

  useEffect(() => {
    if (mounted) {
      const root = document.documentElement;
      
      if (disableTransitionOnChange) {
        root.classList.add('no-transition');
        setTimeout(() => root.classList.remove('no-transition'), 0);
      }
      
      if (attribute === 'class') {
        root.classList.remove('light', 'dark');
        
        let effectiveTheme = theme;
        if (theme === 'system' && enableSystem) {
          effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        root.classList.add(effectiveTheme);
      } else {
        let effectiveTheme = theme;
        if (theme === 'system' && enableSystem) {
          effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        root.setAttribute(attribute, effectiveTheme);
      }
    }
  }, [theme, mounted, attribute, enableSystem, disableTransitionOnChange]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prevTheme => {
      if (prevTheme === 'light') return 'dark';
      if (prevTheme === 'dark') return 'system';
      return 'light';
    });
    storeToggleTheme();
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
