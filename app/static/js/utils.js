function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = 'In Zwischenablage kopiert!';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    });
}

function showErrorInResult(message) {
    document.getElementById('result').innerHTML = `
        <div class="error-message">
            <h3>Fehler</h3>
            <p>${message}</p>
        </div>
    `;
}

function showLoading() {
    const container = document.getElementById('transactionTree');
    container.innerHTML = '<p>Lade Transaktionspfad...</p>';
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
}

window.visualizeTransactionPath = function(data) {
    if (!window.transactionGraph) {
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

    window.transactionGraph.updateGraph({ nodes, links });
}


window.showSuccessMessage = function(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    
    const container = document.querySelector('.visualization');
    if (container) {
        container.insertBefore(messageDiv, container.firstChild);
        setTimeout(() => messageDiv.remove(), 3000);
    }
}

function showErrorInResult(message) {
    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
        <div class="error-message">
            <h3>Error</h3>
            <p>${message}</p>
        </div>
    `;
}

function validateTransactionHash(hash) {
    // Basic Solana transaction hash validation
    const validFormat = /^[A-HJ-NP-Za-km-z1-9]*$/.test(hash);
    const validLength = hash.length === 88;
    return validFormat && validLength;
}

function shortenAddress(address, length = 8) {
    if (!address) return '';
    return `${address.substring(0, length)}...${address.substring(address.length - length)}`;
}

function calculateTransactionMetrics(transactions) {
    return {
        totalVolume: transactions.reduce((sum, tx) => sum + tx.amount, 0),
        averageAmount: transactions.reduce((sum, tx) => sum + tx.amount, 0) / transactions.length,
        uniqueWallets: new Set([
            ...transactions.map(tx => tx.from_wallet),
            ...transactions.map(tx => tx.to_wallet)
        ]).size,
        transactionCount: transactions.length
    };
}

function displayTransactionMetrics(metrics) {
    const metricsContainer = document.createElement('div');
    metricsContainer.className = 'metrics-container';
    metricsContainer.innerHTML = `
        <div class="metric-card">
            <h4>Total Volume</h4>
            <p>${metrics.totalVolume.toFixed(4)} SOL</p>
        </div>
        <div class="metric-card">
            <h4>Average Amount</h4>
            <p>${metrics.averageAmount.toFixed(4)} SOL</p>
        </div>
        <div class="metric-card">
            <h4>Unique Wallets</h4>
            <p>${metrics.uniqueWallets}</p>
        </div>
        <div class="metric-card">
            <h4>Transactions</h4>
            <p>${metrics.transactionCount}</p>
        </div>
    `;

    const existingMetrics = document.querySelector('.metrics-container');
    if (existingMetrics) {
        existingMetrics.replaceWith(metricsContainer);
    } else {
        document.getElementById('txStats').appendChild(metricsContainer);
    }
}
