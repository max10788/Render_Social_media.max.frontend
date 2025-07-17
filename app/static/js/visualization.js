import { TransactionGraph } from '/static/js/modules/TransactionGraph.js';
import { generateCSS } from '/static/js/modules/TransactionStyles.js';

function showFallbackGraph(data) {
    const tree = document.getElementById('transactionTree');
    if (!tree) return;

    // Zeige eine einfachere Visualisierung an
    const source = data.tracked_transactions?.[0]?.from_wallet || 'Unbekannt';
    const target = data.final_wallet_address || 'Ziel';

    // Zeige eine einfachere Visualisierung an
    tree.innerHTML = `
        <div style="padding: 20px; color: #9ca3af;">
            Nur eine einfache Übertragung gefunden:
            <br><br>
            <strong>Quelle:</strong> ${source.slice(0, 6)}...${source.slice(-4)}
            <br>
            <strong>Ziel:</strong> ${target.slice(0, 6)}...${target.slice(-4)}
        </div>
    `;
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
    
        console.log("Empfangene Daten:", data);

        try {
            // Validiere und bereite Daten vor
            let processedData = {
                tracked_transactions: [],
                final_wallet_address: 'Ziel',
                target_currency: 'SOL'
            };

            // Fallback für fehlende Daten
            if (!data || !data.tracked_transactions) {
                logger.warn('Keine Transaktionsdaten vorhanden');
                processedData.tracked_transactions = [{
                    from_wallet: 'Unbekannt',
                    balance_changes: []
                }];
                processedData.final_wallet_address = 'Ziel';
            } else {
                // Bereinige und validiere vorhandene Daten
                processedData = {
                    ...data,
                    tracked_transactions: data.tracked_transactions.map(tx => ({
                        ...tx,
                        from_wallet: tx.from_wallet || 'Unbekannt',
                        balance_changes: tx.balance_changes || []
                    }))
                };
            }

            // Statistikfelder befüllen mit Fallback-Werten
            const firstTx = processedData.tracked_transactions[0] || {};
            
            document.getElementById('sourceWallet').textContent = 
                (firstTx.from_wallet || 'Unbekannt').slice(0, 6) + '...' || '-';
            
            document.getElementById('targetWallet').textContent = 
                processedData.final_wallet_address?.slice(0, 6) + '...' || 'Ziel';
            
            document.getElementById('targetCurrencyDisplay').textContent = 
                processedData.target_currency || 'SOL';
            
            document.getElementById('txCount').textContent = 
                processedData.tracked_transactions.length || '0';

            // Wenn es nur eine Transaktion gibt und Zieladresse bekannt
            if (processedData.tracked_transactions.length === 1 && 
                processedData.final_wallet_address && 
                processedData.final_wallet_address !== 'Ziel') {
                
                // Füge eine leere End-Transaktion hinzu für bessere Visualisierung
                processedData.tracked_transactions.push({
                    from_wallet: processedData.final_wallet_address,
                    to_wallet: 'Ende der Kette',
                    balance_changes: []
                });
            }

            // Prüfung auf notwendigen Fallback-Modus
            const needsFallback = (
                !processedData.tracked_transactions.length ||
                processedData.tracked_transactions.every(tx => 
                    !tx.from_wallet || 
                    !tx.balance_changes?.length
                )
            );

            // Zeige Fallback an wenn nötig
            if (needsFallback) {
                showFallbackGraph(processedData);
            } else {
                // Normale Visualisierung laden
                initTransactionGraph(processedData);
            }
            
        } catch (err) {
            console.error('Fehler bei der Visualisierung:', err);
            errorContainer.textContent = `Fehler beim Anzeigen der Transaktionen: ${err.message}`;
            errorContainer.style.display = 'block';
            
            // Zeige Fallback bei kritischen Fehlern
            showFallbackGraph(data || {
                tracked_transactions: [],
                final_wallet_address: 'Ziel'
            });
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
