// src/components/CustomAnalysisResults.jsx
import React from 'react';
import { 
    TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
    ExternalLink, Copy, Users, DollarSign, Activity 
} from 'lucide-react';

// DashboardStats component - make it the default export if this is what's being imported elsewhere
function DashboardStats() {
  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-2">Dashboard-Statistiken</h2>
      <p>Statistiken werden hier angezeigt …</p>
    </div>
  );
}

const CustomAnalysisResults = ({ analysisResult, onClose }) => {
    if (!analysisResult || !analysisResult.success) {
        return null;
    }

    const { analysis_result, token_address, chain, analyzed_at } = analysisResult;
    const { token_info, score, metrics, risk_flags, wallet_analysis } = analysis_result;

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        if (score >= 40) return 'text-orange-500';
        return 'text-red-500';
    };

    const getScoreBgColor = (score) => {
        if (score >= 80) return 'bg-green-100';
        if (score >= 60) return 'bg-yellow-100';
        if (score >= 40) return 'bg-orange-100';
        return 'bg-red-100';
    };

    const getRiskFlagColor = (flag) => {
        const highRisk = ['rugpull_suspects_detected', 'single_holder_dominance'];
        const mediumRisk = ['high_dev_concentration', 'whale_dominance'];
        
        if (highRisk.some(risk => flag.includes(risk))) return 'bg-red-100 text-red-800';
        if (mediumRisk.some(risk => flag.includes(risk))) return 'bg-yellow-100 text-yellow-800';
        return 'bg-blue-100 text-blue-800';
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    const getChainExplorerUrl = (address, chain) => {
        const explorers = {
            ethereum: `https://etherscan.io/token/${address}`,
            bsc: `https://bscscan.com/token/${address}`,
            solana: `https://solscan.io/token/${address}`,
            sui: `https://suiexplorer.com/object/${address}`
        };
        return explorers[chain] || '#';
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
        return num?.toFixed(2) || '0';
    };

    const formatAddress = (address) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                {token_info.name} ({token_info.symbol})
                            </h2>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className="flex items-center">
                                    <span className="capitalize font-medium">{chain}</span>
                                </span>
                                <span className="flex items-center">
                                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                        {formatAddress(token_address)}
                                    </code>
                                    <button 
                                        onClick={() => copyToClipboard(token_address)}
                                        className="ml-1 p-1 hover:bg-gray-200 rounded"
                                    >
                                        <Copy className="h-3 w-3" />
                                    </button>
                                </span>
                                <a 
                                    href={getChainExplorerUrl(token_address, chain)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-blue-600 hover:text-blue-800"
                                >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Explorer
                                </a>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                        >
                            ×
                        </button>
                    </div>

                    {/* Score Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className={`p-4 rounded-lg ${getScoreBgColor(score)}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Overall Score</p>
                                    <p className={`text-2xl font-bold ${getScoreColor(score)}`}>
                                        {score.toFixed(1)}
                                    </p>
                                </div>
                                {score >= 70 ? (
                                    <CheckCircle className="h-8 w-8 text-green-500" />
                                ) : (
                                    <AlertTriangle className="h-8 w-8 text-red-500" />
                                )}
                            </div>
                        </div>
                        
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Market Cap</p>
                                    <p className="text-xl font-bold text-blue-600">
                                        ${formatNumber(token_info.market_cap)}
                                    </p>
                                </div>
                                <DollarSign className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>

                        <div className="p-4 bg-purple-50 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">24h Volume</p>
                                    <p className="text-xl font-bold text-purple-600">
                                        ${formatNumber(token_info.volume_24h)}
                                    </p>
                                </div>
                                <Activity className="h-6 w-6 text-purple-500" />
                            </div>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Holders</p>
                                    <p className="text-xl font-bold text-green-600">
                                        {formatNumber(token_info.holders_count)}
                                    </p>
                                </div>
                                <Users className="h-6 w-6 text-green-500" />
                            </div>
                        </div>
                    </div>

                    {/* Risk Flags */}
                    {risk_flags && risk_flags.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Risk Flags</h3>
                            <div className="flex flex-wrap gap-2">
                                {risk_flags.map((flag, index) => (
                                    <span
                                        key={index}
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskFlagColor(flag)}`}
                                    >
                                        {flag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Detailed Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Analysis Metrics</h3>
                            <div className="space-y-3">
                                {Object.entries(metrics).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 capitalize">
                                            {key.replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {typeof value === 'number' ? value.toFixed(1) : value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Wallet Analysis</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Total Wallets</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {wallet_analysis.total_wallets}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Dev Wallets</span>
                                    <span className={`text-sm font-medium ${wallet_analysis.dev_wallets > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {wallet_analysis.dev_wallets}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Whale Wallets</span>
                                    <span className={`text-sm font-medium ${wallet_analysis.whale_wallets > 5 ? 'text-red-600' : 'text-yellow-600'}`}>
                                        {wallet_analysis.whale_wallets}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Rugpull Suspects</span>
                                    <span className={`text-sm font-medium ${wallet_analysis.rugpull_suspects > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {wallet_analysis.rugpull_suspects}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Holders */}
                    {wallet_analysis.top_holders && wallet_analysis.top_holders.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Top Holders</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Address
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Balance
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Percentage
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                                Type
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {wallet_analysis.top_holders.slice(0, 10).map((holder, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-4 py-2">
                                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                        {formatAddress(holder.address)}
                                                    </code>
                                                </td>
                                                <td className="px-4 py-2 text-sm">
                                                    {formatNumber(holder.balance)}
                                                </td>
                                                <td className="px-4 py-2 text-sm">
                                                    {holder.percentage.toFixed(2)}%
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                                        holder.type === 'dev_wallet' ? 'bg-red-100 text-red-800' :
                                                        holder.type === 'whale_wallet' ? 'bg-yellow-100 text-yellow-800' :
                                                        holder.type === 'rugpull_suspect' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {holder.type.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 text-sm text-gray-500">
                        <span>
                            Analyzed at: {new Date(analyzed_at).toLocaleString()}
                        </span>
                        <span>
                            Chain: {chain.charAt(0).toUpperCase() + chain.slice(1)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Export DashboardStats as default (if that's what's being imported)
// and CustomAnalysisResults as named export
export default DashboardStats;
export { CustomAnalysisResults, DashboardStats };
