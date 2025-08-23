// src/components/layouts/dashboard-layout.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useOptionStore } from '@/lib/stores/optionStore';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { config } = useOptionStore();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Assets', href: '/assets', icon: '💰' },
    { name: 'Analytics', href: '/analytics', icon: '📈' },
    { name: 'Settings', href: '/settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col h-full px-4 py-6 bg-card border-r">
          <div className="flex items-center mb-8">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">MC</span>
            </div>
            <span className="ml-2 text-lg font-semibold">MonteCarlo</span>
          </div>
          
          <nav className="flex-1 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          {config && (
            <div className="mt-auto pt-4 border-t">
              <div className="text-xs text-muted-foreground mb-2">System Status</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Models</span>
                  <span>{config.supported_stochastic_models.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Max Assets</span>
                  <span>{config.max_assets_per_basket}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
