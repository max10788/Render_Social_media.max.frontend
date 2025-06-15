import { TransactionGraph } from './modules/TransactionGraph.js';
import { generateCSS } from './modules/TransactionStyles.js';

// Initialize visualization
document.addEventListener('DOMContentLoaded', () => {
    // Add styles to document
    const styleSheet = document.createElement('style');
    styleSheet.textContent = generateCSS();
    document.head.appendChild(styleSheet);

    // Initialize graph
    const graph = new TransactionGraph('#transactionTree', {
        width: window.innerWidth * 0.9,
        height: window.innerHeight * 0.7
    });

    // Update function for new transaction data
    window.updateTransactionVisualization = (data) => {
        const tree = document.getElementById('transactionTree');
        const errorContainer = document.getElementById('errorContainer');
        
        // Clear previous content and errors
        tree.innerHTML = '';
        errorContainer.style.display = 'none';
        tree.classList.remove('loading');

        try {
            // Log the incoming data for debugging
            console.log('Received transaction data:', data);

            if (!data || !data.tracked_transactions || data.tracked_transactions.length === 0) {
                errorContainer.textContent = 'No transaction data available';
                errorContainer.style.display = 'block';
                return;
            }

            // Process transactions
            const transactions = data.tracked_transactions;
            const processedData = transactions.map(tx => ({
                tx_hash: tx.tx_hash,
                from_wallet: tx.from_wallet,
                to_wallet: tx.to_wallet,
                amount: parseFloat(tx.amount),
                timestamp: tx.timestamp
            }));

            console.log('Processed data for visualization:', processedData);

            // Update the visualization
            graph.update(processedData);

            // Update statistics panel
            document.getElementById('txCount').textContent = data.total_transactions_tracked;
            document.getElementById('totalValue').textContent = 
                `${processedData[0].amount.toFixed(4)} SOL`;
            document.getElementById('sourceWallet').textContent = data.tracked_transactions[0].from_wallet;
            document.getElementById('targetWallet').textContent = data.final_wallet_address;
            
            // Update status with more accurate description
            const status = data.tracked_transactions.length > 1 ? 
                'funds_transferred' : 
                'single_transfer';
            document.getElementById('finalStatus').textContent = status;

            document.getElementById('targetCurrencyDisplay').textContent = data.target_currency;

        } catch (err) {
            console.error('Error updating visualization:', err);
            errorContainer.textContent = `Error displaying transactions: ${err.message}`;
            errorContainer.style.display = 'block';
        }
    };

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
