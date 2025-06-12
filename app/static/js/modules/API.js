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
            const transactionTree = document.getElementById('transactionTree');
            if (transactionTree) {
                transactionTree.innerHTML = '<div class="loading">Loading transaction data...</div>';
            }

            // Get form values
            const startTx = document.getElementById('startTx');
            const targetCurrency = document.getElementById('targetCurrency');
            const numTransactions = document.getElementById('numTransactions');

            if (!startTx || !targetCurrency || !numTransactions) {
                throw new Error('Required form elements not found');
            }

            const formData = {
                start_tx_hash: startTx.value,
                target_currency: targetCurrency.value,
                num_transactions: parseInt(numTransactions.value)
            };

            // Validate input
            if (!formData.start_tx_hash) {
                throw new Error('Please enter a transaction hash');
            }

            console.log('Sending request with data:', formData); // Debug log

            const response = await fetch(`${this.baseUrl}/track-transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            console.log('Response status:', response.status); // Debug log

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received data:', data); // Debug log
            
            if (data.status === 'no_chain_found') {
                throw new Error('No transaction chain found');
            }

            // Update UI immediately after receiving data
            await this.updateUI(data);

            return data;
        });
    }

    async updateUI(data) {
        try {
            // Update transaction info
            if (typeof window.updateTransactionInfo === 'function') {
                window.updateTransactionInfo(data);
            } else {
                console.error('updateTransactionInfo function not found');
            }
            
            // Update visualization if we have transaction data
            if (data.transactions && data.transactions.length > 0) {
                if (typeof window.visualizeTransactionPath === 'function') {
                    await window.visualizeTransactionPath(data);
                } else {
                    console.error('visualizeTransactionPath function not found');
                }
            }
        } catch (error) {
            console.error('Error updating UI:', error);
            this.handleError(error);
        }
    }

    handleError(error) {
        console.error('Error:', error);
        const transactionTree = document.getElementById('transactionTree');
        if (transactionTree) {
            transactionTree.innerHTML = `
                <div class="error-message">
                    <h3>Error</h3>
                    <p>${error.message}</p>
                </div>`;
        }
            
        // Clear info panels on error
        if (typeof window.updateTransactionInfo === 'function') {
            window.updateTransactionInfo({});
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
