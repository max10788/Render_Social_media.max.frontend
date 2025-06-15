export const theme = {
    colors: {
        primary: '#34c3ff',
        secondary: '#2ecc71',
        accent: '#e74c3c',
        neutral: '#95a5a6',
        background: '#ffffff',
        text: '#2c3e50'
    },
    nodes: {
        wallet: {
            radius: 30,
            fill: '#34c3ff',
            stroke: '#2980b9',
            strokeWidth: 2,
            labelColor: '#2c3e50',
            fontSize: '12px'
        },
        transaction: {
            radius: 20,
            fill: '#2ecc71',
            stroke: '#27ae60',
            strokeWidth: 2,
            labelColor: '#2c3e50',
            fontSize: '10px'
        }
    },
    links: {
        normal: {
            stroke: '#95a5a6',
            strokeWidth: 2,
            opacity: 0.6
        },
        highlighted: {
            stroke: '#e74c3c',
            strokeWidth: 3,
            opacity: 1
        }
    },
    animation: {
        duration: 300,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
};

// Generate CSS styles
export const generateCSS = () => `
    .transaction-graph {
        background-color: ${theme.colors.background};
    }

    .node {
        cursor: pointer;
    }

    .node.wallet .node-shape {
        fill: ${theme.nodes.wallet.fill};
        stroke: ${theme.nodes.wallet.stroke};
        stroke-width: ${theme.nodes.wallet.strokeWidth}px;
    }

    .node.transaction .node-shape {
        fill: ${theme.nodes.transaction.fill};
        stroke: ${theme.nodes.transaction.stroke};
        stroke-width: ${theme.nodes.transaction.strokeWidth}px;
    }

    .node-label {
        fill: ${theme.colors.text};
        font-size: 12px;
        text-anchor: middle;
        pointer-events: none;
    }

    .link {
        stroke: ${theme.links.normal.stroke};
        stroke-width: ${theme.links.normal.strokeWidth}px;
        opacity: ${theme.links.normal.opacity};
    }

    .link.highlighted {
        stroke: ${theme.links.highlighted.stroke};
        stroke-width: ${theme.links.highlighted.strokeWidth}px;
        opacity: ${theme.links.highlighted.opacity};
    }

    .arrowhead {
        fill: ${theme.links.normal.stroke};
    }

    .tooltip {
        position: absolute;
        padding: 8px;
        background: ${theme.colors.background};
        border: 1px solid ${theme.colors.neutral};
        border-radius: 4px;
        pointer-events: none;
        font-size: 12px;
        z-index: 1000;
    }
`;
