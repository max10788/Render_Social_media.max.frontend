import { ethers } from 'ethers';

export interface EthereumProviderState {
  isConnected: boolean;
  account: string | null;
  chainId: number | null;
  provider: ethers.providers.Web3Provider | null;
}

class EthereumProviderManager {
  private provider: ethers.providers.Web3Provider | null = null;
  private initialized = false;

  public async initialize(): Promise<ethers.providers.Web3Provider | null> {
    if (this.initialized) return this.provider;

    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        console.warn('Ethereum provider not available');
        return null;
      }

      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.initialized = true;
      return this.provider;
    } catch (error) {
      console.error('Failed to initialize Ethereum provider:', error);
      return null;
    }
  }

  public async getAccount(): Promise<string | null> {
    try {
      if (!this.provider) return null;
      const accounts = await this.provider.listAccounts();
      return accounts[0] || null;
    } catch (error) {
      console.error('Failed to get account:', error);
      return null;
    }
  }

  public async getChainId(): Promise<number | null> {
    try {
      if (!this.provider) return null;
      const network = await this.provider.getNetwork();
      return network.chainId;
    } catch (error) {
      console.error('Failed to get chain ID:', error);
      return null;
    }
  }

  public async requestAccount(): Promise<string | null> {
    try {
      if (!this.provider) return null;
      const accounts = await this.provider.send('eth_requestAccounts', []);
      return accounts[0] || null;
    } catch (error) {
      console.error('Failed to request account:', error);
      return null;
    }
  }
}

export const ethereumProvider = new EthereumProviderManager();
