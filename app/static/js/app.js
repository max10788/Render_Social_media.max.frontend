/**
 * Main application JavaScript
 * Handles initialization and event handlers for the application
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tab functionality
    initializeTabs();
    
    // Initialize both modules
    initTransactionTracker();
    initSocialAnalysis();
    
    // Set default dates for Social Analysis
    initializeDates();
});

function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            // Set active tab
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            // Show active tab content
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });
}

function initializeDates() {
    // Set the start date to today and end date to tomorrow for Social Analysis
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('start_date').value = today;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('end_date').value = tomorrow.toISOString().split('T')[0];
}

// ---- TRANSACTION TRACKER FEATURES ----
function initTransactionTracker() {
    document.getElementById('trackButton').addEventListener('click', trackTransactions);
}

async function trackTransactions() {
    const startTx = document.getElementById('startTx').value;
    const targetCurrency = document.getElementById('targetCurrency').value;
    const numTransactions = parseInt(document.getElementById('numTransactions').value, 10);
    
    if (!startTx) {
        showError('Bitte geben Sie eine Starttransaktion ein.');
        return;
    }
    
    showLoading();
    
    try {
        // In einer echten Implementierung würde hier die Backend-API aufgerufen werden
        // Für diese Demo generieren wir Beispieldaten
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const data = generateSampleData(startTx, targetCurrency, numTransactions);
        visualizeTransactions(data);
    } catch (error) {
        console.error('Fehler beim Abrufen der Transaktionsdaten:', error);
        showError('Transaktionsdaten konnten nicht abgerufen werden.');
    }
}

function visualizeTransactions(data) {
    TransactionVisualizer.visualizeTransactions(data, 'transactionTree');
}

function showLoading() {
    TransactionVisualizer.showLoading('transactionTree');
}

function showError(message) {
    TransactionVisualizer.showError('transactionTree', message);
}

// ---- SOCIAL ANALYSIS FEATURES ----
function initSocialAnalysis() {
    document.getElementById('analysisForm').addEventListener('submit', submitAnalysis);
}

async function submitAnalysis(event) {
    event.preventDefault();
    
    try {
        // Format the data according to your AnalyzeRequest schema
        const formData = {
            blockchain: document.getElementById('blockchain').value,
            contract_address: document.getElementById('contract_address').value.trim() || null,
            twitter_username: document.getElementById('twitter_username').value.trim(),
            keywords: document.getElementById('keywords').value.split(',').map(k => k.trim()).filter(Boolean),
            start_date: document.getElementById('start_date').value,
            end_date: document.getElementById('end_date').value,
            tweet_limit: parseInt(document.getElementById('tweet_limit').value, 10)
        };

        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = '<h3>Analyse wird gestartet...</h3>';

        // Keep it as a POST request since your schema is designed for POST
        const response = await fetch('/api/v1/analyze/rule-based', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Fehler beim Starten der Analyse');
        }

        const jobId = data.job_id;
        
        resultDiv.innerHTML = `
            <h3>Analyse erfolgreich gestartet!</h3>
            <p><strong>Job-ID:</strong> ${jobId}</p>
            <p><strong>Status:</strong> ${data.status}</p>
        `;

        // Start polling for status updates
        simulatePolling(jobId);

    } catch (error) {
        console.error('Error submitting analysis:', error);
        document.getElementById('result').innerHTML = `
            <h3>Fehler!</h3>
            <p>${error.message}</p>
        `;
    }
}
async function simulatePolling(jobId) {
    const resultDiv = document.getElementById('result');
    
    const interval = setInterval(async () => {
        try {
            const status = await getAnalysisStatus(jobId);
            
            if (status.status === "Completed") {
                clearInterval(interval);
                
                resultDiv.innerHTML = `
                    <h3>Analyse abgeschlossen!</h3>
                    <p><strong>Job-ID:</strong> ${jobId}</p>
                    <p><strong>Status:</strong> ${status.status}</p>
                    <div class="analysis-results">
                        <h4>Gefundene Wallet-Adressen:</h4>
                        ${status.potential_wallets && status.potential_wallets.length > 0 
                            ? `<ul>${status.potential_wallets.map(wallet => `<li>${wallet}</li>`).join('')}</ul>`
                            : '<p>Keine Wallet-Adressen gefunden.</p>'
                        }
                        <p><strong>Analysierte Tweets:</strong> ${status.analyzed_tweets}</p>
                        <p><strong>Analysierte Transaktionen:</strong> ${status.analyzed_transactions}</p>
                    </div>
                `;
            } else {
                resultDiv.innerHTML = `
                    <h3>Analyse läuft...</h3>
                    <p><strong>Job-ID:</strong> ${jobId}</p>
                    <p><strong>Status:</strong> ${status.status}</p>
                `;
            }
        } catch (error) {
            clearInterval(interval);
            resultDiv.innerHTML = `
                <h3>Fehler!</h3>
                <p>Fehler beim Abrufen des Analyse-Status: ${error.message}</p>
            `;
        }
    }, 2000);
}

async function getAnalysisStatus(jobId) {
    try {
        // Update the URL to match your FastAPI endpoint
        const response = await fetch(`/api/v1/analysis/status/${jobId}`);
        return await response.json();
    } catch (error) {
        console.error('Fehler beim Abrufen des Status:', error);
        throw error;
    }
}
