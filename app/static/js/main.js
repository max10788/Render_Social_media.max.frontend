// Global constants
const API_BASE_URL = '/api/v1';
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price';

let api;
let transactionGraph;
let dashboardState;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded'); // Debug log
    
    // Initialize API
    api = new API(API_BASE_URL);
    
    // Initialize dashboard state
    dashboardState = new DashboardState();
    
    // Initialize transaction graph
    const container = document.getElementById('transactionTree');
    transactionGraph = new TransactionGraph('#transactionTree', {
        width: container.clientWidth,
        height: 600,
        nodeRadius: 8,
        linkDistance: 120
    });

    // Track Button Event Listener
    const trackButton = document.getElementById('trackButton');
    if (trackButton) {
        trackButton.addEventListener('click', async function(e) {
            e.preventDefault();
            console.log('Track button clicked'); // Debug log

            try {
                // Show loading state
                dashboardState.setLoading(true);
                document.getElementById('loadingIndicator').style.display = 'block';
                document.getElementById('transactionTree').innerHTML = '<div class="loading">Loading transaction data...</div>';
                
                // Get form values
                const startTx = document.getElementById('startTx').value;
                const targetCurrency = document.getElementById('targetCurrency').value;
                const numTransactions = document.getElementById('numTransactions').value;

                console.log('Form values:', { startTx, targetCurrency, numTransactions }); // Debug log

                // Validate input
                if (!startTx) {
                    throw new Error('Please enter a transaction hash');
                }

                // Call API
                const response = await fetch(`${API_BASE_URL}/track-transactions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        start_tx_hash: startTx,
                        target_currency: targetCurrency,
                        num_transactions: parseInt(numTransactions)
                    })
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

                // Update UI with results
                updateTransactionInfo(data);
                
                // Update visualization
                if (data.transactions && data.transactions.length > 0) {
                    await visualizeTransactionPath(data);
                }

                // Show success message
                showSuccessMessage('Transaction data loaded successfully');

            } catch (error) {
                console.error('Error tracking transactions:', error);
                document.getElementById('transactionTree').innerHTML = `
                    <div class="error-message">
                        <h3>Error</h3>
                        <p>${error.message}</p>
                    </div>`;
                
                // Clear info panels on error
                updateTransactionInfo({});
            } finally {
                // Hide loading indicator
                document.getElementById('loadingIndicator').style.display = 'none';
                // Reset loading state
                dashboardState.setLoading(false);
            }
        });
        console.log('Track button listener added'); // Debug log
    } else {
        console.error('Track button not found');
    }

    // Add window resize handler
    window.addEventListener('resize', () => {
        if (transactionGraph) {
            const container = document.getElementById('transactionTree');
            transactionGraph.resize(container.clientWidth, 600);
        }
    });
});

// Make functions globally available
window.updateTransactionInfo = function(data) {
    const getNestedValue = (obj, path, defaultValue = '-') =>
        path.split('.').reduce((current, key) => 
            current && current[key] !== undefined ? current[key] : defaultValue, obj);

    // Update wallet information
    document.getElementById('sourceWallet').textContent = 
        getNestedValue(data, 'transactions.0.from_wallet');
    document.getElementById('targetWallet').textContent = 
        getNestedValue(data, 'transactions.0.to_wallet');
    document.getElementById('startHash').textContent = 
        getNestedValue(data, 'transactions.0.tx_hash');

    // Update transaction statistics
    document.getElementById('txCount').textContent = 
        getNestedValue(data, 'statistics.total_transactions', '0');
    document.getElementById('totalValue').textContent = 
        `${getNestedValue(data, 'statistics.total_amount', '0')} SOL`;
    document.getElementById('finalStatus').textContent = 
        getNestedValue(data, 'scenarios.0.type', 'Unknown');

    // Update conversion information
    const targetCurrency = document.getElementById('targetCurrency').value;
    document.getElementById('targetCurrencyDisplay').textContent = targetCurrency;

    const exchangeRate = getNestedValue(data, 'statistics.exchange_rate', '0');
    document.getElementById('exchangeRate').textContent = 
        `${exchangeRate} ${targetCurrency}/SOL`;

    const totalAmount = parseFloat(getNestedValue(data, 'statistics.total_amount', '0'));
    const convertedValue = totalAmount * parseFloat(exchangeRate);
    document.getElementById('convertedValue').textContent = 
        `${convertedValue.toFixed(2)} ${targetCurrency}`;
}

window.visualizeTransactionPath = function(data) {
    if (!transactionGraph) {
        console.error('Transaction graph not initialized');
        return;
    }

    const nodes = data.transactions.map(tx => ({
        id: tx.from_wallet,
        value: tx.amount,
        type: 'wallet'
    }));

    const links = data.transactions.map(tx => ({
        source: tx.from_wallet,
        target: tx.to_wallet,
        value: tx.amount
    }));

    transactionGraph.updateGraph({ nodes, links });
}
