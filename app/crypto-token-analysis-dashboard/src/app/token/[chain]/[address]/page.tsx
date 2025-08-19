'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import { TokenAnalysisCard } from '@/components/dashboard/token-analysis-card';
import { PriceChart } from '@/components/charts/price-chart';
import { HolderDistribution } from '@/components/charts/holder-distribution';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';

export async function generateStaticParams() {
  // Hier können Sie eine Liste von vordefinierten Token-Addressen zurückgeben
  // oder eine leere Liste, wenn Sie keine statischen Seiten generieren möchten
  return [
    // Beispiel-Tokens - ersetzen Sie diese mit Ihren eigenen Token-Addressen
    { chain: 'ethereum', address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' }, // WETH
    { chain: 'ethereum', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' }, // WBTC
    { chain: 'bsc', address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c' }, // WBNB
  ];
}

export default function TokenPage() {
  const params = useParams();
  const chain = params.chain as string;
  const tokenAddress = params.address as string;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Token-Analyse</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Detaillierte Analyse des Tokens {tokenAddress} auf {chain}
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <TokenAnalysisCard tokenAddress={tokenAddress} chain={chain} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PriceChart tokenAddress={tokenAddress} chain={chain} />
          <HolderDistribution tokenAddress={tokenAddress} chain={chain} />
        </div>
      </div>
    </DashboardLayout>
  );
}
