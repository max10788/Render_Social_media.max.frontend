'use client';

import { useState, useEffect } from 'react';

interface Web3State {
  provider: any;
  account: string | null;
  chainId: string | null;
  isConnected: boolean;
  error: string | null;
}

export function useWeb3() {
  const [state, setState] = useState<Web3State>({
    provider: null,
    account: null,
    chainId: null,
    isConnected: false,
    error: null
  });

  useEffect(() => {
    const initWeb3 = async () => {
      if (typeof window === 'undefined' || !window.ethereum) {
        setState(prev => ({ ...prev, error: 'No Ethereum provider found' }));
        return;
      }

      try {
        const provider = window.ethereum;
        
        // Aktuelle Chain-ID abrufen
        const chainId = await provider.request({ method: 'eth_chainId' });
        
        // Aktuellen Account abrufen
        const accounts = await provider.request({ method: 'eth_accounts' });
        
        setState({
          provider,
          account: accounts[0] || null,
          chainId,
          isConnected: !!accounts[0],
          error: null
        });

        // Event-Listener für Account-Änderungen
        const handleAccountsChanged = (accounts: string[]) => {
          setState(prev => ({
            ...prev,
            account: accounts[0] || null,
            isConnected: !!accounts[0]
          }));
        };

        // Event-Listener für Chain-Änderungen
        const handleChainChanged = (chainId: string) => {
          setState(prev => ({ ...prev, chainId }));
        };

        provider.on('accountsChanged', handleAccountsChanged);
        provider.on('chainChanged', handleChainChanged);

        // Cleanup
        return () => {
          provider.removeListener('accountsChanged', handleAccountsChanged);
          provider.removeListener('chainChanged', handleChainChanged);
        };
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }));
      }
    };

    initWeb3();
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setState(prev => ({ ...prev, error: 'No Ethereum provider found' }));
      return;
    }

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      setState(prev => ({
        ...prev,
        account: accounts[0] || null,
        isConnected: !!accounts[0],
        error: null
      }));
      
      // Speichern der verbundenen Adresse im localStorage
      if (accounts[0]) {
        localStorage.setItem('connectedAccount', accounts[0]);
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to connect wallet' 
      }));
    }
  };

  const disconnectWallet = () => {
    setState(prev => ({
      ...prev,
      account: null,
      isConnected: false
    }));
    
    // Entfernen der gespeicherten Adresse
    localStorage.removeItem('connectedAccount');
  };

  return {
    ...state,
    connectWallet,
    disconnectWallet
  };
}
