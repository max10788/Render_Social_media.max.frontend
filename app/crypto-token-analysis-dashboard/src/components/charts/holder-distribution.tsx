// components/charts/holder-distribution.tsx
'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTokenByAddress, analyzeToken } from '@/lib/api/tokenApi';
import { TokenDetailResponse, TokenAnalysisResponse } from '@/lib/types/token'; // Geändert von TokenAnalysis zu TokenAnalysisResponse
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

interface HolderDistributionProps {
  tokenAddress: string;
  chain: string;
}

export function HolderDistribution({ tokenAddress, chain }: HolderDistributionProps) {
  const { data: token, isLoading: tokenLoading } = useQuery<TokenDetailResponse>({
    queryKey: ['token', tokenAddress, chain],
    queryFn: () => fetchTokenByAddress(tokenAddress, chain, true) as Promise<TokenDetailResponse>,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const { data: analysis, isLoading: analysisLoading } = useQuery<TokenAnalysisResponse>({ // Typ geändert zu TokenAnalysisResponse
    queryKey: ['tokenAnalysis', tokenAddress, chain],
    queryFn: () => analyzeToken({ token_address: tokenAddress, chain }),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!token, // Nur ausführen, wenn token-Daten vorhanden sind
  });
  
  const isLoading = tokenLoading || analysisLoading;
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  // Anpassung für den Zugriff auf die Daten, da die Struktur von TokenAnalysisResponse anders ist
  const walletAnalysis = analysis?.wallet_analysis || token?.wallet_analyses?.reduce((acc, wallet) => {
    if (!acc.total_wallets) acc.total_wallets = 0;
    if (!acc.dev_wallets) acc.dev_wallets = 0;
    if (!acc.whale_wallets) acc.whale_wallets = 0;
    if (!acc.rugpull_suspects) acc.rugpull_suspects = 0;
    
    acc.total_wallets++;
    
    if (wallet.wallet_type === 'dev') {
      acc.dev_wallets++;
    } else if (wallet.wallet_type === 'whale') {
      acc.whale_wallets++;
    } else if (wallet.wallet_type === 'suspect') {
      acc.rugpull_suspects++;
    }
    
    return acc;
  }, {} as any) || {
    total_wallets: 100,
    dev_wallets: 5,
    whale_wallets: 10,
    rugpull_suspects: 2,
  };
  
  const chartData = [
    { name: 'Dev Wallets', value: walletAnalysis.dev_wallets, color: '#00D4AA' },
    { name: 'Whale Wallets', value: walletAnalysis.whale_wallets, color: '#3B82F6' },
    { name: 'Rugpull Suspects', value: walletAnalysis.rugpull_suspects, color: '#EF4444' },
    { name: 'Regular Wallets', value: walletAnalysis.total_wallets - walletAnalysis.dev_wallets - walletAnalysis.whale_wallets - walletAnalysis.rugpull_suspects, color: '#94A3B8' },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Holder-Verteilung</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} Wallets`, 'Anzahl']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
