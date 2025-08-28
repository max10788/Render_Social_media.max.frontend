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
    if (typeof window === 'undefined') return;
    
    // Nur setzen, wenn noch kein ethereum Provider existiert
    if (!window.ethereum) {
      console.log('Setting up mock ethereum provider');
      
      const mockProvider: EthereumProvider = {
        isMetaMask: false,
        request: async ({ method, params }) => {
          console.log(`Mock provider called with method: ${method}`, params);
          
          switch (method) {
            case 'eth_chainId': return '0x1';
            case 'eth_accounts': return [];
            case 'eth_requestAccounts': return [];
            case 'personal_sign': return '0x';
            default: return null;
          }
        },
        on: (event, callback) => console.log(`Mock provider: Listening for ${event}`),
        removeListener: (event, callback) => console.log(`Mock provider: Stopped listening for ${event}`)
      };
      
      // Sichere Zuweisung
      try {
        Object.defineProperty(window, 'ethereum', {
          value: mockProvider,
          configurable: true,
          writable: true,
          enumerable: true
        });
        console.log('Mock ethereum provider set successfully');
      } catch (error) {
        console.warn('Could not define ethereum provider:', error);
        // Fallback: Direkte Zuweisung
        (window as any).ethereum = mockProvider;
      }
    } else {
      console.log('Ethereum provider already exists');
    }
  }, []);
  
  return null;
}
