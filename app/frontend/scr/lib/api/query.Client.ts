import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { useNotificationStore } from '../stores';
import type { ApiError } from '../types';

// Global error handler
const handleError = (error: unknown) => {
  const addNotification = useNotificationStore.getState().addNotification;
  
  let message = 'An unexpected error occurred';
  let title = 'Error';
  
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'object' && error !== null && 'message' in error) {
    message = (error as ApiError).message;
    title = (error as ApiError).code || 'API Error';
  }
  
  addNotification({
    type: 'error',
    title,
    message,
    persistent: false,
  });
};

// Create React Query client with optimized settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache time - data stays in cache for 10 minutes after becoming unused
      gcTime: 10 * 60 * 1000,
      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch settings
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
  queryCache: new QueryCache({
    onError: handleError,
  }),
  mutationCache: new MutationCache({
    onError: handleError,
  }),
});

// Query keys factory for better organization and type safety
export const queryKeys = {
  // Token related queries
  tokens: {
    all: ['tokens'] as const,
    lists: () => [...queryKeys.tokens.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.tokens.lists(), filters] as const,
    details: () => [...queryKeys.tokens.all, 'detail'] as const,
    detail: (address: string) => [...queryKeys.tokens.details(), address] as const,
    analysis: (address: string) => [...queryKeys.tokens.detail(address), 'analysis'] as const,
    price: (address: string, timeframe: string) => [...queryKeys.tokens.detail(address), 'price', timeframe] as const,
    holders: (address: string) => [...queryKeys.tokens.detail(address), 'holders'] as const,
    transactions: (address: string, page: number) => [...queryKeys.tokens.detail(address), 'transactions', page] as const,
  },
  
  // Dashboard related queries
  dashboard: {
    all: ['dashboard'] as const,
    overview: () => [...queryKeys.dashboard.all, 'overview'] as const,
    trending: () => [...queryKeys.dashboard.all, 'trending'] as const,
    alerts: () => [...queryKeys.dashboard.all, 'alerts'] as const,
  },
  
  // User related queries
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    preferences: () => [...queryKeys.user.all, 'preferences'] as const,
    watchlist: () => [...queryKeys.user.all, 'watchlist'] as const,
    favorites: () => [...queryKeys.user.all, 'favorites'] as const,
  },
} as const;

// Invalidation helpers
export const invalidateQueries = {
  token: (address: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tokens.detail(address) });
  },
  
  tokenAnalysis: (address: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tokens.analysis(address) });
  },
  
  dashboard: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  },
  
  userWatchlist: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.user.watchlist() });
  },
  
  all: () => {
    queryClient.invalidateQueries();
  },
};

// Prefetch helpers for better UX
export const prefetchQueries = {
  tokenAnalysis: async (address: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.tokens.analysis(address),
      queryFn: () => import('./client').then(m => m.apiClient.getTokenAnalysis(address)),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  },
  
  tokenPrice: async (address: string, timeframe: string = '24h') => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.tokens.price(address, timeframe),
      queryFn: () => import('./client').then(m => m.apiClient.getTokenPrice(address, timeframe)),
      staleTime: 30 * 1000, // 30 seconds
    });
  },
  
  trendingTokens: async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard.trending(),
      queryFn: () => import('./client').then(m => m.apiClient.getTrendingTokens()),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },
};

// Background sync for real-time data
export const backgroundSync = {
  start: () => {
    // Refetch critical data every 30 seconds when tab is visible
    const interval = setInterval(() => {
      if (!document.hidden) {
        queryClient.refetchQueries({
          queryKey: queryKeys.dashboard.overview(),
          type: 'active',
        });
      }
    }, 30000);
    
    return () => clearInterval(interval);
  },
  
  syncWatchlist: () => {
    const watchlist = useNotificationStore.getState();
    // Implementation would sync watchlist tokens
  },
};

// Optimistic updates helper
export const optimisticUpdates = {
  addToWatchlist: (address: string) => {
    queryClient.setQueryData(queryKeys.user.watchlist(), (old: string[] = []) => {
      return old.includes(address) ? old : [...old, address];
    });
  },
  
  removeFromWatchlist: (address: string) => {
    queryClient.setQueryData(queryKeys.user.watchlist(), (old: string[] = []) => {
      return old.filter(addr => addr !== address);
    });
  },
  
  addToFavorites: (address: string) => {
    queryClient.setQueryData(queryKeys.user.favorites(), (old: string[] = []) => {
      return old.includes(address) ? old : [...old, address];
    });
  },
  
  removeFromFavorites: (address: string) => {
    queryClient.setQueryData(queryKeys.user.favorites(), (old: string[] = []) => {
      return old.filter(addr => addr !== address);
    });
  },
};
