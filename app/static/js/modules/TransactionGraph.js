export class TransactionGraph {
    constructor(containerId, options = {}) {
        this.container = d3.select(containerId);
        this.options = {
            width: options.width || '100%',
            height: options.height || 800,
            nodeRadius: options.nodeRadius || 30,
            linkDistance: options.linkDistance || 150,
            ...options
        };

        this.init();
    }

    init() {
        // Create SVG container
        this.svg = this.container
            .append('svg')
            .attr('width', this.options.width)
            .attr('height', this.options.height)
            .attr('class', 'transaction-graph');

        // Add zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                this.graphGroup.attr('transform', event.transform);
            });

        this.svg.call(this.zoom);

        // Create main graph group
        this.graphGroup = this.svg.append('g')
            .attr('class', 'graph-group');

        // Initialize force simulation
        this.simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id(d => d.id).distance(this.options.linkDistance))
            .force('charge', d3.forceManyBody().strength(-500))
            .force('center', d3.forceCenter(this.options.width / 2, this.options.height / 2))
            .force('collision', d3.forceCollide().radius(this.options.nodeRadius * 1.5));

        // Create arrow marker definition
        this.svg.append('defs').append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '-10 -10 20 20')
            .attr('refX', 20)
            .attr('refY', 0)
            .attr('markerWidth', 8)
            .attr('markerHeight', 8)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M-10,-10 L0,0 L-10,10')
            .attr('class', 'arrowhead');

        // Initialize containers for links and nodes
        this.linksGroup = this.graphGroup.append('g').attr('class', 'links');
        this.nodesGroup = this.graphGroup.append('g').attr('class', 'nodes');
    }

    update(data) {
        // Process the transaction data
        const { nodes, links } = this._processTransactionData(data);

        // Update links
        this.links = this.linksGroup
            .selectAll('.link')
            .data(links, d => d.id)
            .join(
                enter => this._createLinks(enter),
                update => this._updateLinks(update),
                exit => this._removeLinks(exit)
            );

        // Update nodes
        this.nodes = this.nodesGroup
            .selectAll('.node')
            .data(nodes, d => d.id)
            .join(
                enter => this._createNodes(enter),
                update => this._updateNodes(update),
                exit => this._removeNodes(exit)
            );

        // Update simulation
        this.simulation
            .nodes(nodes)
            .force('link').links(links);

        this.simulation.alpha(1).restart();
    }

    _processTransactionData(transactions) {
        const nodes = [];
        const links = [];
        const nodeMap = new Map();

        transactions.forEach((tx, index) => {
            // Create wallet nodes
            if (!nodeMap.has(tx.from_wallet)) {
                nodeMap.set(tx.from_wallet, {
                    id: tx.from_wallet,
                    type: 'wallet',
                    transactions: []
                });
                nodes.push(nodeMap.get(tx.from_wallet));
            }

            if (!nodeMap.has(tx.to_wallet)) {
                nodeMap.set(tx.to_wallet, {
                    id: tx.to_wallet,
                    type: 'wallet',
                    transactions: []
                });
                nodes.push(nodeMap.get(tx.to_wallet));
            }

            // Create transaction node
            const txNode = {
                id: tx.tx_hash,
                type: 'transaction',
                amount: tx.amount,
                timestamp: tx.timestamp,
                index
            };
            nodes.push(txNode);
            nodeMap.get(tx.from_wallet).transactions.push(tx.tx_hash);

            // Create links
            links.push({
                id: `${tx.from_wallet}-${tx.tx_hash}`,
                source: tx.from_wallet,
                target: tx.tx_hash,
                amount: tx.amount
            });

            links.push({
                id: `${tx.tx_hash}-${tx.to_wallet}`,
                source: tx.tx_hash,
                target: tx.to_wallet,
                amount: tx.amount
            });
        });

        return { nodes, links };
    }

    _createNodes(enter) {
        const nodeGroups = enter.append('g')
            .attr('class', d => `node ${d.type}`)
            .call(d3.drag()
                .on('start', this._dragstarted.bind(this))
                .on('drag', this._dragged.bind(this))
                .on('end', this._dragended.bind(this)));

        // Add different shapes based on node type
        nodeGroups.each(function(d) {
            const group = d3.select(this);
            if (d.type === 'wallet') {
                group.append('circle')
                    .attr('r', d => d.radius || 30)
                    .attr('class', 'node-shape wallet');
            } else {
                group.append('path')
                    .attr('d', d3.symbol().type(d3.symbolDiamond).size(500))
                    .attr('class', 'node-shape transaction');
            }
        });

        // Add labels
        nodeGroups.append('text')
            .attr('dy', '.35em')
            .text(d => this._formatLabel(d))
            .attr('class', 'node-label');

        return nodeGroups;
    }

    _formatLabel(node) {
        if (node.type === 'wallet') {
            return `${node.id.substring(0, 4)}...${node.id.substring(node.id.length - 4)}`;
        }
        return `${node.amount.toFixed(2)}`;
    }

    _updateNodes(update) {
        update.select('.node-label')
            .text(d => this._formatLabel(d));
        return update;
    }

    _removeNodes(exit) {
        return exit.remove();
    }

    _createLinks(enter) {
        return enter.append('line')
            .attr('class', 'link')
            .attr('marker-end', 'url(#arrowhead)');
    }

    _updateLinks(update) {
        return update;
    }

    _removeLinks(exit) {
        return exit.remove();
    }

    _dragstarted(event) {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    _dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    _dragended(event) {
        if (!event.active) this.simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    // Force simulation tick function
    _ticked() {
        this.links
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        this.nodes
            .attr('transform', d => `translate(${d.x},${d.y})`);
    }
}
