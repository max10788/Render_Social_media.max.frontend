/**
 * Crypto Transaction Visualizer
 * ============================
 * Dieses Modul enthält Funktionen zur Visualisierung von Kryptowährungs-Transaktionen
 * basierend auf dem Format, das vom Backend bereitgestellt wird.
 */

// Selbstausführende Funktion, um einen privaten Scope zu erstellen und Variablenkollisionen zu vermeiden
const TransactionVisualizer = (function() {
    // Private Variablen und Hilfsfunktionen
    const currencyColors = {
        btc: '#f2a900',
        eth: '#627eea',
        sol: '#00ffbd'
    };

    /**
     * Hilfsfunktion: Zeigt die Ladeanimation in einem Container an
     * @param {HTMLElement} container - Der Container für die Visualisierung
     */
    function showLoading(container) {
        container.innerHTML = '';
        container.className = 'loading';
    }

    /**
     * Hilfsfunktion: Zeigt eine Fehlermeldung in einem Container an
     * @param {HTMLElement} container - Der Container für die Visualisierung
     * @param {string} message - Die anzuzeigende Fehlermeldung
     */
    function showError(container, message) {
        container.classList.remove('loading');
        container.innerHTML = `<div class="error-message">${message}</div>`;
    }

    /**
     * Aktualisiert die Info-Panels mit Daten aus dem Transaktions-Response
     * @param {Object} data - Die Transaktionsdaten vom Backend
     */
    function updateInfoPanels(data) {
        // Start-Informationen
        document.getElementById('sourceCurrency').textContent = data.source_currency || '-';
        document.getElementById('sourceCurrency').className = 'transaction-value value-' + (data.source_currency || '').toLowerCase();
        document.getElementById('startHash').textContent = data.start_transaction || '-';
        
        const startTime = data.transactions && data.transactions[0] ? 
            new Date(data.transactions[0].timestamp * 1000).toLocaleString() : '-';
        document.getElementById('startTime').textContent = startTime;
        
        // Transaktionsstatistik
        document.getElementById('txCount').textContent = data.transactions_count || 0;
        
        let totalValue = 0;
        let totalFees = 0;
        
        if (data.transactions && data.transactions.length > 0) {
            // Bei BTC-Transaktion: Input-Summe als Gesamtwert
            if (data.transactions[0].currency === 'BTC') {
                totalValue = data.transactions[0].inputs.reduce((sum, input) => sum + input.value, 0);
            }
            
            // Gebühren summieren
            totalFees = data.transactions.reduce((sum, tx) => sum + (tx.fee || 0), 0);
        }
        
        document.getElementById('totalValue').textContent = 
            `${totalValue.toFixed(8)} ${data.source_currency}`;
        document.getElementById('totalValue').className = 
            `transaction-value value-${(data.source_currency || '').toLowerCase()}`;
            
        document.getElementById('totalFees').textContent = 
            `${totalFees.toFixed(8)} ${data.source_currency}`;
        document.getElementById('totalFees').className = 
            `transaction-value value-${(data.source_currency || '').toLowerCase()}`;
        
        // Konvertierungsinformationen
        document.getElementById('targetCurrencyDisplay').textContent = data.target_currency || '-';
        document.getElementById('targetCurrencyDisplay').className = 
            `transaction-value value-${(data.target_currency || '').toLowerCase()}`;
        
        // Wechselkurs berechnen (vereinfacht)
        let exchangeRate = 1.0;
        if (data.transactions && data.transactions[0] && data.transactions[0].inputs && data.transactions[0].inputs[0]) {
            const input = data.transactions[0].inputs[0];
            if (input.value > 0 && input.value_converted) {
                exchangeRate = input.value_converted / input.value;
            }
        }
        
        document.getElementById('exchangeRate').textContent = 
            `1 ${data.source_currency} = ${exchangeRate.toFixed(4)} ${data.target_currency}`;
            
        const convertedValue = totalValue * exchangeRate;
        document.getElementById('convertedValue').textContent = 
            `${convertedValue.toFixed(4)} ${data.target_currency}`;
        document.getElementById('convertedValue').className = 
            `transaction-value value-${(data.target_currency || '').toLowerCase()}`;
    }

    /**
     * Erstellt eine SVG-Darstellung eines BTC-Transaktionsbaums
     * @param {Object} tx - Die BTC-Transaktion
     * @param {string} targetCurrency - Die Zielwährung für die Konversion
     * @returns {string} - Der SVG-Code als String
     */
    function createSVGTreeFromBTCTransaction(tx, targetCurrency) {
        const svgWidth = 800;
        const svgHeight = 500;
        const marginLeft = 100;
        const marginRight = 100;
        
        // SVG-Header erstellen
        let svg = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;
        
        // Farbdefinitionen
        svg += `
            <defs>
                <linearGradient id="btcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:${currencyColors.btc};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${currencyColors.btc};stop-opacity:0.7" />
                </linearGradient>
                <linearGradient id="ethGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:${currencyColors.eth};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${currencyColors.eth};stop-opacity:0.7" />
                </linearGradient>
                <linearGradient id="solGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:${currencyColors.sol};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:${currencyColors.sol};stop-opacity:0.7" />
                </linearGradient>
            </defs>
        `;
        
        // Startpunkt (1 BTC links)
        const inputValue = tx.inputs && tx.inputs[0] ? tx.inputs[0].value : 1.0;
        const centerY = svgHeight / 2;
        const startX = marginLeft;
        const endX = svgWidth - marginRight;
        
        // Zeichne Start-Knoten (BTC)
        svg += `
            <g class="node">
                <circle cx="${startX}" cy="${centerY}" r="40" fill="url(#btcGradient)" />
                <text x="${startX}" y="${centerY - 5}" text-anchor="middle" fill="white" style="font-weight: bold;">${inputValue} BTC</text>
                <text x="${startX}" y="${centerY + 15}" text-anchor="middle" fill="white" style="font-size: 10px;">Start</text>
            </g>
        `;
        
        // Ausgabe-Knoten zeichnen (basierend auf der Skizze)
        const outputs = tx.outputs || [];
        const outputCount = outputs.length || 10; // Fallback auf 10 Outputs wie in der Skizze
        const verticalSpacing = svgHeight / (outputCount + 1);
        
        for (let i = 0; i < outputCount; i++) {
            const output = outputs[i] || { value: 0.1 }; // Fallback auf 0.1, wenn kein Output definiert
            const yPos = (i + 1) * verticalSpacing;
            
            // Linie vom Start-Knoten zum Output-Knoten zeichnen
            svg += `
                <path d="M ${startX + 40} ${centerY} C ${(startX + endX) / 2} ${centerY}, ${(startX + endX) / 2} ${yPos}, ${endX - 30} ${yPos}" 
                      stroke="#ccc" stroke-width="2" fill="none" />
            `;
            
            // Output-Knoten zeichnen
            svg += `
                <g class="node">
                    <circle cx="${endX}" cy="${yPos}" r="25" fill="${currencyColors.btc}" />
                    <text x="${endX}" y="${yPos - 5}" text-anchor="middle" fill="white" style="font-size: 12px;">${output.value.toFixed(2)}</text>
                    <text x="${endX}" y="${yPos + 10}" text-anchor="middle" fill="white" style="font-size: 9px;">BTC</text>
                </g>
            `;
            
            // Zielwährungstext auf der rechten Seite
            if (i === 0) {
                svg += `
                    <text x="${endX + 40}" y="${yPos}" text-anchor="start" fill="#333" style="font-size: 14px;">${targetCurrency}</text>
                `;
            } else if (i === 1) {
                svg += `
                    <text x="${endX + 40}" y="${yPos}" text-anchor="start" fill="#333" style="font-size: 14px;">etc.</text>
                `;
            }
        }
        
        // SVG abschließen
        svg += '</svg>';
        
        return svg;
    }

    /**
     * Erstellt eine SVG-Darstellung eines ETH-Transaktionsbaums
     * @param {Object} tx - Die ETH-Transaktion
     * @param {string} targetCurrency - Die Zielwährung für die Konversion
     * @returns {string} - Der SVG-Code als String
     */
    function createSVGTreeFromETHTransaction(tx, targetCurrency) {
        // Ähnliche Implementierung wie für BTC, aber angepasst für ETH-Transaktionen
        // Für diese Demo vereinfacht: wir nutzen das BTC-Template mit angepassten Farben
        const svgWidth = 800;
        const svgHeight = 500;
        const marginLeft = 100;
        const marginRight = 100;
        
        let svg = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;
        
        // Verwenden Sie die ETH-Farbe
        const centerY = svgHeight / 2;
        const startX = marginLeft;
        const endX = svgWidth - marginRight;
        
        // Startknoten für ETH
        svg += `
            <g class="node">
                <circle cx="${startX}" cy="${centerY}" r="40" fill="${currencyColors.eth}" />
                <text x="${startX}" y="${centerY - 5}" text-anchor="middle" fill="white" style="font-weight: bold;">${tx.value || 1.0} ETH</text>
                <text x="${startX}" y="${centerY + 15}" text-anchor="middle" fill="white" style="font-size: 10px;">Start</text>
            </g>
        `;
        
        // Einfacher ETH-Transaktionsfluss
        svg += `
            <path d="M ${startX + 40} ${centerY} C ${(startX + endX) / 2} ${centerY}, ${(startX + endX) / 2} ${centerY}, ${endX - 30} ${centerY}" 
                  stroke="#ccc" stroke-width="2" fill="none" />
            <g class="node">
                <circle cx="${endX}" cy="${centerY}" r="30" fill="${currencyColors.eth}" />
                <text x="${endX}" y="${centerY - 5}" text-anchor="middle" fill="white" style="font-size: 12px;">${tx.value || 1.0}</text>
                <text x="${endX}" y="${centerY + 10}" text-anchor="middle" fill="white" style="font-size: 9px;">ETH</text>
            </g>
            <text x="${endX + 40}" y="${centerY}" text-anchor="start" fill="#333" style="font-size: 14px;">${targetCurrency}</text>
        `;
        
        svg += '</svg>';
        return svg;
    }

    /**
     * Erstellt eine SVG-Darstellung eines SOL-Transaktionsbaums
     * @param {Object} tx - Die SOL-Transaktion
     * @param {string} targetCurrency - Die Zielwährung für die Konversion
     * @returns {string} - Der SVG-Code als String
     */
    function createSVGTreeFromSOLTransaction(tx, targetCurrency) {
        // Ähnliche Implementierung wie für BTC/ETH, aber angepasst für SOL-Transaktionen
        // Für diese Demo vereinfacht: wir nutzen das BTC-Template mit angepassten Farben
        const svgWidth = 800;
        const svgHeight = 500;
        const marginLeft = 100;
        const marginRight = 100;
        
        let svg = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;
        
        // Verwenden Sie die SOL-Farbe
        const centerY = svgHeight / 2;
        const startX = marginLeft;
        const endX = svgWidth - marginRight;
        
        // Finden Sie den Wert, der übertragen wurde
        let transferValue = 0;
        if (tx.accounts && tx.accounts.length > 0) {
            // Summe der positiven Änderungen als Transferwert
            transferValue = tx.accounts
                .filter(acc => acc.change > 0)
                .reduce((sum, acc) => sum + acc.change, 0);
        }
        
        // Startknoten für SOL
        svg += `
            <g class="node">
                <circle cx="${startX}" cy="${centerY}" r="40" fill="${currencyColors.sol}" />
                <text x="${startX}" y="${centerY - 5}" text-anchor="middle" fill="white" style="font-weight: bold;">${transferValue.toFixed(2)} SOL</text>
                <text x="${startX}" y="${centerY + 15}" text-anchor="middle" fill="white" style="font-size: 10px;">Start</text>
            </g>
        `;
        
        // SOL-Accounts darstellen
        const accounts = tx.accounts || [];
        const accountCount = Math.min(accounts.length, 5); // Maximal 5 Accounts anzeigen
        
        if (accountCount > 0) {
            const verticalSpacing = svgHeight / (accountCount + 1);
            
            for (let i = 0; i < accountCount; i++) {
                const account = accounts[i];
                const yPos = (i + 1) * verticalSpacing;
                
                // Nur Accounts mit positiver Änderung zeigen (Empfänger)
                if (account.change > 0) {
                    // Linie vom Start-Knoten zum Account-Knoten
                    svg += `
                        <path d="M ${startX + 40} ${centerY} C ${(startX + endX) / 2} ${centerY}, ${(startX + endX) / 2} ${yPos}, ${endX - 30} ${yPos}" 
                              stroke="#ccc" stroke-width="2" fill="none" />
                    `;
                    
                    // Account-Knoten
                    svg += `
                        <g class="node">
                            <circle cx="${endX}" cy="${yPos}" r="25" fill="${currencyColors.sol}" />
                            <text x="${endX}" y="${yPos - 5}" text-anchor="middle" fill="white" style="font-size: 12px;">${account.change.toFixed(2)}</text>
                            <text x="${endX}" y="${yPos + 10}" text-anchor="middle" fill="white" style="font-size: 9px;">SOL</text>
                        </g>
                    `;
                    
                    // Zielwährungstext auf der rechten Seite für den ersten Knoten
                    if (i === 0) {
                        svg += `
                            <text x="${endX + 40}" y="${yPos}" text-anchor="start" fill="#333" style="font-size: 14px;">${targetCurrency}</text>
                        `;
                    }
                }
            }
        } else {
            // Fallback: Einfache Transaktion anzeigen
            svg += `
                <path d="M ${startX + 40} ${centerY} C ${(startX + endX) / 2} ${centerY}, ${(startX + endX) / 2} ${centerY}, ${endX - 30} ${centerY}" 
                      stroke="#ccc" stroke-width="2" fill="none" />
                <g class="node">
                    <circle cx="${endX}" cy="${centerY}" r="30" fill="${currencyColors.sol}" />
                    <text x="${endX}" y="${centerY - 5}" text-anchor="middle" fill="white" style="font-size: 12px;">${transferValue.toFixed(2)}</text>
                    <text x="${endX}" y="${centerY + 10}" text-anchor="middle" fill="white" style="font-size: 9px;">SOL</text>
                </g>
                <text x="${endX + 40}" y="${centerY}" text-anchor="start" fill="#333" style="font-size: 14px;">${targetCurrency}</text>
            `;
        }
        
        svg += '</svg>';
        return svg;
    }

    /**
     * Erstellt den Transaktionsbaum basierend auf den Daten und der Währung
     * @param {Object} data - Die Transaktionsdaten vom Backend
     * @param {HTMLElement} container - Der Container für die Visualisierung
     */
    function createTransactionTree(data, container) {
        if (!data.transactions || data.transactions.length === 0) {
            return;
        }
        
        const mainTx = data.transactions[0];
        
        // Je nach Währung die entsprechende Visualisierung wählen
        let svgContent = '';
        
        if (mainTx.currency === 'BTC') {
            svgContent = createSVGTreeFromBTCTransaction(mainTx, data.target_currency);
        } else if (mainTx.currency === 'ETH') {
            svgContent = createSVGTreeFromETHTransaction(mainTx, data.target_currency);
        } else if (mainTx.currency === 'SOL') {
            svgContent = createSVGTreeFromSOLTransaction(mainTx, data.target_currency);
        } else {
            // Fallback für unbekannte Währungen: BTC-Template verwenden
            svgContent = createSVGTreeFromBTCTransaction(mainTx, data.target_currency);
        }
        
        container.innerHTML = svgContent;
    }

    // Öffentliche API
    return {
        /**
         * Zeigt die Ladeanimation im Visualisierungscontainer an
         * @param {string} containerId - Die ID des Container-Elements
         */
        showLoading: function(containerId) {
            const container = document.getElementById(containerId);
            showLoading(container);
        },
        
        /**
         * Zeigt eine Fehlermeldung im Visualisierungscontainer an
         * @param {string} containerId - Die ID des Container-Elements
         * @param {string} message - Die anzuzeigende Fehlermeldung
         */
        showError: function(containerId, message) {
            const container = document.getElementById(containerId);
            showError(container, message);
        },
        
        /**
         * Visualisiert die Transaktionsdaten
         * @param {Object} data - Die Transaktionsdaten vom Backend
         * @param {string} containerId - Die ID des Container-Elements
         */
        visualizeTransactions: function(data, containerId) {
            const container = document.getElementById(containerId);
            
            if (!data || !data.transactions || data.transactions.length === 0) {
                showError(container, 'Keine Transaktionsdaten verfügbar.');
                return;
            }
            
            // Infopanels aktualisieren
            updateInfoPanels(data);
            
            // Transaktionsbaum erstellen
            container.classList.remove('loading');
            createTransactionTree(data, container);
        },
        
        /**
         * Setzt die Farben für verschiedene Kryptowährungen
         * @param {Object} colors - Ein Objekt mit den Farbwerten für 'btc', 'eth' und 'sol'
         */
        setCurrencyColors: function(colors) {
            if (colors.btc) currencyColors.btc = colors.btc;
            if (colors.eth) currencyColors.eth = colors.eth;
            if (colors.sol) currencyColors.sol = colors.sol;
        }
    };
})();

// Stellt sicher, dass das Modul als globale Variable verfügbar ist
window.TransactionVisualizer = TransactionVisualizer;