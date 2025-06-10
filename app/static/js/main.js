// Globale Konstanten
const API_BASE_URL = '/api/v1';
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price'; 

let transactionGraph;

/**
 * Sendet eine Analyseanfrage an die API
 */
async function submitAnalysis(event) {
    event.preventDefault();
    const blockchain = document.getElementById('blockchain').value.toLowerCase();
    const contractAddress = document.getElementById('contract_address').value.trim();

    if (!contractAddress) {
        showErrorInResult('Contract-Adresse ist erforderlich.');
        return;
    }

    if (["ethereum", "binance", "polygon"].includes(blockchain)) {
        if (!contractAddress.startsWith('0x') || contractAddress.length !== 42) {
            showErrorInResult(`${blockchain}-Adressen müssen mit 0x beginnen und 42 Zeichen lang sein.`);
            return;
        }
    } else if (blockchain === "solana") {
        if (contractAddress.length !== 44) {
            showErrorInResult('Solana-Adressen müssen 44 Zeichen lang sein.');
            return;
        }
    }

    try {
        const formData = {
            blockchain: blockchain,
            contract_address: contractAddress,
            twitter_username: document.getElementById('twitter_username').value.trim(),
            keywords: document.getElementById('keywords').value.split(',').map(k => k.trim()).filter(Boolean),
            start_date: document.getElementById('start_date').value,
            end_date: document.getElementById('end_date').value,
            tweet_limit: parseInt(document.getElementById('tweet_limit').value, 10)
        };

        const resultDiv = document.getElementById('result');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<h3>Analyse wird gestartet...</h3>';

        const response = await fetch(`${API_BASE_URL}/analyze/rule-based`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const jobId = data.job_id;

        resultDiv.innerHTML = `
            <h3>Analyse erfolgreich gestartet!</h3>
            <p><strong>Job-ID:</strong> ${jobId}</p>
            <p><strong>Status:</strong> ${data.status}</p>
        `;

        pollAnalysisStatus(jobId);
    } catch (error) {
        console.error('Error submitting analysis:', error);
        showErrorInResult(`Fehler beim Starten der Analyse: ${error.message}`);
    }
}

/**
 * Überwacht den Status einer laufenden Analyse
 */
async function pollAnalysisStatus(jobId) {
    const resultDiv = document.getElementById('result');
    let attempts = 0;
    const maxAttempts = 30;
    const interval = setInterval(async () => {
        try {
            attempts++;
            const response = await fetch(`/api/v1/analysis/status/${jobId}`);
            const status = await response.json();

            if (status.status === 'Completed') {
                clearInterval(interval);
                displayResults(status);
                visualizeTransactionsFromAnalysis(status);
            } else if (status.status.startsWith('Failed')) {
                clearInterval(interval);
                throw new Error(status.error || 'Analyse fehlgeschlagen');
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                throw new Error('Zeitüberschreitung bei der Analyse');
            } else {
                resultDiv.innerHTML = `
                    <h3>Analyse läuft...</h3>
                    <p>Status: ${status.status}</p>
                    <p>Fortschritt: ${Math.round((attempts / maxAttempts) * 100)}%</p>
                `;
            }
        } catch (error) {
            clearInterval(interval);
            resultDiv.innerHTML = `<div class="error-message"><h3>Fehler</h3><p>${error.message}</p></div>`;
        }
    }, 2000);
}
