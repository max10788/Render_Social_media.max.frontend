'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTokenDetail, analyzeToken } from '@/lib/api/tokenApi';
import { TokenDetail, TokenAnalysisResponse, TokenInfo } from '@/lib/types/token';
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
  
  const { data: analysis, refetch: refetchAnalysis } = useQuery<TokenAnalysisResponse>({
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
  
  // Extract token info with proper typing
  const analysisTokenInfo = analysis?.token_info as TokenInfo | undefined;
  
  // Extract properties with fallbacks
  const name = analysisTokenInfo?.name ?? token.name;
  const symbol = analysisTokenInfo?.symbol ?? token.symbol;
  
  // price and price_change_24h are only in analysisTokenInfo
  const price = analysisTokenInfo?.price;
  const priceChange24h = analysisTokenInfo?.price_change_24h;
  
  // market_cap, volume_24h and holders_count are in both sources
  const marketCap = analysisTokenInfo?.market_cap ?? token.market_cap;
  const volume24h = analysisTokenInfo?.volume_24h ?? token.volume_24h;
  const holdersCount = analysisTokenInfo?.holders_count ?? token.holders_count;
  
  // Score and risk flags
  const score = analysis?.score ?? token.token_score ?? 0;
  const riskFlags = analysis?.risk_flags || [];
  
  // Wallet analysis data with type safety
  const walletAnalysisData = analysis?.wallet_analysis ? {
    total_wallets: typeof analysis.wallet_analysis.total_wallets === 'number' ? analysis.wallet_analysis.total_wallets : 0,
    dev_wallets: typeof analysis.wallet_analysis.dev_wallets === 'number' ? analysis.wallet_analysis.dev_wallets : 0,
    whale_wallets: typeof analysis.wallet_analysis.whale_wallets === 'number' ? analysis.wallet_analysis.whale_wallets : 0,
    rugpull_suspects: typeof analysis.wallet_analysis.rugpull_suspects === 'number' ? analysis.wallet_analysis.rugpull_suspects : 0,
  } : null;
  
  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    if (score >= 40) return 'text-orange-500';
    return 'text-danger';
  };
  
  // Determine risk level
  const getRiskLevel = (score: number) => {
    if (score >= 80) return 'Sicher';
    if (score >= 60) return 'Niedriges Risiko';
    if (score >= 40) return 'Mittleres Risiko';
    return 'Hohes Risiko';
  };
  
  // Determine color and icon for price change
  const priceChangeColor = priceChange24h !== undefined && priceChange24h >= 0 ? 'text-success' : 'text-danger';
  const PriceChangeIcon = priceChange24h !== undefined && priceChange24h >= 0 ? TrendingUp : TrendingDown;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {name} ({symbol})
              <Badge variant="outline">{chain}</Badge>
              {token.contract_verified && (
                <Badge variant="secondary">Verifiziert</Badge>
              )}
            </CardTitle>
            {price !== undefined && (
              <div className="flex items-center mt-1">
                <span className="text-2xl font-bold">${price.toFixed(6)}</span>
                {priceChange24h !== undefined && (
                  <div className={`flex items-center ml-2 ${priceChangeColor}`}>
                    <PriceChangeIcon className="h-4 w-4" />
                    <span className="ml-1">
                      {priceChange24h >= 0 ? '+' : ''}
                      {priceChange24h.toFixed(2)}%
                    </span>
                  </div>
                )}
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
              {marketCap ? `$${(marketCap / 1000000).toFixed(2)}M` : 'N/A'}
            </div>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="ml-2 text-sm font-medium">Volume 24h</span>
            </div>
            <div className="mt-1 text-lg font-semibold">
              {volume24h ? `$${(volume24h / 1000000).toFixed(2)}M` : 'N/A'}
            </div>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-primary" />
              <span className="ml-2 text-sm font-medium">Holders</span>
            </div>
            <div className="mt-1 text-lg font-semibold">
              {holdersCount?.toLocaleString() || 'N/A'}
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
