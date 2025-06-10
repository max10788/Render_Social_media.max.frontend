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

function updateTransactionInfo(data) {
    const getNestedValue = (obj, path, defaultValue = '-') =>
        path.split('.').reduce((current, key) => current && current[key] !== undefined ? current[key] : defaultValue, obj);

    document.getElementById('sourceWallet').textContent = getNestedValue(data, 'transactions.0.from_wallet');
    document.getElementById('targetWallet').textContent = getNestedValue(data, 'transactions.0.to_wallet');
    document.getElementById('startHash').textContent = getNestedValue(data, 'transactions.0.tx_hash');

    document.getElementById('txCount').textContent = getNestedValue(data, 'statistics.total_transactions', '0');
    document.getElementById('totalValue').textContent = `${getNestedValue(data, 'statistics.total_amount', '0')} SOL`;
    document.getElementById('finalStatus').textContent = getNestedValue(data, 'scenarios.0.type', 'Unknown');

    const targetCurrency = document.getElementById('targetCurrency').value;
    document.getElementById('targetCurrencyDisplay').textContent = targetCurrency;

    const exchangeRate = getNestedValue(data, 'statistics.exchange_rate', '0');
    document.getElementById('exchangeRate').textContent = `${exchangeRate} ${targetCurrency}/SOL`;

    const totalAmount = parseFloat(getNestedValue(data, 'statistics.total_amount', '0'));
    const convertedValue = totalAmount * parseFloat(exchangeRate);
    document.getElementById('convertedValue').textContent = `${convertedValue.toFixed(2)} ${targetCurrency}`;

    if (data.transactions && data.transactions.length > 0) {
        showSuccessMessage('Transaktionsdaten wurden erfolgreich geladen');
    }
}

function showSuccessMessage(message) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'success-message';
    resultDiv.textContent = message;
    document.querySelector('.visualization').prepend(resultDiv);
    setTimeout(() => resultDiv.remove(), 3000);
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
