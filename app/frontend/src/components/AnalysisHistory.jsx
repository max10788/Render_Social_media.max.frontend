// src/components/AnalysisHistory.jsx
import React, { useState, useEffect } from 'react';
import { History, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';

const AnalysisHistory = ({ onSelectAnalysis }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalysisHistory();
    }, []);

    const fetchAnalysisHistory = async () => {
        try {
            // Get session ID from sessionStorage or generate one
            let sessionId = sessionStorage.getItem('analysis_session_id');
            if (!sessionId) {
                sessionId = Date.now().toString();
                sessionStorage.setItem('analysis_session_id', sessionId);
            }

            const response = await fetch(`/api/analyze/history?session_id=${sessionId}`);
            const data = await response.json();
            setHistory(data);
        } catch (error) {
            console.error('Error fetching analysis history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        if (score >= 40) return 'text-orange-600';
        return 'text-red-600';
    };

    const formatAddress = (address) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-12 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-4">
                    <History className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Analysis History</h3>
                </div>
                <p className="text-gray-500 text-center py-8">
                    No previous analyses found. Start by analyzing a token above.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <History className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Analysis History</h3>
                </div>
                <span className="text-sm text-gray-500">{history.length} analyses</span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
                {history.map((analysis) => (
                    <div
                        key={analysis.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => onSelectAnalysis(analysis)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                    <span className="inline-block w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center uppercase">
                                        {analysis.chain.slice(0, 2)}
                                    </span>
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <span className="font-medium text-gray-900">
                                            {analysis.token_symbol || 'Unknown'}
                                        </span>
                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                            {formatAddress(analysis.token_address)}
                                        </code>
                                    </div>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <span className="text-xs text-gray-500">
                                            {new Date(analysis.analysis_date).toLocaleDateString()}
                                        </span>
                                        {analysis.risk_flags && analysis.risk_flags.length > 0 && (
                                            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                                {analysis.risk_flags.length} risk(s)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className={`text-lg font-bold ${getScoreColor(analysis.total_score)}`}>
                                    {analysis.total_score.toFixed(1)}
                                </span>
                                {analysis.total_score >= 70 ? (
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AnalysisHistory;
