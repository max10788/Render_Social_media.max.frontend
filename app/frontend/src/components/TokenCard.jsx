// src/components/TokenCard.jsx
import React from 'react';

// Assume these utility functions are moved to utils/formatters.js and imported
// For now, defining them locally or assuming they are globally available
// import { formatCurrency, formatPercent, getScoreColor, getRiskBadgeColor } from '../utils/formatters';

// Placeholder implementations if not imported
const formatCurrency = (value) => {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const formatPercent = (value, decimals = 1) => {
    return `${value.toFixed(decimals)}%`;
};

const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
};

const getRiskBadgeColor = (riskFlags) => {
    if (riskFlags.length === 0) return 'bg-green-100 text-green-800';
    if (riskFlags.length <= 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
};

const TokenCard = ({ token, onClick }) => (
    <div
        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border"
        onClick={() => onClick(token)}
    >
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="text-lg font-semibold text-gray-900">{token.symbol}</h3>
                <p className="text-sm text-gray-600">{token.name}</p>
                <p className="text-xs text-gray-500">{token.chain.toUpperCase()}</p>
            </div>
            <div className="text-right">
                <div className={`text-2xl font-bold ${getScoreColor(token.score)}`}>
                    {token.score.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">Score</div>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
                <div className="text-sm font-medium text-gray-900">{formatCurrency(token.marketCap)}</div>
                <div className="text-xs text-gray-500">Market Cap</div>
            </div>
            <div>
                <div className="text-sm font-medium text-gray-900">{formatCurrency(token.volume24h)}</div>
                <div className="text-xs text-gray-500">24h Volume</div>
            </div>
            <div>
                <div className="text-sm font-medium text-gray-900">{token.holders.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Holders</div>
            </div>
            <div>
                <div className={`text-sm font-medium ${token.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {token.priceChange24h >= 0 ? '+' : ''}{formatPercent(token.priceChange24h)}
                </div>
                <div className="text-xs text-gray-500">24h Change</div>
            </div>
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
            <span className={`px-2 py-1 rounded-full text-xs ${getRiskBadgeColor(token.riskFlags)}`}>
                {token.riskFlags.length === 0 ? 'Low Risk' : `${token.riskFlags.length} Risks`}
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {token.whaleWallets} Whales
            </span>
        </div>
        <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Gini: {token.giniCoeff.toFixed(3)}</span>
            <span>{new Date(token.lastAnalyzed).toLocaleTimeString()}</span>
        </div>
    </div>
);

export default TokenCard;
