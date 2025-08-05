'use client';

import React from 'react';
import { TokenAnalysisCard } from '@/components/dashboard/token-analysis-card';
import { PriceChart } from '@/components/charts/price-chart';
import { HolderDistribution } from '@/components/charts/holder-distribution';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';

export default function DashboardPage() {
  // Beispiel-Token-Adresse, sollte durch eine echte ersetzt werden
  const exampleTokenAddress = '0x1234567890abcdef1234567890abcdef12345678';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Analysieren Sie Crypto-Token-Daten in Echtzeit
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <TokenAnalysisCard tokenAddress={exampleTokenAddress} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PriceChart tokenAddress={exampleTokenAddress} />
          <HolderDistribution tokenAddress={exampleTokenAddress} />
        </div>
      </div>
    </DashboardLayout>
  );
}
