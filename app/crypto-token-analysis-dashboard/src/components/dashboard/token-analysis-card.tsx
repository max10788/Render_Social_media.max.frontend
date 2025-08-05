'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTokenAnalysis } from '@/lib/api/tokenApi';
import { TokenAnalysis } from '@/lib/types/token';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  BarChart3,
  AlertTriangle
} from 'lucide-react';

interface TokenAnalysisCardProps {
  tokenAddress: string;
}

export function TokenAnalysisCard({ tokenAddress }: TokenAnalysisCardProps) {
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
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
            <Skeleton className="h-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-danger" />
            <h3 className="mt-2 text-sm font-medium text-neutral-900 dark:text-white">
              Fehler beim Laden der Token-Daten
            </h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Bitte versuchen Sie es später erneut.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!token) {
    return null;
  }

  const {
    token_info,
    score,
    risk_flags,
    wallet_analysis,
  } = token;

  const priceChangeColor = token_info.price_change_24h >= 0 ? 'text-success' : 'text-danger';
  const PriceChangeIcon = token_info.price_change_24h >= 0 ? TrendingUp : TrendingDown;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {token_info.name} ({token_info.symbol})
            </CardTitle>
            <div className="flex items-center mt-1">
              <span className="text-2xl font-bold">${token_info.price.toFixed(6)}</span>
              <div className={`flex items-center ml-2 ${priceChangeColor}`}>
                <PriceChangeIcon className="h-4 w-4" />
                <span className="ml-1">
                  {token_info.price_change_24h >= 0 ? '+' : ''}
                  {token_info.price_change_24h.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-sm font-medium">Token Score</div>
            <div className="text-2xl font-bold">{score}/100</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="ml-2 text-sm font-medium">Market Cap</span>
            </div>
            <div className="mt-1 text-lg font-semibold">
              ${(token_info.market_cap / 1000000).toFixed(2)}M
            </div>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="ml-2 text-sm font-medium">Volume 24h</span>
            </div>
            <div className="mt-1 text-lg font-semibold">
              ${(token_info.volume_24h / 1000000).toFixed(2)}M
            </div>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-primary" />
              <span className="ml-2 text-sm font-medium">Holders</span>
            </div>
            <div className="mt-1 text-lg font-semibold">
              {token_info.holders_count.toLocaleString()}
            </div>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <span className="ml-2 text-sm font-medium">Risk Flags</span>
            </div>
            <div className="mt-1 text-lg font-semibold">{risk_flags.length}</div>
          </div>
        </div>

        {risk_flags.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">
              Risk Flags
            </h3>
            <div className="flex flex-wrap gap-2">
              {risk_flags.map((flag, index) => (
                <Badge key={index} variant="destructive">
                  {flag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">
            Wallet Analysis
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-2 bg-neutral-50 dark:bg-neutral-800 rounded">
              <div className="text-lg font-semibold">{wallet_analysis.total_wallets}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Total Wallets</div>
            </div>
            <div className="text-center p-2 bg-neutral-50 dark:bg-neutral-800 rounded">
              <div className="text-lg font-semibold">{wallet_analysis.dev_wallets}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Dev Wallets</div>
            </div>
            <div className="text-center p-2 bg-neutral-50 dark:bg-neutral-800 rounded">
              <div className="text-lg font-semibold">{wallet_analysis.whale_wallets}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Whale Wallets</div>
            </div>
            <div className="text-center p-2 bg-neutral-50 dark:bg-neutral-800 rounded">
              <div className="text-lg font-semibold">{wallet_analysis.rugpull_suspects}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Rugpull Suspects</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
