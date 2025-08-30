'use client';

import { useEffect, useState } from 'react';
import ethereumProviderManager from '@/utils/ethereumProvider';

interface EthereumProviderProps {
  children: React.ReactNode;
}

export default function EthereumProvider({ children }: EthereumProviderProps) {
  const [provider, setProvider] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeProvider = async () => {
      try {
        const initializedProvider = await ethereumProviderManager.initialize();
        setProvider(initializedProvider);
        
        if (!initializedProvider) {
          setError('No Ethereum provider available. Please install MetaMask or another compatible wallet.');
        }
      } catch (err) {
        console.error('Failed to initialize Ethereum provider:', err);
        setError('Failed to initialize Ethereum provider. Please refresh the page and try again.');
      }
    };

    initializeProvider();
  }, []);

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reload Page</button>
      </div>
    );
  }

  return <>{children}</>;
}
