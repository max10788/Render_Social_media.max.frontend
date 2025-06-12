// Global constants
const API_BASE_URL = '/api/v1';
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price';

// Global variables
let api;
let transactionGraph;
let dashboardState;

// Global error handler
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Global error:', {
        message: msg,
        url: url,
        line: lineNo,
        column: columnNo,
        error: error
    });
    return false;
};

// Initialize application
function initializeApp() {
    console.log('Initializing application...'); // Debug log

    try {
        // Initialize API
        api = new API(API_BASE_URL);
        console.log('API initialized'); // Debug log
        
        // Initialize dashboard state
        dashboardState = new DashboardState();
        console.log('Dashboard state initialized'); // Debug log
        
        // Initialize transaction graph
        const container = document.getElementById('transactionTree');
        if (container) {
            transactionGraph = new TransactionGraph('#transactionTree', {
                width: container.clientWidth,
                height: 600,
                nodeRadius: 8,
                linkDistance: 120
            });
            console.log('Transaction graph initialized'); // Debug log
        } else {
            console.error('Transaction tree container not found');
        }

        // Set up event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...'); // Debug log

    // Track button
    const trackButton = document.getElementById('trackButton');
    if (trackButton) {
        trackButton.onclick = handleTrackButtonClick;
        console.log('Track button listener added'); // Debug log
    } else {
        console.error('Track button not found');
    }

    // Analysis form
    const analysisForm = document.getElementById('analysisForm');
    if (analysisForm) {
        analysisForm.onsubmit = handleAnalysisSubmit;
        console.log('Analysis form listener added'); // Debug log
    }

    // Window resize handler
    window.onresize = handleWindowResize;
    console.log('Window resize handler added'); // Debug log
}

// Handle track button click
async function handleTrackButtonClick(event) {
    console.log('Track button clicked'); // Debug log
    event.preventDefault();

    try {
        // Validate form
        const startTx = document.getElementById('startTx').value;
        const targetCurrency = document.getElementById('targetCurrency').value;
        const numTransactions = document.getElementById('numTransactions').value;

        console.log('Form values:', { startTx, targetCurrency, numTransactions }); // Debug log

        if (!startTx) {
            throw new Error('Please enter a transaction hash');
        }

        // Show loading state
        dashboardState.setLoading(true);
        document.getElementById('transactionTree').innerHTML = '<div class="loading">Loading transaction data...</div>';
        
        // Make API call
        const response = await fetch(`${API_BASE_URL}/track-transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                start_tx_hash: startTx,
                target_currency: targetCurrency,
                num_transactions: parseInt(numTransactions)
            })
        });

        console.log('API response status:', response.status); // Debug log

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API response data:', data); // Debug log

        // Update UI
        updateTransactionInfo(data);
        await visualizeTransactionPath(data);
        showSuccessMessage('Transaction data loaded successfully');

    } catch (error) {
        console.error('Error tracking transactions:', error);
        handleError(error);
    } finally {
        dashboardState.setLoading(false);
    }
}

// Handle analysis form submit
async function handleAnalysisSubmit(event) {
    console.log('Analysis form submitted'); // Debug log
    event.preventDefault();

    try {
        // Show loading state
        document.getElementById('result').style.display = 'block';
        document.getElementById('result').innerHTML = '<div class="loading">Processing analysis...</div>';

        // Get form data
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        console.log('Analysis form data:', data); // Debug log

        // Make API call
        const response = await fetch(`${API_BASE_URL}/analyze/rule-based`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Analysis result:', result); // Debug log

        // Display results
        displayResults(result);

    } catch (error) {
        console.error('Error during analysis:', error);
        showErrorInResult(error.message);
    }
}

// Handle window resize
function handleWindowResize() {
    if (transactionGraph) {
        const container = document.getElementById('transactionTree');
        transactionGraph.resize(container.clientWidth, 600);
    }
}

// Handle error display
function handleError(error) {
    document.getElementById('transactionTree').innerHTML = `
        <div class="error-message">
            <h3>Error</h3>
            <p>${error.message}</p>
        </div>`;
    
    // Clear info panels
    updateTransactionInfo({});
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Make functions available globally
window.handleTrackButtonClick = handleTrackButtonClick;
window.handleAnalysisSubmit = handleAnalysisSubmit;
window.displayResults = displayResults;
