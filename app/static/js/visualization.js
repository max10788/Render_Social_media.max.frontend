mport { TransactionGraph } from './modules/TransactionGraph.js';
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
        if (!transactions || transactions.length === 0) {
            console.warn('No transaction data provided');
            return;
        }
        graph.update(transactions);
    };

    // Handle window resize
    window.addEventListener('resize', () => {
        graph.svg
            .attr('width', window.innerWidth * 0.9)
            .attr('height', window.innerHeight * 0.7);
        graph.simulation.force('center', d3.forceCenter(
            window.innerWidth * 0.45,
            window.innerHeight * 0.35
        ));
        graph.simulation.alpha(0.3).restart();
    });
});
