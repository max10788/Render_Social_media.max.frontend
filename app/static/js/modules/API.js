export class API {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async safeApiCall(apiFunc) {
        try {
            const result = await apiFunc();
            return { success: true, data: result };
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: error.message };
        }
    }

    async trackTransactions() {
        return this.safeApiCall(async () => {
            // Show loading state
            document.getElementById('transactionTree').innerHTML = 
                '<div class="loading">Loading transaction data...</div>';

            const formData = {
                start_tx_hash: document.getElementById('startTx').value,
                target_currency: document.getElementById('targetCurrency').value,
                num_transactions: parseInt(document.getElementById('numTransactions').value),
                amount: parseFloat(document.getElementById('amount')?.value || '0')
            };

            // Validate input
            if (!formData.start_tx_hash) {
                throw new Error('Please enter a transaction hash');
            }

            const response = await fetch(`${this.baseUrl}/track-transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.status === 'no_chain_found') {
                throw new Error('No transaction chain found');
            }

            // Update UI with results
            await this.updateUI(data);
            
            return data;
        });
    }

    async updateUI(data) {
        try {
            // Update transaction info
            updateTransactionInfo(data);
            
            // Update visualization if we have transaction data
            if (data.transactions && data.transactions.length > 0) {
                await visualizeTransactionPath(data);
            }
        } catch (error) {
            console.error('Error updating UI:', error);
            throw error;
        }
    }

    async getExchangeRate(from, to) {
        return this.safeApiCall(async () => {
            const response = await fetch(`${COINGECKO_API_URL}?ids=${from}&vs_currencies=${to}`);
            if (!response.ok) {
                throw new Error('Failed to fetch exchange rate');
            }
            const data = await response.json();
            return data[from.toLowerCase()][to.toLowerCase()];
        });
    }

    async analyzeTransactions(formData) {
        return this.safeApiCall(async () => {
            const response = await fetch(`${this.baseUrl}/analyze/rule-based`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            return response.json();
        });
    }

    async getAnalysisStatus(jobId) {
        return this.safeApiCall(async () => {
            const response = await fetch(`${this.baseUrl}/analysis/status/${jobId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch analysis status');
            }
            return response.json();
        });
    }

    handleError(error) {
        console.error('Error:', error);
        document.getElementById('transactionTree').innerHTML = `
            <div class="error-message">
                <h3>Error</h3>
                <p>${error.message}</p>
            </div>`;
            
        // Clear info panels on error
        updateTransactionInfo({});
    }
}
