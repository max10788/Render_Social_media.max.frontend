'use client';

import React from 'react';
import { useThemeStore } from '@/lib/stores/themeStore';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="bg-white dark:bg-neutral-800 shadow-sm z-10">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold text-primary">Crypto Token Analysis</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
