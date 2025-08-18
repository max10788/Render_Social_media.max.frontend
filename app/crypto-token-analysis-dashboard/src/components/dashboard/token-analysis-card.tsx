// components/dashboard/token-analysis-card.tsx
'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTokenDetail, analyzeToken } from '@/lib/api/tokenApi';
import { TokenDetail, TokenAnalysisResponse } from '@/lib/types/token'; // Geändert von TokenAnalysis zu TokenAnalysisResponse
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  BarChart3,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface TokenAnalysisCardProps {
  tokenAddress: string;
  chain: string;
}

export function TokenAnalysisCard({ tokenAddress, chain }: TokenAnalysisCardProps) {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  
  const { data: token, isLoading, error, refetch } = useQuery<TokenDetail>({
    queryKey: ['token', tokenAddress, chain],
    queryFn: () => fetchTokenDetail(tokenAddress, chain),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const { data: analysis, refetch: refetchAnalysis } = useQuery<TokenAnalysisResponse>({ // Typ geändert
    queryKey: ['tokenAnalysis', tokenAddress, chain],
    queryFn: () => analyzeToken({ token_address: tokenAddress, chain }),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: false, // Nur bei Bedarf ausführen
  });
  
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      await refetchAnalysis();
    } finally {
      setIsAnalyzing(false);
    }
  };
  
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
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
              Erneut versuchen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!token) {
    return null;
  }
  
  // Anpassung für den Zugriff auf token_info, da es jetzt Record<string, any> ist
  const tokenInfo = analysis?.token_info || token;
  const score = analysis?.score || token.token_score || 0;
  const riskFlags = analysis?.risk_flags || [];
  
  // Anpassung für wallet_analysis, da es jetzt Record<string, any> ist
  const walletAnalysisData = analysis?.wallet_analysis ? {
    total_wallets: analysis.wallet_analysis.total_wallets || 0,
    dev_wallets: analysis.wallet_analysis.dev_wallets || 0,
    whale_wallets: analysis.wallet_analysis.whale_wallets || 0,
    rugpull_suspects: analysis.wallet_analysis.rugpull_suspects || 0,
  } : null;
  
  // Bestimme die Farbe basierend auf dem Score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    if (score >= 40) return 'text-orange-500';
    return 'text-danger';
  };
  
  // Bestimme das Risikolevel
  const getRiskLevel = (score: number) => {
    if (score >= 80) return 'Sicher';
    if (score >= 60) return 'Niedriges Risiko';
    if (score >= 40) return 'Mittleres Risiko';
    return 'Hohes Risiko';
  };
  
  const priceChangeColor = tokenInfo.price_change_24h >= 0 ? 'text-success' : 'text-danger';
  const PriceChangeIcon = tokenInfo.price_change_24h >= 0 ? TrendingUp : TrendingDown;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {tokenInfo.name} ({tokenInfo.symbol})
              <Badge variant="outline">{chain}</Badge>
              {token.contract_verified && (
                <Badge variant="secondary">Verifiziert</Badge>
              )}
            </CardTitle>
            {tokenInfo.price && (
              <div className="flex items-center mt-1">
                <span className="text-2xl font-bold">${tokenInfo.price.toFixed(6)}</span>
                <div className={`flex items-center ml-2 ${priceChangeColor}`}>
                  <PriceChangeIcon className="h-4 w-4" />
                  <span className="ml-1">
                    {tokenInfo.price_change_24h >= 0 ? '+' : ''}
                    {tokenInfo.price_change_24h?.toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end">
            <div className="text-sm font-medium">Token Score</div>
            <div className={cn("text-2xl font-bold", getScoreColor(score))}>
              {score}/100
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {getRiskLevel(score)}
            </div>
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
              {tokenInfo.market_cap ? `$${(tokenInfo.market_cap / 1000000).toFixed(2)}M` : 'N/A'}
            </div>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="ml-2 text-sm font-medium">Volume 24h</span>
            </div>
            <div className="mt-1 text-lg font-semibold">
              {tokenInfo.volume_24h ? `$${(tokenInfo.volume_24h / 1000000).toFixed(2)}M` : 'N/A'}
            </div>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-primary" />
              <span className="ml-2 text-sm font-medium">Holders</span>
            </div>
            <div className="mt-1 text-lg font-semibold">
              {tokenInfo.holders_count?.toLocaleString() || 'N/A'}
            </div>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <span className="ml-2 text-sm font-medium">Risk Flags</span>
            </div>
            <div className="mt-1 text-lg font-semibold">{riskFlags.length}</div>
          </div>
        </div>
        
        {riskFlags.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">
              Risk Flags
            </h3>
            <div className="flex flex-wrap gap-2">
              {riskFlags.map((flag, index) => (
                <Badge key={index} variant="destructive">
                  {flag}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {walletAnalysisData && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">
              Wallet Analysis
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-2 bg-neutral-50 dark:bg-neutral-800 rounded">
                <div className="text-lg font-semibold">{walletAnalysisData.total_wallets}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Total Wallets</div>
              </div>
              <div className="text-center p-2 bg-neutral-50 dark:bg-neutral-800 rounded">
                <div className="text-lg font-semibold">{walletAnalysisData.dev_wallets}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Dev Wallets</div>
              </div>
              <div className="text-center p-2 bg-neutral-50 dark:bg-neutral-800 rounded">
                <div className="text-lg font-semibold">{walletAnalysisData.whale_wallets}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Whale Wallets</div>
              </div>
              <div className="text-center p-2 bg-neutral-50 dark:bg-neutral-800 rounded">
                <div className="text-lg font-semibold">{walletAnalysisData.rugpull_suspects}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Rugpull Suspects</div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-center mt-4">
          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isAnalyzing && "animate-spin")} />
            {isAnalyzing ? 'Analysiere...' : 'Detaillierte Analyse'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
