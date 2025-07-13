import { TransactionGraph } from '/static/js/modules/TransactionGraph.js';
import { generateCSS } from '/static/js/modules/TransactionStyles.js';

// ⬇️ Füge diese Funktion hier ein:
function showFallbackGraph(data) {
    const tree = document.getElementById('transactionTree');
    if (!tree) return;

    // Leeren vorheriger Inhalte
    tree.innerHTML = '';

    // Minimaler Graph mit nur zwei Knoten
    const svg = d3.select(tree)
        .append("svg")
        .attr("width", 800)
        .attr("height", 400);

    const g = svg.append("g");

    // Positionen
    const source = data.tracked_transactions[0]?.from_wallet || 'Unknown';
    const target = data.final_wallet_address || 'Final Wallet';

    // Kreise zeichnen
    g.append("circle").attr("cx", 200).attr("cy", 200).attr("r", 30).attr("class", "node start");
    g.append("circle").attr("cx", 600).attr("cy", 200).attr("r", 30).attr("class", "node end");

    // Linie zwischen Knoten
    g.append("line")
        .attr("x1", 200)
        .attr("y1", 200)
        .attr("x2", 600)
        .attr("y2", 200)
        .attr("stroke", "#00ffbd")
        .attr("stroke-width", 2)
        .attr("class", "link");

    // Texte hinzufügen
    g.append("text")
        .attr("x", 200)
        .attr("y", 250)
        .attr("text-anchor", "middle")
        .attr("fill", "#fff")
        .text("Quelle\n" + source.slice(0, 6) + "...");

    g.append("text")
        .attr("x", 600)
        .attr("y", 250)
        .attr("text-anchor", "middle")
        .attr("fill", "#fff")
        .text("Ziel\n" + target.slice(0, 6) + "...");
}

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

    window.updateTransactionVisualization = (data) => {
        const tree = document.getElementById('transactionTree');
        const errorContainer = document.getElementById('errorContainer');
    
        // Vorherigen Inhalt löschen
        tree.innerHTML = '';
        errorContainer.style.display = 'none';
    
        console.log("Empfangene Rohdaten:", data);
    
        try {
            // 🔍 Prüfung: tracked_transactions vorhanden?
            if (!data || !data.tracked_transactions?.length) {
                throw new Error('Keine Transaktionsdaten zum Visualisieren.');
            }
    
            // 🔍 Prüfung: balance_changes vorhanden?
            const allHaveBalanceChanges = data.tracked_transactions.every(tx =>
                tx.balance_changes && Array.isArray(tx.balance_changes) && tx.balance_changes.length > 0
            );
    
            if (!allHaveBalanceChanges) {
                console.warn("Einige Transaktionen haben keine balance_changes.");
            }
    
            // 🔍 Prüfung: from_wallet gültig?
            const allHaveFromWallet = data.tracked_transactions.every(tx =>
                tx.from_wallet && typeof tx.from_wallet === 'string' && tx.from_wallet.length > 40
            );
    
            if (!allHaveFromWallet) {
                console.warn("Einige Transaktionen haben kein gültiges from_wallet.");
            }
    
            // 🔍 Explizites Logging für Debugging
            console.log("tracked_transactions:", data.tracked_transactions);
            data.tracked_transactions.forEach((tx, i) => {
                console.log(`tracked_transactions[${i}].from_wallet:`, tx.from_wallet);
                console.log(`tracked_transactions[${i}].balance_changes:`, tx.balance_changes || []);
            });
    
            // 🔍 Leere Nachricht einfügen, falls nötig
            const messageDiv = document.createElement('div');
            messageDiv.style.padding = '20px';
            messageDiv.style.color = '#9ca3af';
            messageDiv.style.textAlign = 'center';
    
            if (!allHaveBalanceChanges || !allHaveFromWallet) {
                messageDiv.textContent = 'Unvollständige oder leere Transaktionsdaten – es können keine Beziehungen visualisiert werden.';
            } else if (data.tracked_transactions.length <= 1) {
                messageDiv.textContent = 'Keine weiteren Transaktionen – alle Mittel verblieben im gleichen Wallet.';
            } else {
                messageDiv.textContent = 'Transaktionsgraph wird geladen...';
            }
    
            tree.appendChild(messageDiv);
    
            // 🔍 Nur visualisieren, wenn alles OK ist
            if (allHaveBalanceChanges && allHaveFromWallet && data.tracked_transactions.length > 0) {
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
            }
    
        } catch (err) {
            console.error('Fehler bei der Visualisierung:', err);
            errorContainer.textContent = `Fehler beim Anzeigen der Transaktionen: ${err.message}`;
            errorContainer.style.display = 'block';
    
            // Optional: Fallback-Nachricht anzeigen
            const fallbackMessage = document.createElement('div');
            fallbackMessage.style.padding = '20px';
            fallbackMessage.style.color = '#ef4444';
            fallbackMessage.style.textAlign = 'center';
            fallbackMessage.textContent = 'Fehler beim Laden des Graphen.';
            const tree = document.getElementById('transactionTree');
            tree.appendChild(fallbackMessage);
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
