// Global constants
const API_BASE_URL = '/api/v1';
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price';

let api;
let transactionGraph;
let dashboardState;

document.addEventListener('DOMContentLoaded', function() {
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

    // Add event listener for the track button
    document.getElementById('trackButton').addEventListener('click', handleTrackButtonClick);

    // Add form submission handler
    document.getElementById('analysisForm').addEventListener('submit', handleAnalysisSubmit);
});

async function handleAnalysisSubmit(event) {
    event.preventDefault();
    try {
        // Show loading state
        document.getElementById('transactionTree').innerHTML = 
            '<div class="loading">Loading transaction data...</div>';

        // Get form values
        const startTxHash = document.getElementById('startTx').value;
        const targetCurrency = document.getElementById('targetCurrency').value;
        const numTransactions = document.getElementById('numTransactions').value;
        const amount = document.getElementById('amount')?.value;

        // Validate input
        if (!startTxHash) {
            throw new Error('Please enter a transaction hash');
        }

        // Make API call
        const response = await fetch(`${API_BASE_URL}/track-transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                start_tx_hash: startTxHash,
                target_currency: targetCurrency,
                num_transactions: parseInt(numTransactions),
                amount: amount ? parseFloat(amount) : null
            })
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
        updateTransactionInfo(data);
        
        // Update visualization
        if (data.transactions && data.transactions.length > 0) {
            await visualizeTransactionPath(data);
        }

        // Show success message
        showSuccessMessage('Transaction data loaded successfully');

    } catch (error) {
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

function visualizeTransactionPath(data) {
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

    // Add window resize handler
window.addEventListener('resize', () => {
    if (transactionGraph) {
        const container = document.getElementById('transactionTree');
        transactionGraph.resize(container.clientWidth, 600);
    }
});

    transactionGraph.updateGraph({ nodes, links });
}
