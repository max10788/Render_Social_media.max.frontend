// visualization.js
// Transaktionsvisualisierung für das Crypto-Flow Dashboard
// Stellt sicher, dass alle Visualisierungsfunktionen korrekt geladen und initialisiert werden

// Zustandsvariablen für die Visualisierungsinitialisierung
window.visualizationState = {
    d3Loaded: false,
    visualizationReady: false,
    transactionDataQueue: [],
    d3Loading: false,
    transactionGraphInitialized: false,
    currentTransactionData: null
};

// 1. Definiere die Fallback-Visualisierung für einfache Transaktionen
function showFallbackGraph(data) {
    const tree = document.getElementById('transactionTree');
    if (!tree) {
        console.error('[VISUALIZATION] Fallback: transactionTree Element nicht gefunden');
        return;
    }
    
    // Entferne eventuelle vorherige Fehlermeldungen
    const existingError = tree.querySelector('.fallback-visualization');
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
    
    // Berechne den Gesamtwert
    let totalValue = 0;
    if (firstTx?.balance_changes) {
        firstTx.balance_changes.forEach(change => {
            totalValue += Math.abs(change.change);
        });
    }
    
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
            
            <div class="label" style="font-weight: bold; color: #555;">Gesamtwert:</div>
            <div class="value" style="font-family: monospace;">${totalValue.toFixed(6)} SOL</div>
        </div>
    `;
    
    tree.appendChild(fallbackContainer);
    
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
        
        console.log(`[VISUALIZATION] initTransactionGraph: Verarbeite ${data.tracked_transactions.length} Transaktionen`);
        
        // Erstelle eine einfachere Visualisierung für den Fall, dass nur eine Transaktion vorhanden ist
        if (data.tracked_transactions.length <= 2) {
            console.log('[VISUALIZATION] initTransactionGraph: Erstelle vereinfachte Visualisierung für eine einfache Transaktionskette');
            
            const width = 800;
            const height = 200;
            
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
        
        // Komplexe Visualisierung für mehrere Transaktionen
        console.log('[VISUALIZATION] initTransactionGraph: Erstelle komplexe Visualisierung für mehrere Transaktionen');
        
        // Stelle sicher, dass D3.js korrekt geladen wurde
        if (typeof d3 === 'undefined') {
            console.error('[VISUALIZATION] initTransactionGraph: D3.js ist nicht geladen');
            graphContainer.innerHTML = '<p style="padding: 20px; text-align: center; color: #e74c3c;">Fehler: D3.js-Bibliothek nicht geladen</p>';
            return;
        }
        
        const width = 800;
        const height = 600;
        
        // Erstelle die force-directed simulation
        const svg = d3.select(`#${graphContainer.id}`)
            .append("svg")
            .attr("width", width)
            .attr("height", height);
        
        // Erstelle Knoten und Links
        const nodes = [];
        const links = [];
        const nodesMap = new Map();
        
        // Verarbeite alle Transaktionen
        data.tracked_transactions.forEach((tx, txIndex) => {
            const fromId = tx.from_wallet;
            
            // Füge Quellknoten hinzu, falls nicht vorhanden
            if (!nodesMap.has(fromId)) {
                nodesMap.set(fromId, nodes.length);
                nodes.push({ 
                    id: fromId, 
                    type: 'wallet', 
                    label: fromId.substring(0, 6) + '...' 
                });
            }
            
            // Verarbeite alle Balance-Änderungen
            tx.balance_changes.forEach(change => {
                const toId = change.account;
                const amount = Math.abs(change.change);
                
                // Füge Zielknoten hinzu, falls nicht vorhanden
                if (!nodesMap.has(toId)) {
                    nodesMap.set(toId, nodes.length);
                    nodes.push({ 
                        id: toId, 
                        type: 'wallet', 
                        label: toId.substring(0, 6) + '...' 
                    });
                }
                
                // Füge Verbindung hinzu
                links.push({
                    source: fromId,
                    target: toId,
                    value: amount,
                    transaction: tx
                });
            });
        });
        
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2));
        
        // Erstelle die Verbindungen
        const link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(links)
            .enter()
            .append("line")
            .attr("stroke", "#95a5a6")
            .attr("stroke-width", d => Math.sqrt(d.value) * 0.1);
        
        // Erstelle die Knoten
        const node = svg.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("r", 10)
            .attr("fill", "#3498db")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));
        
        // Erstelle Labels für Knoten
        const label = svg.append("g")
            .attr("class", "labels")
            .selectAll("text")
            .data(nodes)
            .enter()
            .append("text")
            .text(d => d.label)
            .attr("dx", 15)
            .attr("dy", 4)
            .attr("fill", "#2c3e50");
        
        // Tick-Handler
        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
            
            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
            
            label
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        });
        
        // Drag-Funktionen
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }
        
        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }
        
        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }
        
        // Tooltip für Knoten
        node.on("mouseover", function(event, d) {
            const tooltip = d3.select("#transactionTooltip") || 
                           d3.select("body").append("div")
                               .attr("id", "transactionTooltip")
                               .attr("class", "transaction-tooltip")
                               .style("opacity", 0);
            
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            
            tooltip.html(`<strong>Konto:</strong> ${d.id}<br/>
                          <strong>Typ:</strong> ${d.type}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select("#transactionTooltip")
                .transition()
                .duration(500)
                .style("opacity", 0);
        });
        
        window.visualizationState.transactionGraphInitialized = true;
        console.log('[VISUALIZATION] initTransactionGraph: Komplexe Visualisierung erfolgreich erstellt');
        
    } catch (err) {
        console.error('[VISUALIZATION] Kritischer Fehler bei initTransactionGraph:', err);
        const graphContainer = document.getElementById('transactionGraph');
        if (graphContainer) {
            graphContainer.innerHTML = `<p style="padding: 20px; text-align: center; color: #e74c3c;">Kritischer Fehler: ${err.message}</p>`;
        }
    }
}

// 3. Definiere die Hauptvisualisierungsfunktion
function setupVisualization() {
    window.updateTransactionVisualization = function(data) {
        const tree = document.getElementById('transactionTree');
        const errorContainer = document.getElementById('errorContainer');
        let graphContainer = document.getElementById('transactionGraph');
        
        console.log("[VISUALIZATION] updateTransactionVisualization: Empfangene Daten:", data);
        
        // Vorherigen Inhalt löschen
        if (tree) {
            // Entferne alle vorherigen Visualisierungen
            const existingGraph = tree.querySelector('#transactionGraph');
            if (existingGraph) existingGraph.remove();
            
            // Entferne alle vorherigen Fallback-Visualisierungen
            const existingFallback = tree.querySelector('.fallback-visualization');
            if (existingFallback) existingFallback.remove();
        }
        
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
        
        try {
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
                console.log(`[VISUALIZATION] updateTransactionVisualization: Verarbeite ${processedData.tracked_transactions.length} Transaktionen`);
                
                // Sicherstellen, dass D3.js korrekt geladen wurde
                if (typeof d3 === 'undefined') {
                    console.error("[VISUALIZATION] updateTransactionVisualization: D3.js ist nicht geladen. Versuche, D3.js dynamisch nachzuladen.");
                    
                    if (window.visualizationState.d3Loading) {
                        console.log("[VISUALIZATION] updateTransactionVisualization: D3.js wird bereits geladen. Speichere Daten für später.");
                        window.visualizationState.currentTransactionData = processedData;
                        return;
                    }
                    
                    window.visualizationState.d3Loading = true;
                    
                    if (errorContainer) {
                        errorContainer.textContent = 'Lade Visualisierungsbibliothek...';
                        errorContainer.style.display = 'block';
                    }
                    
                    // Versuche, D3.js dynamisch zu laden
                    const script = document.createElement('script');
                    script.src = 'https://d3js.org/d3.v7.min.js';
                    script.onload = () => {
                        console.log("[VISUALIZATION] updateTransactionVisualization: D3.js wurde erfolgreich geladen");
                        window.visualizationState.d3Loaded = true;
                        window.visualizationState.d3Loading = false;
                        
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
                            
                            // Verarbeite gespeicherte Daten
                            if (window.visualizationState.currentTransactionData) {
                                console.log("[VISUALIZATION] updateTransactionVisualization: Verarbeite gespeicherte Transaktionsdaten");
                                initTransactionGraph(window.visualizationState.currentTransactionData);
                                window.visualizationState.currentTransactionData = null;
                            }
                        }, 100);
                    };
                    script.onerror = () => {
                        console.error("[VISUALIZATION] updateTransactionVisualization: Fehler beim Laden von D3.js");
                        window.visualizationState.d3Loading = false;
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
    
    window.visualizationState.visualizationReady = true;
    console.log("[VISUALIZATION] updateTransactionVisualization ist definiert");
    
    // Verarbeite gespeicherte Transaktionsdaten
    if (window.visualizationState.currentTransactionData) {
        console.log('[VISUALIZATION] Verarbeite gespeicherte Transaktionsdaten');
        window.updateTransactionVisualization(window.visualizationState.currentTransactionData);
        window.visualizationState.currentTransactionData = null;
    }
}

// 4. Initialisiere die Visualisierung erst, wenn DOM und D3.js bereit sind
function initVisualization() {
    // Überprüfe, ob D3.js bereits geladen ist
    if (typeof d3 !== 'undefined') {
        console.log("[VISUALIZATION] D3.js ist bereits geladen");
        window.visualizationState.d3Loaded = true;
        setupVisualization();
    } else {
        console.log("[VISUALIZATION] D3.js ist nicht geladen. Wird bei Bedarf dynamisch nachgeladen.");
        
        // Stelle sicher, dass die Funktion auch ohne D3.js verfügbar ist
        window.updateTransactionVisualization = function(data) {
            console.log('[VISUALIZATION] updateTransactionVisualization: Warte auf D3.js-Laden');
            window.visualizationState.currentTransactionData = data;
        };
    }
    
    // Initialisiere die Visualisierung, falls Daten bereits vorhanden sind
    if (window.visualizationState.currentTransactionData) {
        console.log('[VISUALIZATION] Verarbeite gespeicherte Transaktionsdaten');
        window.updateTransactionVisualization(window.visualizationState.currentTransactionData);
        window.visualizationState.currentTransactionData = null;
    }
}

// 5. DOMContentLoaded-Handler
document.addEventListener('DOMContentLoaded', function() {
    console.log('[VISUALIZATION] DOMContentLoaded: Initialisiere Visualisierungsmodul');
    
    // Initialisiere die Visualisierung
    initVisualization();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.visualizationState.currentTransactionData && window.visualizationState.transactionGraphInitialized) {
            console.log("[VISUALIZATION] Window resize: Aktualisiere Transaktionsvisualisierung");
            initTransactionGraph(window.visualizationState.currentTransactionData);
        }
    });
    
    console.log('[VISUALIZATION] Initialisierung abgeschlossen');
});

// 6. Sicherstellen, dass die Funktion auch ohne DOMContentLoaded verfügbar ist
if (typeof window.updateTransactionVisualization !== 'function') {
    console.warn('[VISUALIZATION] updateTransactionVisualization wird als Platzhalter definiert');
    
    window.updateTransactionVisualization = function(data) {
        console.log('[VISUALIZATION] updateTransactionVisualization: Funktion wurde aufgerufen, bevor das DOM geladen war');
        
        // Speichere die Daten für später
        window.visualizationState.currentTransactionData = data;
        
        // Versuche, die Visualisierung später zu initialisieren
        setTimeout(() => {
            if (typeof window.updateTransactionVisualization === 'function' && window.visualizationState.currentTransactionData) {
                window.updateTransactionVisualization(window.visualizationState.currentTransactionData);
                window.visualizationState.currentTransactionData = null;
            }
        }, 1000);
    };
}

// 7. Zusätzliche Sicherheit für D3.js-Initialisierung
document.addEventListener('readystatechange', function() {
    if (document.readyState === 'complete') {
        // Überprüfe, ob D3.js geladen wurde
        if (typeof d3 === 'undefined') {
            console.log('[VISUALIZATION] readystatechange: D3.js ist nicht geladen. Versuche, es nachzuladen.');
            const existingScript = document.querySelector('script[src*="d3js.org"]');
            if (!existingScript) {
                const script = document.createElement('script');
                script.src = 'https://d3js.org/d3.v7.min.js';
                script.onload = () => {
                    console.log('[VISUALIZATION] readystatechange: D3.js wurde nachgeladen');
                    window.visualizationState.d3Loaded = true;
                    
                    // Versuche, die Visualisierung neu zu initialisieren
                    if (window.visualizationState.currentTransactionData) {
                        console.log('[VISUALIZATION] readystatechange: Verarbeite gespeicherte Transaktionsdaten');
                        if (typeof window.updateTransactionVisualization === 'function') {
                            window.updateTransactionVisualization(window.visualizationState.currentTransactionData);
                            window.visualizationState.currentTransactionData = null;
                        }
                    }
                };
                document.head.appendChild(script);
            }
        }
    }
});
