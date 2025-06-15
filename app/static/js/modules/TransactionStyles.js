// TransactionStyles.js - Styling and theme configuration
export const generateCSS = () => `
    .transaction-graph {
        background-color: #fff;
        border: 1px solid #ddd;
        border-radius: 4px;
    }

    .node {
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .node.wallet .node-shape {
        fill: #34c3ff;
        stroke: #2980b9;
        stroke-width: 2px;
    }

    .node.transaction .node-shape {
        fill: #2ecc71;
        stroke: #27ae60;
        stroke-width: 2px;
    }

    .node.highlighted .node-shape {
        stroke: #e74c3c;
        stroke-width: 3px;
    }

    .node-label {
        fill: #2c3e50;
        font-size: 12px;
        font-family: monospace;
        text-anchor: middle;
        pointer-events: none;
    }

    .link {
        stroke: #95a5a6;
        stroke-width: 2px;
        stroke-opacity: 0.6;
        transition: all 0.3s ease;
    }

    .link.highlighted {
        stroke: #e74c3c;
        stroke-width: 3px;
        stroke-opacity: 1;
    }

    .arrowhead {
        fill: #95a5a6;
    }

    .transaction-tooltip {
        position: absolute;
        padding: 8px;
        font-family: Arial, sans-serif;
        font-size: 12px;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid #ddd;
        border-radius: 4px;
        pointer-events: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        transition: opacity 0.3s ease;
    }

    .tooltip-header {
        font-weight: bold;
        margin-bottom: 4px;
        padding-bottom: 4px;
        border-bottom: 1px solid #ddd;
    }

    .tooltip-body {
        line-height: 1.4;
    }

    .loading {
        position: relative;
    }

    .loading::after {
        content: 'Loading...';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 16px;
        color: #666;
    }

    .error-message {
        color: #721c24;
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        padding: 1rem;
        margin: 1rem 0;
        text-align: center;
    }
`;
