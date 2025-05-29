export class TransactionGraph {
    constructor(selector, options = {}) {
        this.selector = selector;
        this.options = {
            width: options.width || 800,
            height: options.height || 600,
            nodeRadius: options.nodeRadius || 8,
            linkDistance: options.linkDistance || 120,
            colors: {
                node: {
                    default: "#69b3a2",
                    source: "#2ca02c",
                    target: "#ff7f0e",
                    exchange: "#9467bd",
                    bridge: "#e377c2"
                },
                link: {
                    default: "#999",
                    highlighted: "#ff7f0e"
                },
                ...options.colors
            }
        };

        this.svg = d3.select(selector)
            .append("svg")
            .attr("width", this.options.width)
            .attr("height", this.options.height);

        this.simulation = d3.forceSimulation()
            .force("link", d3.forceLink().distance(this.options.linkDistance))
            .force("charge", d3.forceManyBody().strength(-200))
            .force("center", d3.forceCenter(this.options.width / 2, this.options.height / 2));

        this.initializeGraph();
    }

    initializeGraph() {
        // Create groups for links and nodes
        this.linksGroup = this.svg.append("g").attr("class", "links");
        this.nodesGroup = this.svg.append("g").attr("class", "nodes");
        
        // Initialize tooltip
        this.tooltip = d3.select("body")
            .append("div")
            .attr("class", "transaction-tooltip")
            .style("opacity", 0);
    }

    async visualizeTransactions(startTxHash, config) {
        const { data } = await this.fetchTransactionData(startTxHash, config);
        this.updateGraph(data);
    }

    updateGraph(data) {
        const nodes = this.processNodes(data.tracked_transactions);
        const links = this.processLinks(data.tracked_transactions);

        this.updateNodes(nodes);
        this.updateLinks(links);
        this.updateSimulation(nodes, links);
    }

    processNodes(transactions) {
        const nodesMap = new Map();
        
        transactions.forEach(tx => {
            if (!nodesMap.has(tx.from_wallet)) {
                nodesMap.set(tx.from_wallet, {
                    id: tx.from_wallet,
                    type: 'wallet',
                    value: tx.amount
                });
            }
            if (!nodesMap.has(tx.to_wallet)) {
                nodesMap.set(tx.to_wallet, {
                    id: tx.to_wallet,
                    type: 'wallet',
                    value: tx.amount
                });
            }
        });

        return Array.from(nodesMap.values());
    }

    processLinks(transactions) {
        return transactions.map(tx => ({
            source: tx.from_wallet,
            target: tx.to_wallet,
            value: tx.amount
        }));
    }

    updateNodes(nodes) {
        const nodeElements = this.nodesGroup
            .selectAll("circle")
            .data(nodes, d => d.id);

        // Remove old nodes
        nodeElements.exit().remove();

        // Add new nodes
        const nodeEnter = nodeElements.enter()
            .append("circle")
            .attr("r", this.options.nodeRadius)
            .attr("fill", d => this.getNodeColor(d))
            .call(this.drag());

        // Update all nodes
        this.nodes = nodeEnter.merge(nodeElements)
            .on("mouseover", (event, d) => this.showTooltip(event, d))
            .on("mouseout", () => this.hideTooltip());
    }

    updateLinks(links) {
        const linkElements = this.linksGroup
            .selectAll("line")
            .data(links, d => `${d.source.id}-${d.target.id}`);

        // Remove old links
        linkElements.exit().remove();

        // Add new links
        const linkEnter = linkElements.enter()
            .append("line")
            .attr("stroke", this.options.colors.link.default)
            .attr("stroke-width", d => Math.sqrt(d.value));

        // Update all links
        this.links = linkEnter.merge(linkElements);
    }

    updateSimulation(nodes, links) {
        this.simulation
            .nodes(nodes)
            .force("link").links(links);

        this.simulation.alpha(1).restart();

        this.simulation.on("tick", () => {
            this.links
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            this.nodes
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
        });
    }

    drag() {
        return d3.drag()
            .on("start", (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on("drag", (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on("end", (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });
    }

    showTooltip(event, d) {
        this.tooltip
            .style("opacity", 1)
            .html(`
                <div class="tooltip-header">${this.shortenAddress(d.id)}</div>
                <div class="tooltip-body">
                    <div>Type: ${d.type}</div>
                    <div>Value: ${d.value.toFixed(4)} SOL</div>
                </div>
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
    }

    hideTooltip() {
        this.tooltip.style("opacity", 0);
    }

    getNodeColor(node) {
        if (node.type === 'exchange') return this.options.colors.node.exchange;
        if (node.type === 'bridge') return this.options.colors.node.bridge;
        return this.options.colors.node.default;
    }

    shortenAddress(address) {
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    resize(width, height) {
        this.options.width = width;
        this.options.height = height;
        
        this.svg
            .attr("width", width)
            .attr("height", height);
        
        this.simulation
            .force("center", d3.forceCenter(width / 2, height / 2))
            .alpha(0.3)
            .restart();
    }

    async fetchTransactionData(startTxHash, config) {
        try {
            const response = await fetch(`${API_BASE_URL}/track-transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    start_tx_hash: startTxHash,
                    target_currency: config.targetCurrency,
                    num_transactions: config.numTransactions
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            return { success: true, data: await response.json() };
        } catch (error) {
            console.error('Error fetching transaction data:', error);
            return { success: false, error: error.message };
        }
    }
}
