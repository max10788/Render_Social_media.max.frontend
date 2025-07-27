// visualization.js
// Transaktionsvisualisierung für das Crypto-Flow Dashboard
// Stellt sicher, dass alle Visualisierungsfunktionen korrekt geladen und initialisiert werden

// Import der benötigten Module (wird nur benötigt, wenn ES6-Module verwendet werden)
// import { TransactionGraph } from '/static/js/modules/TransactionGraph.js';
// import { generateCSS } from '/static/js/modules/TransactionStyles.js';

// Sicherstellen, dass der Code erst ausgeführt wird, wenn das DOM vollständig geladen ist
document.addEventListener('DOMContentLoaded', function() {
    console.log('[VISUALIZATION] DOMContentLoaded: Initialisiere Visualisierungsmodul');
    
    // 1. Definiere die Fallback-Visualisierung für einfache Transaktionen
    function showFallbackGraph(data) {
        const tree = document.getElementById('transactionTree');
        if (!tree) {
            console.error('[VISUALIZATION] Fallback: transactionTree Element nicht gefunden');
            return;
        }
        
        // Entferne eventuelle vorherige Fehlermeldungen
        const existingError = tree.querySelector('.fallback-error');
        if (existingError) existingError.remove();
        
        // Erstelle einen Container für die Fallback-Visualisierung
        const fallbackContainer = document.createElement('div');
        fallbackContainer.className = 'fallback-visualization';
        fallbackContainer.style.padding = '20px';
        fallbackContainer.style.backgroundColor = '#f8f9fa';
        fallbackContainer.style.borderRadius = '4px';
        fallbackContainer.style.marginTop = '20px';
        
        // Ermittle Quelle und Ziel
        const firstTx = data.tracked_transactions?.[0];
        const source = firstTx?.from_wallet || 'Unbekannt';
        const target = data.final_wallet_address || 'Ziel';
        const hash = firstTx?.signature || 'N/A';
        
        fallbackContainer.innerHTML = `
            <div class="fallback-header" style="font-weight: bold; margin-bottom: 15px; color: #333;">
                Nur eine einfache Übertragung gefunden:
            </div>
            <div class="fallback-content" style="display: grid; grid-template-columns: auto 1fr; gap: 10px 15px; align-items: center;">
                <div class="label" style="font-weight: bold; color: #555;">Quelle:</div>
                <div class="value" style="font-family: monospace;">${source.slice(0, 6)}...${source.slice(-4)}</div>
                
                <div class="label" style="font-weight: bold; color: #555;">Ziel:</div>
                <div class="value" style="font-family: monospace;">${target.slice(0, 6)}...${target.slice(-4)}</div>
                
                <div class="label" style="font-weight: bold; color: #555;">Transaktions-Hash:</div>
                <div class="value" style="font-family: monospace; word-break: break-all;">${hash.slice(0, 6)}...${hash.slice(-6)}</div>
            </div>
        `;
        
        tree.appendChild(fallbackContainer);
        
        // Aktualisiere auch die Statistik-Elemente mit Fallback-Daten
        const txCountEl = document.getElementById('txCount');
        const totalValueEl = document.getElementById('totalValue');
        
        if (txCountEl) txCountEl.textContent = '1';
        if (totalValueEl && firstTx) {
            let value = 0;
            firstTx.balance_changes.forEach(change => {
                value += Math.abs(change.change);
            });
            totalValueEl.textContent = `${value.toFixed(6)} SOL`;
        }
        
        console.log('[VISUALIZATION] Fallback-Visualisierung erfolgreich erstellt');
    }

    // 2. Definiere die initTransactionGraph-Funktion
    function initTransactionGraph(data) {
        try {
            // Sicherstellen, dass der Graph-Container existiert
            let graphContainer = document.getElementById('transactionGraph');
            
            // Erstelle Container, falls nicht vorhanden
            if (!graphContainer) {
                graphContainer = document.createElement('div');
                graphContainer.id = 'transactionGraph';
                graphContainer.style.width = '100%';
                graphContainer.style.height = '600px';
                
                // Füge Container zum transactionTree hinzu
                const tree = document.getElementById('transactionTree');
                if (tree) {
                    tree.appendChild(graphContainer);
                } else {
                    console.error('[VISUALIZATION] initTransactionGraph: transactionTree Element nicht gefunden');
                    return;
                }
            }
            
            // Leere den Container vor der neuen Visualisierung
            graphContainer.innerHTML = '';
            
            // Prüfe, ob Daten vorhanden sind
            if (!data || !data.tracked_transactions || data.tracked_transactions.length === 0) {
                console.warn('[VISUALIZATION] initTransactionGraph: Keine Transaktionsdaten für die Visualisierung');
                graphContainer.innerHTML = '<p style="padding: 20px; text-align: center;">Keine Transaktionsdaten zum Visualisieren vorhanden</p>';
                return;
            }
            
            // ERWEITERUNG: Prüfe, ob mehr als eine Transaktion vorhanden ist
            if (data.tracked_transactions.length === 1) {
                console.log('[VISUALIZATION] initTransactionGraph: Nur eine Transaktion gefunden. Suche nach weiteren...');
                
                // Füge hier Logik ein, um nach weiteren Transaktionen zu suchen
                // Dies ist nur ein Beispiel - die eigentliche Logik sollte im Backend erfolgen
                const tree = document.getElementById('transactionTree');
                if (tree) {
                    const warningDiv = document.createElement('div');
                    warningDiv.className = 'transaction-warning';
                    warningDiv.style.padding = '10px';
                    warningDiv.style.backgroundColor = '#fff8e1';
                    warningDiv.style.borderLeft = '4px solid #ffc107';
                    warningDiv.style.margin = '10px 0';
                    warningDiv.innerHTML = `
                        <p style="margin: 0; font-size: 14px;">
                            <strong>Hinweis:</strong> Es wurde nur eine Transaktion gefunden. 
                            Möglicherweise wurden nicht alle Transaktionen in der Kette erfasst.
                        </p>
                    `;
                    tree.appendChild(warningDiv);
                }
            }
            
            // Erstelle eine einfachere Visualisierung für den Fall, dass nur eine Transaktion vorhanden ist
            if (data.tracked_transactions.length <= 2) {
                console.log('[VISUALIZATION] initTransactionGraph: Erstelle vereinfachte Visualisierung für eine einfache Transaktionskette');
                
                const width = 800;
                const height = 200;
                const centerX = width / 2;
                
                // Leere vorherigen Inhalt
                const existingSvg = graphContainer.querySelector('svg');
                if (existingSvg) existingSvg.remove();
                
                // Stelle sicher, dass D3.js korrekt geladen wurde
                if (typeof d3 === 'undefined') {
                    console.error('[VISUALIZATION] initTransactionGraph: D3.js ist nicht geladen');
                    graphContainer.innerHTML = '<p style="padding: 20px; text-align: center; color: #e74c3c;">Fehler: D3.js-Bibliothek nicht geladen</p>';
                    return;
                }
                
                const simpleSvg = d3.select(`#${graphContainer.id}`)
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .attr("class", "transaction-graph");
                
                // Erstelle eine horizontale Linie
                simpleSvg.append("line")
                    .attr("x1", 100)
                    .attr("y1", height / 2)
                    .attr("x2", width - 100)
                    .attr("y2", height / 2)
                    .attr("stroke", "#3498db")
                    .attr("stroke-width", 2);
                
                // Erstelle Quelle-Knoten
                simpleSvg.append("circle")
                    .attr("cx", 100)
                    .attr("cy", height / 2)
                    .attr("r", 30)
                    .attr("fill", "#3498db")
                    .attr("stroke", "#2980b9")
                    .attr("stroke-width", 2);
                
                simpleSvg.append("text")
                    .attr("x", 100)
                    .attr("y", height / 2 + 5)
                    .attr("text-anchor", "middle")
                    .attr("fill", "white")
                    .text("Quelle");
                
                // Erstelle Ziel-Knoten
                simpleSvg.append("circle")
                    .attr("cx", width - 100)
                    .attr("cy", height / 2)
                    .attr("r", 30)
                    .attr("fill", "#2ecc71")
                    .attr("stroke", "#27ae60")
                    .attr("stroke-width", 2);
                
                simpleSvg.append("text")
                    .attr("x", width - 100)
                    .attr("y", height / 2 + 5)
                    .attr("text-anchor", "middle")
                    .attr("fill", "white")
                    .text("Ziel");
                
                // Füge Pfeilspitze hinzu
                const defs = simpleSvg.append("defs");
                defs.append("marker")
                    .attr("id", "arrowhead")
                    .attr("refX", 6)
                    .attr("refY", 3)
                    .attr("markerWidth", 6)
                    .attr("markerHeight", 4)
                    .attr("orient", "auto")
                    .append("path")
                    .attr("d", "M 0,0 V 6 L 9,3 Z")
                    .attr("fill", "#3498db");
                
                simpleSvg.select("line")
                    .attr("marker-end", "url(#arrowhead)");
                
                console.log('[VISUALIZATION] initTransactionGraph: Vereinfachte Visualisierung erfolgreich erstellt');
                return;
            }
            
            // Hier würde die komplexe Visualisierung kommen
            console.log('[VISUALIZATION] initTransactionGraph: Komplexe Visualisierung wird benötigt');
            
        } catch (err) {
            console.error('[VISUALIZATION] Kritischer Fehler bei initTransactionGraph:', err);
            const graphContainer = document.getElementById('transactionGraph');
            if (graphContainer) {
                graphContainer.innerHTML = `<p style="padding: 20px; text-align: center; color: #e74c3c;">Kritischer Fehler: ${err.message}</p>`;
            }
        }
    }

    // 3. Definiere die Hauptvisualisierungsfunktion
    window.updateTransactionVisualization = function(data) {
        const tree = document.getElementById('transactionTree');
        const errorContainer = document.getElementById('errorContainer');
        let graphContainer = document.getElementById('transactionGraph');
        
        // Vorherigen Inhalt löschen
        if (tree) {
            // Entferne alle vorherigen Visualisierungen
            const existingGraph = tree.querySelector('#transactionGraph');
            if (existingGraph) existingGraph.remove();
        }
        
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }

        console.log("[VISUALIZATION] updateTransactionVisualization: Empfangene Daten:", data);

        try {
            // Sicherstellen, dass der Graph-Container existiert
            if (!graphContainer) {
                graphContainer = document.createElement('div');
                graphContainer.id = 'transactionGraph';
                graphContainer.style.width = '100%';
                graphContainer.style.height = '600px';
                
                if (tree) {
                    tree.appendChild(graphContainer);
                } else {
                    console.error("[VISUALIZATION] updateTransactionVisualization: Kein transactionTree-Element gefunden");
                    if (errorContainer) {
                        errorContainer.textContent = 'Fehler: Transaktionsbaum-Container nicht gefunden';
                        errorContainer.style.display = 'block';
                    }
                    return;
                }
            }

            // Validiere und bereite Daten vor
            let processedData = {
                tracked_transactions: [],
                final_wallet_address: 'Ziel',
                target_currency: 'SOL'
            };

            // Fallback für fehlende Daten
            if (!data || !data.tracked_transactions) {
                console.warn('[VISUALIZATION] updateTransactionVisualization: Keine Transaktionsdaten vorhanden');
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
            
            const sourceWalletEl = document.getElementById('sourceWallet');
            const targetWalletEl = document.getElementById('targetWallet');
            const targetCurrencyEl = document.getElementById('targetCurrencyDisplay');
            const txCountEl = document.getElementById('txCount');
            const totalValueEl = document.getElementById('totalValue');
            const finalStatusEl = document.getElementById('finalStatus');
            const startHashEl = document.getElementById('startHash');
            const exchangeRateEl = document.getElementById('exchangeRate');
            const convertedValueEl = document.getElementById('convertedValue');

            // Füge Sicherheitsprüfung für alle Statistik-Elemente hinzu
            if (sourceWalletEl) {
                sourceWalletEl.textContent = 
                    firstTx.from_wallet && firstTx.from_wallet !== 'Unbekannt' ? 
                    (firstTx.from_wallet.slice(0, 6) + '...' + firstTx.from_wallet.slice(-4)) : 
                    'Unbekannt';
            }
            
            if (targetWalletEl) {
                targetWalletEl.textContent = 
                    processedData.final_wallet_address && processedData.final_wallet_address !== 'Ziel' ? 
                    (processedData.final_wallet_address.slice(0, 6) + '...' + processedData.final_wallet_address.slice(-4)) : 
                    'Ziel';
            }
            
            if (targetCurrencyEl) {
                targetCurrencyEl.textContent = processedData.target_currency || 'SOL';
            }
            
            if (txCountEl) {
                txCountEl.textContent = processedData.tracked_transactions.length || '0';
            }
            
            // Berechne den Gesamtwert aus allen Balance-Änderungen
            let totalValue = 0;
            processedData.tracked_transactions.forEach(tx => {
                tx.balance_changes.forEach(change => {
                    totalValue += Math.abs(change.change);
                });
            });
            
            if (totalValueEl) {
                totalValueEl.textContent = `${totalValue.toFixed(6)} SOL`;
            }
            
            if (finalStatusEl) {
                finalStatusEl.textContent = 'Abgeschlossen';
            }
            
            if (startHashEl && firstTx.signature) {
                startHashEl.textContent = 
                    firstTx.signature.slice(0, 6) + '...' + firstTx.signature.slice(-6);
            }
            
            // Wechselkurs und Umrechnungswert
            const exchangeRate = 150.5; // In einer echten App würde dies von einer API kommen
            if (exchangeRateEl) {
                exchangeRateEl.textContent = `${exchangeRate} ${processedData.target_currency || 'SOL'} pro SOL`;
            }
            
            if (convertedValueEl) {
                convertedValueEl.textContent = `${(totalValue * exchangeRate).toFixed(2)} ${processedData.target_currency || 'SOL'}`;
            }

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
                    tx.from_wallet === 'Unbekannt' ||
                    !tx.balance_changes?.length
                )
            );

            // Zeige Fallback an wenn nötig
            if (needsFallback) {
                console.log("[VISUALIZATION] updateTransactionVisualization: Verwende Fallback-Visualisierung");
                showFallbackGraph(processedData);
            } else {
                // Sicherstellen, dass D3.js korrekt geladen wurde
                if (typeof d3 === 'undefined') {
                    console.error("[VISUALIZATION] updateTransactionVisualization: D3.js ist nicht geladen. Versuche, D3.js dynamisch nachzuladen.");
                    
                    if (errorContainer) {
                        errorContainer.textContent = 'Lade Visualisierungsbibliothek...';
                        errorContainer.style.display = 'block';
                    }
                    
                    // Versuche, D3.js dynamisch zu laden
                    const script = document.createElement('script');
                    script.src = 'https://d3js.org/d3.v7.min.js';
                    script.onload = () => {
                        console.log("[VISUALIZATION] updateTransactionVisualization: D3.js wurde erfolgreich geladen");
                        
                        if (errorContainer) {
                            errorContainer.textContent = 'Erstelle Transaktionsvisualisierung...';
                            errorContainer.style.display = 'block';
                        }
                        
                        // Warte kurz, um sicherzustellen, dass D3.js vollständig geladen ist
                        setTimeout(() => {
                            initTransactionGraph(processedData);
                            
                            if (errorContainer) {
                                errorContainer.style.display = 'none';
                            }
                        }, 100);
                    };
                    script.onerror = () => {
                        console.error("[VISUALIZATION] updateTransactionVisualization: Fehler beim Laden von D3.js");
                        if (errorContainer) {
                            errorContainer.textContent = 'Fehler: D3.js konnte nicht geladen werden. Bitte überprüfen Sie Ihre Internetverbindung.';
                            errorContainer.style.display = 'block';
                        }
                    };
                    document.head.appendChild(script);
                } else {
                    console.log("[VISUALIZATION] updateTransactionVisualization: Verwende normale Visualisierung");
                    initTransactionGraph(processedData);
                }
            }
            
        } catch (err) {
            console.error('[VISUALIZATION] Kritischer Fehler bei der Visualisierung:', err);
            if (errorContainer) {
                errorContainer.textContent = `Fehler beim Anzeigen der Transaktionen: ${err.message}`;
                errorContainer.style.display = 'block';
            }
            
            // Zeige Fallback bei kritischen Fehlern
            showFallbackGraph(data || {
                tracked_transactions: [],
                final_wallet_address: 'Ziel'
            });
        }
    };
    
    // 4. Stelle sicher, dass die Funktion verfügbar ist
    console.log("[VISUALIZATION] updateTransactionVisualization ist", 
               typeof window.updateTransactionVisualization === 'function' ? 
               "verfügbar" : "NICHT verfügbar");
    
    // 5. Handle window resize
    window.addEventListener('resize', () => {
        if (window.currentTransactionData) {
            console.log("[VISUALIZATION] Window resize: Aktualisiere Transaktionsvisualisierung");
            initTransactionGraph(window.currentTransactionData);
        }
    });
    
    // 6. Teste, ob D3.js korrekt geladen wurde
    if (typeof d3 === 'undefined') {
        console.log("[VISUALIZATION] D3.js ist nicht geladen. Wird bei Bedarf dynamisch nachgeladen.");
    } else {
        console.log("[VISUALIZATION] D3.js ist bereits geladen.");
    }
    
    // 7. Speichere die aktuelle Transaktionsdaten für spätere Verwendung
    window.currentTransactionData = null;
    
    console.log('[VISUALIZATION] Initialisierung abgeschlossen');
});

// Sicherstellen, dass die Funktion auch ohne DOMContentLoaded verfügbar ist
if (typeof window.updateTransactionVisualization !== 'function') {
    console.warn('[VISUALIZATION] updateTransactionVisualization wird als Platzhalter definiert');
    
    window.updateTransactionVisualization = function(data) {
        console.error('[VISUALIZATION] updateTransactionVisualization: Funktion wurde aufgerufen, bevor das DOM geladen war');
        
        // Speichere die Daten für später
        window.currentTransactionData = data;
        
        // Versuche, die Visualisierung später zu initialisieren
        setTimeout(() => {
            if (typeof window.updateTransactionVisualization === 'function' && window.currentTransactionData) {
                window.updateTransactionVisualization(window.currentTransactionData);
                window.currentTransactionData = null;
            }
        }, 1000);
    };
}
