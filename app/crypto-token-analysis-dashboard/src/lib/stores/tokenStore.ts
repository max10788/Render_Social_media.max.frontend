import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { TokenAnalysis } from '@/lib/types/token';

interface TokenState {
  selectedToken: TokenAnalysis | null;
  setSelectedToken: (token: TokenAnalysis | null) => void;
  watchlist: string[];
  addToWatchlist: (tokenAddress: string) => void;
  removeFromWatchlist: (tokenAddress: string) => void;
}

export const useTokenStore = create<TokenState>()(
  devtools(
    (set) => ({
      selectedToken: null,
      setSelectedToken: (token) => set({ selectedToken: token }),
      watchlist: [],
      addToWatchlist: (tokenAddress) =>
        set((state) => ({
          watchlist: state.watchlist.includes(tokenAddress)
            ? state.watchlist
            : [...state.watchlist, tokenAddress],
        })),
      removeFromWatchlist: (tokenAddress) =>
        set((state) => ({
          watchlist: state.watchlist.filter((address) => address !== tokenAddress),
        })),
    }),
    {
      name: 'token-storage',
    }
  )
);
