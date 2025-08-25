'use client';
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { TokenAnalysisCard } from '@/components/dashboard/token-analysis-card';
import { PriceChart } from '@/components/charts/price-chart';
import { HolderDistribution } from '@/components/charts/holder-distribution';
import { TransactionRadarChart } from '@/components/charts/transaction-radar-chart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { fetchChainStatistics } from '@/lib/api/tokenApi';
import WalletConnect from '@/components/web3/WalletConnect';

// Unterstützte Blockchains
const supportedChains = [
  { id: 'ethereum', name: 'Ethereum' },
  { id: 'bsc', name: 'Binance Smart Chain' },
  { id: 'solana', name: 'Solana' },
  { id: 'sui', name: 'Sui' },
];

export default function DashboardPage() {
  const [tokenAddress, setTokenAddress] = useState('');
  const [selectedChain, setSelectedChain] = useState('ethereum');
  const [submittedAddress, setSubmittedAddress] = useState('');
  const [submittedChain, setSubmittedChain] = useState('');
  
  const { data: chainStats } = useQuery({
    queryKey: ['chainStatistics'],
    queryFn: fetchChainStatistics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenAddress.trim()) {
      setSubmittedAddress(tokenAddress.trim());
      setSubmittedChain(selectedChain);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Crypto Token Analysis Dashboard</h1>
          <WalletConnect />
        </div>
        
        <div className="mb-8">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Enter token address..."
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-48">
              <Select value={selectedChain} onValueChange={setSelectedChain}>
                <SelectTrigger>
                  <SelectValue placeholder="Select chain" />
                </SelectTrigger>
                <SelectContent>
                  {supportedChains.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id}>
                      {chain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Analyze</Button>
          </form>
        </div>
        
        {submittedAddress && submittedChain && (
          <div className="space-y-6">
            <TokenAnalysisCard 
              tokenAddress={submittedAddress} 
              chain={submittedChain} 
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PriceChart tokenAddress={submittedAddress} chain={submittedChain} />
              <HolderDistribution tokenAddress={submittedAddress} chain={submittedChain} />
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <TransactionRadarChart 
                tokenAddress={submittedAddress} 
                chain={submittedChain} 
              />
            </div>
          </div>
        )}
        
        {!submittedAddress && (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Welcome to the Crypto Token Analysis Dashboard</h2>
            <p className="text-muted-foreground mb-6">
              Enter a token address and select a blockchain to get started
            </p>
            
            {chainStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
                {Object.entries(chainStats).map(([chain, stats]) => (
                  <div key={chain} className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="font-semibold capitalize">{chain}</h3>
                    <p className="text-sm text-muted-foreground">
                      Tokens: {stats.total_tokens}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Avg Market Cap: ${(stats.average_market_cap / 1000000).toFixed(1)}M
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {supportedChains.map((chain) => (
                <div key={chain.id} className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-semibold">{chain.name}</h3>
                  <p className="text-sm text-muted-foreground">{chain.id}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
