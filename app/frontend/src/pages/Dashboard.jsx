// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Search, Refresh, Download, Settings, Filter } from 'lucide-react';
import TokenCard from '../components/TokenCard';
import TokenDetailModal from '../components/TokenDetailModal';
import DashboardStats from '../components/DashboardStats';
// Assume useApi hook is created
// import useApi from '../hooks/useApi';

// For now, using mock data and simulating API calls
const LowCapAnalyzerDashboard = () => {
    // State Management
    const [tokens, setTokens] = useState([]);
    const [filteredTokens, setFilteredTokens] = useState([]);
    const [selectedToken, setSelectedToken] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('score');
    const [filterScore, setFilterScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [scanStatus, setScanStatus] = useState(null);
    const [analytics, setAnalytics] = useState({});

    // Simulate API call with mock data
    useEffect(() => {
        const fetchDashboardData = async () => {
            // In a real app, you would call your API here
            // const data = await api.getDashboardData();
            // setTokens(data.tokens);
            // setAnalytics(data.analytics);
            // setScanStatus(data.scanStatus);

            // Mock Data
            const mockTokens = [
                {
                    id: 1,
                    address: '0x1234...5678',
                    name: 'SafeMoon Ultra',
                    symbol: 'SMUL',
                    chain: 'ethereum',
                    marketCap: 2500000,
                    volume24h: 150000,
                    score: 85.5,
                    liquidityUSD: 80000,
                    holders: 1250,
                    whaleWallets: 3,
                    devWallets: 1,
                    rugpullSuspects: 0,
                    giniCoeff: 0.45,
                    lastAnalyzed: '2025-01-01T10:30:00Z',
                    riskFlags: [],
                    priceChange24h: 15.2
                },
                {
                    id: 2,
                    address: '0xabcd...efgh',
                    name: 'DeFi Rocket',
                    symbol: 'DRKT',
                    chain: 'bsc',
                    marketCap: 1800000,
                    volume24h: 95000,
                    score: 72.3,
                    liquidityUSD: 45000,
                    holders: 890,
                    whaleWallets: 5,
                    devWallets: 2,
                    rugpullSuspects: 1,
                    giniCoeff: 0.62,
                    lastAnalyzed: '2025-01-01T10:25:00Z',
                    riskFlags: ['high_concentration'],
                    priceChange24h: -8.5
                },
                {
                    id: 3,
                    address: '0x9876...5432',
                    name: 'Moon Token',
                    symbol: 'MOON',
                    chain: 'ethereum',
                    marketCap: 4200000,
                    volume24h: 320000,
                    score: 91.2,
                    liquidityUSD: 150000,
                    holders: 2100,
                    whaleWallets: 2,
                    devWallets: 1,
                    rugpullSuspects: 0,
                    giniCoeff: 0.38,
                    lastAnalyzed: '2025-01-01T10:20:00Z',
                    riskFlags: [],
                    priceChange24h: 28.7
                }
            ];
            setTokens(mockTokens);
            setFilteredTokens(mockTokens);
            setLoading(false);

            // Mock Analytics
            setAnalytics({
                totalTokensScanned: 156,
                highScoreTokens: 23,
                averageScore: 68.4,
                totalMarketCap: 45600000,
                lastScanTime: '2025-01-01T10:30:00Z'
            });

            setScanStatus({
                isRunning: false,
                lastRun: '2025-01-01T10:30:00Z',
                nextRun: '2025-01-01T16:30:00Z',
                tokensProcessed: 156,
                successRate: 94.2
            });
        };

        fetchDashboardData();
    }, []);

    // Filter und Such-Funktionen
    useEffect(() => {
        let filtered = tokens.filter(token => {
            const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                token.address.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesScore = token.score >= filterScore;
            return matchesSearch && matchesScore;
        });

        // Sortierung
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'score':
                    return b.score - a.score;
                case 'marketCap':
                    return b.marketCap - a.marketCap;
                case 'volume':
                    return b.volume24h - a.volume24h;
                case 'holders':
                    return b.holders - a.holders;
                default:
                    return 0;
            }
        });

        setFilteredTokens(filtered);
    }, [tokens, searchTerm, sortBy, filterScore]);

    // Simulate refreshing data
    const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => {
            // In a real app, re-fetch data from API
            setLoading(false);
        }, 1000); // Simulate network delay
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-2xl font-bold text-gray-700">Loading Dashboard...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Low-Cap Token Analyzer</h1>
                    <p className="text-gray-600">Identify promising low-cap tokens with high potential</p>
                </header>

                <DashboardStats analytics={analytics} scanStatus={scanStatus} />

                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search tokens..."
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                                <Filter className="h-5 w-5 text-gray-400 mr-2" />
                                <span className="text-sm text-gray-700 mr-2">Min Score:</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                                    value={filterScore}
                                    onChange={(e) => setFilterScore(Number(e.target.value))}
                                />
                            </div>
                            <select
                                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="score">Sort by Score</option>
                                <option value="marketCap">Sort by Market Cap</option>
                                <option value="volume">Sort by Volume</option>
                                <option value="holders">Sort by Holders</option>
                            </select>
                            <button
                                onClick={handleRefresh}
                                className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                            >
                                <Refresh className="h-4 w-4 mr-1" />
                                Refresh
                            </button>
                            <button className="flex items-center px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm">
                                <Download className="h-4 w-4 mr-1" />
                                Export
                            </button>
                            <button className="flex items-center px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm">
                                <Settings className="h-4 w-4 mr-1" />
                                Settings
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTokens.map(token => (
                            <TokenCard key={token.id} token={token} onClick={setSelectedToken} />
                        ))}
                    </div>
                </div>
            </div>

            {selectedToken && (
                <TokenDetailModal token={selectedToken} onClose={() => setSelectedToken(null)} />
            )}
        </div>
    );
};

export default LowCapAnalyzerDashboard;
