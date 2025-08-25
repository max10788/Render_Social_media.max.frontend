'use client';

import { useEffect } from 'react';

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

export default function EthereumProvider() {
  useEffect(() => {
    // Nur im Browser ausführen
    if (typeof window === 'undefined') return;

    // Prüfen, ob bereits ein Provider existiert
    if (window.ethereum) {
      console.log('Ethereum provider already exists:', window.ethereum);
      return;
    }

    // Mock-Provider für Entwicklung ohne Wallet
    const mockProvider: EthereumProvider = {
      isMetaMask: false,
      request: async ({ method, params }) => {
        console.log(`Mock provider called with method: ${method}`, params);
        
        // Mock-Antworten für gängige Methoden
        switch (method) {
          case 'eth_chainId':
            return '0x1'; // Mainnet
          case 'eth_accounts':
            return [];
          case 'eth_requestAccounts':
            return [];
          case 'personal_sign':
            return '0x'; // Mock-Signatur
          default:
            return null;
        }
      },
      on: (event, callback) => {
        console.log(`Mock provider: Listening for ${event}`);
      },
      removeListener: (event, callback) => {
        console.log(`Mock provider: Stopped listening for ${event}`);
      }
    };

    // Versuchen, den Provider sicher zu definieren
    try {
      Object.defineProperty(window, 'ethereum', {
        value: mockProvider,
        configurable: true,
        writable: true,
        enumerable: true
      });
      console.log('Mock ethereum provider set successfully');
    } catch (error) {
      console.error('Could not define ethereum provider:', error);
      // Fallback: Direkte Zuweisung
      window.ethereum = mockProvider;
    }
  }, []);

  return null;
}
