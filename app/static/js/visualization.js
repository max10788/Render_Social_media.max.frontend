function displayResults(status) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <div class="analysis-results">
            <h3>Analyse abgeschlossen!</h3>
            <div class="results-grid">
                <div class="result-card">
                    <h4>Blockchain-Daten</h4>
                    <p>Analysierte Transaktionen: ${status.analyzed_transactions || 0}</p>
                    <p>Gefundene Wallets: ${status.potential_wallets ? status.potential_wallets.length : 0}</p>
                </div>
                <div class="result-card">
                    <h4>Social Media Daten</h4>
                    <p>Analysierte Tweets: ${status.analyzed_tweets || 0}</p>
                </div>
            </div>
            ${status.potential_wallets && status.potential_wallets.length > 0 ? `
                <div class="wallets-list">
                    <h4>Gefundene Wallet-Adressen:</h4>
                    <ul>
                        ${status.potential_wallets.map(wallet => `
                            <li>
                                <code>${wallet}</code>
                                <button onclick="copyToClipboard('${wallet}')" class="copy-btn">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : '<p>Keine Wallet-Adressen gefunden.</p>'}
            <div id="transactionTree" style="width:100%; height:600px; border:1px solid #ccc;"></div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', function() {
    initializeTransactionGraph();
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            if (transactionGraph) {
                const container = document.getElementById('transactionTree');
                transactionGraph = new TransactionGraph('#transactionTree', {
                    width: container.clientWidth,
                    height: 600,
                    nodeRadius: 8,
                    linkDistance: 120
                });
            }
        }, 250);
    });
});
