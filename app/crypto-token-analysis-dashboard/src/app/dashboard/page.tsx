// app/dashboard/page.tsx
'use client';

import React from 'react';
import { TokenAnalysisCard } from '@/components/dashboard/token-analysis-card';
import { PriceChart } from '@/components/charts/price-chart';
import { HolderDistribution } from '@/components/charts/holder-distribution';
import { TransactionRadarChart } from '@/components/charts/transaction-radar-chart';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';

export default function DashboardPage() {
  // Beispiel-Token-Adresse und Chain
  const exampleTokenAddress = '0x1234567890abcdef1234567890abcdef12345678';
  const exampleChain = 'ethereum';

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
          <TokenAnalysisCard 
            tokenAddress={exampleTokenAddress} 
            chain={exampleChain} 
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PriceChart tokenAddress={exampleTokenAddress} chain={exampleChain} />
          <HolderDistribution tokenAddress={exampleTokenAddress} chain={exampleChain} />
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <TransactionRadarChart 
            tokenAddress={exampleTokenAddress} 
            chain={exampleChain} 
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
