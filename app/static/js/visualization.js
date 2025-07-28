// app/static/js/visualization.js
import { TransactionStyles } from './modules/TransactionStyles.js';
import { TransactionGraph } from './modules/TransactionGraph.js';

console.log('[FRONTEND] VISUALISIERUNG: visualization.js geladen');

class TransactionVisualizer {
    constructor() {
        console.log('[FRONTEND] VISUALISIERUNG: TransactionVisualizer initialisiert');
        this.graph = new TransactionGraph('#transactionGraph');
        this.currentData = null;
    }

    async fetchTransactionData(hash, depth = 5) {
        console.log(`[FRONTEND] API: Abrufen von Transaktionsdaten für Hash ${hash} mit Tiefe ${depth}`);
        try {
            const response = await fetch('/api/track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    blockchain: 'sol', // Standardmäßig Solana
                    tx_hash: hash,
                    depth: parseInt(depth)
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[FRONTEND] API: Fehler bei der Anfrage (${response.status}):`, errorText);
                throw new Error(`API-Fehler: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('[FRONTEND] API: Transaktionsdaten erfolgreich abgerufen', data);
            return data;
        } catch (error) {
            console.error('[FRONTEND] API: Fehler beim Abrufen der Transaktionsdaten:', error);
            throw error;
        }
    }

    updateTransactionInfo(data) {
        console.log('[FRONTEND] INFO: Aktualisiere Transaktionsinformationen', data);
        const infoDiv = document.getElementById('transactionInfo');
        if (!infoDiv) {
            console.warn('[FRONTEND] INFO: Element #transactionInfo nicht gefunden');
            return;
        }

        if (!data || !data.tx_hash) {
            infoDiv.innerHTML = '<p>Keine Transaktionsdaten verfügbar</p>';
            return;
        }

        // Zähle alle Transaktionen rekursiv
        const countTransactions = (tx) => {
            let count = 1; // Zähle die aktuelle Transaktion
            if (tx.next_transactions && Array.isArray(tx.next_transactions)) {
                tx.next_transactions.forEach(nextTx => {
                    count += countTransactions(nextTx);
                });
            }
            return count;
        };

        const totalTransactions = countTransactions(data);

        // Berechne den Gesamtwert rekursiv
        const calculateTotalValue = (tx) => {
            let total = tx.amount || 0;
            if (tx.next_transactions && Array.isArray(tx.next_transactions)) {
                tx.next_transactions.forEach(nextTx => {
                    total += calculateTotalValue(nextTx);
                });
            }
            return total;
        };

        const totalValue = calculateTotalValue(data);

        infoDiv.innerHTML = `
            <h3>Transaktionsdetails</h3>
            <p><strong>Quelle:</strong> ${data.from_address ? data.from_address.substring(0, 6) + '...' + data.from_address.substring(data.from_address.length - 4) : 'N/A'}</p>
            <p><strong>Ziel:</strong> ${data.to_address ? data.to_address.substring(0, 6) + '...' + data.to_address.substring(data.to_address.length - 4) : 'N/A'}</p>
            <p><strong>Transaktions-Hash:</strong> ${data.tx_hash ? data.tx_hash.substring(0, 6) + '...' + data.tx_hash.substring(data.tx_hash.length - 6) : 'N/A'}</p>
            <p><strong>Anzahl Transaktionen:</strong> ${totalTransactions}</p>
            <p><strong>Gesamtwert:</strong> ${totalValue.toFixed(6)} ${data.currency || 'SOL'}</p>
            <p><strong>Status:</strong> ${data.status || 'Abgeschlossen'}</p>
            <p><strong>Zielwährung:</strong> ${data.currency || 'SOL'}</p>
            <p><strong>Wechselkurs:</strong> 1 ${data.currency || 'SOL'} pro ${data.currency || 'SOL'}</p>
            <p><strong>Umrechnungswert:</strong> ${(totalValue).toFixed(2)} ${data.currency || 'SOL'}</p>
        `;
        console.log('[FRONTEND] INFO: Transaktionsinformationen aktualisiert');
    }

    updateTransactionVisualization(data) {
        console.log('[FRONTEND] VISUALISIERUNG: Aktualisiere Visualisierung mit Daten', data);
        
        if (!data) {
            console.warn('[FRONTEND] VISUALISIERUNG: Keine Daten zum Visualisieren');
            this.showFallbackGraph();
            return;
        }

        try {
            // Erstelle ein flaches Array aller Transaktionen
            const allTransactions = this.flattenTransactions(data);
            console.log('[FRONTEND] VISUALISIERUNG: Alle Transaktionen zum Visualisieren', allTransactions);

            if (allTransactions.length === 0) {
                console.warn('[FRONTEND] VISUALISIERUNG: Keine Transaktionen zum Visualisieren');
                this.showFallbackGraph();
                return;
            }

            // Erstelle Knoten und Kanten
            const nodes = [];
            const links = [];
            const nodeIds = new Set();

            allTransactions.forEach(tx => {
                // Füge "from" Knoten hinzu
                if (tx.from_address && !nodeIds.has(tx.from_address)) {
                    nodes.push({
                        id: tx.from_address,
                        label: tx.from_address.substring(0, 6) + '...' + tx.from_address.substring(tx.from_address.length - 4),
                        type: 'address'
                    });
                    nodeIds.add(tx.from_address);
                }

                // Füge "to" Knoten hinzu
                if (tx.to_address && !nodeIds.has(tx.to_address)) {
                    nodes.push({
                        id: tx.to_address,
                        label: tx.to_address.substring(0, 6) + '...' + tx.to_address.substring(tx.to_address.length - 4),
                        type: 'address'
                    });
                    nodeIds.add(tx.to_address);
                }

                // Füge Transaktionsknoten hinzu
                if (tx.tx_hash && !nodeIds.has(tx.tx_hash)) {
                    nodes.push({
                        id: tx.tx_hash,
                        label: tx.tx_hash.substring(0, 6) + '...' + tx.tx_hash.substring(tx.tx_hash.length - 6),
                        type: 'transaction',
                        amount: tx.amount,
                        currency: tx.currency
                    });
                    nodeIds.add(tx.tx_hash);
                }

                // Füge Kanten hinzu: from_address -> tx_hash -> to_address
                if (tx.from_address && tx.tx_hash) {
                    links.push({
                        source: tx.from_address,
                        target: tx.tx_hash,
                        value: tx.amount || 0,
                        type: 'initiates'
                    });
                }
                if (tx.tx_hash && tx.to_address) {
                    links.push({
                        source: tx.tx_hash,
                        target: tx.to_address,
                        value: tx.amount || 0,
                        type: 'receives'
                    });
                }
            });

            console.log('[FRONTEND] VISUALISIERUNG: Knoten erstellt', nodes);
            console.log('[FRONTEND] VISUALISIERUNG: Kanten erstellt', links);

            if (nodes.length === 0 || links.length === 0) {
                console.warn('[FRONTEND] VISUALISIERUNG: Keine Knoten oder Kanten zum Rendern');
                this.showFallbackGraph();
                return;
            }

            // Visualisiere die Daten mit D3
            this.graph.render(nodes, links);
            console.log('[FRONTEND] VISUALISIERUNG: Visualisierung abgeschlossen');

        } catch (error) {
            console.error('[FRONTEND] VISUALISIERUNG: Fehler bei der Visualisierung:', error);
            this.showFallbackGraph();
        }
    }

    flattenTransactions(transaction, flatList = []) {
        // Füge die aktuelle Transaktion zur Liste hinzu
        flatList.push(transaction);

        // Rekursiver Abstieg in next_transactions
        if (transaction.next_transactions && Array.isArray(transaction.next_transactions)) {
            transaction.next_transactions.forEach(nextTx => {
                this.flattenTransactions(nextTx, flatList);
            });
        }

        return flatList;
    }

    showFallbackGraph() {
        console.log('[FRONTEND] VISUALISIERUNG: Zeige Fallback-Graph');
        // Erstelle einfache Fallback-Daten
        const nodes = [
            { id: 'source', label: 'Quelle', type: 'address' },
            { id: 'target', label: 'Ziel', type: 'address' }
        ];
        const links = [
            { source: 'source', target: 'target', value: 0, type: 'fallback' }
        ];

        this.graph.render(nodes, links);
        console.log('[FRONTEND] VISUALISIERUNG: Fallback-Graph angezeigt');
    }

    showLoading() {
        console.log('[FRONTEND] VISUALISIERUNG: Zeige Ladeanzeige');
        const graphContainer = document.querySelector('#transactionGraph');
        if (graphContainer) {
            graphContainer.innerHTML = '<div class="loading">Lade Transaktionsdaten...</div>';
        }
    }

    hideLoading() {
        console.log('[FRONTEND] VISUALISIERUNG: Verstecke Ladeanzeige');
        const graphContainer = document.querySelector('#transactionGraph');
        if (graphContainer) {
            const loadingElement = graphContainer.querySelector('.loading');
            if (loadingElement) {
                loadingElement.remove();
            }
        }
    }
}

// Initialisiere die Visualisierung, wenn das DOM geladen ist
document.addEventListener('DOMContentLoaded', async function() {
    console.log('[FRONTEND] DOM: Dokument geladen, initialisiere Visualisierung');
    
    const visualizer = new TransactionVisualizer();
    
    // Event-Listener für das Formular
    const trackForm = document.getElementById('trackForm');
    if (trackForm) {
        trackForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            console.log('[FRONTEND] FORM: Formular abgeschickt');
            
            const hashInput = document.getElementById('txHash');
            const depthInput = document.getElementById('depth');
            
            const hash = hashInput ? hashInput.value.trim() : '';
            const depth = depthInput ? depthInput.value : '5';
            
            if (!hash) {
                alert('Bitte geben Sie einen Transaktions-Hash ein.');
                return;
            }
            
            visualizer.showLoading();
            
            try {
                const data = await visualizer.fetchTransactionData(hash, depth);
                visualizer.currentData = data;
                visualizer.updateTransactionInfo(data);
                visualizer.updateTransactionVisualization(data);
            } catch (error) {
                console.error('[FRONTEND] FORM: Fehler bei der Transaktionsverfolgung:', error);
                alert('Fehler beim Abrufen der Transaktionsdaten: ' + error.message);
                visualizer.showFallbackGraph();
            } finally {
                visualizer.hideLoading();
            }
        });
    } else {
        console.warn('[FRONTEND] FORM: Element #trackForm nicht gefunden');
    }
    
    // Event-Listener für den Beispiel-Button
    const exampleBtn = document.getElementById('exampleTransaction');
    if (exampleBtn) {
        exampleBtn.addEventListener('click', async function() {
            console.log('[FRONTEND] BUTTON: Beispiel-Transaktion geladen');
            const exampleHash = '2muRryVQtiTVrphzJ2ZLE3vQhceRdZPb5WZq4s3fi2vwK19jVbQvAQpZ7SNRBmkTGFVFweZ7wrTaoGvZDXR5d2Lu'; // Beispiel-Hash
            const exampleDepth = '5';
            
            const hashInput = document.getElementById('txHash');
            const depthInput = document.getElementById('depth');
            
            if (hashInput) hashInput.value = exampleHash;
            if (depthInput) depthInput.value = exampleDepth;
            
            visualizer.showLoading();
            
            try {
                const data = await visualizer.fetchTransactionData(exampleHash, exampleDepth);
                visualizer.currentData = data;
                visualizer.updateTransactionInfo(data);
                visualizer.updateTransactionVisualization(data);
            } catch (error) {
                console.error('[FRONTEND] BUTTON: Fehler bei der Transaktionsverfolgung:', error);
                alert('Fehler beim Abrufen der Transaktionsdaten: ' + error.message);
                visualizer.showFallbackGraph();
            } finally {
                visualizer.hideLoading();
            }
        });
    } else {
        console.warn('[FRONTEND] BUTTON: Element #exampleTransaction nicht gefunden');
    }
});
