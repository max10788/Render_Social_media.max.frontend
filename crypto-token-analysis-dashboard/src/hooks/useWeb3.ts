'use client';

import { useState, useEffect } from 'react';

interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function useWeb3() {
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [chainId, setChainId] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Prüfen, ob bereits eine Verbindung besteht
    const savedAccount = localStorage.getItem('connectedAccount');
    if (savedAccount) {
      setAccount(savedAccount);
      setIsConnected(true);
    }

    // Event Listener für Kontowechsel
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      // Cleanup
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      localStorage.setItem('connectedAccount', accounts[0]);
      setIsConnected(true);
    } else {
      setAccount('');
      localStorage.removeItem('connectedAccount');
      setIsConnected(false);
    }
  };

  const handleChainChanged = (chainId: string) => {
    setChainId(chainId);
  };

  const connectWallet = async () => {
    setError('');
    
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask and try again.');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        localStorage.setItem('connectedAccount', accounts[0]);
        setIsConnected(true);
        
        // Chain-ID abrufen
        const chainId = await window.ethereum.request({ 
          method: 'eth_chainId' 
        });
        setChainId(chainId);
      }
    } catch (err: any) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet');
    }
  };

  const disconnectWallet = () => {
    setAccount('');
    setIsConnected(false);
    localStorage.removeItem('connectedAccount');
  };

  return {
    account,
    isConnected,
    chainId,
    error,
    connectWallet,
    disconnectWallet
  };
}
