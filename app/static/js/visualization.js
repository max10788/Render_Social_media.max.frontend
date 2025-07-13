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
        tree.classList.remove('loading');

        console.log('Updating visualization with data:', data);

        try {
            if (!data || !data.tracked_transactions || data.tracked_transactions.length === 0) {
                errorContainer.textContent = 'No transaction data available';
                errorContainer.style.display = 'block';
                return;
            }

            // Store data globally for resize handling
            window.currentTransactionData = data;

            // Initialize the graph with new data
            initTransactionGraph(data);

            // Update statistics panel
            document.getElementById('txCount').textContent = data.total_transactions_tracked;
            document.getElementById('totalValue').textContent = 
                `${data.tracked_transactions[0].amount?.toFixed(4) ?? 'N/A'} SOL`;
            document.getElementById('sourceWallet').textContent = data.tracked_transactions[0].from_wallet;
            document.getElementById('targetWallet').textContent = data.final_wallet_address;
            document.getElementById('finalStatus').textContent = 
                data.tracked_transactions.length > 1 ? 'funds_transferred' : 'single_transfer';
            document.getElementById('targetCurrencyDisplay').textContent = data.target_currency;

        } catch (err) {
            console.error('Error updating visualization:', err);
            errorContainer.textContent = `Error displaying transactions: ${err.message}`;
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
