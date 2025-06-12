// Global constants
const API_BASE_URL = '/api/v1';
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price'; 

let api;
let transactionGraph;
let dashboardState;

// Logging when script is loaded
console.log('main.js loaded');

// Track script load states
const scriptsLoaded = {
    api: false,
    graph: false,
    dashboard: false
};

function checkAllScriptsLoaded() {
    if (Object.values(scriptsLoaded).every(loaded => loaded)) {
        console.log('All scripts loaded, initializing...');
        initializeApp();
    }
}

function initializeApp() {
    console.log('DOMContentLoaded event fired'); // Debug log

    // Initialize API
    try {
        api = new API(API_BASE_URL);
        console.log('API initialized'); // Debug-Ausgabe
    } catch (err) {
        console.error('Failed to initialize API:', err);
    }

    // Initialize dashboard state
    try {
        dashboardState = new DashboardState();
        console.log('DashboardState initialized'); // Debug-Ausgabe
    } catch (err) {
        console.error('Failed to initialize DashboardState:', err);
    }

    // Initialize transaction graph
    const container = document.getElementById('transactionTree');
    if (container) {
        try {
            transactionGraph = new TransactionGraph('#transactionTree', {
                width: container.clientWidth,
                height: 600,
                nodeRadius: 8,
                linkDistance: 120
            });
            console.log('TransactionGraph initialized');
        } catch (err) {
            console.error('Failed to initialize TransactionGraph:', err);
        }
    } else {
        console.warn('TransactionGraph container not found');
    }

    // Überprüfe ob der Button existiert
    const trackButton = document.getElementById('trackButton');
    console.log('Track button element:', trackButton); // Debug-Ausgabe

    if (trackButton) {
        trackButton.addEventListener('click', async (event) => {
            console.log('Track button clicked'); // Debug-Ausgabe
            event.preventDefault();
            handleTrackButtonClick(event);
        });
        console.log('Track button listener added'); // Debug-Ausgabe
    } else {
        console.error('Track button not found');
    }

    // Alternative Event Listener
    document.querySelector('#trackButton')?.addEventListener('click', function(event) {
        console.log('Track button clicked (alternative listener)');
        handleTrackButtonClick(event);
    });

    // Add window resize handler
    window.addEventListener('resize', () => {
        if (transactionGraph) {
            const container = document.getElementById('transactionTree');
            transactionGraph.resize(container.clientWidth, 600);
        }
    });
}

// Handle Track Button Click
async function handleTrackButtonClick(event) {
    console.log('handleTrackButtonClick function called'); // Debug-Ausgabe

    try {
        // Show loading state
        dashboardState.setLoading(true);
        console.log('Loading state set to true'); // Debug-Ausgabe

        document.getElementById('loadingIndicator').style.display = 'block';
        document.getElementById('transactionTree').innerHTML = '<div class="loading">Loading transaction data...</div>';

        // Get form values
        const startTx = document.getElementById('startTx').value;
        const targetCurrency = document.getElementById('targetCurrency').value;
        const numTransactions = document.getElementById('numTransactions').value;

        console.log('Form values:', { startTx, targetCurrency, numTransactions }); // Debug-Ausgabe

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
        console.error('Error in handleTrackButtonClick:', error);
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
}

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
};

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
};

// Global error handler
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Global error:', {
        message: msg,
        url: url,
        lineNo: lineNo,
        columnNo: columnNo,
        error: error
    });
    return false; // Return false to let the browser's default handler run
};

// Trigger DOMContentLoaded manually after all scripts are loaded
document.addEventListener('DOMContentLoaded', () => {
    scriptsLoaded.dashboard = typeof DashboardState === 'function';
    scriptsLoaded.graph = typeof TransactionGraph === 'function';
    scriptsLoaded.api = typeof API === 'function';

    checkAllScriptsLoaded();
});
