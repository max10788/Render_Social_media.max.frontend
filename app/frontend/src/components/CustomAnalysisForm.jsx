import React, { useState } from 'react';
import { Search, AlertCircle, Loader2 } from 'lucide-react';

const CustomAnalysisForm = ({ onAnalysisComplete }) => {
    const [formData, setFormData] = useState({
        tokenAddress: '',
        chain: 'ethereum'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    const chainOptions = [
        { value: 'ethereum', label: 'Ethereum', icon: '⟠' },
        { value: 'bsc', label: 'Binance Smart Chain', icon: '🟡' },
        { value: 'solana', label: 'Solana', icon: '🟣' },
        { value: 'sui', label: 'Sui', icon: '🔵' }
    ];

    const validateAddress = (address, chain) => {
        const errors = {};
        
        if (!address) {
            errors.tokenAddress = 'Token address is required';
            return errors;
        }

        switch (chain) {
            case 'ethereum':
            case 'bsc':
                if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
                    errors.tokenAddress = 'Invalid Ethereum/BSC address format';
                }
                break;
            case 'solana':
                if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
                    errors.tokenAddress = 'Invalid Solana address format';
                }
                break;
            case 'sui':
                if (!/^0x[a-fA-F0-9]{64}$/.test(address)) {
                    errors.tokenAddress = 'Invalid Sui address format';
                }
                break;
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const errors = validateAddress(formData.tokenAddress, formData.chain);
        setValidationErrors(errors);
        
        if (Object.keys(errors).length > 0) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/analyze/custom', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                onAnalysisComplete(result);
                setFormData({ tokenAddress: '', chain: 'ethereum' });
            } else {
                setError(result.error_message || 'Analysis failed');
            }
        } catch (err) {
            setError('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        
        // Clear validation errors when user starts typing
        if (validationErrors[field]) {
            setValidationErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const getAddressPlaceholder = () => {
        switch (formData.chain) {
            case 'ethereum':
            case 'bsc':
                return '0x1234567890123456789012345678901234567890';
            case 'solana':
                return 'So11111111111111111111111111111111111111112';
            case 'sui':
                return '0x1234567890123456789012345678901234567890123456789012345678901234';
            default:
                return 'Enter token address';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Analyze Custom Token
                </h2>
                <p className="text-gray-600 text-sm">
                    Enter a token address to get detailed analysis across multiple chains
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="chain" className="block text-sm font-medium text-gray-700 mb-2">
                        Blockchain
                    </label>
                    <select
                        id="chain"
                        value={formData.chain}
                        onChange={(e) => handleInputChange('chain', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                    >
                        {chainOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.icon} {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="tokenAddress" className="block text-sm font-medium text-gray-700 mb-2">
                        Token Address
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            id="tokenAddress"
                            value={formData.tokenAddress}
                            onChange={(e) => handleInputChange('tokenAddress', e.target.value)}
                            placeholder={getAddressPlaceholder()}
                            className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm ${
                                validationErrors.tokenAddress ? 'border-red-500' : 'border-gray-300'
                            }`}
                            disabled={loading}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                    </div>
                    {validationErrors.tokenAddress && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {validationErrors.tokenAddress}
                        </p>
                    )}
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            {error}
                        </p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Search className="h-4 w-4 mr-2" />
                            Analyze Token
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default CustomAnalysisForm;
