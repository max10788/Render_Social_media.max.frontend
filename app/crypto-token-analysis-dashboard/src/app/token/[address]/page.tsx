'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { TokenAnalysisCard } from '@/components/dashboard/token-analysis-card';
import { PriceChart } from '@/components/charts/price-chart';
import { HolderDistribution } from '@/components/charts/holder-distribution';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';

export default function TokenPage() {
  const params = useParams();
  const tokenAddress = params.address as string;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Token-Analyse</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Detaillierte Analyse des Tokens {tokenAddress}
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <TokenAnalysisCard tokenAddress={tokenAddress} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PriceChart tokenAddress={tokenAddress} />
          <HolderDistribution tokenAddress={tokenAddress} />
        </div>
      </div>
    </DashboardLayout>
  );
}
