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
    window.updateTransactionVisualization = (transactions) => {
        const tree = document.getElementById('transactionTree');
        const errorContainer = document.getElementById('errorContainer');
        
        // Clear previous errors
        errorContainer.style.display = 'none';
        tree.classList.remove('loading');

        if (!transactions || transactions.length === 0) {
            errorContainer.textContent = 'No transaction data available';
            errorContainer.style.display = 'block';
            return;
        }

        try {
            // Log the incoming data for debugging
            console.log('Received transaction data:', transactions);

            // Transform data if needed
            const processedData = transactions.map(tx => ({
                tx_hash: tx.tx_hash || tx.signature,
                from_wallet: tx.from_wallet || tx.from_address,
                to_wallet: tx.to_wallet || tx.to_address,
                amount: parseFloat(tx.amount || '0'),
                timestamp: new Date(tx.timestamp).toISOString()
            }));

            // Update the visualization
            graph.update(processedData);

            // Update statistics display
            updateStatistics(transactions);
        } catch (err) {
            console.error('Error updating visualization:', err);
            errorContainer.textContent = `Error displaying transactions: ${err.message}`;
            errorContainer.style.display = 'block';
        }
    };

    // Update statistics panel
    function updateStatistics(transactions) {
        if (!transactions.length) return;

        const stats = {
            totalAmount: transactions.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0),
            count: transactions.length,
            firstTx: transactions[0],
            lastTx: transactions[transactions.length - 1]
        };

        // Update UI elements
        document.getElementById('txCount').textContent = stats.count;
        document.getElementById('totalValue').textContent = 
            `${stats.totalAmount.toFixed(4)} SOL`;
        document.getElementById('sourceWallet').textContent = 
            stats.firstTx.from_wallet || stats.firstTx.from_address || '-';
        document.getElementById('targetWallet').textContent = 
            stats.lastTx.to_wallet || stats.lastTx.to_address || '-';
    }

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
        // Add any custom handling for node clicks
    });
});
