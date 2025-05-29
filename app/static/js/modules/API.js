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

    async trackTransactions(params) {
        return this.safeApiCall(async () => {
            const response = await fetch(`${this.baseUrl}/track-transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            return response.json();
        });
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
}
