'use client';

import { useWeb3 } from '@/hooks/useWeb3';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function WalletConnect() {
  const { 
    account, 
    isConnected, 
    error, 
    connectWallet, 
    disconnectWallet,
    chainId 
  } = useWeb3();

  // Formatieren der Adresse
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Chain-ID in Namen umwandeln
  const getChainName = (chainId: string) => {
    switch (chainId) {
      case '0x1': return 'Ethereum Mainnet';
      case '0x89': return 'Polygon';
      case '0x38': return 'BSC';
      case '0xa': return 'Optimism';
      case '0xa4b1': return 'Arbitrum';
      default: return `Chain ${chainId}`;
    }
  };

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Wallet Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={connectWallet} className="w-full">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isConnected && account) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Wallet Connected</CardTitle>
          <CardDescription>
            {getChainName(chainId || '0x1')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Address:</span>
            <span className="font-mono">{formatAddress(account)}</span>
          </div>
          <Button onClick={disconnectWallet} variant="outline" className="w-full">
            Disconnect
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Connect Wallet</CardTitle>
        <CardDescription>
          Connect your wallet to access all features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={connectWallet} className="w-full">
          Connect MetaMask
        </Button>
      </CardContent>
    </Card>
  );
}
