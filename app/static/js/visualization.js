import { TransactionGraph } from './modules/TransactionGraph.js';
import { generateCSS } from './modules/TransactionStyles.js';

// Initialize visualization
document.addEventListener('DOMContentLoaded', () => {
    // Add styles to document
    const styleSheet = document.createElement('style');
    styleSheet.textContent = generateCSS();
    document.head.appendChild(styleSheet);

    // Create container for visualization
    const container = document.getElementById('transactionTree');
    container.innerHTML = ''; // Clear existing content

    // Initialize graph with explicit dimensions
    const graph = new TransactionGraph('#transactionTree', {
        width: Math.max(800, window.innerWidth * 0.9),
        height: Math.max(600, window.innerHeight * 0.7)
    });

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

            // Create new TransactionGraph instance for each update
            const newGraph = new TransactionGraph('#transactionTree', {
                width: Math.max(800, window.innerWidth * 0.9),
                height: Math.max(600, window.innerHeight * 0.7)
            });

            // Process transactions
            const transactions = data.tracked_transactions;
            console.log('Processing transactions:', transactions);

            // Update the visualization
            newGraph.update(transactions);

            // Update statistics panel
            document.getElementById('txCount').textContent = data.total_transactions_tracked;
            document.getElementById('totalValue').textContent = 
                `${transactions[0].amount.toFixed(4)} SOL`;
            document.getElementById('sourceWallet').textContent = data.tracked_transactions[0].from_wallet;
            document.getElementById('targetWallet').textContent = data.final_wallet_address;
            document.getElementById('finalStatus').textContent = 
                transactions.length > 1 ? 'funds_transferred' : 'single_transfer';
            document.getElementById('targetCurrencyDisplay').textContent = data.target_currency;

        } catch (err) {
            console.error('Error updating visualization:', err);
            errorContainer.textContent = `Error displaying transactions: ${err.message}`;
            errorContainer.style.display = 'block';
        }
    };

    // Handle window resize
    window.addEventListener('resize', () => {
        const width = Math.max(800, window.innerWidth * 0.9);
        const height = Math.max(600, window.innerHeight * 0.7);
        
        // Create new graph with updated dimensions
        const newGraph = new TransactionGraph('#transactionTree', {
            width: width,
            height: height
        });

        // Re-render current data
        if (window.currentTransactionData) {
            newGraph.update(window.currentTransactionData.tracked_transactions);
        }
    });
});

    // Handle window resize
    window.addEventListener('resize', () => {
        if (!graph.svg) return;
        
        const width = window.innerWidth * 0.9;
        const height = window.innerHeight * 0.7;
        
        graph.svg
            .attr('width', width)
            .attr('height', height);
            
        graph.simulation.force('center', d3.forceCenter(
            width / 2,
            height / 2
        ));
        
        graph.simulation.alpha(0.3).restart();
    });

    // Listen for node clicks
    document.getElementById('transactionTree').addEventListener('nodeClick', (event) => {
        const node = event.detail.node;
        console.log('Node clicked:', node);
    });
});
