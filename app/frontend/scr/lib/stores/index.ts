import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import type { 
  TokenAnalysis, 
  DashboardState, 
  ThemeState, 
  UserPreferences,
  WebSocketMessage,
  RiskLevel 
} from '../types';

// Theme Store
interface ThemeStore extends ThemeState {
  toggleMode: () => void;
  setPrimaryColor: (color: string) => void;
  setFontSize: (size: 'sm' | 'md' | 'lg') => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      primaryColor: '#00D4AA',
      fontSize: 'md',
      
      toggleMode: () => set((state) => ({ mode: state.mode === 'light' ? 'dark' : 'light' })),
      setPrimaryColor: (color) => set({ primaryColor: color }),
      setFontSize: (size) => set({ fontSize: size }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Dashboard Store
interface DashboardStore extends DashboardState {
  setSelectedToken: (token: string | null) => void;
  setTimeframe: (timeframe: '1h' | '24h' | '7d' | '30d') => void;
  setRefreshInterval: (interval: number) => void;
  toggleRealTime: () => void;
  resetDashboard: () => void;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      selectedToken: null,
      timeframe: '24h',
      refreshInterval: 30000, // 30 seconds
      isRealTimeEnabled: true,
      
      setSelectedToken: (token) => set({ selectedToken: token }),
      setTimeframe: (timeframe) => set({ timeframe }),
      setRefreshInterval: (interval) => set({ refreshInterval: interval }),
      toggleRealTime: () => set((state) => ({ isRealTimeEnabled: !state.isRealTimeEnabled })),
      resetDashboard: () => set({
        selectedToken: null,
        timeframe: '24h',
        refreshInterval: 30000,
        isRealTimeEnabled: true,
      }),
    }),
    {
      name: 'dashboard-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Token Analysis Store
interface TokenAnalysisStore {
  analyses: Record<string, TokenAnalysis>;
  loading: Record<string, boolean>;
  errors: Record<string, string>;
  favorites: string[];
  watchlist: string[];
  
  setAnalysis: (address: string, analysis: TokenAnalysis) => void;
  setLoading: (address: string, loading: boolean) => void;
  setError: (address: string, error: string) => void;
  clearError: (address: string) => void;
  addToFavorites: (address: string) => void;
  removeFromFavorites: (address: string) => void;
  addToWatchlist: (address: string) => void;
  removeFromWatchlist: (address: string) => void;
  clearAnalysis: (address: string) => void;
  clearAllAnalyses: () => void;
  
  // Computed getters
  getFavoriteAnalyses: () => TokenAnalysis[];
  getWatchlistAnalyses: () => TokenAnalysis[];
  getHighRiskTokens: () => TokenAnalysis[];
}

export const useTokenAnalysisStore = create<TokenAnalysisStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        analyses: {},
        loading: {},
        errors: {},
        favorites: [],
        watchlist: [],
        
        setAnalysis: (address, analysis) => 
          set((state) => ({
            analyses: { ...state.analyses, [address]: analysis },
            loading: { ...state.loading, [address]: false },
            errors: { ...state.errors, [address]: '' },
          })),
          
        setLoading: (address, loading) =>
          set((state) => ({
            loading: { ...state.loading, [address]: loading },
          })),
          
        setError: (address, error) =>
          set((state) => ({
            errors: { ...state.errors, [address]: error },
            loading: { ...state.loading, [address]: false },
          })),
          
        clearError: (address) =>
          set((state) => ({
            errors: { ...state.errors, [address]: '' },
          })),
          
        addToFavorites: (address) =>
          set((state) => ({
            favorites: state.favorites.includes(address) 
              ? state.favorites 
              : [...state.favorites, address],
          })),
          
        removeFromFavorites: (address) =>
          set((state) => ({
            favorites: state.favorites.filter(addr => addr !== address),
          })),
          
        addToWatchlist: (address) =>
          set((state) => ({
            watchlist: state.watchlist.includes(address)
              ? state.watchlist
              : [...state.watchlist, address],
          })),
          
        removeFromWatchlist: (address) =>
          set((state) => ({
            watchlist: state.watchlist.filter(addr => addr !== address),
          })),
          
        clearAnalysis: (address) =>
          set((state) => {
            const { [address]: removed, ...restAnalyses } = state.analyses;
            const { [address]: removedLoading, ...restLoading } = state.loading;
            const { [address]: removedError, ...restErrors } = state.errors;
            return {
              analyses: restAnalyses,
              loading: restLoading,
              errors: restErrors,
            };
          }),
          
        clearAllAnalyses: () => set({ analyses: {}, loading: {}, errors: {} }),
        
        // Computed getters
        getFavoriteAnalyses: () => {
          const state = get();
          return state.favorites
            .map(address => state.analyses[address])
            .filter(Boolean);
        },
        
        getWatchlistAnalyses: () => {
          const state = get();
          return state.watchlist
            .map(address => state.analyses[address])
            .filter(Boolean);
        },
        
        getHighRiskTokens: () => {
          const state = get();
          return Object.values(state.analyses)
            .filter(analysis => analysis.score < 30); // High risk threshold
        },
      }),
      {
        name: 'token-analysis-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ 
          favorites: state.favorites, 
          watchlist: state.watchlist 
        }),
      }
    )
  )
);

// WebSocket Store for real-time updates
interface WebSocketStore {
  isConnected: boolean;
  reconnectAttempts: number;
  lastMessage: WebSocketMessage | null;
  subscriptions: Set<string>;
  
  setConnected: (connected: boolean) => void;
  setReconnectAttempts: (attempts: number) => void;
  setLastMessage: (message: WebSocketMessage) => void;
  addSubscription: (tokenAddress: string) => void;
  removeSubscription: (tokenAddress: string) => void;
  clearSubscriptions: () => void;
}

export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  isConnected: false,
  reconnectAttempts: 0,
  lastMessage: null,
  subscriptions: new Set(),
  
  setConnected: (connected) => set({ isConnected: connected }),
  setReconnectAttempts: (attempts) => set({ reconnectAttempts: attempts }),
  setLastMessage: (message) => set({ lastMessage: message }),
  addSubscription: (tokenAddress) =>
    set((state) => ({
      subscriptions: new Set([...state.subscriptions, tokenAddress]),
    })),
  removeSubscription: (tokenAddress) =>
    set((state) => {
      const newSubscriptions = new Set(state.subscriptions);
      newSubscriptions.delete(tokenAddress);
      return { subscriptions: newSubscriptions };
    }),
  clearSubscriptions: () => set({ subscriptions: new Set() }),
}));

// Notification Store
interface NotificationStore {
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
    persistent?: boolean;
  }>;
  
  addNotification: (notification: Omit<NotificationStore['notifications'][0], 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  
  addNotification: (notification) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    set((state) => ({
      notifications: [
        {
          ...notification,
          id,
          timestamp: Date.now(),
          read: false,
        },
        ...state.notifications,
      ].slice(0, 50), // Keep only last 50 notifications
    }));
    
    // Auto-remove non-persistent notifications after 5 seconds
    if (!notification.persistent) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id),
        }));
      }, 5000);
    }
  },
  
  removeNotification: (id) =>
    set((state)
