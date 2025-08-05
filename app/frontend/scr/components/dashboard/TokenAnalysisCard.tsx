import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Shield, 
  Users, 
  DollarSign,
  Star,
  Eye,
  ExternalLink,
  Clock
} from 'lucide-react';
import { TokenAnalysis, RiskLevel } from '../../lib/types';
import { useTokenAnalysisStore, useThemeStore } from '../../lib/stores';
import { formatNumber, formatCurrency, formatPercentage, getTimeAgo } from '../../lib/utils';

interface TokenAnalysisCardProps {
  analysis: TokenAnalysis;
  className?: string;
  showActions?: boolean;
  compact?: boolean;
}

const TokenAnalysisCard: React.FC<TokenAnalysisCardProps> = ({ 
  analysis, 
  className = '', 
  showActions = true,
  compact = false 
}) => {
  const { addToFavorites, removeFromFavorites, addToWatchlist, removeFromWatchlist, favorites, watchlist } = useTokenAnalysisStore();
  const { mode } = useThemeStore();
  
  const isFavorite = favorites.includes(analysis.token_info.address);
  const isWatched = watchlist.includes(analysis.token_info.address);
  
  const getRiskColor = (score: number): string => {
    if (score >= 80) return 'text-success-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-warning-500';
    return 'text-danger-500';
  };
  
  const getRiskBackground = (score: number): string => {
    if (score >= 80) return 'bg-success-500/10 border-success-500/20';
    if (score >= 60) return 'bg-yellow-500/10 border-yellow-500/20';
    if (score >= 40) return 'bg-warning-500/10 border-warning-500/20';
    return 'bg-danger-500/10 border-danger-500/20';
  };

  const handleFavoriteToggle = () => {
    if (isFavorite) {
      removeFromFavorites(analysis.token_info.address);
    } else {
      addToFavorites(analysis.token_info.address);
    }
  };

  const handleWatchlistToggle = () => {
    if (isWatched) {
      removeFromWatchlist(analysis.token_info.address);
    } else {
      addToWatchlist(analysis.token_info.address);
    }
  };

  const priceChangeColor = analysis.token_info.price_change_24h >= 0 
    ? 'text-success-500' 
    : 'text-danger-500';

  const PriceChangeIcon = analysis.token_info.price_change_24h >= 0 ? TrendingUp : TrendingDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`
        relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300
        ${mode === 'dark' 
          ? 'bg-gray-900/80 border-gray-800 hover:border-gray-700' 
          : 'bg-white/80 border-gray-200 hover:border-gray-300'
        }
        hover:shadow-lg ${className}
      `}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold truncate">
                {analysis.token_info.name}
              </h3>
              <span className={`
                px-2 py-1 rounded-md text-xs font-medium
                ${mode === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}
              `}>
                {analysis.token_info.symbol}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span className="font-medium">
                  {formatCurrency(analysis.token_info.price)}
                </span>
                <span className={`flex items-center gap-1 ${priceChangeColor}`}>
                  <PriceChangeIcon className="w-3 h-3" />
                  {formatPercentage(analysis.token_info.price_change_24h)}
                </span>
              </div>
            </div>
          </div>

          {/* Risk Score */}
          <div className={`
            flex items-center justify-center w-16 h-16 rounded-xl border-2
            ${getRiskBackground(analysis.score)}
          `}>
            <div className="text-center">
              <div className={`text-lg font-bold ${getRiskColor(analysis.score)}`}>
                {analysis.score}
              </div>
              <div className="text-xs text-gray-500">Risk</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-6 pb-4">
        <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-4`}>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Market Cap</div>
            <div className="font-semibold">
              {formatCurrency(analysis.token_info.market_cap, { compact: true })}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Volume 24h</div>
            <div className="font-semibold">
              {formatCurrency(analysis.token_info.volume_24h, { compact: true })}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Holders</div>
            <div className="font-semibold flex items-center justify-center gap-1">
              <Users className="w-3 h-3" />
              {formatNumber(analysis.token_info.holders_count, { compact: true })}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Liquidity</div>
            <div className="font-semibold">
              {formatCurrency(analysis.liquidity_info.liquidity_usd, { compact: true })}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Flags */}
      {analysis.risk_flags.length > 0 && (
        <div className="px-6 pb-4">
          <div className="flex flex-wrap gap-2">
            {analysis.risk_flags.slice(0, 3).map((flag, index) => (
              <span
                key={index}
                className={`
                  inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
                  ${mode === 'dark' 
                    ? 'bg-warning-500/20 text-warning-400 border border-warning-500/30' 
                    : 'bg-warning-50 text-warning-700 border border-warning-200'
                  }
                `}
              >
                <AlertTriangle className="w-3 h-3" />
                {flag}
              </span>
            ))}
            {analysis.risk_flags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{analysis.risk_flags.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Wallet Analysis Preview */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-500 mb-1">Dev Wallets</div>
            <div className={`font-semibold ${
              analysis.wallet_analysis.dev_wallets > 5 ? 'text-danger-500' : 'text-success-500'
            }`}>
              {analysis.wallet_analysis.dev_wallets}
            </div>
          </div>
          
          <div>
            <div className="text-xs text-gray-500 mb-1">Whales</div>
            <div className="font-semibold text-warning-500">
              {analysis.wallet_analysis.whale_wallets}
            </div>
          </div>
          
          <div>
            <div className="text-xs text-gray-500 mb-1">Suspects</div>
