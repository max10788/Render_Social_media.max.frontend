// TransactionStyles.js - Styling and theme configuration
export const generateCSS = () => `
    .transaction-graph {
        background-color: #fff;
        border: 1px solid #ddd;
        border-radius: 4px;
        width: 100%;
        height: 600px;
        margin: 20px 0;
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

    .node.high-value .node-shape {
        fill: #e74c3c;
    }

    .node.medium-value .node-shape {
        fill: #f39c12;
    }

    .node.low-value .node-shape {
        fill: #2ecc71;
    }

    .link {
        stroke: #95a5a6;
        stroke-width: 2px;
        stroke-opacity: 0.6;
        transition: all 0.3s ease;
        marker-end: url(#arrowhead);
    }

    .link.highlighted {
        stroke: #e74c3c;
        stroke-width: 3px;
        stroke-opacity: 1;
    }

    .transaction-tooltip {
        position: absolute;
        padding: 10px;
        font-family: Arial, sans-serif;
        font-size: 12px;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid #ddd;
        border-radius: 4px;
        pointer-events: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        transition: opacity 0.3s ease;
        max-width: 300px;
    }

    .tooltip-header {
        font-weight: bold;
        margin-bottom: 6px;
        border-bottom: 1px solid #ddd;
        color: #2c3e50;
    }

    .tooltip-body {
        line-height: 1.4;
        color: #34495e;
    }

    .tooltip-body ul {
        list-style: none;
        padding-left: 0;
    }

    .tooltip-body li {
        overflow: hidden;
        white-space: nowrap;
    }

    .amount-label {
        font-weight: bold;
        color: #27ae60;
    }

    .error {
        color: #e74c3c;
    }

    .timestamp-label {
        color: #7f8c8d;
        font-size: 11px;
    }

    .loading {
        position: relative;
        min-height: 200px;
    }

    .loading::after {
        content: 'Loading...';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 16px;
        color: #666;
        background: rgba(255, 255, 255, 0.9);
        padding: 10px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .error-message {
        color: #721c24;
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        padding: 1rem;
        margin: 1rem 0;
        text-align: center;
        animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
