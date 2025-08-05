'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTokenAnalysis } from '@/lib/api/tokenApi';
import { TokenAnalysis } from '@/lib/types/token';
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
}

export function HolderDistribution({ tokenAddress }: HolderDistributionProps) {
  const { data: token, isLoading, error } = useQuery<TokenAnalysis>({
    queryKey: ['token', tokenAddress],
    queryFn: () => fetchTokenAnalysis(tokenAddress),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-danger">Fehler beim Laden der Holder-Daten</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!token) {
    return null;
  }

  const { wallet_analysis } = token;

  const chartData = [
    { name: 'Dev Wallets', value: wallet_analysis.dev_wallets, color: '#00D4AA' },
    { name: 'Whale Wallets', value: wallet_analysis.whale_wallets, color: '#3B82F6' },
    { name: 'Rugpull Suspects', value: wallet_analysis.rugpull_suspects, color: '#EF4444' },
    { name: 'Regular Wallets', value: wallet_analysis.total_wallets - wallet_analysis.dev_wallets - wallet_analysis.whale_wallets - wallet_analysis.rugpull_suspects, color: '#94A3B8' },
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
