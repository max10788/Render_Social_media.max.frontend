import { TransactionGraph } from '/static/js/modules/TransactionGraph.js';
import { generateCSS } from '/static/js/modules/TransactionStyles.js';

// Initialize visualization
document.addEventListener('DOMContentLoaded', () => {
    // Add styles to document
    const styleSheet = document.createElement('style');
    styleSheet.textContent = generateCSS();
    document.head.appendChild(styleSheet);

    // Create container for visualization
    const container = document.getElementById('transactionTree');

    // Initialize graph with explicit dimensions
    let currentGraph = null;

    // Function to create and initialize a new graph
    function initTransactionGraph(data) {
        const width = Math.max(800, window.innerWidth * 0.9);
        const height = Math.max(600, window.innerHeight * 0.7);

        // Clear previous content
        container.innerHTML = '';

        // Create new graph instance
        currentGraph = new TransactionGraph('#transactionTree', {
            width: width,
            height: height
        });

        if (data && data.tracked_transactions?.length > 0) {
            currentGraph.update(data.tracked_transactions);
        }
    }

    // Update function for new transaction data
    window.updateTransactionVisualization = (data) => {
        const tree = document.getElementById('transactionTree');
        const errorContainer = document.getElementById('errorContainer');

        // Clear previous content
        tree.innerHTML = '';
        errorContainer.style.display = 'none';

        console.log("Empfangene Rohdaten:", data);

        try {
            // 🔍 Prüfung auf tracked_transactions
            if (!data || !data.tracked_transactions || data.tracked_transactions.length === 0) {
                throw new Error('Keine Transaktionsdaten zum Visualisieren.');
            }

            // 🔍 Prüfung auf balance_changes
            const allHaveBalanceChanges = data.tracked_transactions.every(tx =>
                tx.balance_changes && Array.isArray(tx.balance_changes) && tx.balance_changes.length > 0
            );

            if (!allHaveBalanceChanges) {
                console.warn("Einige Transaktionen haben keine balance_changes.");
            }

            // 🔍 Prüfung auf from_wallet
            const allHaveFromWallet = data.tracked_transactions.every(tx =>
                tx.from_wallet && typeof tx.from_wallet === 'string' && tx.from_wallet.length > 40
            );

            if (!allHaveFromWallet) {
                console.warn("Einige Transaktionen haben kein gültiges from_wallet.");
            }

            // 🔍 Explizite Ausgabe von nodes, links und balance_changes
            console.log("tracked_transactions:", data.tracked_transactions);
            data.tracked_transactions.forEach((tx, i) => {
                console.log(`tracked_transactions[${i}].from_wallet:`, tx.from_wallet);
                console.log(`tracked_transactions[${i}].balance_changes:`, tx.balance_changes || []);
            });

            // Speichere Daten global für Resize
            window.currentTransactionData = data;

            // Initiale Visualisierung
            initTransactionGraph(data);

            // Statistikfelder befüllen
            const firstTx = data.tracked_transactions[0];

            document.getElementById('sourceWallet').textContent = firstTx?.from_wallet || '-';
            document.getElementById('targetWallet').textContent = data.final_wallet_address || '-';
            document.getElementById('txCount').textContent = data.total_transactions_tracked ?? '-';
            document.getElementById('totalValue').textContent =
                `${firstTx?.amount?.toFixed(4) ?? 'N/A'} SOL`;
            document.getElementById('finalStatus').textContent =
                data.tracked_transactions.length > 1 ? 'funds_transferred' : 'single_transfer';
            document.getElementById('targetCurrencyDisplay').textContent = data.target_currency;

        } catch (err) {
            console.error('Fehler bei der Visualisierung:', err);
            errorContainer.textContent = `Fehler beim Anzeigen der Transaktionen: ${err.message}`;
            errorContainer.style.display = 'block';
        }
    };

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.currentTransactionData) {
            initTransactionGraph(window.currentTransactionData);
        }
    });

    // Listen for node clicks
    container.addEventListener('nodeClick', (event) => {
        const node = event.detail.node;
        console.log('Node clicked:', node);
    });

    // Zoom controls
    document.getElementById('zoomIn')?.addEventListener('click', () => {
        if (currentGraph && currentGraph.svg) {
            const svg = d3.select(currentGraph.svg.node().parentNode);
            const currentTransform = d3.zoomTransform(svg.node());
            svg.call(d3.zoom().transform, currentTransform.scaleBy(1.2));
        }
    });

    document.getElementById('zoomOut')?.addEventListener('click', () => {
        if (currentGraph && currentGraph.svg) {
            const svg = d3.select(currentGraph.svg.node().parentNode);
            const currentTransform = d3.zoomTransform(svg.node());
            svg.call(d3.zoom().transform, currentTransform.scaleBy(0.8));
        }
    });
});
